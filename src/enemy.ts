import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';
import { IMovable, ICollisionable, EFacing, IObjectPools, ECollisionType, LivingObject, Buffer, Updatable, UpdatableObject } from "./types";
import { checkCollision } from "./collision_helper";
import { Droplets as Droplet } from "./droplet";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, applyDamageFlash, applyEventBuffer, Buffable, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HEALTH_CHANGE, BUFFER_EVENTNAME_HITTED, checkBufferAlive } from "./buffer";
import { cloneAnimationSprites } from "./sprite_utils";
import { overGroundCenterHeight } from "./groups";
import { debugInfo } from "./debug_info";
import { IdleJump } from "./helper/animated_utils";
import { HotClass } from "./helper/class_reloader";


type ReinitableProps = Pick<Enemy, 
    'speed' | 'size' | 'health' | 'sprite_names'
>;

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

    shadow: Graphics;

    debugInfo = debugInfo();

    sprite_names = {
        idle: 'idle',
        idle_back: 'idle_back',
        die: 'die',
        die_back: 'die_back'
    };

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
    ) {
        super();

        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.addChild(shadow);
        shadow.position.y = - overGroundCenterHeight;

        this.shadow = shadow;
        shadow.beginFill(0x000000);
        shadow.drawEllipse(0, 60, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

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
    }

    assets: PIXI.DisplayObject[] = [];
    ground_assets: PIXI.DisplayObject[] = [];

    health: number = 1;
    prev_health: number = 1;
    recieveHealth(amount: number): void {
        throw new Error("Method not implemented.");
    }

    recieveDamage(damage: number, hitPos: Vector): void {
        this.health -= damage;
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
                this.position.clone().sub({x: 0, y: overGroundCenterHeight}),
                this.facing == EFacing.top ? this.spirtes[this.sprite_names.die_back] : this.spirtes[this.sprite_names.die],
                undefined,
                600,
            );

            app.emitDroplets(
                this.position,
                function (this: Droplet) {
                    this.player!.receiveExp(1);
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
        props?: Partial<ReinitableProps>
    ) {
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.visible = true;
        this.dead = false;

        if (props) {
            if (props.speed) {
                this.speed = props.speed;
            }
            if (props.size) {
                this.size = props.size;
            }
            if (props.health) {
                this.health = props.health;
            }
            if (props.sprite_names) {
                this.sprite_names = props.sprite_names;
            }
        }
        this.health = 30;


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
        const app = getRunnerApp();
        const player = app.getEntities({
            collisionTypes: [ECollisionType.player]
        })[0];
        if (player as Player) {
            this.direct.setV(player.position.clone()
                .sub(this.position)
                .normalize()
                .multiplyScalar(this.speed));
        } else {
            this.direct
                .setX(0)
                .setY(0);
        }

        applyBuffer(this);


        this.position.x += this.direct.x;
        this.position.y += this.direct.y;

        const nodes = getRunnerApp().getEntities({
            collisionTypes: [ECollisionType.enemy, ECollisionType.player],
        });

        for (let index = 0; index < nodes.length; index++) {
            const enemy = nodes[index];
            if (enemy !== this) {
                const checkRes = checkCollision(this, enemy);
                if (checkRes) {
                    this.position.setV(checkRes.collisionPos);
                }
            }
        }


    }

    updateSprite() {
        if (this.direct.x > 0 && this.sprite.scale.x > 0) {
            this.sprite.scale.x = -1;
        } else if (this.direct.x < 0 && this.sprite.scale.x < 0) {
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
        this.bufferList = checkBufferAlive(this);
    }

    update() {
        if (this.dead) {
            this.sprite.visible = false;
            return;
        }
        super.update();
        this.updateBuffer();

        this.updatePosition();
        this.updateSprite();
    }
}

@HotClass({ module })
export class EnemyPool extends UpdatableObject implements IObjectPools {
    pool: Enemy[] = [];
    spawnTimer: Updatable;
    livenodes = 0;


    simpleEnemyTypes: Partial<ReinitableProps>[] = [
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
        },
        // bunny
        {
            sprite_names: {
                idle: 'bunny_idle',
                idle_back: 'bunny_idle_back',
                die: 'bunny_die',
                die_back: 'bunny_die_back'
            },
            speed: 2,
            health: 10,
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
        const type = this.simpleEnemyTypes[Math.floor(0.49 + Math.random())]
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

    update() {
        this.spawnTimer.update();
        super.update();
        this.livenodes = this.pool.filter(x => !x.dead).length;
    }

    spawn = () => {
        if (this.livenodes > 100) {
            return;
        }
        const app = getRunnerApp();
        const player = app.getEntities({
            collisionTypes: [ECollisionType.player],
        })[0];
        const radius = 800;
        const n = Math.min(Math.floor(Math.log2(app.now() / 20e3)) + 1, 5);
        const minR = 10;
        let r = Math.random() * 360;
        for (let index = 0; index < n; index++) {
            r += Math.floor(Math.random() * index) * minR / 180 * Math.PI;
            this.emit(
                new Vector(
                    player!.position.x + Math.sin(r) * radius,
                    player!.position.y + Math.cos(r) * radius,
                )
            );
        }
    }

    dispose(): void {
        super.dispose();
        this.pool.length = 0;
    }
}
