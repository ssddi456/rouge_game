import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { EFacing, ICollisionable, IMovable, IObjectPools } from "./types";
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
    ) { }

    size: number = 10;
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
        console.log('rad', direct.rad() / Math.PI, this.sprite.rotation / Math.PI);
        
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
    pools: Ammo[] = [];
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
        if (this.pools.length < 100) {
            const ammo = new Ammo(new AnimatedSprite(this.spirte.textures), this.container);
            this.pools.push(ammo);
            ammo.init(
                direct,
                position,
                range
            );
        } else {
            this.pools.find(ammo => {
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
        this.pools.forEach(x => x.update());
    }
}