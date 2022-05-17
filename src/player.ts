import * as PIXI from "pixi.js";
import { Container, Sprite } from "pixi.js";
import { Vector } from "./vector";
import { keypressed } from "./user_input";

export class Player {
    spirte: Container;
    direct: Vector;
    prev_direct: Vector;
    
    speed = 4;

    constructor(
        public spirtes: Record<string, Sprite>,
        public hp: number,
    ) {
        this.spirte = new Container();
        this.direct = new Vector(0, 0);
        this.prev_direct = new Vector(0, 0);
        this.spirte.addChild(spirtes.idle);

        // center point
        const sprite = this.spirte.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        sprite.tint = 0xff0000;
        sprite.width = sprite.height = 10;

    }

    getInput() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;

        if (keypressed.up) {
            this.direct.y = -1 * this.speed;
        } else if (keypressed.down) {
            this.direct.y = 1 * this.speed;
        } else {
            this.direct.y = 0;
        }

        if (keypressed.left) {
            this.direct.x = -1 * this.speed;
        } else if (keypressed.right) {
            this.direct.x = 1 * this.speed;
        } else {
            this.direct.x = 0;
        }

    }

    updatePosition() {
        this.spirte.x += this.direct.x;
        this.spirte.y += this.direct.y;
    }

    updateSpirte() {
        if (this.direct.x > 0 && this.prev_direct.y <= 0) {
            this.spirte.scale.x = -1;
        } else if (this.direct.x < 0 && this.prev_direct.y >= 0) {
            this.spirte.scale.x = 1;
        }
        if ((this.direct.y > 0 && this.prev_direct.y <= 0)
            || (this.direct.y < 0 && this.prev_direct.y >= 0)
        ) {
            this.spirte.removeChildAt(0);
            if (this.direct.y > 0 ){
                this.spirte.addChildAt(this.spirtes.idle, 0);
            }
            if (this.direct.y < 0) {
                this.spirte.addChildAt(this.spirtes.idle_back, 0);
            }

            console.log(this.spirte.children.length);
            
        }
    }

    update() {
        this.getInput();
        this.updatePosition();
        this.updateSpirte();

    }
}