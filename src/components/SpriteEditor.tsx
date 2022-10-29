import { Row, Col, Select, Button, Form, Input, FormInstance, message, Modal } from "antd";
import { Application, Container, Graphics, ImageSource, LoaderResource, Sprite, Texture, Text, Point, Matrix, Transform } from "pixi.js";
import React from "react";
import { SheetInfo } from "../editor";

import { Viewport } from 'pixi-viewport'
import { Stage } from '@pixi/layers';

export function getNextKey(selectedSpriteSheet: Record<number, any>) {
    const maxKey = Math.max(-1, ...Object.keys(selectedSpriteSheet).map(x => Number(x)));
    return maxKey + 1;
}

export function pointInCoords(p: { x: number, y: number }, coords: Coords) {
    if (p.x > coords[0]
        && p.x < coords[0] + coords[2]
        && p.y > coords[1]
        && p.y < coords[1] + coords[3]
    ) {
        return true;
    }
    return false;
}

type Coords = [number, number, number, number];

interface EditorState {
    list: SheetInfo[];
    selected: string;
    selectedSheet: SheetInfo | undefined;
    selectedSpriteSheet: Record<number, Coords>;
    selectedSheetWidth: number;
    selectedSheetHeight: number;
    textureInfo: string;
    selectedSpriteKey: number;
}

