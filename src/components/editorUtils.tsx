import { Stage } from "@pixi/layers";
import { Modal } from "antd";
import number from "inquirer/lib/prompts/number";
import { Viewport } from "pixi-viewport";
import { Application, Point, Graphics, Transform, Text } from "pixi.js";
import React from "react";
import { getCoordFromTextureConfig, getOffsetFromTextureConfig, copyTextureConfig } from "../loadAnimation";
import { PointXY, Coords, TextureConfig, CoordControll } from "../types";

export function getNextKey(selectedSpriteSheet: Record<number, any>) {
    const maxKey = Math.max(-1, ...Object.keys(selectedSpriteSheet).map(x => Number(x)));
    return maxKey + 1;
}

export function pointInCoords(p: PointXY, coords: Coords) {
    if (p.x > coords[0]
        && p.x < coords[0] + coords[2]
        && p.y > coords[1]
        && p.y < coords[1] + coords[3]
    ) {
        return true;
    }
    return false;
}

export function getCoordsControll(config: TextureConfig) {
    const coords = getCoordFromTextureConfig(config);
    const offset = getOffsetFromTextureConfig(config);

    const size = 8;
    const h = size / 2;
    return {
        [CoordControll.TopLeft]: [coords[0] - h, coords[1] - h, size, size],
        [CoordControll.TopCenter]: [coords[0] + (coords[2] / 2) - h, coords[1] - h, size, size],
        [CoordControll.TopRight]: [coords[0] + coords[2] - h, coords[1] - h, size, size],

        [CoordControll.MiddleLeft]: [coords[0] - h, coords[1] + (coords[3] / 2) - h, size, size],
        [CoordControll.MiddleCenter]: [-1, -1, 0, 0],
        [CoordControll.MiddleRight]: [coords[0] + coords[2] - h, coords[1] + (coords[3] / 2) - h, size, size],

        [CoordControll.BottomLeft]: [coords[0] - h, coords[1] + coords[3] - h, size, size],
        [CoordControll.BottomCenter]: [coords[0] + (coords[2] / 2) - h, coords[1] + coords[3] - h, size, size],
        [CoordControll.BottomRight]: [coords[0] + coords[2] - h, coords[1] + coords[3] - h, size, size],

        [CoordControll.OffsetPoint]: [coords[0] + (coords[2] / 2) + offset[0] - h, coords[1] + (coords[2] / 2) + offset[1] - h, size, size],
    } as Record<CoordControll, Coords>;
}

export function pointInCoordsControll(p: PointXY, config: TextureConfig) {
    const coords = getCoordFromTextureConfig(config);
    const CoordControllCoords = getCoordsControll(config);

    for (const key in CoordControllCoords) {
        if (Object.prototype.hasOwnProperty.call(CoordControllCoords, key)) {
            const element = CoordControllCoords[(key as any) as CoordControll];
            if (pointInCoords(p, element)) {
                return Number(key) as CoordControll;
            }
        }
    }

    if (pointInCoords(p, coords)) {
        return CoordControll.MiddleCenter;
    }
    return false;
}

export function normalizeCoord(coord: Coords) {
    if (coord[2] < 0) {
        coord[0] += coord[2];
        coord[2] *= -1;
    }
    if (coord[3] < 0) {
        coord[1] += coord[3];
        coord[3] *= -1;
    }
}

export interface editorProps extends React.Component<{}, {
    selectedSpriteSheet: Record<string | number, TextureConfig>
    selectedSpriteKey: string | number
}>, withEditorMixin {
    canvasContainerRef: HTMLDivElement | null;
    canvasApp: Application | null;
    gameview: Viewport | null;
    getCurrentSprite?(): TextureConfig | undefined;
    setCurrentSprite?(config: TextureConfig): void;
    reloadSpriteDisplay?(): void;
}

