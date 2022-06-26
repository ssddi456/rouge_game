import { AnimatedSprite, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';
import { IMovable, ICollisionable, EFacing, IObjectPools, ECollisionType, EntityManager, LivingObject, Buffer } from "./types";
import { checkCollision } from "./collision_helper";
import { enemyZIndex } from "./const";
import { Droplets as Droplet } from "./droplet";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, checkBufferAlive } from "./buffer";
import { cloneAnimationSprites } from "./sprite_utils";

export class Enemy implements IMovable, ICollisionable, LivingObject {
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

    mainSpirtIndex = 1
    sprite = new Container();

    bufferList: Buffer[] = [];

    shadow: Graphics;

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
    ) {
        instanceList.push(this);
        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.addChild(shadow);
        this.sprite.zIndex = enemyZIndex;

        this.shadow = shadow;
        shadow.beginFill(0x000000);
        shadow.drawEllipse(0, 60, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        this.sprite.addChild(this.spirtes.idle);

    }
    health: number = 1;
    prev_health: number = 1;
    recieveHealth(amount: number): void {
        throw new Error("Method not implemented.");
    }
    recieveDamage(damage: number, hitPos: Vector): void {
        this.health -= damage;
        const app = getRunnerApp();
        app.emitDamageParticles(hitPos, damage);

        if (this.health <= 0) {
            this.dead = true;
            this.health = 0;
        }

        if (this.dead) {
            // 插入一个死亡动画
            app.emitParticles(
                this.position,
                this.facing == EFacing.top ? this.spirtes.die_back : this.spirtes.die,
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
        }
    }


    init(
        position: Vector,
    ) {
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.visible = true;
        this.dead = false;
        this.container.addChild(this.sprite);
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
            this.direct.setV(new Vector(
                player.position.x,
                player.position.y)
                .sub(this.position)
                .normalize()
                .multiplyScalar(this.speed));
        } else {
            this.direct
                .setX(0)
                .setY(0);
        }

        applyBuffer(this.bufferList, this);


        this.position.x += this.direct.x;
        this.position.y += this.direct.y;
        this.sprite.zIndex = enemyZIndex + this.position.y / 1000;
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
        if (this.direct.x > 0 && this.prev_direct.y <= 0) {
            if (this.sprite.scale.x > 0) {
                this.sprite.scale.x *= -1;
            }
        } else if (this.direct.x < 0 && this.prev_direct.y >= 0) {
            if (this.sprite.scale.x < 0) {
                this.sprite.scale.x *= -1;
            }
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
            this.sprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == EFacing.top) {
                this.sprite.addChildAt(this.spirtes.idle_back, this.mainSpirtIndex);
            }
            if (this.facing == EFacing.bottom) {
                this.sprite.addChildAt(this.spirtes.idle, this.mainSpirtIndex);
            }
        }
    }

    updateBuffer() {
        this.bufferList = checkBufferAlive(this.bufferList);
    }

    update() {
        if (this.dead) {
            this.sprite.visible = false;
            return;
        }
        this.cacheProperty();
        this.updatePosition();
        this.updateBuffer();
        this.updateSprite();
    }
}

export class EnemyPool implements IObjectPools {
    pool: Enemy[] = [];
    spawnTimer: CountDown;
    livenodes = 0;
    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
    ) {
        this.spawnTimer = new CountDown(5000, this.spawn);
        
        if (module.hot) {
            if (this.constructor === EnemyPool) {
                instancePool.push(this);
            }
            module.hot.dispose((module) => {
                const oldSpawnTimer = this.spawnTimer;
                this.spawnTimer = new CountDown(5000, this.spawn);
                this.spawnTimer.exec_times = oldSpawnTimer.exec_times;
                this.spawnTimer.last_update_time = oldSpawnTimer.last_update_time;
            });
        }
    }

    emit(
        position: Vector,
    ) {
        const dead = this.pool.find(enemy => enemy.dead);
        if (dead) {
            dead.init(position);
        } else {
            const enemy = new Enemy(cloneAnimationSprites(this.spirtes), this.container);
            this.pool.push(enemy);
            enemy.init(position);
        }
    }

    update() {
        this.spawnTimer.update();
        this.pool.forEach(x => x.update());
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
        const radius = 400;
        const n = Math.floor(Math.log2(app.now() / 20e3)) + 1;
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
}

export const instanceList: Enemy[] = module?.hot?.data?.instanceList || [];
export const instancePool: EnemyPool[] = module?.hot?.data?.instanceList || [];
if (module.hot) {
    module.hot.accept();
    module.hot.dispose((module) => {
        console.log('dispose', module);
        module.instanceList = instanceList;
    });
    instanceList.forEach(enemy => {
        if (enemy.constructor.toString() !== Enemy.toString()) {
            location.reload();
        }
        enemy.constructor = Enemy;
        (enemy as any).__proto__ = Enemy.prototype;
    });
    instancePool.forEach(enemyPool => {
        if (enemyPool.constructor.toString() !== EnemyPool.toString()) {
            location.reload();
        }
        enemyPool.constructor = EnemyPool;
        (enemyPool as any).__proto__ = EnemyPool.prototype;
    });
}
