import { Row, Col, Select, Button, Form, Input, FormInstance } from "antd";
import { Application, Container, Graphics, ImageSource, LoaderResource, Sprite, Texture, TextureSource } from "pixi.js";
import React from "react";
import { SheetInfo } from "../editor";

interface EditorState {
    list: SheetInfo[];
    selected: string;
    selectedSheet: SheetInfo | undefined;
    selectedSpriteSheet: Record<number, [number, number, number, number]>;
    selectedSheetWidth: number;
    selectedSheetHeight: number;
    textureInfo: string;
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
        };
    }

    canvasContainerRef: HTMLDivElement | null = null;
    canvasApp: Application | null = null;
    spriteDisplay: Container | null = null;
    cutForm: FormInstance<any> | null = null;
    currentTexture: Texture | null = null;

    componentDidMount() {
        fetch("http://localhost:7001/list")
            .then((res) => res.json())
            .then(({ data: { list } }) => this.setState({ list }));
        this.initPixi();
    }

    componentWillUnmount(): void {
        this.canvasApp?.destroy();
    }

    initPixi() {
        const app = new Application({
            width: this.canvasContainerRef!.clientWidth,
            height: this.canvasContainerRef!.clientHeight,
            backgroundColor: 0x1099bb,
        });
        this.canvasApp = app;
        this.canvasContainerRef?.appendChild(app.view);
        this.initGrid(app.view.width, app.view.height);
    }

    initGrid(width: number, height: number) {
        const size = 16;
        const xCount = Math.floor(width / size);
        const yCount = Math.floor(height / size);

        const grid = this.canvasApp!.stage.addChild(new Graphics());
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
        app.stage.removeChildren();
        console.log('base', texture.texture);

        this.initGrid(app.view.width, app.view.height);
        app.stage.addChild(new Sprite(texture.texture));
        this.spriteDisplay = app.stage.addChild(new Container);
        app.stage.addChild(new Graphics())
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
        const spriteDisplay = this.spriteDisplay = this.spriteDisplay || app.stage.addChild(new Container);
        spriteDisplay.removeChildren();

        Object.entries(selectedSpriteSheet as Record<string, [number, number, number, number]>).map(([key, coords]) => {
            const spriteMark = spriteDisplay.addChild(new Container());
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
        });
    }

    rebuildCut = () => {
        const values = this.cutForm?.getFieldsValue();
        const width = this.currentTexture?.width! / values.n;
        const height = this.currentTexture?.height! / values.m;
        const selectedSpriteSheet: Record<number, [number, number, number, number]> = {};

        for (let index = 0; index < Number(values.m); index++) {
            const currentLineHeight = height * index
            for (let jndex = 0; jndex < Number(values.n); jndex++) {
                selectedSpriteSheet[(jndex + index * values.n)] = [
                    jndex * width,
                    index * height,
                    width,
                    height
                ] as [number, number, number, number]

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
