import { Container, DisplayObject, Graphics } from "pixi.js";
import { Laser, LaserController } from "../element/laser";
import { DashedLine, VectorSegmentElement } from "../helper/vector_helper";
import { getRunnerApp } from "../runnerApp";
import { ECollisionType, UpdatableMisc } from "../types";
import { Vector, VectorSegment } from "../vector";
import { ActiveSkill } from "./activeskill";

export class LaserShooter extends ActiveSkill {
    constructor(
        public countdown: number,
    ) {
        super(true, countdown, true);
    }

    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }

    cast(): void {
        const app = getRunnerApp();
        app.addMisc(new DamageLaser(
            this.owner!.position!,
            this.owner!.size! * 2,
            this.target!.position!
        ));
    }
}

export class LaserCrossShooter extends ActiveSkill {
    constructor(
        public countdown: number,
        public dirSplit: number
    ) {
        super(true, countdown, true);
    }

    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }

    cast(): void {
        const app = getRunnerApp();
        for (let index = 0; index < this.dirSplit; index++) {
            const v = new Vector(1, 0).rotate(2 * Math.PI * index / this.dirSplit);
            app.addMisc(new DamageLaser(
                this.owner!.position!,
                this.owner!.size! * 3,
                this.owner!.position!.clone().add(v),
            ));
        }
    }
}

class DamageLaser implements UpdatableMisc {
    dead: boolean = false;
    // sprite = new Laser(300);
    sprite = new Container();
    segment: VectorSegment;
    last: number = 0;
    aim: number = 60;
    charge: number = 60;
    duration: number = 30;
    width = 6;
    length = 1000;

    laserIndicator: Graphics;
    laser: Laser;
    laserController: LaserController;
    segmentEl: VectorSegmentElement;

    constructor(
        public position: Vector,
        public radius: number,
        public targetPosition: Vector,
    ) {
        const direction = Vector.AB(position, targetPosition);
        const nDir = direction.normalize();

        const real_length = this.length - this.radius;
        const localStart = nDir.clone().multiplyScalar(this.radius);
        const target = nDir.clone().multiplyScalar(this.length);
        this.segment = new VectorSegment(
            this.position.clone().add(localStart),
            this.position.clone().add(target),
            this.width
        );

        this.sprite.parentGroup = getRunnerApp().getGroups().ammoGroup;
        this.laserIndicator = this.sprite.addChild(new DashedLine(this.length, this.radius));
        this.laser = this.sprite.addChild(new Laser(real_length));
        this.laser.position.set(localStart.x, localStart.y);
        this.laserIndicator.rotation =
            this.laser.rotation = - target.rad() - Math.PI;
        this.segmentEl = this.sprite.addChild(
            new VectorSegmentElement(new VectorSegment(localStart, target, this.width))
        );
        this.laserController = new LaserController(this.laserIndicator, this.laser);
        this.laserController.charge();
    }

    updateRotation() {
        const direction = Vector.AB(this.position, this.targetPosition);
        const nDir = direction.normalize();

        const localStart = nDir.clone().multiplyScalar(this.radius);
        const target = nDir.clone().multiplyScalar(this.length);

        this.segment.point1.set(this.position.x + localStart.x, this.position.y + localStart.y);
        this.segment.point2.set(this.position.x + target.x, this.position.y + target.y);
        this.segmentEl.segment = new VectorSegment(localStart, target, this.width);

        this.laser.position.set(localStart.x, localStart.y);
        this.laserIndicator.rotation =
            this.laser.rotation = - nDir.rad() - Math.PI;
    }

    update(...args: any[]): void {

        const app = getRunnerApp();
        const player = app.getPlayer();
        if (this.laserController.firing && player) {
            if (player.collisison_type == ECollisionType.player
                && player.collideBody.collidesWithSegment(this.segment)
            ) {
                player.recieveDamage(1, player.position);
            }
        }
        if (this.laserController.idle) {
            this.dead = true;
            return;
        }

        this.last++;
        if (this.last > (this.aim + this.charge + this.duration)) {
            this.laserController.end();
        } else if (this.last > (this.aim + this.charge)) {
            this.laserController.fire();
        }

        if (this.last < this.aim) {
            this.updateRotation();
            if (Math.floor(this.last / 10) % 2) {
                this.laserIndicator.alpha = 1;
            } else {
                this.laserIndicator.alpha = 0;
            }
        } else {
            this.laserIndicator.alpha = 1;
        }


        this.laserController.update();

    }
    disposed: boolean = false;
    dispose(): void {
        this.disposed;
        this.sprite.destroy();
    }

}