import { AnimatedSprite, Container, DisplayObject, Graphics, Sprite } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';
import { IMovable, ICollisionable, IObjectPools, ECollisionType, LivingObject, Buffer, Updatable, UpdatableObject } from "./types";
import { checkCollision } from "./collision_helper";
import { Droplet as Droplet } from "./droplet";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, applyDamageFlash, execEventBuffer, applyKnockback, Buffable, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HEALTH_CHANGE, BUFFER_EVENTNAME_HITTED, checkBufferAlive, hasCharge, hasKnockback } from "./buffer";
import { cloneAnimationSprites } from "./sprite_utils";
import { overGroundCenterHeight } from "./groups";
import { DebugInfo } from "./debug_info";
import { IdleJump } from "./helper/animated_utils";
import { HotClass } from "./helper/class_reloader";
import { getBlobShadow } from './uicomponents/blobShadow';
import { Viewport } from 'pixi-viewport';
import { pointsCircleAround } from "./helper/emit_utils";
import { controllerKey, enemyControllerDispose, enemyControllerInit, enemyControllerUpdate } from "./enemy_controller";
import { createFastLookup } from "./entityTypeCache";


type ReinitableProps = Partial<Pick<Enemy,
    'speed' | 'size' | 'health' | 'sprite_names' | 'scale'
>> & {
    controller: controllerKey[]
};

@HotClass({ module })
export class Enemy extends UpdatableObject implements IMovable, ICollisionable, LivingObject, Buffable {
    prev_dead: boolean = false;
    dead = false;
    prev_direct = new Vector(0, 0);
    direct = new Vector(0, 0);

    prev_position = new Vector(0, 0);
    position = new Vector(0, 0);

    speed = 1;
    scale = 1;
    size: number = 30;
    collisison_type: ECollisionType = ECollisionType.enemy;

    mainSpirtIndex = 0
    sprite = new Container();
    bodySprite = this.sprite.addChild(new Container);
    bufferList: Buffer[] = [];

    shadow: Sprite;

    debugInfo = this.sprite.addChild(new DebugInfo());

    sprite_names = {
        idle: 'idle',
        die: 'die',
    };

    current_target_position: Vector | undefined;

