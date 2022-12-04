import { Container, Graphics } from "pixi.js";
import { DebugInfo } from "./debug_info";
import { Enemy } from "./enemy";
import { line_of_circle_x_circle } from "./ik_utils";
import { Player } from "./player";
import { LegSecondaryDynamics, LegSecondaryDynamicsState } from "./simple_eular_second_order";
import { UpdatableMisc, UpdatableObject } from "./types";
import { Vector } from "./vector";

const stepFrames = 12;
export class FollowLeg extends UpdatableObject {
    size: number = 10;
    sprite = new Container();
    position = new Vector(0, 0);
    positionRef = new LegSecondaryDynamics(0.5, 0.1, stepFrames, stepFrames, stepFrames, this.master.position!);
    // debugInfo = this.sprite.addChild(new DebugInfo());
    bone1 = this.sprite.addChild(new Graphics());
    bone2 = this.sprite.addChild(new Graphics());
    jointLocalPos = Vector.AB(this.offset, this.jointOffset,);
    constructor(
        public master: UpdatableMisc | Player | Enemy,
        public offset: Vector, public jointOffset: Vector,
        public legSeg: [number, number]
    ) {
        super();
        this.addChildren(this.positionRef);
        // this.debugInfo.text = 'this is a follow leg';
        this.updatePosition();
        this.updateBone();

    }

    updatePosition() {
        this.position.setV({
            x: this.positionRef.y.x + this.offset.x,
            y: this.positionRef.y.y + this.offset.y,
        });
    }

    updateBone() {
        const jointToBodyPos = new Vector(
            this.jointLocalPos.x - this.positionRef.y.x + this.positionRef.x.x,
            this.jointLocalPos.y - this.positionRef.y.y + this.positionRef.x.y
        );
        const joints = line_of_circle_x_circle(
            [0, 0, this.legSeg[0]],
            [
                jointToBodyPos.x,
                jointToBodyPos.y,
                this.legSeg[1]
            ]
        );

        const joint = joints[1][1] < joints[0][1] ? joints[1] : joints[0];
        const toBody = [0.5 * joint[0] + 0.5 * jointToBodyPos.x, joint[1] + 0.3 * jointToBodyPos.y,];

        this.bone1.clear().lineStyle({
            color: 0xff0000,
            width: 2
        })
            .moveTo(0, 0)
            .lineTo(toBody[0], toBody[1])

        this.bone2.clear().lineStyle({
            color: 0xff0000,
            width: 2
        })
            .moveTo(jointToBodyPos.x, jointToBodyPos.y)
            .lineTo(toBody[0], toBody[1])
    }

    update(): void {
        super.update();
        this.updatePosition();
        this.updateBone();
        // this.debugInfo.text = `leg is ${LegSecondaryDynamicsState[this.positionRef.state]}`;
    }
}

export class LeadingLeg extends FollowLeg {
    constructor(
        public master: UpdatableMisc | Player | Enemy,
        public offset: Vector, public jointOffset: Vector,
        public legSeg: [number, number]
    ) {
        super(master, offset, jointOffset, legSeg);
        this.removeChidlren(this.positionRef)
        this.positionRef = this.addChildren(new LegSecondaryDynamics(0.5, 0.1, stepFrames, stepFrames, 0, master.position!));

        this.updatePosition();
        this.updateBone();

    }
}