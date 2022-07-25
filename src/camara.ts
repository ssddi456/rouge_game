import { DisplayObject } from "pixi.js";
import { Player } from "./player";
import { GameObject } from "./types";
import { Vector } from "./vector";

export class Camera {

    prevPlayerPos = new Vector(0, 0);
    offset = new Vector(0, 0);

    constructor(
        player: Player,
        public size: Vector,
    ) {
        this.prevPlayerPos.setV(player.position);
    }

    paddingX = 200;
    paddingY = 200;

    update(player: Player) {
        const screenPos = this.worldPosToScreenPos(player.position);
        if (screenPos.x < this.paddingX) {
            this.offset.x += screenPos.x - this.paddingX;
        } else if (screenPos.x > this.size.x - this.paddingX) {
            this.offset.x += screenPos.x - this.size.x + this.paddingX;
        }
        if (screenPos.y < this.paddingY) {
            this.offset.y += screenPos.y - this.paddingY;
        } else if (screenPos.y > this.size.y - this.paddingY) {
            this.offset.y += screenPos.y - this.size.y + this.paddingY;
        }
    }

    worldPosToScreenPos(pos: Vector) {
        return pos.clone().sub(this.offset);
    }

    screenPosToWorldPos(pos: Vector) {
        return pos.clone().add(this.offset);
    }
    
    updateItemPos(item: {
        position: Vector,
        sprite: DisplayObject,
    }) {
        const screenPos = this.worldPosToScreenPos(item.position);
        item.sprite.x = screenPos.x;
        item.sprite.y = screenPos.y;
    }

}