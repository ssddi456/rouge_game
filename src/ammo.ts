import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { ECollisionType, EFacing, ICollisionable, IMovable, IObjectPools } from "./types";
import { Vector } from "./vector";


export class Ammo implements IMovable, ICollisionable {
    start_position = new Vector(0, 0);
    dead = false;
    
    prev_direct = new Vector(0, 0);
    direct = new Vector(0, 0);
    
    prev_position = new Vector(0, 0);
    position = new Vector(0, 0);
    range = 1000;

    constructor(
        public sprite: AnimatedSprite,
        public container: Container,
    ) {
        this.sprite.anchor.set(0.8, 0.5);
    }

    size: number = 20;
    collisison_type: ECollisionType = ECollisionType.none;

    speed: number = 10;

    prev_facing: EFacing = EFacing.top;
    facing: EFacing = EFacing.top;

    updateSprite(): void {
        throw new Error("Method not implemented.");
    }

    init(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        this.direct.setV(direct);
        this.start_position.setV(position);
        this.position.setV(position);

        this.sprite.rotation = -1 * (direct.rad() -  Math.PI / 2);
        
        this.range = range;
        this.dead = false;
        this.container.addChild(this.sprite);
    }

    cacheProperty() {

        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
    }

    updatePosition() {
        this.position.x += this.direct.x;
        this.position.y += this.direct.y;

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;

        if (this.start_position.distanceTo(this.position) >= this.range) {
            this.dead = true;
            this.container.removeChild(this.sprite);
        }
    }

    update() {
        if (this.dead) {
            return;
        }
        this.cacheProperty();
        this.updatePosition();
    }
}

export class AmmoPool implements IObjectPools {
    spirte: AnimatedSprite;
    pool: Ammo[] = [];
    constructor(
        spirte: AnimatedSprite,
        public container: Container,
    ) {
        this.spirte = spirte;
    }

    emit(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        if (this.pool.length < 100) {
            const ammo = new Ammo(new AnimatedSprite(this.spirte.textures), this.container);
            this.pool.push(ammo);
            ammo.init(
                direct,
                position,
                range
            );
        } else {
            this.pool.find(ammo => {
                if (ammo.dead) {
                    ammo.init(
                        direct, 
                        position,
                        range
                    );
                    return true;
                }
            });
        }
    }

    update() {
        this.pool.forEach(x => x.update());
    }
}