export const editorMixin = {

    initPixi(this: editorProps) {
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
    },

    bindCreateEmptySprite(this: editorProps) {
        const gameview = this.gameview!;
        let tempBox: Graphics;
        let startPos: PointXY;
        let delta: { w: number, h: number };
        gameview.on('pointerdown', (e) => {
            const globalPos = e.data.global as Point; // screen?
            const transform = e.currentTarget.transform as Transform;
            startPos = transform.worldTransform.applyInverse(globalPos);
            // not selet a sprite
            if (!Object.values(this.state.selectedSpriteSheet).some(x => pointInCoordsControll(startPos, getCoordFromTextureConfig(x)))) {
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
                            this.reloadSpriteDisplay?.();
                        }
                    });
                }
            }
            (tempBox as any) = null;
            (delta as any) = null;
        });
    },

    bindMoveSprite(this: editorProps) {
        const gameview = this.gameview!;
        let startPos: PointXY;
        let startSpriteCoord: Coords;
        let startSpriteOffset: Coords;
        let delta: { w: number, h: number };
        let moveMode: CoordControll | false;

        gameview.on('pointerdown', (e) => {
            const currentSprite = this.getCurrentSprite?.();
            if (currentSprite) {
                const globalPos = e.data.global as Point; // screen?
                const transform = e.currentTarget.transform as Transform;
                startPos = transform.worldTransform.applyInverse(globalPos);
                moveMode = pointInCoordsControll(startPos, currentSprite);
                console.log('moveMode', moveMode, moveMode !== false && CoordControll[moveMode]);
                // not selet a sprite
                if (moveMode !== false) {
                    delta = { w: 0, h: 0 };
                    startSpriteCoord = [...getCoordFromTextureConfig(currentSprite)];
                    startSpriteOffset = [...getOffsetFromTextureConfig(currentSprite)];
                }
            }
        });
        gameview.on('pointermove', (e) => {
            if (delta && e.currentTarget) {
                const globalPos = e.data.global as Point;
                const transform = e.currentTarget.transform as Transform;
                const localPos = transform.worldTransform.applyInverse(globalPos);
                delta = { w: localPos.x - startPos.x, h: localPos.y - startPos.y };
                const currentSpriteConfig = copyTextureConfig(this.getCurrentSprite?.()!);
                const currentSprite = getCoordFromTextureConfig(currentSpriteConfig);
                const currentOffset = getOffsetFromTextureConfig(currentSpriteConfig);
                if (moveMode == CoordControll.MiddleCenter) {
                    currentSprite[0] = startSpriteCoord[0] + delta.w;
                    currentSprite[1] = startSpriteCoord[1] + delta.h;
                } else {
                    switch (moveMode) {
                        case CoordControll.TopLeft:
                            currentSprite[0] = startSpriteCoord[0] + delta.w;
                            currentSprite[1] = startSpriteCoord[1] + delta.h;
                            currentSprite[2] = startSpriteCoord[2] - delta.w;
                            currentSprite[3] = startSpriteCoord[3] - delta.h;
                            break;
                        case CoordControll.TopCenter:
                            currentSprite[1] = startSpriteCoord[1] + delta.h;
                            currentSprite[3] = startSpriteCoord[3] - delta.h;
                            break;
                        case CoordControll.TopRight:
                            currentSprite[1] = startSpriteCoord[1] + delta.h;
                            currentSprite[2] = startSpriteCoord[2] + delta.w;
                            currentSprite[3] = startSpriteCoord[3] - delta.h;
                            break;
                        case CoordControll.MiddleLeft:
                            currentSprite[0] = startSpriteCoord[0] + delta.w;
                            currentSprite[2] = startSpriteCoord[2] - delta.w;
                            break;
                        case CoordControll.MiddleRight:
                            currentSprite[2] = startSpriteCoord[2] + delta.w;
                            break;
                        case CoordControll.BottomLeft:
                            currentSprite[0] = startSpriteCoord[0] + delta.w;
                            currentSprite[2] = startSpriteCoord[2] - delta.w;
                            currentSprite[3] = startSpriteCoord[3] + delta.h;
                            break;
                        case CoordControll.BottomCenter:
                            currentSprite[3] = startSpriteCoord[3] + delta.h;
                            break;
                        case CoordControll.BottomRight:
                            currentSprite[2] = startSpriteCoord[2] + delta.w;
                            currentSprite[3] = startSpriteCoord[3] + delta.h;
                            break;
                        case CoordControll.OffsetPoint:
                            currentOffset[0] = startSpriteOffset[0] + delta.w;
                            currentOffset[1] = startSpriteOffset[1] + delta.h;
                            break;
                    }
                }
                this.setCurrentSprite?.(currentSpriteConfig);
            }
        });
        gameview.on('pointerup', (e) => {
            const currentSprite = this.getCurrentSprite?.()!;
            if (currentSprite) {
                normalizeCoord(getCoordFromTextureConfig(currentSprite));
            }
            (startPos as any) = undefined;
            (startSpriteCoord as any) = undefined;
            (delta as any) = undefined;
        });
    },

    initGrid(this: editorProps, width: number, height: number) {
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
};

export type withEditorMixin = typeof editorMixin;

export function applyEditorMixin(instance: React.Component) {
    for (const key in editorMixin) {
        if (Object.prototype.hasOwnProperty.call(editorMixin, key)) {
            const element = editorMixin[key as (keyof typeof editorMixin)];
            (instance as any)[key] = element;
        }
    }
} 