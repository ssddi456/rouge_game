import React from "react";
import {
    Button,
    Col,
    Divider,
    Input,
    Row,
    Select,
    Space,
    Typography,
} from "antd";

interface AnimationPickerProps {
    name: string;
    url: string;
    spriteSheet: Record<string, number[]>;
    animateIndexMap: Record<string, number[]>;
    animationName: string;
    onChange(map: Record<string, number[]>): void;
}
interface AnimationPickerState {
    pickState: "pick" | "idle";
    newAnimationName: string;
}
export class AnimationPicker extends React.Component<
    AnimationPickerProps,
    AnimationPickerState
> {
    constructor(props: AnimationPickerProps) {
        super(props);
        this.state = {
            pickState: "idle",
            newAnimationName: "",
        };
    }

    render() {
        const { url, spriteSheet, animateIndexMap, animationName } = this.props;
        const { pickState, newAnimationName } = this.state;

        const currentAnimationIdx =
            animateIndexMap[this.props.animationName] || [];
        const spritePositions = currentAnimationIdx.map((idx) => {
            return {
                idx,
                pos: spriteSheet[idx],
            };
        });

        return (
            <div>
                <h3>Animation Sprite picker</h3>
                <Row>
                    <Col span={12}></Col>
                </Row>
                <div>
                    <div>
                        current sheet sprite:
                    </div>
                    {/*  增加和删除 */}
                    {spritePositions.map((sprite, i) => {
                        return (
                            <div
                                key={`${sprite.idx}_${i}`}
                                style={{
                                    background: `url("${url}") ${
                                        -1 * sprite.pos[0]
                                    }px ${-1 * sprite.pos[1]}px`,
                                    backgroundRepeat: "no-repeat",
                                    width: sprite.pos[2],
                                    height: sprite.pos[3],
                                    border: "1px solid red",
                                    display: "inline-block",
                                }}
                            >
                                {`${sprite.idx}_${i}`}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        currentAnimationIdx.splice(i, 1);

                                        this.props.onChange({
                                            ...animateIndexMap,
                                            [animationName]: currentAnimationIdx,
                                        });
                                    }}
                                >
                                    X
                                </Button>
                            </div>
                        );
                    })}
                    <Button
                        onClick={() => {
                            if (pickState === "idle") {
                                this.setState({
                                    pickState: "pick",
                                });
                            } else {
                                this.setState({
                                    pickState: "idle",
                                });
                            }
                        }}
                    >
                        {pickState === "idle" ? "Pick" : "Idle"}
                    </Button>
                </div>
                <div
                    style={{
                        position: "relative",
                        overflow: "auto",
                        maxHeight: "500px",
                    }}
                >
                    <img src={url} />
                    {pickState == "idle"
                        ? spritePositions.map((sprite, i) => {
                              return (
                                  <div
                                      key={`${sprite.idx}_${i}`}
                                      style={{
                                          position: "absolute",
                                          left: sprite.pos[0],
                                          top: sprite.pos[1],
                                          width: sprite.pos[2],
                                          height: sprite.pos[3],
                                          outline: "1px solid red",
                                      }}
                                  >
                                      {`${sprite.idx}_${i}`}
                                  </div>
                              );
                          })
                        : pickState == "pick"
                        ? Object.keys(spriteSheet).map((i) => {
                              const sprite = spriteSheet[i];
                              return (
                                  <div
                                      key={`${i}`}
                                      style={{
                                          position: "absolute",
                                          left: sprite[0],
                                          top: sprite[1],
                                          width: sprite[2],
                                          height: sprite[3],
                                          outline: "1px solid red",
                                      }}
                                  >
                                      {`${i}`}
                                      <Button
                                          size="small"
                                          onClick={() => {
                                              const updatedAnimationIdx = [
                                                  ...currentAnimationIdx,
                                                  Number(i),
                                              ];

                                              this.props.onChange({
                                                  ...animateIndexMap,
                                                  [animationName]: updatedAnimationIdx,
                                              });
                                          }}
                                      >
                                          +
                                      </Button>
                                  </div>
                              );
                          })
                        : null}
                </div>
            </div>
        );
    }
}
