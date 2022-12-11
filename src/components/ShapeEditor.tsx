import { Row, Col, Select, message, Form, Input, Button, FormInstance } from "antd";
import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics, Texture } from "pixi.js";
import React, { Component } from "react";
import { getBBoxOfShape, getCenterOfShape, getDirectionIntoShape, getDirectionOutOfShape, rotateShapeFromCenter } from "../shape_utitls";
import { PointXY, TextureConfig } from "../types";
import { Vector } from "../vector";
import { applyEditorMixin, editorProps, withEditorMixin } from "./editorUtils";

type ShapeEditorState = typeof defaultShapeEditorState;
const defaultShapeEditorState = {
    shapes: {} as Record<string, PointXY[]>,
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
    initGrid(this: editorProps, width: number, height: number): void { }

    canvasContainerRef: HTMLDivElement | null = null;
    canvasApp: Application | null = null;
    gameview: Viewport | null = null;
    shapeView: Graphics | null = null;

    componentWillMount() {
        this.loadShapeConfig();
    }

    loadShapeConfig() {
        fetch('http://localhost:7001/get_shape')
            .then(x => x.json())
            .then(x => {
                this.setState({ shapes: x.data.config }, () => {
                    this.initPixi();
                })
            });
    }

    bindEvents(): void {
        const gameview = this.gameview!;

        // add point to shape
        gameview.on('pointerdown', (e) => {
            if (e.data.originalEvent.ctrlKey) {
                const globalPos = e.data.global as PointXY;
                const currentShape = this.getCurrentShape();
                currentShape.push({ x: globalPos.x, y: globalPos.y });
                this.drawCurrentShape();
            }
            if (e.data.originalEvent.shiftKey) {
                const globalPos = e.data.global as PointXY;
                const currentShape = this.getCurrentShape();
                const filtered = currentShape.filter((p, i) => {
                    const dx = p.x - globalPos.x;
                    const dy = p.y - globalPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return dist > 10;
                });
                this.setState({
                    shapes: {
                        ...this.state.shapes,
                        [this.state.currentShapeName]: filtered
                    }
                }, () => {
                    this.drawCurrentShape();
                });

            }
        });
    }

    drawCurrentShape() {
        const currentShape = this.getCurrentShape();
        const gameview = this.gameview!;
        if (this.shapeView) {
            this.shapeView.clear()
        } else {
            this.shapeView = gameview.addChild(new Graphics());
        }

        const drawShape = (shape: Vector[]) => {
            shape.forEach((p, i) => {
                this.shapeView!
                    .beginFill(0xFF0000)
                    .drawCircle(p.x, p.y, 10)
                    .endFill();
            });
            const center = getCenterOfShape(shape);
            this.shapeView!
                .lineStyle(1, 0x000000)
                .moveTo(center.x, center.y - 10).lineTo(center.x, center.y + 10)
                .moveTo(center.x - 10, center.y).lineTo(center.x + 10, center.y);
        }
        const getVectorShape = () => currentShape.map(x => new Vector(x.x, x.y));
        const shape = getVectorShape();
        const bbox = getBBoxOfShape(shape);
        const center = getCenterOfShape(shape);
        drawShape(shape);

        const padding = 20;
        const nextLineTop = bbox.y + bbox.height + padding;
        const rowLeft = bbox.x + bbox.width + padding;

        const line2 = center.clone().add(new Vector(0, nextLineTop * 2));
        [
            { size: 1, pos: new Vector(0, 0) },
            { size: 0.8, pos: new Vector(bbox.width * 0.7, bbox.height * - 0.6) },
            { size: 0.8, pos: new Vector(bbox.width * 0.6, bbox.height * 0.7) },
            { size: 0.5, pos: new Vector(bbox.width * 0.1, bbox.height * - 1.3) },
            { size: 0.5, pos: new Vector(bbox.width * - 0.5, bbox.height * -0.7) },
            { size: 0.3, pos: new Vector(bbox.width * 0.1, bbox.height * 1.2) },
            { size: 0.2, pos: new Vector(bbox.width * 1.1, bbox.height * 0.2) },
            { size: 0.2, pos: new Vector(bbox.width * -0.5, bbox.height * 0.6) },
        ].forEach(({ size, pos }) => {
            drawShape(
                getDirectionOutOfShape(getVectorShape()).map(x => x.multiplyScalar(size))
                    .map(x => x.add(line2).add(pos))
            );
        });

    }

    saveShapeConfig() {
        fetch('http://localhost:7001/save_shape', {
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
                [newShapeName]: [],
            },
            currentShapeName: newShapeName,
            newShapeName: ''
        }, () => {
            this.drawCurrentShape();
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
                    <Col span="8" style={{ padding: 20 }}>
                        <Form.Item label={`Sheet: ${this.state.currentShapeName}`}>
                            <Select
                                value={this.state.currentShapeName}
                                onChange={(value) => {
                                    this.setState({ currentShapeName: value }, () => {
                                        this.drawCurrentShape();
                                    });
                                }}
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
                            <Button size='small' onClick={() => this.addShape()}>Add</Button>
                            <Button size='small' onClick={() => this.saveShapeConfig()}>Save</Button>
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