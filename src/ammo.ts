import { AnimatedSprite, Container, DisplayObject, Point, SimpleRope, Texture } from "pixi.js";
import { applyEventBuffer, applyKnockback, Buffable, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HIT, BUFFER_EVENTNAME_HITTED } from "./buffer";
import { checkCollision } from "./collision_helper";
import { Enemy } from "./enemy";
import { overGroundCenterHeight } from "./groups";
import { HotClass } from "./helper/class_reloader";
import { Particle } from "./particle";
import { getRunnerApp } from "./runnerApp";
import { Buffer, ECollisionType, EFacing, ICollisionable, IMovable, IObjectPools } from "./types";
import { Vector } from "./vector";

export interface DamageInfo {
    collision: ReturnType<typeof checkCollision>;
    damage: number
}

@HotClass({ module })
export class Ammo implements IMovable, ICollisionable, Buffable {
    start_position = new Vector(0, 0);
    dead = false;
    prev_dead = false;
    prev_direct = new Vector(0, 0);
    direct = new Vector(0, 0);

    prev_position = new Vector(0, 0);
    position = new Vector(0, 0);
    range = 1000;

    sprite = new Container();
    textureIndex = 0;

    trailLenght = 10;
    points: Point[] = []
    history: Vector[] = [];
    shootedTime = 0;
    damage = 1;

    constructor(
        public textures: Texture[],
        public trailTexture: Texture,
        public container: Container,
    ) {
        for (let index = 0; index < this.trailLenght; index++) {
            this.points.push(new Point(0, 0));
            this.history.push(new Vector(0, 0));
        }

        const sprite = new SimpleRope(trailTexture, this.points);
        sprite.width = this.size;
        sprite.position.y = - overGroundCenterHeight;
        this.sprite.addChild(sprite);
    }

    bufferList: Buffer[] = [];
    assets: DisplayObject[] = [];
    ground_assets: DisplayObject[] = [];

    size: number = 5;
    collisison_type: ECollisionType = ECollisionType.none;

    speed: number = 10;

    prev_facing: EFacing = EFacing.top;
    facing: EFacing = EFacing.top;

    max_piecing_counnt = 3;
    current_piecing_count = 0;

    max_bouncing_count = 0;
    currrent_bouncing_count = 0;

    current_hitting_items: ICollisionable[] = [];

    init(
        direct: Vector,
        position: Vector,
        range: number,
        damage: number,
    ) {
        this.shootedTime = getRunnerApp().getSession().now();
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
        this.max_piecing_counnt = 3;
        this.current_piecing_count = 0;

        this.max_bouncing_count = 1;
        this.currrent_bouncing_count = 0;

        this.current_hitting_items = [];

        this.range = range;
        this.dead = false;
        this.container.addChild(this.sprite);

        this.bufferList = [];
        this.assets = [];
        this.ground_assets = [];
        this.damage = damage;
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
    }
    
    die() {
        applyEventBuffer(this, BUFFER_EVENTNAME_DEAD);
        this.dead = true;
        this.container.removeChild(this.sprite);
    }

    doBouncing(v: Vector) {
        this.direct.reflect(v);
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

        // console.log('history', JSON.stringify(this.history));
    }

    updateRange() {
        if (this.range + this.shootedTime < getRunnerApp().getSession().now()) {
            this.die();
        }
    }

    update() {
        if (this.dead) {
            return;
        }
        this.cacheProperty();
        this.updatePosition();
        this.updateSprite();
        this.updateRange();
    }
}

@HotClass({ module })
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
        range: number,
        damage: number,
    ) {
        if (this.pool.length < 100) {
            const ammo = new Ammo(this.spirte.textures as Texture[],
                this.trailTexture,
                this.container);
            this.pool.push(ammo);
            ammo.init(
                direct,
                position,
                range,
                damage,
            );
            return ammo;
        } else {
            return this.pool.find(ammo => {
                if (ammo.dead) {
                    ammo.init(
                        direct,
                        position,
                        range,
                        damage,
                    );
                    return true;
                }
            });
        }
    }

    updateHit() {
        const ammos = this.pool.filter(ammo => !ammo.dead);
        for (let index = 0; index < ammos.length; index++) {
            const ammo = ammos[index];
            const _temp_hitting_items: ICollisionable[] = [];
            const enemies = getRunnerApp().getNearbyEntity({ collisionTypes: [ECollisionType.enemy], position: ammo.position });
            for (let jndex = 0; jndex < enemies.length; jndex++) {
                const enemy = enemies[jndex] as Enemy;
                if (!enemy.dead) {
                    const ifCollision = checkCollision(ammo, enemy);
                    if (ifCollision) {
                        _temp_hitting_items.push(enemy);

                        if (!ammo.current_hitting_items.includes(enemy)) {
                            const damageInfo: DamageInfo = {
                                collision: ifCollision,
                                damage: ammo.damage
                            };

                            applyEventBuffer(ammo, BUFFER_EVENTNAME_HIT, enemy, damageInfo);
                            applyEventBuffer(enemy, BUFFER_EVENTNAME_HITTED, ammo, damageInfo);

                            enemy.recieveDamage(damageInfo.damage, ifCollision.collisionHitPos);
                            const app = getRunnerApp();
                            app.emitParticles(ifCollision.collisionHitPos,
                                this.hitAnimate,
                                function (this: Particle, percent) {
                                    const sprite = this.sprite.children[0] as AnimatedSprite;
                                    if (!sprite.playing) {
                                        sprite.play();
                                        sprite.onLoop = () => {
                                            this.die();
                                            sprite.stop();
                                        };
                                    }
                                }, -1);

                            applyKnockback(enemy, ammo.direct.clone(), 100);

                            if (ammo.current_piecing_count < ammo.max_piecing_counnt) {
                                ammo.current_piecing_count += 1;
                            } else if (ammo.currrent_bouncing_count < ammo.max_bouncing_count) {
                                ammo.doBouncing(ifCollision.normal);
                                ammo.currrent_bouncing_count += 1;
                            } else {
                                ammo.die();
                            }
                        }

                    }
                }
            }
            ammo.current_hitting_items = _temp_hitting_items;
        }
    }

    update() {
        this.pool.forEach(x => x.update());
        this.updateHit();
    }
}
