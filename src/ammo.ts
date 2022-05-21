import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { Vector } from "./vector";


export class Ammo {
    prev_direct = new Vector(0, 0);
    current_position = new Vector(0, 0);
    dead = false;

    direct = new Vector(0, 0);
    position = new Vector(0, 0);
    range = 1000;

    constructor(
        public sprite: AnimatedSprite,
        public container: Container,
    ) { }

    init(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        this.direct.setV(direct);
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
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
        this.sprite.x += this.direct.x;
        this.sprite.y += this.direct.y;
        this.current_position.x = this.sprite.x;
        this.current_position.y = this.sprite.y;

        if (this.position.distanceTo(this.current_position) >= this.range) {
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

export class AmmoPool {
    spirte: AnimatedSprite;
    ammos: Ammo[] = [];
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
        if (this.ammos.length < 100) {
            const ammo = new Ammo(new AnimatedSprite(this.spirte.textures), this.container);
            this.ammos.push(ammo);
            ammo.init(
                direct,
                position,
                range
            );
        } else {
            this.ammos.find(ammo => {
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
        this.ammos.forEach(x => x.update());
    }
}