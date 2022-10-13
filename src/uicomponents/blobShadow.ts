import * as PIXI from 'pixi.js';
import { getRunnerApp } from '../runnerApp';

export function getBlobShadow(renderer: PIXI.Renderer) {
    const width = 30;
    const height = 10;
    const padding = 5;

    const _w = width + 8 * padding;
    const _h =  height + 8 * padding;

    const shadow = new PIXI.Graphics();

    shadow.beginFill(0x000000);
    shadow.drawEllipse(_w / 2, _h / 2, width, height);
    shadow.endFill();

    shadow.filters = [new PIXI.filters.BlurFilter(padding, padding)];
    

    const bounds = new PIXI.Rectangle(0, 0, _w, _h);
    const texture = renderer.generateTexture(shadow, {
        scaleMode:PIXI.SCALE_MODES.NEAREST,
        resolution: 1, 
        region: bounds,
    });
    shadow.destroy();
    const realShadow = new PIXI.Sprite(texture);
    realShadow.position.x = - _w / 2;
    realShadow.position.y = - height;
    realShadow.parentGroup = getRunnerApp().getGroups().shadowGroup;
    return realShadow;
}
