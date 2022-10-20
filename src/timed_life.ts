import { Container } from "pixi.js";
import { Behavior } from "./behavior";
import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable, UpdatableObject } from "./types";
import { Vector } from "./vector";

export class TimedSummoned extends UpdatableObject implements Disposible {
    createTime: number;
    dying: boolean = false;
    dead: boolean = false;
    fadeSpeed: number = 1 / 60; // in 1 sec
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
            this.dead;
        }
    }

    dispose(): void {
        super.dispose();
        this.sprite.destroy();
    }

}