    distSqToPlayer: number = 0;
    controller: controllerKey = 'charger';
    idleJump: IdleJump = this.addChildren(new IdleJump(
        this.bodySprite,
        {
            frames: 36,
            base: - overGroundCenterHeight,
            height: 10,
        }
    ));

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
    ) {
        super();

        // soft shadow
        const shadow = getBlobShadow(getRunnerApp().getApp().renderer as PIXI.Renderer);
        this.sprite.addChild(shadow);
        this.shadow = shadow;

        this.bodySprite.position.y = - overGroundCenterHeight;
        this.bodySprite.addChild(this.spirtes[this.sprite_names.idle]);


    }

    assets: PIXI.DisplayObject[] = [];
    ground_assets: PIXI.DisplayObject[] = [];

    health: number = 1;
    max_health: number = 1;
    prev_health: number = 1;
    recieveHealth(amount: number): void {
        throw new Error("Method not implemented.");
    }

    recieveDamage(damage: number, hitPos: Vector): void {
        this.health -= damage;
        this.debugInfo.text = `${this.health}/${this.max_health}`;
        execEventBuffer(this, BUFFER_EVENTNAME_HEALTH_CHANGE);

        const app = getRunnerApp();
        app.emitDamageParticles(hitPos, damage);
        applyDamageFlash(this);

        if (this.health <= 0) {
            this.dead = true;
            this.health = 0;
        }

        if (this.dead) {
            enemyControllerDispose(this,);

            // 插入一个死亡动画
            const dieSprite = this.spirtes[this.sprite_names.die];
            dieSprite.scale.set(
                this.scale * this.bodySprite.scale.x,
                this.scale
            );

            app.emitParticles(
                this.position.clone().sub({ x: 0, y: overGroundCenterHeight }),
                dieSprite,
                undefined,
                600,
            );

            app.emitDroplets(
                this.position,
                function (this: Droplet) {
                    const session = getRunnerApp().getSession();
                    session.receiveExp(1);
                },
                Infinity
            );


            this.sprite.parent.removeChild(this.sprite);
            this.sprite.parentGroup = undefined;

            execEventBuffer(this, BUFFER_EVENTNAME_DEAD);
        }
    }


    init(
        position: Vector,
        props?: Omit<ReinitableProps, 'controller'> & { controller: controllerKey }
    ) {
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.visible = true;
        this.dead = false;

        if (props) {
            this.controller = props.controller;
            if (props.speed) {
                this.speed = props.speed;
            }
            if (props.size) {
                this.size = props.size;
            }

            if (props.scale) {
                this.scale = props.scale;
            } else {
                this.scale = 1;
            }

            if (props.health) {
                this.health = props.health;
                this.max_health = props.health;
            }
            if (props.sprite_names) {
                this.sprite_names = props.sprite_names;
            }
        } else {
            this.scale = 1;
        }

        this.bodySprite.removeChildAt(this.mainSpirtIndex);
        this.bodySprite.addChildAt(this.spirtes[this.sprite_names.idle], this.mainSpirtIndex);
        const item = this.bodySprite.children[this.mainSpirtIndex];
        item.scale.set(this.scale);
        this.spirtes[this.sprite_names.idle].play?.();

        // clearups
        this.bufferList = [];
        this.assets = [];
        this.ground_assets = [];
        this.sprite.filters = [];

        enemyControllerInit(this,);
    }

    cacheProperty() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_position.x = this.position.x;
        this.prev_position.y = this.position.y;
        this.prev_dead = this.dead;
        this.prev_health = this.health;
    }

    updatePosition() {
        this.position.x += this.direct.x;
        this.position.y += this.direct.y;

        const nodes = getRunnerApp().getNearbyEntity({
            collisionTypes: [ECollisionType.enemy, ECollisionType.player],
            position: this.position,
        });
        const charging = hasCharge(this);

        let node: ICollisionable;
        let checkRes: ReturnType<typeof checkCollision>;

        for (let index = 0; index < nodes.length; index++) {
            node = nodes[index];
            if (node !== this) {
                checkRes = checkCollision(this, node);
                if (checkRes) {
                    if (charging) {
                        if (!hasCharge((node as any) as Buffable)) {
                            applyKnockback((node as any) as Buffable,
                                node.position.clone().sub(this.position)
                                    .normalize().rotate(Math.PI / 3)
                                    .multiplyScalar(this.speed * 20),
                                200
                            );
                        }
                    } else {
                        this.position.setV(checkRes.collisionPos);
                    }
                    if (node.collisison_type === ECollisionType.player) {
                        execEventBuffer(node as Player, BUFFER_EVENTNAME_HITTED);
                        (node as Player).recieveDamage(1, checkRes.collisionHitPos);
                        applyKnockback((node as any) as Buffable,
                            node.position.clone().sub(this.position)
                                .normalize().rotate(Math.PI / 3)
                                .multiplyScalar(this.speed * (charging ? 20 : 5)),
                            200
                        );
                    }
                }
            }
        }


    }

    updateSprite() {
        if (this.direct.x > 0 && this.bodySprite.scale.x > 0) {
            this.bodySprite.scale.x = -1;
        } else if (this.direct.x < 0 && this.bodySprite.scale.x < 0) {
            this.bodySprite.scale.x = 1;
        }
    }

    updateBuffer() {
        // for timer buffers
        applyBuffer(this,);
        this.bufferList = checkBufferAlive(this);
    }

    update() {
        if (this.dead) {
            this.sprite.visible = false;
            return;
        }
        super.update();
        this.updateBuffer();
        if (
            !hasKnockback(this)
            && !hasCharge(this)
        ) {
            enemyControllerUpdate(this,);
        } else {
            this.direct.setV({ x: 0, y: 0 });
        }
        this.updatePosition();
        this.updateSprite();
    }

    dispose(): void {
        this.sprite.destroy();
    }
}

@HotClass({ module })
export class EnemyPool extends UpdatableObject implements IObjectPools {
    pool: Enemy[] = [];
    spawnTimer: Updatable;
    livenodes: Enemy[] = [];
    lookupHelper = createFastLookup(this.pool);
    
