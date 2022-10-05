import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';
import { IMovable, ICollisionable, EFacing, IObjectPools, ECollisionType, LivingObject, Buffer, Updatable, UpdatableObject } from "./types";
import { checkCollision } from "./collision_helper";
import { Droplet as Droplet } from "./droplet";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, applyCharge, applyDamageFlash, applyEventBuffer, applyKnockback, Buffable, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HEALTH_CHANGE, BUFFER_EVENTNAME_HITTED, checkBufferAlive, hasCharge } from "./buffer";
import { cloneAnimationSprites } from "./sprite_utils";
import { overGroundCenterHeight } from "./groups";
import { debugInfo } from "./debug_info";
import { IdleJump } from "./helper/animated_utils";
import { HotClass } from "./helper/class_reloader";
import { getBlobShadow } from './uicomponents/blobShadow';
import { Viewport } from 'pixi-viewport';


type ReinitableProps = Partial<Pick<Enemy,
    'speed' | 'size' | 'health' | 'sprite_names'
>> & {
    controller: controllerKey[]
};

type controllerKey = (keyof (typeof EnemyControllerMap));

const EnemyControllerMap: Record<string, (enemy: Enemy, player?: Player) => void> = {
    tracer(enemy: Enemy, player: Player = getRunnerApp().getPlayer()) {
        if (player as Player) {
            enemy.direct.setV(player.position.clone()
                .sub(enemy.position)
                .normalize()
                .multiplyScalar(enemy.speed));
        } else {
            enemy.direct.set(0, 0);
        }
    },
    charger(enemy: Enemy, player: Player = getRunnerApp().getPlayer()){
        if (hasCharge(enemy)) {
            enemy.direct.set(0, 0);
            return;
        }
        if (enemy.distSqToPlayer < 300 * 300) {
            applyCharge(enemy, 1200, {
                start_pos: enemy.position.clone(),
                direct: player.position.clone().sub(enemy.position).normalize().multiplyScalar(300 + 100),
                chargingTime: 1500
            });
        } else {
            this.tracer(enemy, player);
        }
    }
};

@HotClass({ module })
export class Enemy extends UpdatableObject implements IMovable, ICollisionable, LivingObject, Buffable {
    prev_dead: boolean = false;
    dead = false;
    prev_direct = new Vector(0, 0);
    direct = new Vector(0, 0);

    prev_position = new Vector(0, 0);
    position = new Vector(0, 0);

    prev_facing = EFacing.bottom;
    facing = EFacing.bottom;

    speed = 1;
    size: number = 30;
    collisison_type: ECollisionType = ECollisionType.enemy;

    mainSpirtIndex = 0
    sprite = new Container();
    bodySprite = this.sprite.addChild(new Container);
    bufferList: Buffer[] = [];

    shadow: Sprite;

    debugInfo = debugInfo();

    sprite_names = {
        idle: 'idle',
        idle_back: 'idle_back',
        die: 'die',
        die_back: 'die_back'
    };
    
    distSqToPlayer: number = 0;
    controller: keyof (typeof EnemyControllerMap) = 'charger';

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
        this.dispositions.push(
            new IdleJump(
                this.bodySprite,
                {
                    frames: 36,
                    base: - overGroundCenterHeight,
                    height: 10,
                }
            )
        );

        this.sprite.addChild(this.debugInfo.pointer);
        this.sprite.addChild(this.debugInfo.text);
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
        this.debugInfo.text.text = `${this.health}/${this.max_health}`;
        applyEventBuffer(this, BUFFER_EVENTNAME_HEALTH_CHANGE);

        const app = getRunnerApp();
        app.emitDamageParticles(hitPos, damage);
        applyDamageFlash(this);

        if (this.health <= 0) {
            this.dead = true;
            this.health = 0;
        }

