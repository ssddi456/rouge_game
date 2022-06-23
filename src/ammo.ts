import { AnimatedSprite, Container, DisplayObject, Graphics, Point, SimpleRope, Sprite, Texture } from "pixi.js";
import { checkCollision } from "./collision_helper";
import { ammoZIndex } from "./const";
import { Enemy } from "./enemy";
import { Particle } from "./particle";
import { getRunnerApp } from "./runnerApp";
import { cloneAnimationSprite } from "./sprite_utils";
import { ECollisionType, EFacing, EntityManager, ICollisionable, IMovable, IObjectPools } from "./types";
import { Vector } from "./vector";


export class Ammo implements IMovable, ICollisionable {
    start_position = new Vector(0, 0);
    dead = false;
    prev_dead = false;
    prev_direct = new Vector(0, 0);
    direct = new Vector(0, 0);

    prev_position = new Vector(0, 0);
    position = new Vector(0, 0);
    range = 1000;
    sprite: SimpleRope;
    textureIndex = 0;

    trailLenght = 10;
    points: Point[] = []
    history: Vector[] = [];

    constructor(
        public textures: Texture[],
        public trailTexture: Texture,
        public container: Container,
    ) {
        for (let index = 0; index < this.trailLenght; index++) {
            this.points.push(new Point(0, 0));
            this.history.push(new Vector(0, 0));
        }

        this.sprite = new SimpleRope(trailTexture, this.points);
        this.sprite.width = this.size;
        this.sprite.zIndex = ammoZIndex;
    }

    size: number = 5;
    collisison_type: ECollisionType = ECollisionType.none;

    speed: number = 10;

    prev_facing: EFacing = EFacing.top;
    facing: EFacing = EFacing.top;


    init(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        this.direct.setV(direct);
        for (let index = 0; index < this.points.length; index++) {
            const p = this.points[index];
            const h = this.history[index];
            h.x = position.x;
            h.y = position.y;
            p.x = 0;
            p.y = 0;
        }

        this.textureIndex = 0;
        this.start_position.setV(position);
        this.prev_position.setV(position);
        this.position.setV(position);

        // this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height);
        // this.sprite.rotation = -1 * (direct.rad() - Math.PI / 2);

        this.range = range;
        this.dead = false;
        this.container.addChild(this.sprite);
    }

    cacheProperty() {

        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_dead = this.dead;
    }

    updatePosition() {
        this.position.x += this.direct.x * this.speed;
        this.position.y += this.direct.y * this.speed;
        for (let index = 0; index < this.points.length; index++) {
            const p = this.points[index];
            const h = this.history[index];
            p.x = h.x - this.position.x;
            p.y = h.y - this.position.y;
        }

        if (this.start_position.distanceTo(this.position) >= this.range) {
            this.dead = true;
            this.container.removeChild(this.sprite);
        }
    }
    updateSprite() {
        // this.sprite.texture = this.textures[this.textureIndex];
        // this.textureIndex = this.textureIndex + 1;
        // if (this.textureIndex >= this.textures.length) {
        //     this.textureIndex = 0;
        // }
        const last = this.history.pop()!;
        this.history.unshift(last);
        last.x = this.position.x;
        last.y = this.position.y;

        console.log('history', JSON.stringify(this.history));
    }

    update() {
        if (this.dead) {
            return;
        }
        this.cacheProperty();
        this.updatePosition();
        this.updateSprite();
    }
}

export class AmmoPool implements IObjectPools {
    spirte: AnimatedSprite;
    pool: Ammo[] = [];
    constructor(
        spirte: AnimatedSprite, // head
        public trailTexture: Texture, // tail
        public container: Container,
        public hitAnimate: AnimatedSprite,
    ) {
        this.spirte = spirte;
    }

    emit(
        direct: Vector,
        position: Vector,
        range: number
    ) {
        if (this.pool.length < 100) {
            const ammo = new Ammo(this.spirte.textures as Texture[],
                this.trailTexture,
                this.container);
            this.pool.push(ammo);
            ammo.init(
                direct,
                position,
                range
            );
            return ammo;
        } else {
            return this.pool.find(ammo => {
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

    updateHit() {
        const ammos = this.pool.filter(ammo => !ammo.dead);
        const enemies = getRunnerApp().getEntities({ collisionTypes: [ECollisionType.enemy] });
        for (let index = 0; index < ammos.length; index++) {
            const ammo = ammos[index];
            for (let jndex = 0; jndex < enemies.length; jndex++) {
                const enemy = enemies[jndex] as Enemy;
                if (!enemy.dead) {
                    const ifCollision = checkCollision(ammo, enemy);
                    if (ifCollision) {
                        enemy.recieveDamage(1, ifCollision.collisionHitPos);
                        const app = getRunnerApp();
                        app.emitParticles(ifCollision.collisionHitPos,
                            cloneAnimationSprite(this.hitAnimate),
                            function (this: Particle, percent) {
                                const sprite = this.sprite as AnimatedSprite;
                                if (percent == 0) {
                                    sprite.play();
                                }
                                if (sprite.currentFrame === (sprite.totalFrames - 1)) {
                                    this.die();
                                }
                            }, -1);
                    }
                }
            }
        }
    }

    update() {
        this.pool.forEach(x => x.update());
        this.updateHit();
    }
}