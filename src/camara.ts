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

    update(player: Player) {
        const screenPos = this.worldPosToScreenPos(player.position);
        const paddingX = 100;
        const paddingY = 100
        if (screenPos.x < paddingX) {
            this.offset.x += screenPos.x - paddingX;
        } else if (screenPos.x > this.size.x - paddingX) {
            this.offset.x += screenPos.x - this.size.x + paddingX;
        }
        if (screenPos.y < paddingY) {
            this.offset.y += screenPos.y - paddingY;
        } else if (screenPos.y > this.size.y - paddingY) {
            this.offset.y += screenPos.y - this.size.y + paddingY;
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