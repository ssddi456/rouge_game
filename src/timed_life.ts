import { Container } from "pixi.js";
import { Behavior } from "./behavior";
import { DebugInfo, } from "./debug_info";
import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable, UpdatableObject } from "./types";
import { Vector } from "./vector";

export class TimedSummoned extends UpdatableObject implements Disposible {
    createTime: number;
    dying: boolean = false;
    dead: boolean = false;
    fadeSpeed: number = 1 / 60; // in 1 sec
    debugInfo: Container;
    shoot_position: Vector = new Vector(0, 0);

    constructor(
        public duration: number,
        public position: Vector,
        public sprite: Container,
        public behavior: Behavior
    ) {
        super();
        this.createTime = getRunnerApp().now();
        if ('update' in sprite) {
            this.addChildren((this.sprite as any) as (Updatable & Disposible));
        }

        this.debugInfo = this.sprite.addChild(new DebugInfo());

        this.behavior.setOwner(this);
        this.addChildren(this.behavior);
    }

    update() {
        super.update();
        if (this.createTime + this.duration < getRunnerApp().now()) {
            this.dying = true;
        }
        if (this.dying) {
            this.sprite.alpha -= this.fadeSpeed;
        }
        if (this.sprite.alpha <= 0) {
            this.dead = true;
        }
    }

    dispose(): void {
        super.dispose();
        this.sprite.destroy();
    }

}