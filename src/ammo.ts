import { Container, Sprite, Texture } from "pixi.js";
import { Vector } from "./vector";


export class Ammo {
    prev_direct = new Vector(0, 0);
    current_position = new Vector(0, 0);
    dead = false;

    direct = new Vector(0, 0);
    position = new Vector(0, 0);
    range = 100;

    constructor(
        public spirte: Sprite,
        public container: Container,
    ) {}

    init(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        this.direct.setV(direct);
        this.position.setV(position);
        this.range = range;
        this.dead = false;
        this.container.addChild(this.spirte);
    }

    cacheProperty() {

        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
    }

    updatePosition () {
        this.spirte.x += this.direct.x;
        this.spirte.y += this.direct.y;
        this.current_position.x = this.spirte.x;
        this.current_position.y = this.spirte.y;
        
        if (this.position.distanceTo(this.current_position) >= this.range) {
            this.dead = true;
            this.container.removeChild(this.spirte);
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
    spirte: Sprite;
    ammos: Ammo[] = [];
    constructor(
        spirte: Sprite,
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
            const ammo = new Ammo(this.spirte., this.container);
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