import { AnimatedSprite, Container } from "pixi.js";
import { particleZIndex } from "./const";
import { Vector } from "./vector";

export class Particle {
    initialTime = Date.now();
    sprite = new Container()
    constructor(
        public position: Vector,
        sprite: AnimatedSprite,
        public container: Container,
        public duration: number,
    ) {
        sprite.anchor.set(0.5, 0.5);
        this.sprite.addChild(sprite);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.zIndex = particleZIndex;
        this.container.addChild(this.sprite);
    }

    update() {
        if ((this.initialTime + this.duration) <= Date.now()) {
            this.container.removeChild(this.sprite);
        }
    }
}