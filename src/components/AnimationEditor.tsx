import {
    Button,
    Col,
    Divider, Input, Row,
    Select,
    Space, Typography
} from "antd";
import React from "react";
import { AnimationPreview } from "./animateSheets";
import { AnimationPicker } from "./animationPicker";
import { SheetInfo } from "../editor";

interface EditorState {
    list: SheetInfo[];
    selected: string;
    selectedSheet: SheetInfo | undefined;
    selectedSpriteSheet: Record<number, number[]>;
    selectedAnimateIndexMap: Record<string, number[]>;
    selectedAnimationName: string;
    newAnimationName: string;
    selectedSheetWidth: number;
    selectedSheetHeight: number;
}
export class AnimationEditor extends React.Component<{}, EditorState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            list: [],
            selected: "",
            selectedSheet: undefined,
            selectedSpriteSheet: {},
            selectedAnimateIndexMap: {},
            selectedAnimationName: "",
            newAnimationName: "",
            selectedSheetWidth: 0,
            selectedSheetHeight: 0,
        };
    }
    componentDidMount() {
        fetch("http://localhost:7001/list")
            .then((res) => res.json())
            .then(({ data: { list } }) => this.setState({ list }));
    }

    loadSheet = async (name: string) => {
        const selectedSheet = this.state.list.find((x) => x.name === name);
        if (selectedSheet) {
            const [
                selectedSpriteSheet, selectedAnimateIndexMap,
            ] = await Promise.all([
                fetch(
                    `http://localhost:7001/get_marked?name=${encodeURIComponent(
                        name
                    )}`
                )
                    .then((res) => res.json())
                    .then(({ data: { config } }) => config),
                fetch(
                    `http://localhost:7001/get_animation?name=${encodeURIComponent(
                        name
                    )}`
                )
                    .then((res) => res.json())
                    .then(({ data: { config } }) => config)
                    .catch(() => {
                        return {
                            idle: [],
                            idle_back: [],
                        };
                    }),
            ]);
            const selectedAnimationName = Object.keys(
                selectedAnimateIndexMap
            )[0];
            const {
                width: selectedSheetWidth, height: selectedSheetHeight,
            } = this.getAnimationSize(
                selectedAnimateIndexMap[selectedAnimationName] || [],
                selectedSpriteSheet
            );

            this.setState({
                selected: name,
                selectedSheet,
                selectedSpriteSheet,
                selectedAnimateIndexMap,
                selectedAnimationName,
                selectedSheetWidth,
                selectedSheetHeight,
            });
        }
    };
    getAnimationSize(
        indexes: number[],
        selectedSpriteSheet: Record<number, number[]> = {}
    ) {
        const sprites = indexes.map((idx) => selectedSpriteSheet[idx]);
        const width = Math.max(...sprites.map((x) => x[2])) || 0;
        const height = Math.max(...sprites.map((x) => x[3])) || 0;
        return { width, height };
    }
    renderBody() {
        if (!this.state.selectedSheet) {
            return null;
        }
        const {
            newAnimationName, selectedAnimateIndexMap, selectedAnimationName, selectedSheetWidth, selectedSheetHeight,
        } = this.state;

        return (
            <>
                <Select
                    style={{ width: "100%" }}
                    value={this.state.selectedAnimationName}
                    onChange={(value) => {
                        const {
                            width: selectedSheetWidth, height: selectedSheetHeight,
                        } = this.getAnimationSize(
                            selectedAnimateIndexMap[value] || [],
                            this.state.selectedSpriteSheet
                        );

                        this.setState({
                            selectedAnimationName: value,
                            selectedSheetWidth,
                            selectedSheetHeight,
                        });
                    }}
                    dropdownRender={(menu) => (
                        <>
                            {menu}
                            <Divider style={{ margin: "8px 0" }} />
                            <Space
                                align="center"
                                style={{ padding: "0 8px 4px" }}
                            >
                                <Input
                                    placeholder="Please enter item"
                                    value={newAnimationName}
                                    onChange={(e) => this.setState({
                                        newAnimationName: e.target.value,
                                    })} />
                                <Typography.Link
                                    onClick={() => {
                                        this.setState({
                                            selectedAnimateIndexMap: {
                                                ...selectedAnimateIndexMap,
                                                [newAnimationName]: [],
                                            },
                                            newAnimationName: ""
                                        });
                                    }}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    + Add item
                                </Typography.Link>
                            </Space>
                        </>
                    )}
                >
                    {Object.keys(selectedAnimateIndexMap).map((key) => (
                        <Select.Option key={key} value={key}>
                            {key}
                        </Select.Option>
                    ))}
                </Select>
                <AnimationPreview
                    name={this.state.selectedSheet.name}
                    url={`http://localhost:7001/public/${this.state.selectedSheet.resource}`}
                    spriteSheet={this.state.selectedSpriteSheet}
                    animateIndexMap={this.state.selectedAnimateIndexMap}
                    animationName={selectedAnimationName}
                    width={selectedSheetWidth}
                    height={selectedSheetHeight} />
                <AnimationPicker
                    name={this.state.selectedSheet.name}
                    url={`http://localhost:7001/public/${this.state.selectedSheet.resource}`}
                    spriteSheet={this.state.selectedSpriteSheet}
                    animateIndexMap={this.state.selectedAnimateIndexMap}
                    animationName={selectedAnimationName}
                    onChange={(map) => this.setState({
                        selectedAnimateIndexMap: map,
                    })} />
            </>
        );
    }
    render() {
        return (
            <div>
                <h1>Animation sheet Editor</h1>
                <Row>
                    <Col span="2">
                        Sheet:
                    </Col>
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
                        <Button
                            onClick={() => {
                                fetch("http://localhost:7001/save_animation", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        name: this.state.selected,
                                        config: this.state
                                            .selectedAnimateIndexMap,
                                    }),
                                });
                            }}
                        >
                            保存
                        </Button>
                    </Col>
                </Row>
                {this.renderBody()}
            </div>
        );
    }
}
