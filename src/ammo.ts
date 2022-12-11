import * as PIXI from "pixi.js";
import { AnimatedSprite, Container, DisplayObject, Point, SimpleRope, Texture } from "pixi.js";
import { ammoControllerDispose, ammoControllerInit, AmmoControllerKey, ammoControllerUpdate } from "./ammo_controller";
import { execEventBuffer, applyKnockback, Buffable, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HIT, BUFFER_EVENTNAME_HITTED } from "./buffer";
import { checkCollision } from "./collision_helper";
import { Enemy } from "./enemy";
import { createFastLookup } from "./entityTypeCache";
import { overGroundCenterHeight } from "./groups";
import { HotClass } from "./helper/class_reloader";
import { Particle } from "./particle";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { cloneAnimationSprite } from "./sprite_utils";
import { Buffer, ECollisionType, EFacing, ICollisionable, IMovable, IObjectPools } from "./types";
import { Vector } from "./vector";

export interface DamageInfo {
    collision: ReturnType<typeof checkCollision>;
    damage: number
}

interface AmmoInitProps {
    direct: Vector,
    position: Vector,
    range: number,
    damage: number,
    head?: AnimatedSprite,
    trail?: Texture | null,
    hitEffect?: AnimatedSprite | null,
    controller?: AmmoControllerKey;
    controllerParams?: any
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
    trail: SimpleRope;
    controller?: string;

    constructor(
        public head: AnimatedSprite,
        public trailTexture: Texture,
        public container: Container,
    ) {
        for (let index = 0; index < this.trailLenght; index++) {
            this.points.push(new Point(0, 0));
            this.history.push(new Vector(0, 0));
        }

        const trail = new SimpleRope(trailTexture, this.points);
        trail.width = this.size;
        this.trail = trail;

        if (trailTexture == PIXI.Texture.WHITE) {
            this.trail.visible = false;
        } else {
            this.trail.visible = true;
        }
        
        this.sprite.addChild(head);
        this.sprite.addChild(trail);
        head.position.y = - overGroundCenterHeight;
        trail.position.y = - overGroundCenterHeight;

    }

    bufferList: Buffer[] = [];
    assets: DisplayObject[] = [];
    ground_assets: DisplayObject[] = [];

    hit_effect: AnimatedSprite | null = null;

    size: number = 5;
    collisison_type: ECollisionType = ECollisionType.none;

    speed: number = 10;

    prev_facing: EFacing = EFacing.top;
    facing: EFacing = EFacing.top;

    max_piecing_count = 3;
    current_piecing_count = 0;

    max_bouncing_count = 0;
    currrent_bouncing_count = 0;

    current_hitting_items: ICollisionable[] = [];

    init(props: AmmoInitProps) {
        const {
            direct,
            position,
            range,
            damage,
            head,
            trail,
            hitEffect,
            controller,
            controllerParams
        } = props;
        this.shootedTime = getRunnerApp().now();
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

        if (head) {
            this.sprite.removeChild(this.head);
            this.head = head;
            head.position.y = - overGroundCenterHeight;
            this.sprite.addChildAt(head, 0);
            this.head.play();
        }

        this.head.rotation = direct.rad();

        if (trail && trail !== PIXI.Texture.WHITE) {
            this.trail.texture = trail;
            this.trail.visible = true;
        } else if (trail == null || trail === PIXI.Texture.WHITE) {
            this.trail.visible = false;
        }
        if (hitEffect) {
            this.hit_effect = hitEffect;
        }

        this.max_piecing_count = 3;
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
        this.controller = controller;
        ammoControllerInit(this, controllerParams);
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
        execEventBuffer(this, BUFFER_EVENTNAME_DEAD);
        ammoControllerDispose(this);
        this.dead = true;
        this.container.removeChild(this.sprite);
    }

    doBouncing(v: Vector) {
        this.direct.reflect(v);
    }

    updateSprite() {
        this.head.rotation = this.direct.rad();

        const last = this.history.pop()!;
        this.history.unshift(last);
        last.x = this.position.x;
        last.y = this.position.y;
    }

    updateRange() {
        if (this.range + this.shootedTime < getRunnerApp().now()) {
            this.die();
        }
    }

    update() {
        if (this.dead) {
            return;
        }
        this.cacheProperty();
        ammoControllerUpdate(this);
        this.updatePosition();
        this.updateSprite();
        this.updateRange();
    }
}

