import { Container, Sprite } from "pixi.js";
import { Group, Layer } from '@pixi/layers';

export const skyZIndex = 200;
export const textParticleZIndex = 130;
export const ammoZIndex = 110;
export const overGroundZindex = 100;
export const enemyZIndex = 90;
export const dropletZIndex = 70;
export const groundZIndex = 0;


export function createGroup(container: Container, zIndex: number){
    const displayGroup = new Group(zIndex, true);
    const displayLayer = new Layer(displayGroup);

    displayGroup.on('sort', ((sprite: Sprite) => {
        sprite.zOrder = sprite.position.y;
    }));

    container.addChild(displayLayer);

    return displayGroup;
}

export function createGroups (container: Container){
    return {
        skyGroup: createGroup(container, skyZIndex),
        textGroup: createGroup(container, textParticleZIndex),
        ammoGroup: createGroup(container, ammoZIndex),
        overGroundGroup: createGroup(container, overGroundZindex),
        groundGroup: createGroup(container, groundZIndex),
        dropletGroup: createGroup(container, dropletZIndex),
    };
}