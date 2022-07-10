import { Container, Point, Graphics, AnimatedSprite, Sprite, Texture, DisplayObject } from "pixi.js";
import { getRunnerApp } from "./runnerApp";
import { EFacing, GameObject } from "./types";
import { Vector } from "./vector";

export class Gun1 implements GameObject {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);

    sprite: Container = new Container();

    facing: EFacing = EFacing.bottom;
    gunCenterPosX = -60;
    muzzle: Vector = new Vector(0, 0);

    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        this.initSprite(bowAnimateMap);
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const gun = this.getSprite(bowAnimateMap);
        const top = new Sprite(gun.textures[0] as Texture);
        const handle = new Sprite(gun.textures[1] as Texture);

        this.sprite.addChild(top);
        this.sprite.addChild(handle);

        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0, 0, 2);

        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(this.gunCenterPosX, 0);

        const muzzle = this.sprite.addChild(new Graphics());
        muzzle.beginFill(0xff0000);
        muzzle.drawCircle(0, 0, 2);
        this.setupParts(top, handle, muzzle);
    }

    getSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        return bowAnimateMap.gun1;
    }

    setupParts(top: DisplayObject, handle: DisplayObject, muzzle: DisplayObject) {
        top.position.x = -86 + this.gunCenterPosX;
        top.position.y = -38;
        handle.position.x = -30 + this.gunCenterPosX;
        handle.position.y = -30;

        muzzle.position.x = -45 + this.gunCenterPosX;
        muzzle.position.y = 5;
    }
    updateState(): void {
        const runnerApp = getRunnerApp();
        const worldPos = runnerApp.getMouseWorldPos();
        const vec = worldPos.sub(this.position).normalize();
        const rotation = Math.atan(vec.y / vec.x);
        // 仍然有突变的问题
        if (vec.x > 0) {
            this.sprite.rotation = rotation - Math.PI / 2;
        } else {
            this.sprite.rotation = rotation + Math.PI / 2;
        }
    }
    update(): void {
        this.updateState();
    }
}


export class Gun2 extends Gun1 {
    getSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        return bowAnimateMap.gun2;
    }

    setupParts(top: DisplayObject, handle: DisplayObject, muzzle: DisplayObject) {

        top.position.x = -80 + this.gunCenterPosX;
        top.position.y = -38;
        handle.position.x = -20 + this.gunCenterPosX;
        handle.position.y = -10;

        muzzle.position.x = -68 + this.gunCenterPosX;
        muzzle.position.y = 5;
    }
}

export class Gun3 extends Gun1 {
    getSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        return bowAnimateMap.gun3;
    }

    setupParts(top: DisplayObject, handle: DisplayObject, muzzle: DisplayObject) {

        top.position.x = -86 + this.gunCenterPosX;
        top.position.y = -38;
        handle.position.x = -34 + this.gunCenterPosX;
        handle.position.y = -23;

        muzzle.position.x = -72 + this.gunCenterPosX;
        muzzle.position.y = 15;
    }
}

export class Gun4 extends Gun1 {
    getSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        return bowAnimateMap.gun4;
    }

    setupParts(top: DisplayObject, handle: DisplayObject, muzzle: DisplayObject) {

        top.position.x = -88 + this.gunCenterPosX;
        top.position.y = -52;
        handle.position.x = -10 + this.gunCenterPosX;
        handle.position.y = -5;

        muzzle.position.x = -63 + this.gunCenterPosX;
        muzzle.position.y = 11;
    }
}


export class Gun5 extends Gun1 {
    getSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        return bowAnimateMap.gun5;
    }

    setupParts(top: DisplayObject, handle: DisplayObject, muzzle: DisplayObject) {

        top.position.x = -86 + this.gunCenterPosX;
        top.position.y = -46;
        handle.position.x = -30 + this.gunCenterPosX;
        handle.position.y = -10;

        muzzle.position.x = -75 + this.gunCenterPosX;
        muzzle.position.y = 5;
    }
}
