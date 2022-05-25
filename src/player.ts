import * as PIXI from "pixi.js";
import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js";
import { Vector } from "./vector";
import { keypressed, mouse } from "./user_input";
import { AmmoPool } from "./ammo";
import { EFacing, ICollisionable, IMovable, Shootable } from "./types";

export class Player implements IMovable, Shootable, ICollisionable {
    sprite: Container = new Container();
    dead: boolean = false;
    prev_position: Vector = new Vector(0, 0);
    position: Vector = new Vector(0, 0);
    size = 100;

    prev_direct: Vector = new Vector(0, 0);
    direct: Vector = new Vector(0, 0);

    prev_costing: boolean = false;
    costing: boolean = false;

    prev_facing = EFacing.top;
    facing = EFacing.bottom;

    speed = 4;

    shadow: Graphics;
    pointer: Graphics;

    mainSpirtIndex = 1;

    lastShootTime = 0;
    shootCd = 400;

    ammoPools: AmmoPool;

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public hp: number,
        public container: Container,
    ) {
        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.addChild(shadow);
        this.shadow = shadow;
        shadow.beginFill(0x000000);
        shadow.drawEllipse(-10, 80, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        // main character
        this.sprite.addChild(spirtes.idle);

        // center point indicator
        const pointer = this.sprite.addChild(new PIXI.Graphics());
        this.pointer = pointer
        pointer.beginFill(0xff0000);
        pointer.drawCircle(0, 0, 10);
        pointer.endFill();

        this.ammoPools = new AmmoPool(this.spirtes.ammo, this.container);
    }

    cacheProperty() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_position.x = this.position.x;
        this.prev_position.y = this.position.y;
        this.prev_costing = this.costing;
        this.prev_facing = this.facing;
    }

    getInput() {

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

        if (this.prev_costing) {
            const animated = this.sprite.children[this.mainSpirtIndex] as AnimatedSprite;
            if (animated.currentFrame == animated.totalFrames - 1) {
                this.costing = false;
                animated.gotoAndStop(0);
            }
        } else {
            if (
                keypressed.attack
                || keypressed.heavy_attack
            ) {
                this.costing = true;
            }
        }



        if (this.costing) {
            this.direct.x = 0;
            this.direct.y = 0;
            return;
        }

        if (this.shootCd + this.lastShootTime < Date.now()) {
            if (keypressed.shoot) {
                this.lastShootTime = Date.now();
                this.doShoot();
            }
        }
    }

    updatePosition() {
        this.position.add(this.direct);

        this.sprite.x += this.direct.x;
        this.sprite.y += this.direct.y;
    }

    doShoot() {
        const direct = new Vector(
            mouse.x - this.sprite.x,
            mouse.y - this.sprite.y
        )
            .normalize()
            .multiplyScalar(1);
        this.ammoPools.emit(
            direct,
            new Vector(this.sprite.x, this.sprite.y),
            2000,
        );
    }

    updateSprite() {

        if (this.costing && !this.prev_costing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            const attack_animation = keypressed.heavy_attack
                ? (this.facing == "top" ? this.spirtes.heavy_attack_back : this.spirtes.heavy_attack)
                : (this.facing == "top" ? this.spirtes.attack_back : this.spirtes.attack);
            this.sprite.addChildAt(attack_animation, this.mainSpirtIndex);
            attack_animation.play();
        }

        if (!this.costing && this.prev_costing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == "top") {
                this.sprite.addChildAt(this.spirtes.idle_back, this.mainSpirtIndex);
            }
            if (this.facing == "bottom") {
                this.sprite.addChildAt(this.spirtes.idle, this.mainSpirtIndex);
            }
        }

        if (this.costing) {
            return;
        }

        if (this.direct.x > 0 && this.prev_direct.y <= 0) {
            this.sprite.scale.x = -1;
        } else if (this.direct.x < 0 && this.prev_direct.y >= 0) {
            this.sprite.scale.x = 1;
        }

        if ((this.direct.y > 0 && this.prev_direct.y <= 0)
            || (this.direct.y < 0 && this.prev_direct.y >= 0)
        ) {
            if (this.direct.y > 0) {
                this.facing = EFacing.bottom;
            }
            if (this.direct.y < 0) {
                this.facing = EFacing.top;
            }
        }

        if (this.facing != this.prev_facing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == "top") {
                this.sprite.addChildAt(this.spirtes.idle_back, this.mainSpirtIndex);
            }
            if (this.facing == EFacing.bottom) {
                this.sprite.addChildAt(this.spirtes.idle, this.mainSpirtIndex);
            }
        }
    }

    update() {
        this.cacheProperty();
        this.getInput();
        this.updatePosition();
        this.updateSprite();
        this.ammoPools.update();
    }
}