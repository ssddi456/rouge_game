import { Graphics, Sprite } from "pixi.js";
import { skyZIndex } from "./groups";
import * as PIXI from 'pixi.js';
import { getRunnerApp } from "./runnerApp";
import { ECollisionType } from "./types";

export default class WarFog {

    graphic = new Graphics();
    radius = 200;
    blurSize = 50;

    constructor(
        public width: number,
        public height: number,
    ) {
        this.graphic.zIndex = skyZIndex;
        this.initGraphics();
    }
    
    initGraphics() {
        const g = this.graphic;
        g.clear();

        g.beginFill(0x000000, 0.9)
            .drawRect(0, 0, this.width, this.height)
            .endFill();
    }
    
    updateGraphics() {
        const app = getRunnerApp();
        const player = app.getEntities({
            collisionTypes: [ECollisionType.player]
        })[0];
        const camara = app.getCamera();
        const screenPos = camara.worldPosToScreenPos(player.position);

        const circle = new Graphics()
            .beginFill(0xff0000)
            // .drawRect(-this.blurSize, -this.blurSize, this.width + 2 * this.blurSize, this.height + 2 * this.blurSize)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
            .beginFill(0xaa0000)
            .drawCircle(screenPos.x, screenPos.y, this.radius * 1.5)
            .endFill()
            .beginFill(0x000000)
            .drawCircle(screenPos.x, screenPos.y, this.radius)
            .endFill();

        circle.filters = [new PIXI.filters.BlurFilter(this.blurSize)];

        const bounds = new PIXI.Rectangle(0, 0, this.width, this.height);
        const texture = getRunnerApp().getApp().renderer.generateTexture(circle, {
            scaleMode:PIXI.SCALE_MODES.NEAREST,
            resolution: 1, 
            region: bounds,
        });
        circle.destroy();
        const focus = new PIXI.Sprite(texture);
        const oldMask = this.graphic.mask;
        this.graphic.mask = focus;
        if (oldMask) {
            (oldMask as Sprite).destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
        }
    }

    update() {
        this.updateGraphics();
    }
}