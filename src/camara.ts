import { DisplayObject } from "pixi.js";
import { HotClass } from "./helper/class_reloader";
import { Player } from "./player";
import { GameObject } from "./types";
import { Vector } from "./vector";

@HotClass({ module })
export class Camera {

    prevPlayerPos = new Vector(0, 0);
    offset = new Vector(0, 0);

    constructor(
        player: Player,
        public size: Vector,
    ) {
        this.prevPlayerPos.setV(player.position);
    }

    paddingX = 400;
    paddingY = 400;

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
        if (isNaN(item.position.y) || isNaN(item.position.x)) {
            debugger;
        }

        const screenPos = this.worldPosToScreenPos(item.position);
        item.sprite.x = screenPos.x;
        item.sprite.y = screenPos.y;
    }

}