import { getRunnerApp } from "../runnerApp";
import { getDirectionOutOfShape } from "../shape_utitls";
import { ShootInfo } from "../shootManager";
import { Vector } from "../vector";
import { BarrageShooter, BarrageShooterCastParams, defaultBarrageShooterCastParams } from "./BarrageShooter";

export class ShapeShooter extends BarrageShooter {
    shootQueue: ShootInfo[] = [];

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
            element.from || this.castPos,
            element.range || this.range,
            this.damage,
            this.projectile,
            this.tail,
            this.hitEffect,
            element.controller,
            element.controllerParams
        );
        ammo.max_piecing_count = 0;
        ammo.max_bouncing_count = 0;
        ammo.speed = this.speed;
        element.shooted = true;
    }

    cast(_params: Partial<ShapeShooterCastParams> = {}): void {
        const {
            startRad,
            endRad,
            emitCount,
            speed,
            waves,
            distance,
            initialDelay,
            delayFramePerWave,
            deltaRadPerWave,
            ammoController,
            ammoControllerParams,
            shape,
        } = {
            ...defaultShapeShooterCastParams,
            ..._params
        }

        const delta = (endRad - startRad) / (emitCount - 1);
        const initialVector = Vector.AB(this.castPos, this.target!.position!).normalize().multiplyScalar(speed / 10).rotate(startRad);

        for (let index = 0; index < emitCount; index++) {
            for (let jndex = 0; jndex < waves; jndex++) {
                const newDir = initialVector.clone().rotate(deltaRadPerWave * jndex);
                const localPoses = getDirectionOutOfShape(shape);
                for (let index = 0; index < shape.length; index++) {
                    const pos = localPoses[index];
                    this.shootQueue.push({
                        frameDelay: initialDelay + jndex * delayFramePerWave,
                        from: this.castPos.clone()
                                .add(newDir.clone().normalize().multiplyScalar(this.owner?.size || 10))
                                .add(pos),
                        dir: newDir,
                        shooted: false,
                        range: distance ? (distance * 1000 / 60 / speed) : 0,
                        damage: 1,
                        controller: ammoController,
                        controllerParams: ammoControllerParams,
                    });
                }
            }
            initialVector.rotate(delta);
        }
    }
}

const defaultShapeShooterCastParams: ShapeShooterCastParams = {
    ...defaultBarrageShooterCastParams,
    startRad: 0,
    endRad: 0,
    emitCount: 1,
    waves: 1,
    startScale: 1,
    endScale: 1,
    shape: [],
};

export interface ShapeShooterCastParams extends BarrageShooterCastParams { 
    shape: Vector[];
    startScale: number,
    endScale: number,
};