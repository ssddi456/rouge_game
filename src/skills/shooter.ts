import { AnimatedSprite, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { ActiveSkill } from "./activeskill";

export class Shooter extends ActiveSkill {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public poolType: 'AmmoPool' | 'EnemyAmmoPool' = 'AmmoPool',
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
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
        const pool = getRunnerApp()[('get' + this.poolType as 'getAmmoPool' | 'getEnemyAmmoPool')]();
        const castPos = (this.owner as any).shoot_position || this.owner?.position!;
        const ammo = pool.emit(
            Vector.AB(castPos, this.target!.position!).normalize(),
            castPos,
            this.range,
            this.damage,
            this.projectile,
            this.tail,
            this.hitEffect,
        );
        ammo.max_piecing_count = 0;
        ammo.max_bouncing_count = 0;
        ammo.speed = this.speed;
    }
}

export class AllianceShooter extends Shooter {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(autoCast, countdown, immediately, 'AmmoPool', projectile, tail, hitEffect);
    }
}
export class EnemyShooter extends Shooter {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(autoCast, countdown, immediately, 'EnemyAmmoPool', projectile, tail, hitEffect);
        this.damage = 1;
    }
}