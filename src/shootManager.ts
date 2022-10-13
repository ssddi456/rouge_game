

/**
 * shell
 * power smoke fire
 * warheads
 * hit exposion piecing
 * miss exposion
 */

import { AmmoPool } from "./ammo";
import { HotClass } from "./helper/class_reloader";
import { getRunnerApp } from "./runnerApp";
import { EventBuffer } from "./types";
import { keypressed, mouse } from "./user_input";
import { Vector } from "./vector";

interface ShootInfo {
    frameDelay: number;
    dir?: Vector;
    target?: Vector;
    shooted: boolean;
}
@HotClass({ module })
export class ShootManager {
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
        if (this.dispersionRad == 0) {
            this.shootQueue.push({
                frameDelay: 0,
                dir,
                shooted: false,
            });
        } else {
            if (this.projectileCount == 1) {
                this.shootQueue.push({
                    frameDelay: 0,
                    dir,
                    shooted: false,
                });
            } else {
                const startRad = - this.dispersionRad / 2;
                const deltaRad = this.dispersionRad / (this.projectileCount - 1);
                for (let index = 0; index < this.projectileCount; index++) {
                    const theta = startRad + deltaRad * index;
                    this.shootQueue.push({
                        frameDelay: 0,
                        dir: dir.clone().rotate(theta),
                        shooted: false,
                    })
                }

            }
        }
    }

    doShoot(shootInfo: ShootInfo) {
        const app = getRunnerApp();

        this.currentAmmoCount -= 1;
        const ammo = (() => {
            if (shootInfo.dir) {
                shootInfo.shooted = true;
                return this.ammoPool!.emit(
                    shootInfo.dir,
                    this.position,
                    600,
                    this.damage,
                );
            } else {
                shootInfo.shooted = true;
                const dir = this.position.clone().sub(shootInfo.target!).normalize();
                return this.ammoPool!.emit(
                    dir,
                    this.position,
                    600,
                    this.damage,
                );
            }
        })();

        ammo?.bufferList.push(...this.hiteffects, ...this.ammoDieEffects);


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
