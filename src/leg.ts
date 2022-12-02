import { Container } from "pixi.js";
import { DebugInfo } from "./debug_info";
import { Enemy } from "./enemy";
import { Player } from "./player";
import { LegSecondaryDynamics } from "./simple_eular_second_order";
import { UpdatableMisc, UpdatableObject } from "./types";
import { Vector } from "./vector";

export class FollowLeg extends UpdatableObject {
    dead: boolean = false;
    size: number = 30;
    sprite = new Container();
    position: Vector;
    positionRef: LegSecondaryDynamics;
    debugInfo = this.sprite.addChild(new DebugInfo());
    constructor(public master: UpdatableMisc | Player | Enemy, public offset: Vector) {
        super();
        this.positionRef = this.addChildren(new LegSecondaryDynamics(2, 10, 3, 0, master.position!));

        this.position = new Vector(0, 0);
        this.debugInfo.text = 'this is a follow leg';
        this.updatePosition();
    }

    updatePosition() {
        this.position.setV({
            x: this.positionRef.y.x + this.offset.x,
            y: this.positionRef.y.y + this.offset.y,
        });
    }

    update(): void {
        super.update();
        this.updatePosition();
    }
}

export class LeadingLeg extends UpdatableObject {
    dead: boolean = false;
    size: number = 30;
    sprite = new Container();
    position: Vector;
    positionRef: LegSecondaryDynamics;
    debugInfo = this.sprite.addChild(new DebugInfo());
    constructor(public master: UpdatableMisc | Player | Enemy, public offset: Vector) {
        super();
        this.positionRef = this.addChildren(new LegSecondaryDynamics(2, 10, 3, 3, master.position!));

        this.position = new Vector(0, 0);
        this.debugInfo.text = 'this is a leading leg';
        this.updatePosition();
    }

    updatePosition() {
        this.position.setV({
            x: this.positionRef.y.x + this.offset.x,
            y: this.positionRef.y.y + this.offset.y,
        });
    }

    update(): void {
        super.update();
        this.updatePosition();
    }
}