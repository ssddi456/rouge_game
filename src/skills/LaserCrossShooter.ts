import { Container, Graphics } from "pixi.js";
import { Laser, LaserController } from "../element/laser";
import { VectorSegmentElement, DashedLine } from "../helper/vector_helper";
import { getRunnerApp } from "../runnerApp";
import { UpdatableMisc, ECollisionType } from "../types";
import { Vector, VectorSegment } from "../vector";
import { ActiveSkill } from "./activeskill";

const defaultGenerateConfig = {
    beamCount: 1,
    initialRotate: 0,
    endRotate: Math.PI * 2,
    rotatePerFrame: 0,
    initialDelayFramePerBeam: 0,
    beamScale: 1,
};

type GenerateConfig = typeof defaultGenerateConfig;
export class LaserCrossShooter extends ActiveSkill {
    generateConfig: GenerateConfig;
    constructor(
        public countdown: number,
        generateConfig: Partial<GenerateConfig>
    ) {
        super(true, countdown, true);
        this.generateConfig = {
            ...defaultGenerateConfig,
            ...generateConfig
        };
    }

    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }

    cast(): void {
        const app = getRunnerApp();
        const {
            beamCount,
            initialRotate,
            endRotate,
            rotatePerFrame,
            initialDelayFramePerBeam,
            beamScale,
        } = this.generateConfig;

        const initialVector = new Vector(1, 0).rotate(initialRotate);
        const delta = (endRotate - initialRotate) / beamCount;
        for (let index = 0; index < beamCount; index++) {
            const item = new DamageLaserSimple(
                this.owner!.position!,
                this.owner!.size! * 3,
                this.owner!.position!.clone().add(initialVector),
                beamScale,
                rotatePerFrame,
            );
            app.addMisc(item);
            if (initialDelayFramePerBeam) {
                item.last -= initialDelayFramePerBeam * index;
            }
            initialVector.rotate(delta);
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
    duration: number = 90;
    basicWidth = 6;
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
        public rotatePerFrame: number = 0,
    ) {
        const real_length = this.length - this.radius;
        this.width = this.basicWidth * scale;
        this.segment = new VectorSegment( new Vector(0, 0), new Vector(0, 0), this.width);

        this.sprite.parentGroup = getRunnerApp().getGroups().ammoGroup;
        this.laser = this.sprite.addChild(new Laser(real_length, scale));
        this.laserIndicator = this.sprite.addChild(new Graphics());
        this.laserIndicator
            .beginFill(0xff0000)
            .drawCircle(0, 0, 6)
            .endFill();

        // this.segmentEl = this.sprite.addChild(new VectorSegmentElement(new VectorSegment(new Vector(0, 0), new Vector(0, 0), this.width)));

        this.laserController = new LaserController(this.laserIndicator, this.laser);
        this.laserController.charge();

        this.update(true);
    }

    updateRotation() {
        const direction = Vector.AB(this.position, this.targetPosition);
        const nDir = direction.normalize();

        if (this.rotatePerFrame) {
            nDir.rotate(this.rotatePerFrame * this.last);
        }

        const localStart = nDir.clone().multiplyScalar(this.radius);
        const target = nDir.clone().multiplyScalar(this.length);

        this.segment.point1.set(this.position.x + localStart.x, this.position.y + localStart.y);
        this.segment.point2.set(this.position.x + target.x, this.position.y + target.y);

        if (this.segmentEl) {
            this.segmentEl.segment = new VectorSegment(localStart, target, this.width);
        }

        this.laserIndicator.position.set(localStart.x, localStart.y);
        this.laser.position.set(localStart.x, localStart.y);
        this.laser.rotation = - nDir.rad() - Math.PI;
    }

    update(init: boolean): void {

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

        if (this.rotatePerFrame || init) {
            this.updateRotation();
        }

        this.last++;
        if (this.last > (this.aim + this.charge + this.duration)) {
            this.laserController.end();
        } else if (this.last > (this.aim + this.charge)) {
            this.laserController.fire();
        }

        if (this.last > this.aim && this.laserIndicator.alpha > 0) {
            this.laserIndicator.alpha -= 0.1; 
        } else if (this.last < 0) {
            this.laserIndicator.alpha = 0;
        } else if (this.laserIndicator.alpha < 1){
            this.laserIndicator.alpha += 0.1;
        }

        this.laserController.update();

    }
    disposed: boolean = false;
    dispose(): void {
        this.disposed;
        this.sprite.destroy();
    }

}