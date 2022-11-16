import { Container, Graphics } from "pixi.js";
import { Laser, LaserController } from "../element/laser";
import { VectorSegmentElement, DashedLine } from "../helper/vector_helper";
import { getRunnerApp } from "../runnerApp";
import { UpdatableMisc, ECollisionType } from "../types";
import { Vector, VectorSegment } from "../vector";
import { ActiveSkill } from "./activeskill";


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
            app.addMisc(new DamageLaserSimple(
                this.owner!.position!,
                this.owner!.size! * 3,
                this.owner!.position!.clone().add(v)
            ));
        }
    }
}

class DamageLaserSimple implements UpdatableMisc {
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

    laser: Laser;
    laserController: LaserController;
    segmentEl: VectorSegmentElement;

    constructor(
        public position: Vector,
        public radius: number,
        public targetPosition: Vector,
    ) {
        const real_length = this.length - this.radius;
        this.segment = new VectorSegment( new Vector(0, 0), new Vector(0, 0), this.width);

        this.sprite.parentGroup = getRunnerApp().getGroups().ammoGroup;
        this.laser = this.sprite.addChild(new Laser(real_length));
        this.segmentEl = this.sprite.addChild(new VectorSegmentElement(new VectorSegment(new Vector(0, 0), new Vector(0, 0), this.width)));

        this.updateRotation();

        this.laserController = new LaserController(this.laser, this.laser);
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
            this.laser.index = 0;
        }


        this.laserController.update();

    }
    disposed: boolean = false;
    dispose(): void {
        this.disposed;
        this.sprite.destroy();
    }

}