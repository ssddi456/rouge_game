import { AnimatedSprite, Container, DisplayObject, Graphics, Point, Sprite, Texture } from "pixi.js";
import { HotClass } from "./helper/class_reloader";
import { getRunnerApp } from "./runnerApp";
import { GameObject } from "./types";
import { mouse } from "./user_input";
import { Vector } from "./vector";

// 1 - 5
interface Changable {
    percent: number;
    addCharge(): void;
    releaseCharge(): void;
    releasing: boolean;
}

export class Bow1Inner implements GameObject, Changable {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);

    sprite: Container = new Container();

    ropeDragRangeMin = -55;
    ropeDragRangeMax = 70;

    ropePoints = [
        new Point(this.ropeDragRangeMin, -85),
        new Point(this.ropeDragRangeMin, 0),
        new Point(this.ropeDragRangeMin, 85),
    ];

    rope = new Graphics();

    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        this.rope.pivot.set(0.5, 0.5);
        this.sprite.addChild(this.rope);
        this.drawRope();
        this.initSprite(bowAnimateMap);
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const bow1 = bowAnimateMap.bow1;
        const top = new Sprite(bow1.textures[0] as Texture);
        const bottom = new Sprite(bow1.textures[1] as Texture);
        const handle = new Sprite(bow1.textures[2] as Texture);
        
        top.pivot.set(0, 1);

        this.sprite.addChild (top);
        this.sprite.addChild (bottom);
        this.sprite.addChild(handle);
        
        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0,0,2);
        
        const bowCenterPosX = -80;
        const bowCenterPosY = 0;

        handle.position.set(
            -1 * handle.width / 2 + bowCenterPosX, 
            -1 * handle.height / 2 + bowCenterPosY,
        );
        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(bowCenterPosX, bowCenterPosY);
        top.position.x = bottom.position.x = -100 + bowCenterPosX;
        top.position.y = -1 * top.height + bowCenterPosY;
        bottom.position.y = 0 + bowCenterPosY;
    }

    drawRope() {
        const rope = this.rope;
        rope.clear();
        rope.lineStyle({
            color: 0xffffff,
            width: 2
        });
        rope.moveTo(this.ropePoints[0].x, this.ropePoints[0].y);
        if (this.percent == 100 || (this.releasing && this.percent == 0)) {
            rope.lineTo(this.ropePoints[1].x , this.ropePoints[1].y);
        } else {
            rope.lineTo(this.ropePoints[1].x, this.ropePoints[1].y);
        }
        rope.lineTo(this.ropePoints[2].x, this.ropePoints[2].y);
    }

    updateRope() {
        if (this.percent < -20) {
            this.percent = 0;
            this.releasing = false;
        }

        this.ropePoints[1].x = this.ropeDragRangeMin 
            + (Math.max(Math.min(this.percent - 10, 90), 0) * (this.ropeDragRangeMax - this.ropeDragRangeMin)) / 80
            + (
                this.releasing
                    ? (this.percent < 10 ? 10 * (0.5 - Math.random()): 0)
                    : (this.percent == 100 ? 2 * (0.5 - Math.random()): 0)
            );
    }

    percent = 0;
    releasing = false;

    addCharge() {
        if (this.releasing) {
            return;
        }
        this.percent = Math.min(this.percent + 24, 100);
    }

    releaseCharge(): void {
        if (this.percent > 0 && !this.releasing) {
            this.releasing = true;
        }

        if (this.releasing) {
            if (this.percent < 10) {
                this.percent = this.percent - 2;
            } else if (this.percent < 50) {
                this.percent = this.percent - 40;
            } else {
                this.percent = this.percent - 30;
            }
        }
    }

    updateState(): void {
        const runnerApp = getRunnerApp();
        const worldPos = runnerApp.getMouseWorldPos();
        const vec = worldPos.sub(this.position).normalize();
        const rotation = Math.atan(vec.y / vec.x);
        // 仍然有突变的问题
        if (vec.x > 0) {
            this.sprite.rotation = rotation - Math.PI;
        } else {
            this.sprite.rotation = rotation;
        }
        if (mouse.left) {
            this.addCharge();
        } else {
            this.releaseCharge();
        }
    }

    updateSprite() {
    }

    update(): void {
        this.updateState();
        this.updateRope();
        this.drawRope();
        this.updateSprite();
    }
}
export type Bow1 = Bow1Inner;
export const Bow1 = HotClass({ module })(Bow1Inner);
export class Bow2 extends Bow1 {
    ropeDragRangeMin = -30;
    ropeDragRangeMax = 60;
    ropePoints = [
        new Point(this.ropeDragRangeMin, -70),
        new Point(this.ropeDragRangeMin, 0),
        new Point(this.ropeDragRangeMin, 70),
    ];
    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        super(bowAnimateMap);
        this.drawRope();
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const bow2 = bowAnimateMap.bow2;
        const top = new Sprite(bow2.textures[0] as Texture);
        const bottom = new Sprite(bow2.textures[1] as Texture);
        const handle = new Sprite(bow2.textures[2] as Texture);
        top.pivot.set(0, 1);