    simpleEnemyTypes: ReinitableProps[] = [
        // bottle
        {
            sprite_names: {
                idle: 'idle',
                die: 'die',
            },
            speed: 1,
            health: 50,
            controller: ['tracer', 'charger'],
        },
        // bunny
        {
            sprite_names: {
                idle: 'bunny_idle',
                die: 'bunny_die',
            },
            speed: 1.5,
            health: 30,
            controller: ['tracer'],
        },
        // succubus
        {
            sprite_names: {
                idle: 'succubus_idle',
                die: 'succubus_idle',
            },
            scale: 0.5,
            speed: 1.2,
            health: 120,
            controller: ['tracer'],
        },

        {
            sprite_names: {
                idle: 'succubus_idle',
                die: 'succubus_idle',
            },
            scale: 0.5,
            speed: 1.2,
            health: 120,
            controller: ['saunterer'],
        },

        {
            sprite_names: {
                idle: 'succubus_idle',
                die: 'succubus_idle',
            },
            scale: 0.5,
            speed: 1.2,
            health: 120,
            controller: ['escaper'],
        },

        {
            sprite_names: {
                idle: 'succubus_idle',
                die: 'succubus_idle',
            },
            scale: 0.5,
            speed: 1.2,
            health: 120,
            controller: ['shooter'],
        },
    ];

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
    ) {
        super();

        this.spawnTimer = new CountDown(5000, this.spawn);

        if (module.hot) {
            module.hot.dispose((module) => {
                const oldSpawnTimer = this.spawnTimer as any;
                if (oldSpawnTimer.exec) {
                    oldSpawnTimer.exec = this.spawn
                }
            });
        }
    }

    emit(
        position: Vector,
        enemy_id?: number,
    ) {
        console.log('emit at ', position);
        if (isNaN(position.x) || isNaN(position.y)) {
            debugger
        }

        const pickType = this.simpleEnemyTypes[enemy_id == undefined ? Math.floor(Math.random() * this.simpleEnemyTypes.length) : enemy_id];
        const type = {
            ...pickType,
            controller: pickType.controller[Math.floor(Math.random() * pickType.controller.length)] as controllerKey
        };

        const dead = this.pool.find(enemy => enemy.dead);
        if (dead) {
            dead.init(position, type);
            this.container.addChild(dead.sprite);
            return dead;
        } else {
            const enemy = new Enemy(cloneAnimationSprites(this.spirtes));
            this.container.addChild(enemy.sprite);
            this.pool.push(enemy);
            this.addChildren(enemy);
            enemy.init(position, type);
            return enemy;
        }
    }

    updateEnemyDist() {
        const app = getRunnerApp();
        const player = app.getPlayer();
        let enemy: Enemy;
        if (!player) {
            return;
        }
        for (let index = 0; index < this.livenodes.length; index++) {
            enemy = this.livenodes[index];
            enemy.distSqToPlayer = enemy.position.distanceToSq(player.position);
        }
    }

    relocate() {
        const livenodes = this.livenodes;
        const app = getRunnerApp();
        const player = app.getPlayer();
        const screen = app.getGameView() as Viewport;
        // 2 screen cross
        const cross = 4 * screen.worldHeight * screen.worldHeight + screen.worldWidth * screen.worldWidth;
        let pos = { x: 0, y: 0 };
        let enemy: Enemy;
        let r: number;
        let radius: number;

        for (let index = 0; index < livenodes.length; index++) {
            enemy = livenodes[index];
            if (!hasKnockback(enemy)
                && !hasCharge(enemy)
            ) {
                if (enemy.distSqToPlayer > cross) {
                    r = Math.floor(Math.random() * index) / 180 * Math.PI;
                    radius = 500 + Math.random() * 300;
                    pos.x = player!.position.x + Math.sin(r) * radius;
                    pos.y = player!.position.y + Math.cos(r) * radius;
                    enemy.position.setV(pos);
                    // console.log('relocate at ', pos.x, pos.y);
                }
            }
        }
    }

    update() {
        // this.spawnTimer.update();
        this.livenodes = this.pool.filter(x => !x.dead);
        this.updateEnemyDist();
        super.update();
        this.livenodes = this.pool.filter(x => !x.dead);
        this.lookupHelper.clearEntityTypeCache();
        this.relocate();
    }

    spawn = () => {
        if (this.livenodes.length > 1) {
            return;
        }
        const app = getRunnerApp();
        const player = app.getPlayer();
        const gameView = app.getGameView();
        const radius = 1.2 * Math.max(gameView.width, gameView.height);

        const n = Math.floor(app.getSession().now() / 20e3) + 4;

        const points = pointsCircleAround(player.position, radius, n);
        for (let index = 0; index < points.length; index++) {
            const element = points[index];
            this.emit(element);
        }
    }

    dispose(): void {
        super.dispose();
        for (let index = 0; index < this.pool.length; index++) {
            const element = this.pool[index];
            element.dispose();
        }
        this.pool.length = 0;
    }
}