@HotClass({ module })
export class AmmoPool implements IObjectPools {
    spirte: AnimatedSprite;
    pool: Ammo[] = [];
    queue: { till: number, args: Parameters<InstanceType<typeof AmmoPool>['emit']>}[] = [];
    lookupHelper = createFastLookup(this.pool);

    lastSprite: AnimatedSprite;
    lastTrail: Texture;
    lastHitEffect: AnimatedSprite;

    constructor(
        spirte: AnimatedSprite, // head
        public trailTexture: Texture, // tail
        public container: Container,
        public hitAnimate: AnimatedSprite,
    ) {
        this.spirte = spirte;

        this.lastSprite = spirte;
        this.lastTrail = trailTexture;
        this.lastHitEffect = hitAnimate;
    }
    
    emitDelay(delay: number, ...args: Parameters<InstanceType<typeof AmmoPool>['emit']>) {
        this.queue.push({ till: delay + getRunnerApp().now(), args });
    }

    emit(
        direct: Vector,
        position: Vector,
        range: number,
        damage: number,
        head: AnimatedSprite,
        trail: Texture | null,
        hitEffect: AnimatedSprite | null,
        controller?: AmmoControllerKey,
        controllerParams?: any
    ) {
        const makeNewAmmo =  () => {
            const headSpirt = cloneAnimationSprite(head);
            headSpirt.play();
            const ammo = new Ammo(
                headSpirt,
                trail || PIXI.Texture.WHITE,
                this.container);
            ammo.hit_effect = hitEffect;
            this.pool.push(ammo);
            
            ammo.init({
                direct,
                position,
                range,
                damage,
                controller,
                controllerParams,
            });
            return ammo;
        }
        if (this.pool.length < 100) {
            return makeNewAmmo();
        } else {
            const found = this.pool.find(ammo => ammo.dead);
            if (found) {
                found.init({
                    direct,
                    position,
                    range,
                    damage,
                    head: cloneAnimationSprite(head),
                    trail,
                    hitEffect,
                    controller,
                    controllerParams,
                });
                return found;
            }
            return makeNewAmmo();
        }
    }

    emitLast(
        direct: Vector,
        position: Vector,
        range: number,
        damage: number,
    ) {
        return this.emit(direct, position, range, damage, this.lastSprite, this.lastTrail, this.lastHitEffect);
    }

    emitHitEffect(pos: Vector, effect: AnimatedSprite) {
        const app = getRunnerApp();
        app.emitParticles(new Vector(pos.x, pos.y - overGroundCenterHeight),
            effect,
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
    }

    ammoHitTarget(ammo: Ammo, enemyOrPlayer: Enemy | Player, ifCollision: ReturnType<typeof checkCollision>) {
        if (!ifCollision) {
            return;
        }
        const damageInfo: DamageInfo = {
            collision: ifCollision,
            damage: ammo.damage
        };

        execEventBuffer(ammo, BUFFER_EVENTNAME_HIT, enemyOrPlayer, damageInfo);
        execEventBuffer(enemyOrPlayer, BUFFER_EVENTNAME_HITTED, ammo, damageInfo);

        enemyOrPlayer.recieveDamage(damageInfo.damage, ifCollision.collisionHitPos);

        if (ammo.hit_effect) {
            this.emitHitEffect(ifCollision.collisionHitPos, ammo.hit_effect);
        }

        applyKnockback(enemyOrPlayer, ammo.direct.clone(), 100);

        if (ammo.current_piecing_count < ammo.max_piecing_count) {
            ammo.current_piecing_count += 1;
        } else if (ammo.currrent_bouncing_count < ammo.max_bouncing_count) {
            ammo.doBouncing(ifCollision.normal);
            ammo.currrent_bouncing_count += 1;
        } else {
            ammo.die();
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
                            this.ammoHitTarget(ammo, enemy, ifCollision);
                        }
                    }
                }
            }
            ammo.current_hitting_items = _temp_hitting_items;
        }
    }

    update() {
        this.pool.forEach(x => x.update());
        this.lookupHelper.clearEntityTypeCache();
        const now = getRunnerApp().now();
        this.queue = this.queue.filter(x => {
            if (x.till <= now) {
                this.emit(...x.args);
                return false;
            }
            return true;
        });
    }
}
