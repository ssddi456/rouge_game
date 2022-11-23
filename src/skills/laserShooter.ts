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
        public scale: number = 1
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
            this.target!.position!,
            this.scale
        ));
    }
}

export class DamageLaser implements UpdatableMisc {
    dead: boolean = false;
    // sprite = new Laser(300);
    sprite = new Container();
    segment: VectorSegment;
    last: number = 0;
    aim: number = 60;
    charge: number = 60;
    duration: number = 30;
    baseWidth = 6;
    width = 6;
    length = 1000;

    laserIndicator: Graphics;
    laser: Laser;
    laserController: LaserController;
    segmentEl?: VectorSegmentElement;

    constructor(
        public position: Vector,
        public radius: number,
        public targetPosition: Vector,
        public scale: number = 1,
    ) {
        this.width = this.baseWidth * scale;
        const real_length = this.length - this.radius;
        this.segment = new VectorSegment(new Vector(0, 0), new Vector(0, 0), this.width);

        this.sprite.parentGroup = getRunnerApp().getGroups().ammoGroup;
        this.laserIndicator = this.sprite.addChild(new DashedLine(this.length, this.radius));
        this.laser = this.sprite.addChild(new Laser(real_length));
        // this.segmentEl = this.sprite.addChild(
        //     new VectorSegmentElement(new VectorSegment(new Vector(0, 0), new Vector(0, 0), this.width))
        // );
        this.updateRotation();
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

        if (this.segmentEl) {
            this.segmentEl.segment = new VectorSegment(localStart, target, this.width);
        }

        this.laser.position.set(localStart.x, localStart.y);
        this.laserIndicator.rotation =
            this.laser.rotation = nDir.rad() + Math.PI / 2;
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