import { AnimatedSprite, Container } from "pixi.js";
import { mouse } from "./user_input";
import { Vector } from "./vector";


export class Curser {

    constructor(
        public sprite: AnimatedSprite,
        public container: Container,
    ) { }

    cacheProperty() {
    }

    updatePosition() {
        this.sprite.x = mouse.x;
        this.sprite.y = mouse.y;
    }

    update() {
        this.cacheProperty();
        this.updatePosition();
    }
}