        if (this.dead) {
            // 插入一个死亡动画
            app.emitParticles(
                this.position.clone().sub({ x: 0, y: overGroundCenterHeight }),
                this.facing == EFacing.top ? this.spirtes[this.sprite_names.die_back] : this.spirtes[this.sprite_names.die],
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

            applyEventBuffer(this, BUFFER_EVENTNAME_DEAD);
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
            if (props.health) {
                this.health = props.health;
                this.max_health = props.health;
            }
            if (props.sprite_names) {
                this.sprite_names = props.sprite_names;
            }
        }

        this.bodySprite.removeChildAt(this.mainSpirtIndex);
        if (this.facing == EFacing.top) {
            this.bodySprite.addChildAt(this.spirtes[this.sprite_names.idle_back], this.mainSpirtIndex);
        }
        if (this.facing == EFacing.bottom) {
            this.bodySprite.addChildAt(this.spirtes[this.sprite_names.idle], this.mainSpirtIndex);
        }
        // clearups
        this.bufferList = [];
        this.assets = [];
        this.ground_assets = [];
        this.sprite.filters = [];
    }

    cacheProperty() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_position.x = this.position.x;
        this.prev_position.y = this.position.y;
        this.prev_facing = this.facing;
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
                        applyKnockback((node as any) as Buffable,
                            node.position.clone().sub(this.position)
                                .normalize().rotate( Math.PI / 3)
                                .multiplyScalar(this.speed * 20),
                            200
                        );
                    } else {
                        this.position.setV(checkRes.collisionPos);
                    }
                    if (node.collisison_type === ECollisionType.player) {
                        applyEventBuffer(node as Player, BUFFER_EVENTNAME_HITTED);
                        (node as Player).recieveDamage(1, checkRes.collisionHitPos);
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
            this.bodySprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == EFacing.top) {
                this.bodySprite.addChildAt(this.spirtes[this.sprite_names.idle_back], this.mainSpirtIndex);
            }
            if (this.facing == EFacing.bottom) {
                this.bodySprite.addChildAt(this.spirtes[this.sprite_names.idle], this.mainSpirtIndex);
            }
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
        EnemyControllerMap[this.controller](this,);
        this.updatePosition();
        this.updateSprite();
    }
}

@HotClass({ module })
export class EnemyPool extends UpdatableObject implements IObjectPools {
    pool: Enemy[] = [];
    spawnTimer: Updatable;
    livenodes: Enemy[] = [];

    simpleEnemyTypes: ReinitableProps[] = [
        // bottle
        {
            sprite_names: {
                idle: 'idle',
                idle_back: 'idle_back',
                die: 'die',
                die_back: 'die_back'
            },
            speed: 1,
            health: 30,
            controller: ['tracer', 'charger'],
        },
        // bunny
        {
            sprite_names: {
                idle: 'bunny_idle',
                idle_back: 'bunny_idle_back',
                die: 'bunny_die',
                die_back: 'bunny_die_back'
            },
            speed: 1.5,
            health: 20,
            controller: ['tracer'],
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
    ) {
        console.log('emit at ', position);
        if (isNaN(position.x) || isNaN(position.y)) {
            debugger
        }

        const pickType = this.simpleEnemyTypes[Math.floor(Math.random() * this.simpleEnemyTypes.length)];
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
        let dist: number;
        let r: number;
        let radius: number;

        for (let index = 0; index < livenodes.length; index++) {
            enemy = livenodes[index];
            dist = enemy.position.distanceToSq(player.position);

            if (dist > cross) {
                r = Math.floor(Math.random() * index) / 180 * Math.PI;
                radius = 500 + Math.random() * 300;
                pos.x = player!.position.x + Math.sin(r) * radius;
                pos.y = player!.position.y + Math.cos(r) * radius;
                enemy.position.setV(pos);
                // console.log('relocate at ', pos.x, pos.y);
            }
        }
    }

    update() {
        this.spawnTimer.update();
        this.livenodes = this.pool.filter(x => !x.dead);
        this.updateEnemyDist();
        super.update();
        this.livenodes = this.pool.filter(x => !x.dead);
        this.relocate();
    }

    spawn = () => {
        if (this.livenodes.length > 1) {
            return;
        }
        const app = getRunnerApp();
        const player = app.getPlayer();
        const radius = 800;
        const n = Math.min(Math.floor(app.getSession().now() / 20e3) + 1, 3);
        // const n = 3;
        const minR = 10;
        let r = Math.random() * 360;
        for (let index = 0; index < n; index++) {
            r += Math.floor(Math.random() * index) * minR / 180 * Math.PI;

            const pos = [player!.position.x + Math.sin(r) * radius, player!.position.y + Math.cos(r) * radius,];
            for (let jndex = 0; jndex < 5; jndex++) {
                this.emit(new Vector(pos[0], pos[1]));
            }
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