export class SpriteEditor extends React.Component<{}, EditorState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            list: [],
            selected: "",
            selectedSheet: undefined,
            selectedSpriteSheet: {},
            selectedSheetWidth: 0,
            selectedSheetHeight: 0,
            textureInfo: '',
            selectedSpriteKey: -1,
        };
    }

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



    initPixi() {
        const app = new Application({
            width: this.canvasContainerRef!.clientWidth,
            height: this.canvasContainerRef!.clientHeight,
            backgroundColor: 0x1099bb,
        });
        app.stage = new Stage();
        const gameview = app.stage.addChild(new Viewport({
            screenWidth: this.canvasContainerRef!.clientWidth,
            screenHeight: this.canvasContainerRef!.clientHeight,
            worldWidth: this.canvasContainerRef!.clientWidth,
            worldHeight: this.canvasContainerRef!.clientHeight,
            stopPropagation: true,
            interaction: app.renderer.plugins.interaction
        }));

        gameview
            .drag({
                keyToPress: ['ControlLeft']
            })
            .pinch()
            .wheel();

        gameview.on('click', (e) => {
            console.log(e);

            const text = gameview.addChild(new Text('clicked'));
            const globalPos = e.data.global as Point;
            text.position.set(globalPos.x, globalPos.y);

            setTimeout(() => {
                gameview.removeChild(text);
            })
        });


        this.canvasApp = app;
        this.gameview = gameview;

        this.bindCreateEmptySprite();
        this.bindMoveSprite();

        this.canvasContainerRef?.appendChild(app.view);
        this.initGrid(app.view.width, app.view.height);
    }

    bindCreateEmptySprite() {
        const gameview = this.gameview!;
        let tempBox: Graphics;
        let startPos: { x: number, y: number };
        let delta: { w: number, h: number };
        gameview.on('pointerdown', (e) => {
            const globalPos = e.data.global as Point; // screen?
            const transform = e.currentTarget.transform as Transform;
            startPos = transform.worldTransform.applyInverse(globalPos);
            // not selet a sprite
            if (!Object.values(this.state.selectedSpriteSheet).some(x => pointInCoords(startPos, x))) {
                delta = { w: 0, h: 0 };
            }
        });

        gameview.on('pointermove', (e) => {
            if (e.currentTarget && delta) {
                const globalPos = e.data.global as Point;
                const transform = e.currentTarget.transform as Transform;
                const localPos = transform.worldTransform.applyInverse(globalPos);
                console.log(JSON.stringify(transform.worldTransform), globalPos.x, globalPos.y, localPos.x, localPos.y);
                delta = { w: localPos.x - startPos.x, h: localPos.y - startPos.y };

                if (delta.w > 4 || delta.h > 4) {
                    if (tempBox && e.currentTarget) {
                        tempBox
                            .clear()
                            .beginFill(0xffffff)
                            .drawRect(0, 0, localPos.x - startPos.x + 2, localPos.y - startPos.y + 2)
                            .endFill()
                            .beginHole()
                            .drawRect(1, 1, localPos.x - startPos.x, localPos.y - startPos.y)
                            .beginHole()
                    } else {
                        tempBox = gameview.addChild(new Graphics());
                        tempBox.position.set(startPos.x, startPos.y);
                        tempBox
                            .beginFill(0xffffff)
                            .drawRect(0, 0, 2, 2)
                            .endFill()
                    }
                }
            }

        });
        gameview.on('pointerup', (e) => {

            if (delta && tempBox) {
                tempBox.destroy();

                if (delta.w > 4 || delta.h > 4) {
                    const newData = [startPos.x, startPos.y, delta.w, delta.h] as Coords;
                    Modal.confirm({
                        content: 'add this sprite?',
                        onOk: () => {
                            const newKey = getNextKey(this.state.selectedSpriteSheet);
                            this.state.selectedSpriteSheet[newKey] = newData;
                            this.setState({
                                selectedSpriteKey: newKey
                            });
                            this.reloadSpriteDisplay();
                        }
                    });
                }
            }
            (tempBox as any) = null;
            (delta as any) = null;
        });
    }

    bindMoveSprite() {
        const gameview = this.gameview!;
        let startPos: { x: number, y: number };
        let startSpritePos:{ x: number, y: number };
        let delta: { w: number, h: number };

        gameview.on('pointerdown', (e) => {
            const currentSprite = this.getCurrentSprite();
            if (currentSprite) {
                const globalPos = e.data.global as Point; // screen?
                const transform = e.currentTarget.transform as Transform;
                startPos = transform.worldTransform.applyInverse(globalPos);

                // not selet a sprite
                if (pointInCoords(startPos, currentSprite)) {
                    delta = { w: 0, h: 0 };
                    startSpritePos= {x: currentSprite[0], y: currentSprite[1]};
                }
            }
        });
        gameview.on('pointermove', (e) => {
            if (delta && e.currentTarget) {
                const globalPos = e.data.global as Point;
                const transform = e.currentTarget.transform as Transform;
                const localPos = transform.worldTransform.applyInverse(globalPos);
                delta = { w: localPos.x - startPos.x, h: localPos.y - startPos.y };

                const currentSprite = this.getCurrentSprite()!;
                currentSprite[0] = startSpritePos.x + delta.w;
                currentSprite[1] = startSpritePos.y + delta.h;
                this.reloadSpriteDisplay();
            }
        });
        gameview.on('pointerup', (e) => {
            (startPos as any) = undefined;
            (startSpritePos as any) = undefined;
            (delta as any) = undefined;
        });
    }
    initGrid(width: number, height: number) {
        const size = 16;
        const xCount = Math.floor(width / size);
        const yCount = Math.floor(height / size);

        const grid = this.gameview!.addChild(new Graphics());
        grid.lineStyle({
            width: 1,
            color: 0xffffff
        });
        grid.alpha = 0.1;
        for (let index = 0; index < xCount; index++) {
            const x = size * (index + 1);
            grid.moveTo(x, 0);
            grid.lineTo(x, height)
        }
        for (let index = 0; index < yCount; index++) {
            const y = size * (index + 1);
            grid.moveTo(0, y);
            grid.lineTo(width, y)
        }
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
            .lineTo(0, 0)
        this.reloadSpriteDisplay();
    }
    reloadSpriteDisplay = () => {
        const selectedSpriteSheet = this.state.selectedSpriteSheet;
        const app = this.canvasApp!;
        const spriteDisplay = this.spriteDisplay = this.spriteDisplay || this.gameview!.addChild(new Container);
        spriteDisplay.removeChildren();

        Object.entries(selectedSpriteSheet as Record<string, Coords>).map(([key, coords]) => {
            const mask = spriteDisplay.addChild(drawSpriteMask(coords));

            mask.on('click', () => {
                message.info(`key: ${key}, coords: ${JSON.stringify(coords)}`);
                this.setState({ selectedSpriteKey: this.state.selectedSpriteKey !== Number(key) ? Number(key) : -1 });
            });
        });
    }

    rebuildCut = () => {
        if (this.state.selectedSpriteKey === -1) {
            this.doRebuildCut([0, 0,
                this.currentTexture?.width!,
                this.currentTexture?.height!,
            ], this.state.selectedSpriteSheet);
        } else {
            this.doRebuildCut(this.state.selectedSpriteSheet[this.state.selectedSpriteKey], this.state.selectedSpriteSheet);
        }
    }
    doRebuildCut = (coords: [number, number, number, number,], selectedSpriteSheet: Record<number, Coords>) => {
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
    copyCurrentSprite = () => {
        const current = this.getCurrentSprite();
        if (current) {
            const newKey = getNextKey(this.state.selectedSpriteSheet);
            this.state.selectedSpriteSheet[newKey] = [...current];
            this.setState({ selectedSpriteKey: newKey });
            this.reloadSpriteDisplay();
        }
    }

    changeCurrentSprite = (_, values) => {
        message.info(`this.state.selectedSpriteKey ${this.state.selectedSpriteKey}, values ${JSON.stringify(values)}`);

        this.state.selectedSpriteSheet[this.state.selectedSpriteKey] = [Number(values.x), Number(values.y), Number(values.w), Number(values.h)];
        this.reloadSpriteDisplay();
    }

    removeCurrentSprite = () => {
        delete this.state.selectedSpriteSheet[this.state.selectedSpriteKey];
        this.setState({ selectedSpriteKey: -1 });
        this.reloadSpriteDisplay();
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
                                    const coords = this.getCurrentSprite()!;

                                    return (
                                        <Form
                                            layout="inline"
                                            key={this.state.selectedSpriteKey}
                                            style={{ verticalAlign: 'middle' }}
                                            onValuesChange={this.changeCurrentSprite}
                                        >
                                            <Form.Item key={`${this.state.selectedSpriteKey}-x`}name="x" label="x" initialValue={coords[0]} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                                            <Form.Item key={`${this.state.selectedSpriteKey}-y`}name="y" label="y" initialValue={coords[1]} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                                            <Form.Item key={`${this.state.selectedSpriteKey}-w`}name="w" label="w" initialValue={coords[2]} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                                            <Form.Item key={`${this.state.selectedSpriteKey}-h`}name="h" label="h" initialValue={coords[3]} style={{ display: 'inline-block', }}><Input style={{ width: 60 }} /></Form.Item>
                                            <Button danger onClick={this.removeCurrentSprite} >x</Button>
                                            <Button onClick={this.removeCurrentSprite} >copy</Button>
                                        </Form>
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