import { AnimatedSprite, Container, DisplayObject, Sprite, Texture } from "pixi.js";
import { GameObject } from "./types";
import { Vector } from "./vector";

export class Tree implements GameObject {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);
    sprite = new Container();
    constructor(
        sprites: Record<string, AnimatedSprite>,
    ) {
        const sprite = new Sprite(sprites[1].textures[0] as Texture);
        sprite.pivot.set(0.5, 1);
        this.sprite.addChild(sprite);
    }

    updatePosition() {
        this.sprite.position.set(this.position.x, this.position.y);
    }

    update(): void {
        this.updatePosition();
    }
}