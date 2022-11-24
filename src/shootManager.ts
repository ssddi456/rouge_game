

/**
 * shell
 * power smoke fire
 * warheads
 * hit exposion piecing
 * miss exposion
 */

import { DisplayObject } from "pixi.js";
import { AmmoPool } from "./ammo";
import { Buffable, BUFFER_BEFORE_SHOOT, execEventBuffer } from "./buffer";
import { HotClass } from "./helper/class_reloader";
import { getRunnerApp } from "./runnerApp";
import { Buffer, EventBuffer } from "./types";
import { keypressed, mouse } from "./user_input";
import { Vector } from "./vector";

export interface ShootInfo {
    frameDelay: number;
    dir?: Vector;
    range?: number;
    from?: Vector;
    target?: Vector;
    shooted: boolean;
    damage: number;
    whenShoot?: () => void;
    hitEffects?: EventBuffer[];
    ammoDieEffects?: EventBuffer[];
    controller?: string,
    controllerParams?: any,
}
@HotClass({ module })
export class ShootManager implements Buffable {
    position: Vector = new Vector(0, 0);
    // 15deg = 15/180 * Math.PI
    dispersionRad: number = 0;
    projectileCount: number = 1;

    shootQueue: ShootInfo[] = [];
    shootInterval: number = 400;
    lastShootTime: number = 0;
    shootPrepareTime: number = 700;

    maxClipAmmoCount = 12;
    currentAmmoCount = 12;

    reloading = false;
    timeToReload = 3000;
    startTimeToReload = 0;

    shooting = false;

    damage = 10;

    hiteffects: EventBuffer[] = [];
    ammoDieEffects: EventBuffer[] = [];
    
    bufferList: Buffer[] = [];
    assets: DisplayObject[] = [];
    ground_assets: DisplayObject[] = [];

    constructor(
        public center: Vector,
        public ammoPool: AmmoPool,

    ) {}


    isShooting() {
        return (this.lastShootTime + this.shootPrepareTime) > getRunnerApp().now();
    }

    shoot(
        target: Vector,
    ) {
        if (this.reloading) {
            return;
        }

        const now = getRunnerApp().now()
        if ((this.lastShootTime + this.shootInterval) > now) {
            return;
        }
        this.lastShootTime = now;

        const dir = target.clone().sub(this.position).normalize();
        const ammoToShoot: ShootInfo[] = [];
        if (this.dispersionRad == 0) {
            ammoToShoot.push({
                frameDelay: 0,
                dir,
                shooted: false,
                damage: this.damage,
                hitEffects: [...this.hiteffects],
                ammoDieEffects: [...this.ammoDieEffects],
            });
        } else {
            if (this.projectileCount == 1) {
                ammoToShoot.push({
                    frameDelay: 0,
                    dir,
                    shooted: false,
                    damage: this.damage,
                    hitEffects: [...this.hiteffects],
                    ammoDieEffects: [...this.ammoDieEffects],
                });
            } else {
                const startRad = - this.dispersionRad / 2;
                const deltaRad = this.dispersionRad / (this.projectileCount - 1);
                for (let index = 0; index < this.projectileCount; index++) {
                    const theta = startRad + deltaRad * index;
                    ammoToShoot.push({
                        frameDelay: 0,
                        dir: dir.clone().rotate(theta),
                        shooted: false,
                        damage: this.damage,
                        hitEffects: [...this.hiteffects],
                        ammoDieEffects: [...this.ammoDieEffects],
                    });
                }
            }
        }
        execEventBuffer(this, BUFFER_BEFORE_SHOOT, ammoToShoot);
        this.shootQueue.push(...ammoToShoot);
    }

    doShoot(shootInfo: ShootInfo) {
        const app = getRunnerApp();

        this.currentAmmoCount -= 1;
        const ammo = (() => {
            shootInfo.shooted = true;
            if (shootInfo.dir) {
                return this.ammoPool!.emitLast(
                    shootInfo.dir,
                    this.position,
                    600,
                    shootInfo.damage,
                );
            } else {
                const dir = this.position.clone().sub(shootInfo.target!).normalize();
                return this.ammoPool!.emitLast(
                    dir,
                    this.position,
                    600,
                    shootInfo.damage,
                );
            }
        })();

        ammo?.bufferList.push(...(shootInfo.hitEffects || []), ...(shootInfo.ammoDieEffects || []));

        if (this.lastShootTime < app.now() - this.shootInterval) {
            this.shooting = true;
        } else {
            this.shooting = false;
        }

        if (this.currentAmmoCount <= 0) {
            this.doReload();
            return;
        }
    }

    doReload() {
        if (this.reloading) {
            return;
        }
        const app = getRunnerApp();
        this.reloading = true;
        this.startTimeToReload = app.now();
    }

    reloadPercent() {
        const app = getRunnerApp();
        return (app.now() - this.startTimeToReload ) / this.timeToReload;
    }

    checkReload() {
        const app = getRunnerApp();
        if (app.now() > this.startTimeToReload + this.timeToReload) {
            this.reloading = false;
            this.currentAmmoCount = this.maxClipAmmoCount;
        }
        this.shooting = false;
    }

    update() {
        if (this.reloading) {
            this.checkReload();
            return;
        }

        if (keypressed.shoot
            || mouse.left
        ) {

            const worldPos = getRunnerApp().screenPosToWorldPos(new Vector(mouse.x, mouse.y)).sub(this.center);

            this.shoot(worldPos);
        }


        if (this.shootQueue.length) {
            for (let index = 0; index < this.shootQueue.length; index++) {
                const element = this.shootQueue[index];
                if (element.frameDelay > 0) {
                    element.frameDelay -= 1;
                } else {
                    this.doShoot(element);
                }
            }
            for (let index = this.shootQueue.length - 1; index >= 0; index--) {
                const element = this.shootQueue[index];
                if (element.shooted) {
                    this.shootQueue.splice(index, 1);
                }
            }
        }
    }
}
