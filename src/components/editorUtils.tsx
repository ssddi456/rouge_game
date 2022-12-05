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
    bindEvents(): void;
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

        this.bindEvents();

        this.canvasContainerRef?.appendChild(app.view);
        this.initGrid(app.view.width, app.view.height);
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