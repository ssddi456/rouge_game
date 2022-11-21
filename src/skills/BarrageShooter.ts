import { AnimatedSprite, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { ShootInfo } from "../shootManager";
import { Vector } from "../vector";
import { ActiveSkill } from "./activeskill";

export class BarrageShooter extends ActiveSkill {
    shootQueue: ShootInfo[] = [];

    constructor(
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(false, 0, true);
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

    update() {
        super.update();

        if (this.shootQueue.length) {
            for (let index = 0; index < this.shootQueue.length; index++) {
                const element = this.shootQueue[index];
                if (element.frameDelay > 0) {
                    element.frameDelay -= 1;
                } else {
                    this.doShoot(element);
                }
            }

            this.shootQueue = this.shootQueue.filter(x => !x.shooted);
        }
    }
    get castPos() {
        return (this.owner as any).shoot_position || this.owner?.position!;
    }
    doShoot(element: ShootInfo) {
        const pool = getRunnerApp().getEnemyAmmoPool();
        const ammo = pool.emit(
            element.dir!,
            this.castPos,
            this.range,
            this.damage,
            this.projectile,
            this.tail,
            this.hitEffect,
        );
        ammo.max_piecing_count = 0;
        ammo.max_bouncing_count = 0;
        ammo.speed = this.speed;
        element.shooted = true;
    }

    cast(): void {

        const endRad = Math.PI / 3;
        const emitCount = 6; // block count
        const delta = endRad / (emitCount - 1);
        const initialVector = Vector.AB(this.castPos, this.target!.position!).normalize().rotate(-endRad / 2);
        const waves = 9;
        const delayPerWave = 15;

        for (let index = 0; index < emitCount; index++) {
            for (let jndex = 0; jndex < waves; jndex++) {
                this.shootQueue.push({
                    frameDelay: jndex * delayPerWave,
                    dir: initialVector.clone(),
                    shooted: false,
                    damage: 1,
                    hitEffects: [],
                    ammoDieEffects: []
                });
            }
            initialVector.rotate(delta);
        }
    }
}
