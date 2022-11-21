import { AnimatedSprite, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { ShootInfo } from "../shootManager";
import { Vector } from "../vector";
import { BarrageShooter } from "./BarrageShooter";

export class ContinualShooter extends BarrageShooter {
    constructor(
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(projectile, tail, hitEffect);
    }

    cast(params: Partial<ContinualShooterCastParams> = {}): void {
        const {
            count,
            speed,
            distance,
            delayFramePerWave,
            deltaRadPerWave,
            deltaPositonPerWave,
        } = {
            ...defaultContinualShooterCastParams,
            ...params
        };

        const initialVector = Vector.AB(this.castPos, this.target!.position!).normalize().multiplyScalar(speed / 10);

        for (let index = 0; index < count; index++) {
            const from = this.castPos.clone().add(initialVector.clone().normalize().multiplyScalar(this.owner?.size || 10));
            if (deltaPositonPerWave) {
                from.add(deltaPositonPerWave instanceof Vector ? deltaPositonPerWave : deltaPositonPerWave(index, initialVector))
            }
            this.shootQueue.push({
                frameDelay: index * delayFramePerWave,
                from,
                dir: initialVector.clone().rotate(typeof deltaRadPerWave === 'number' ? deltaRadPerWave : deltaRadPerWave(index)),
                shooted: false,
                range: distance ? (distance * 1000 / 60 / speed) : 0,
                damage: 1,
                hitEffects: [],
                ammoDieEffects: []
            })
        }
    }
}

const defaultContinualShooterCastParams = {
    count: 6,
    speed: 10,
    distance: 0,
    delayFramePerWave: 15,
    deltaRadPerWave: 0 as (number | ((c: number) => number)),
    deltaPositonPerWave: undefined as (undefined | Vector | ((c: number, iv: Vector) => Vector)),
};
export type ContinualShooterCastParams = typeof defaultContinualShooterCastParams;