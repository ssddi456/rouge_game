import { Row, Col, Select, Button, Form, Input, FormInstance, message, Modal } from "antd";
import { Application, Container, Graphics, ImageSource, LoaderResource, Sprite, Texture, Text, Point, Matrix, Transform } from "pixi.js";
import React from "react";
import { SheetInfo } from "../editor";
import { Viewport } from 'pixi-viewport'
import { Coords, TextureConfig } from "../types";
import { copyTextureConfig, getCoordFromTextureConfig, getOffsetFromTextureConfig, updateOffset } from "../loadAnimation";
import { applyEditorMixin, editorProps, getCoordsControll, getNextKey, withEditorMixin } from "./editorUtils";

interface EditorState {
    list: SheetInfo[];
    selected: string;
    selectedSheet: SheetInfo | undefined;
    selectedSpriteSheet: Record<number, TextureConfig>;
    textureInfo: string;
    selectedSpriteKey: number;
}

export class SpriteEditor extends React.Component<{}, EditorState> implements editorProps, withEditorMixin {
    constructor(props: {}) {
        super(props);
        this.state = {
            list: [],
            selected: "",
            selectedSheet: undefined,
            selectedSpriteSheet: {},
            textureInfo: '',
            selectedSpriteKey: -1,
        };
        applyEditorMixin(this);
    }

    initPixi(this: editorProps): void {}
    bindCreateEmptySprite(this: editorProps): void {}
    bindMoveSprite(this: editorProps): void {}
    initGrid(this: editorProps, width: number, height: number): void {}

    canvasContainerRef: HTMLDivElement | null = null;
    canvasApp: Application | null = null;
    gameview: Viewport | null = null;
    spriteDisplay: Container | null = null;
    cutForm: FormInstance<any> | null = null;
    currentTexture: Texture | null = null;

    disposiables: (() => void)[] = [];

    componentDidMount() {
        fetch("http://localhost:7001/list")
            .then((res) => res.json())
            .then(({ data: { list } }) => this.setState({ list }));
        this.initPixi();
    }

    componentWillUnmount(): void {
        this.canvasApp?.destroy();
        this.disposiables.forEach(element => {
            element();
        });
    }

    loadSheet = async (name: string) => {
        const selectedSheet = this.state.list.find((x) => x.name === name);
        if (selectedSheet) {
            const [selectedSpriteSheet] = await Promise.all([
                fetch(
                    `http://localhost:7001/get_marked?name=${encodeURIComponent(
                        name
                    )}`
                )
                    .then((res) => res.json())
                    .then(({ data: { config } }) => config),
            ]);

            this.setState({
                selected: name,
                selectedSheet,
                selectedSpriteSheet,
                selectedSpriteKey: -1
            }, () => this.reloadTexture(name, selectedSheet));
        }
    };

    reloadTexture = async (name: string, selectedSheet: SheetInfo) => {
        const app = this.canvasApp!;
        const resource = `http://localhost:7001/public/${selectedSheet.resource}`;
        const texture = await new Promise<LoaderResource>((resolve) => {
            if (app.loader.resources[name]) {
                resolve(app.loader.resources[name]);
            } else {
                this.canvasApp!.loader.add(name, resource).load(
                    (loader, resources) => {
                        resolve(resources[name]);
                    }
                );
            }
        });

        this.setState({
            textureInfo: `${texture.texture?.width} x ${texture.texture?.height}`
        });
        const width = texture.texture?.width;
        const height = texture.texture?.height;
        this.currentTexture = texture.texture!;
        this.gameview!.removeChildren();
        console.log('base', texture.texture);

        this.initGrid(app.view.width, app.view.height);
        this.gameview!.addChild(new Sprite(texture.texture));
        this.spriteDisplay = this.gameview!.addChild(new Container);
        this.gameview!.addChild(new Graphics())
            .lineStyle({
                color: 0xff9933,
                width: 1
            })
            .lineTo(width!, 0)
            .lineTo(width!, height!)
            .lineTo(0, height!)
            .lineTo(0, 0);
        this.gameview!.resize();
        this.reloadSpriteDisplay();
    }
    reloadSpriteDisplay = () => {
        const selectedSpriteSheet = this.state.selectedSpriteSheet;
        const app = this.canvasApp!;
        const spriteDisplay = this.spriteDisplay = this.spriteDisplay || this.gameview!.addChild(new Container);
        spriteDisplay.removeChildren();

        Object.entries(selectedSpriteSheet as Record<string, TextureConfig>).map(([key, coords]) => {
            const mask = spriteDisplay.addChild(drawSpriteMask(getCoordFromTextureConfig(coords)));

            mask.on('click', () => {
                message.info(`key: ${key}, coords: ${JSON.stringify(coords)}`);
                this.setState({ selectedSpriteKey: this.state.selectedSpriteKey !== Number(key) ? Number(key) : -1 },
                    () => this.reloadSpriteDisplay());
            });
        });

        const currentSprite = this.getCurrentSprite();
        if (currentSprite) {
            Object.values(getCoordsControll(currentSprite)).forEach(coord => spriteDisplay.addChild(drawSpriteMask(coord)));
        }
    }

