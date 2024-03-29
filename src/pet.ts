import { Container, DisplayObject } from "pixi.js";
import { DebugInfo } from "./debug_info";
import { Enemy } from "./enemy";
import { Player } from "./player";
import { SecondaryDynamics } from "./secondary_order";
import { EularSecondaryDynamics } from "./simple_eular_second_order";
import { UpdatableMisc, UpdatableObject } from "./types";
import { Vector } from "./vector";

export class FollowPet extends UpdatableObject  {
    dead: boolean = false;
    size: number = 30;
    sprite = new Container();
    position: Vector;
    positionRef: SecondaryDynamics;
    debugInfo = this.sprite.addChild(new DebugInfo());
    constructor(public master: UpdatableMisc | Player | Enemy, public offset: Vector) {
        super();
        this.positionRef = this.addChildren(new SecondaryDynamics(0.25, 4, -4, master.position!));
        
        this.position = new Vector(0, 0);
        this.debugInfo.text = 'this is a follow pet';
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

export class GuidingPet extends UpdatableObject {
    dead: boolean = false;
    size: number = 30;
    sprite = new Container();
    position: Vector;
    positionRef: EularSecondaryDynamics;
    debugInfo = this.sprite.addChild(new DebugInfo());
    constructor(public master: UpdatableMisc | Player | Enemy, public offset: Vector) {
        super();
        this.positionRef = this.addChildren(new EularSecondaryDynamics(0.5, 0.1, master.position!));

        this.position = new Vector(0, 0);
        this.debugInfo.text = 'this is a guiding pet';
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