        this.sprite.addChild(top);
        this.sprite.addChild(bottom);
        this.sprite.addChild(handle);

        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0, 0, 2);

        const bowCenterPosX = -80;
        const bowCenterPosY = 0;

        handle.position.set(
            -1 * handle.width / 2 + bowCenterPosX,
            -1 * handle.height / 2 + bowCenterPosY,
        );
        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(bowCenterPosX, bowCenterPosY);
        top.position.x = bottom.position.x = -14 + bowCenterPosX;
        const yDelta = 10;
        top.position.y = -1 * top.height - yDelta + bowCenterPosY;
        bottom.position.y = yDelta + bowCenterPosY;
    }
}


export class Bow3 extends Bow1 {
    ropeDragRangeMin = -35;
    ropeDragRangeMax = 60;
    ropePoints = [
        new Point(this.ropeDragRangeMin, -100),
        new Point(this.ropeDragRangeMin, 0),
        new Point(this.ropeDragRangeMin, 100),
    ];
    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        super(bowAnimateMap);
        this.drawRope();
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const bow3 = bowAnimateMap.bow3;
        const top = new Sprite(bow3.textures[0] as Texture);
        const bottom = new Sprite(bow3.textures[1] as Texture);
        const handle = new Sprite(bow3.textures[2] as Texture);
        top.pivot.set(0, 1);


        this.sprite.addChild(top);
        this.sprite.addChild(bottom);
        this.sprite.addChild(handle);

        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0, 0, 2);

        const bowCenterPosX = -55;
        const bowCenterPosY = 0;

        const handleHeight = handle.height / 2;
        handle.position.set(
            -1 * handle.width / 2 + bowCenterPosX,
            -1 * handleHeight + bowCenterPosY,
        );
        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(bowCenterPosX, bowCenterPosY);
        top.position.x = bottom.position.x = -50 + bowCenterPosX;
        const yDelta = 11;
        top.position.y = -1 * top.height - yDelta + bowCenterPosY;
        bottom.position.y = yDelta + bowCenterPosY;
    }
}

export class Bow4 extends Bow1 {
    ropeDragRangeMin = -20;
    ropeDragRangeMax = 80;
    ropePoints = [
        new Point(this.ropeDragRangeMin, -95),
        new Point(this.ropeDragRangeMin, 0),
        new Point(this.ropeDragRangeMin, 95),
    ];
    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        super(bowAnimateMap);
        this.drawRope();
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const bow4 = bowAnimateMap.bow4;
        const top = new Sprite(bow4.textures[0] as Texture);
        const bottom = new Sprite(bow4.textures[1] as Texture);
        const handle = new Sprite(bow4.textures[2] as Texture);
        top.pivot.set(0, 1);


        this.sprite.addChild(top);
        this.sprite.addChild(bottom);
        this.sprite.addChild(handle);

        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0, 0, 2);

        const bowCenterPosX = -60;
        const bowCenterPosY = 0;

        handle.position.set(
            -1 * handle.width / 2 + bowCenterPosX,
            -1 * handle.height / 2 + bowCenterPosY,
        );
        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(bowCenterPosX, bowCenterPosY);
        top.position.x = bottom.position.x = -40 + bowCenterPosX;
        const yDelta = 8;
        top.position.y = -1 * top.height - yDelta + 2 + bowCenterPosY;
        bottom.position.y = yDelta + bowCenterPosY;
    }
}


export class Bow5 extends Bow1 {
    ropeDragRangeMin = -40;
    ropeDragRangeMax = 60;
    ropePoints = [
        new Point(this.ropeDragRangeMin + 5, -100 - 20),
        new Point(this.ropeDragRangeMin + 2.5, 0),
        new Point(this.ropeDragRangeMin, 100),
    ];
    constructor(
        bowAnimateMap: Record<string, AnimatedSprite>
    ) {
        super(bowAnimateMap);
        this.drawRope();
    }

    initSprite(bowAnimateMap: Record<string, AnimatedSprite>) {
        this.sprite.pivot.set(0.5, 0.5);
        const bow5 = bowAnimateMap.bow5;
        const top = new Sprite(bow5.textures[0] as Texture);
        const bottom = new Sprite(bow5.textures[1] as Texture);
        const handle = new Sprite(bow5.textures[2] as Texture);
        top.pivot.set(0, 1);


        this.sprite.addChild(top);
        this.sprite.addChild(bottom);
        this.sprite.addChild(handle);

        const center = this.sprite.addChild(new Graphics());
        center.beginFill(0xff0000);
        center.drawCircle(0, 0, 2);

        const bowCenterPosX = -80;
        const bowCenterPosY = 0;

        handle.position.set(
            -1 * handle.width / 2 + bowCenterPosX,
            -1 * handle.height / 2 + bowCenterPosY,
        );
        const bowCenter = this.sprite.addChild(new Graphics());
        bowCenter.beginFill(0xff0000);
        bowCenter.drawCircle(0, 0, 2);
        bowCenter.position.set(bowCenterPosX, bowCenterPosY);
        top.position.x = -25 + bowCenterPosX
        bottom.position.x = -20 + bowCenterPosX;
        const yDelta = 17;
        top.position.y = -1 * top.height - yDelta - 5 + bowCenterPosY;
        bottom.position.y = yDelta + bowCenterPosY;
    }
}