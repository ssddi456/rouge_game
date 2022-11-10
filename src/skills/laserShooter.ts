import { DisplayObject } from "pixi.js";
import { Laser } from "../element/laser";
import { VectorSegmentElement } from "../helper/vector_helper";
import { getRunnerApp } from "../runnerApp";
import { ECollisionType, UpdatableMisc } from "../types";
import { Vector, VectorSegment } from "../vector";
import { ActiveSkill } from "./activeskill";

export class LaserShooter extends ActiveSkill {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
    ) {
        super(autoCast, countdown, immediately);
    }

    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }

    _distance: number = 600;
    set distance(val: number) {
        this._distance = val;
    }
    get distance() {
        return this._distance;
    }

    get range() {
        return this._distance * 1000 / 60 / this._speed;
    }

    damage = 1;

    _speed: number = 10;
    set speed(val: number) {
        this._speed = val;
    };

    get speed() {
        return this._speed;
    }

    cast(): void {
        const app = getRunnerApp();
        app.addMisc(new DamageLaser(this.owner!.position!, 300));
    }
}

class DamageLaser implements  UpdatableMisc {
    dead: boolean = false;
    // sprite = new Laser(300);
    sprite: DisplayObject;
    segment: VectorSegment;
    last: number = 0;

    constructor(
        public position: Vector,
        public duration: number,
    ) {
        this.segment = new VectorSegment(this.position, this.position.clone().add({x: 300, y: 0}), 10);
        this.sprite  = new VectorSegmentElement(this.segment);
    }
    update(...args: any[]): void {
        const app = getRunnerApp();
        const player = app.getPlayer();
        if (player) {
            if (player.collisison_type == ECollisionType.player 
                && player.collideBody.collidesWithSegment(this.segment)
            ) {
                player.recieveDamage(1, player.position);
            }
        }
        this.last ++;
        if (this.last > this.duration) {
            this.dead = true;
        }
    }
    disposed: boolean = false;
    dispose(): void {
        this.disposed;
        this.sprite.destroy();
    }

}