    rebuildCut = () => {
        if (this.state.selectedSpriteKey === -1) {
            this.doRebuildCut([0, 0,
                this.currentTexture?.width!,
                this.currentTexture?.height!,
            ], this.state.selectedSpriteSheet);
        } else {
            this.doRebuildCut(
                getCoordFromTextureConfig(this.state.selectedSpriteSheet[this.state.selectedSpriteKey]),
                this.state.selectedSpriteSheet);
        }
    }
    doRebuildCut = (coords: [number, number, number, number,], selectedSpriteSheet: Record<number, TextureConfig>) => {
        const values = this.cutForm?.getFieldsValue();
        const width = Math.floor(coords[2] / values.n);
        const height = Math.floor(coords[3] / values.m);

        let newKey = getNextKey(selectedSpriteSheet);
        for (let index = 0; index < Number(values.m); index++) {
            for (let jndex = 0; jndex < Number(values.n); jndex++) {
                selectedSpriteSheet[newKey] = [
                    coords[0] + jndex * width,
                    coords[1] + index * height,
                    width,
                    height
                ] as Coords
                newKey++;
            }
        }
        this.setState({
            selectedSpriteSheet,
        }, () => {
            this.reloadSpriteDisplay();
        });
    }

    saveCut = () => {
        fetch("http://localhost:7001/save_marked", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: this.state.selected,
                config: this.state.selectedSpriteSheet,
            }),
        });
    }

    getCurrentSprite = () => {
        if (this.state.selectedSpriteKey == -1) {
            return;
        }
        return this.state.selectedSpriteSheet[this.state.selectedSpriteKey];
    }

    setCurrentSprite = (config: TextureConfig) => {
        this.state.selectedSpriteSheet[this.state.selectedSpriteKey] = config;
        this.setState({}, () => {
            this.reloadSpriteDisplay();
        });
    }

    copyCurrentSprite = () => {
        const current = this.getCurrentSprite();
        if (current) {
            const newKey = getNextKey(this.state.selectedSpriteSheet);
            this.state.selectedSpriteSheet[newKey] = copyTextureConfig(current);
            this.setState({ selectedSpriteKey: newKey }, () => {
                this.reloadSpriteDisplay();
            });
        }
    }

    removeCurrentSprite = () => {
        delete this.state.selectedSpriteSheet[this.state.selectedSpriteKey];
        this.setState({ selectedSpriteKey: -1 }, () => {
            this.reloadSpriteDisplay();
        });
    }

    render(): React.ReactNode {
        return (
            <div>
                <h1>Animation sheet Editor</h1>
                <Row>
                    <Col span="2">Sheet: {this.state.textureInfo}</Col>
                    <Col span="8">
                        <Select
                            value={this.state.selected}
                            onChange={(value) => this.loadSheet(value)}
                            style={{ width: "100%" }}
                        >
                            {this.state.list.map((x) => (
                                <Select.Option key={x.name} value={x.name}>
                                    {x.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span="8">

                        {
                            this.state.selectedSpriteKey !== -1
                                ? (() => {
                                    const currentSprite = this.getCurrentSprite()!;
                                    const coords = getCoordFromTextureConfig(currentSprite);
                                    const offset = getOffsetFromTextureConfig(currentSprite);
                                    return (
                                        <div style={{ verticalAlign: 'middle' }}>
                                            {
                                                ['x', 'y', 'w', 'h'].map((x, idx) => {
                                                    return <Form.Item label={x} style={{ display: 'inline-block', }}>
                                                        <Input
                                                            style={{ width: 60 }}
                                                            value={coords[idx]}
                                                            onChange={(e) => {
                                                                coords[idx] = Number(e.target.value);
                                                                this.reloadSpriteDisplay();
                                                            }}
                                                        />
                                                    </Form.Item>
                                                })
                                            }
                                            {
                                                ['offsetx', 'offsety'].map((x, idx) => {
                                                    return <Form.Item label={x} style={{ display: 'inline-block', }}>
                                                        <Input
                                                            style={{ width: 60 }}
                                                            value={offset[idx]}
                                                            onChange={(e) => {
                                                                const newOffset = [...offset] as Coords;
                                                                newOffset[idx] = Number(e.target.value);;
                                                                this.setCurrentSprite(updateOffset(currentSprite, newOffset));
                                                            }}
                                                        />
                                                    </Form.Item>
                                                })
                                            }
                                            <Button danger onClick={this.removeCurrentSprite} >x</Button>
                                            <Button onClick={this.removeCurrentSprite} >copy</Button>
                                        </div>
                                    );

                                })()
                                : null
                        }
                        <Form layout="inline" style={{ display: 'inline-block', verticalAlign: 'middle' }} ref={ref => this.cutForm = ref}>
                            <Form.Item name="n" label="n(x)" initialValue={1} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                            <Form.Item name="m" label="m(y)" initialValue={1} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                        </Form>
                        <Button onClick={() => this.rebuildCut()}>fast cut</Button>
                        <Button onClick={() => this.saveCut()}>save cut</Button>
                    </Col>
                </Row>
                <Row>
                    <Col span="24">
                        <div
                            ref={(ref) => (this.canvasContainerRef = ref)}
                            style={{ height: 800 }}
                        ></div>
                    </Col>
                </Row>
            </div>
        );
    }
}


function drawSpriteMask(coords: Coords) {
    const spriteMark = new Container();
    spriteMark.addChild(new Graphics()
        .lineStyle({
            width: 1,
            color: 0x66ff66
        })
        .lineTo(coords[2], 0)
        .lineTo(coords[2], coords[3])
        .lineTo(0, coords[3])
        .lineTo(0, 0)
    );
    const mask = spriteMark.addChild(new Graphics()
        .beginFill(0x66ff66)
        .drawRect(0, 0, coords[2], coords[3])
        .endFill()
    );
    mask.alpha = 0.3;
    spriteMark.position.set(coords[0], coords[1]);
    spriteMark.interactive = true;

    return spriteMark;
}