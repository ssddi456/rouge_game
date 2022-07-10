

/**
 * shell
 * power smoke fire
 * warheads
 * hit exposion piecing
 * miss exposion
 */

import { AmmoPool } from "./ammo";
import { getRunnerApp } from "./runnerApp";
import { Vector } from "./vector";

interface ShootInfo {
    frameDelay: number;
    dir?: Vector;
    target?: Vector;
    shooted: boolean;
}
export class ShootManager {
    position: Vector = new Vector(0, 0);
    // 15deg = 15/180 * Math.PI
    dispersionRad: number = 0;
    projectileCount: number = 1;

    ammoPool?: AmmoPool;
    shootQueue: ShootInfo[] = [];
    shootInterval: number = 400;
    lastShootTime: number = 0;
    shootPrepareTime: number = 700;

    setAmmoPool(ammoPool: AmmoPool) {
        this.ammoPool = ammoPool;
    }

    isShooting() {
        return (this.lastShootTime + this.shootPrepareTime) > getRunnerApp().now();
    }

    shoot(
        target: Vector,
    ) {
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
        if (shootInfo.dir) {
            shootInfo.shooted = true;
            this.ammoPool!.emit(
                shootInfo.dir,
                this.position,
                600
            );
        } else {
            shootInfo.shooted = true;
            const dir = this.position.clone().sub(shootInfo.target!).normalize();
            this.ammoPool!.emit(
                dir,
                this.position,
                600
            );
        }
    }

    update() {
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