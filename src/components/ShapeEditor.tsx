import { Row, Col, Select, message, Form, Input, Button, FormInstance } from "antd";
import { Viewport } from "pixi-viewport";
import { Application, Container, Texture } from "pixi.js";
import { Component } from "react";
import { PointXY, TextureConfig } from "../types";
import { applyEditorMixin, editorProps, withEditorMixin } from "./editorUtils";

type ShapeEditorState = typeof defaultShapeEditorState;
const defaultShapeEditorState = {
    shapes: {} as Record<string, PointXY>,
    newShapeName: '',
    currentShapeName: '',
    selectedSpriteSheet: {} as Record<string | number, TextureConfig>,
    selectedSpriteKey: '' as string | number
}

export class ShapeEditor extends Component<ShapeEditorState> implements editorProps, withEditorMixin {
    state: ShapeEditorState = {
        ...defaultShapeEditorState,

    };
    constructor(props: any) {
        super(props);
        applyEditorMixin(this);
    }

    initPixi(this: editorProps): void { }
    bindCreateEmptySprite(this: editorProps): void { }
    bindMoveSprite(this: editorProps): void { }
    initGrid(this: editorProps, width: number, height: number): void { }

    canvasContainerRef: HTMLDivElement | null = null;
    canvasApp: Application | null = null;
    gameview: Viewport | null = null;


    componentWillMount() {
        this.loadShapeConfig();
    }

    loadShapeConfig() {
        fetch('/get_shape')
            .then(x => x.json())
            .then(x => {
                this.setState({ shapes: x.data.config }, () => {
                    this.initPixi();
                })
            });
    }

    saveShapeConfig() {
        fetch('/save_shape', {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(this.state.shapes)
        })
            .then(x => x.json())
            .then(x => {
                console.log('xxx', x);
            });
    }

    addShape() {
        const newShapeName = this.state.newShapeName;
        if (!newShapeName.length || (newShapeName in this.state.shapes)) {
            message.info('shape name should not be empty or duplicate');
            return
        }
        this.setState({
            shapes: {
                ...this.state.shapes,
                [this.state.newShapeName]: [],
                currentShapeName: newShapeName,
            },
            newShapeName: ''
        });
    }

    getCurrentShape() {
        return this.state.shapes[this.state.currentShapeName];
    }


    render() {
        return (
            <div>
                <h1>Animation sheet Editor</h1>
                <Row>
                    <Col span="8">
                        <Form.Item label={`Sheet: ${this.state.currentShapeName}`}>
                            <Select
                                value={this.state.currentShapeName}
                                onChange={(value) => this.setState({ currentShapeName: value })}
                                style={{ width: "100%" }}
                            >
                                {
                                    Object.keys(this.state.shapes).map((x) => (
                                        <Select.Option key={x}>{x}</Select.Option>
                                    ))
                                }
                            </Select>
                        </Form.Item>
                        <Form.Item label='new shape'>
                            <Input value={this.state.newShapeName} onChange={(e) => this.setState({ newShapeName: e.target.value })} />
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={() => this.addShape()}>Add</Button>
                        </Form.Item>
                    </Col>
                    <Col span="16">
                        <div
                            ref={(ref) => this.canvasContainerRef = ref}
                            style={{ height: 800 }}
                        ></div>
                    </Col>
                </Row>
            </div>
        );
    }

}