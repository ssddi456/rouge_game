import { Container, Sprite } from "pixi.js";
import { particleZIndex } from "./const";
import { getRunnerApp } from "./runnerApp";
import { Vector } from "./vector";

export class Particle {
    position: Vector = new Vector(0, 0);
    initialTime = getRunnerApp().now();
    sprite = new Container()
    dead = false;
    constructor(
        public startPosition: Vector,
        sprite: Sprite,
        public container: Container,
        public updateFunc: ((percent: number) => void) | undefined,
        public duration: number,
        zIndex: number = particleZIndex,
    ) {
        sprite.anchor.set(0.5, 0.5);
        this.sprite.addChild(sprite);
        this.sprite.x = startPosition.x;
        this.sprite.y = startPosition.y;
        this.position.setV(startPosition);
        this.sprite.zIndex = zIndex;
        this.container.addChild(this.sprite);
    }

    update() {
        const now = getRunnerApp().now();
        if (!!this.updateFunc) {
            const percent = (now - this.initialTime) / this.duration;
            this.updateFunc(percent);
        }

        if ((this.initialTime + this.duration) <= now) {
            this.die();
        }
    }

    die() {
        this.container.removeChild(this.sprite);
        this.dead = true;
    }
}