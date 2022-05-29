import { Container, Sprite } from "pixi.js";
import { particleZIndex } from "./const";
import { Vector } from "./vector";

export class Particle {
    initialTime = Date.now();
    sprite = new Container()
    dead = false;
    constructor(
        public position: Vector,
        sprite: Sprite,
        public container: Container,
        public updateFunc: ((percent: number) => void) | undefined,
        public duration: number,
        zIndex: number = particleZIndex,
    ) {
        sprite.anchor.set(0.5, 0.5);
        this.sprite.addChild(sprite);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.zIndex = zIndex;
        this.container.addChild(this.sprite);
    }

    update() {
        if (!!this.updateFunc) {
            const percent = (Date.now() - this.initialTime) / this.duration;
            this.updateFunc(percent);
        }

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;

        if ((this.initialTime + this.duration) <= Date.now()) {
            this.container.removeChild(this.sprite);
            this.dead = true;
        }
    }
}