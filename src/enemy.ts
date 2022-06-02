import { AnimatedSprite, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';
import { IMovable, ICollisionable, EFacing, IObjectPools, ECollisionType, EntityManager, LivingObject, Buffer } from "./types";
import { checkCollision } from "./collision_helper";
import { enemyZIndex } from "./const";


function cloneAnimationSprites(spriteMap: Record<string, AnimatedSprite>) {
    const ret: Record<string, AnimatedSprite> = {};
    for (const key in spriteMap) {
        if (Object.prototype.hasOwnProperty.call(spriteMap, key)) {
            const element = spriteMap[key];

            ret[key] = new AnimatedSprite(element.textures);
            ret[key].anchor.set(element.anchor._x, element.anchor._y);
        }
    }
    return ret;
}


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
    size: number = 50;
    collisison_type: ECollisionType = ECollisionType.enemy;

    player: Player | undefined;

    mainSpirtIndex = 1
    sprite = new Container();

    bufferList: Buffer[] = [];

    shadow: Graphics;

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
        public entityManager: EntityManager,
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

        this.entityManager.emitDamageParticles(hitPos, damage);

        if (this.health <= 0) {
            this.dead = true;
            this.health = 0;
        }

        if (this.dead) {
            // 插入一个死亡动画
            this.entityManager.emitParticles(
                this.position,
                this.facing == EFacing.top ? this.spirtes.die_back : this.spirtes.die,
                undefined,
                300,
            );
        }
    }


    init(
        position: Vector,
        player: Player
    ) {
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.visible = true;
        this.dead = false;
        this.container.addChild(this.sprite);
        this.player = player;
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
        this.direct.setV(new Vector(
            this.player!.position.x,
            this.player!.position.y)
            .sub(this.position)
            .normalize()
            .multiplyScalar(this.speed));

        this.bufferList.filter(buffer => {
            if (buffer.properties.direct) {
                console.log('buffer.properties.direct', buffer.properties.direct, this.direct);

                this.direct.add(buffer.properties.direct);

                console.log(this.direct);
            }
        });

        this.position.x += this.direct.x;
        this.position.y += this.direct.y;

        const nodes = this.entityManager.getEntities({
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
            this.sprite.scale.x = -1;
        } else if (this.direct.x < 0 && this.prev_direct.y >= 0) {
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
        this.bufferList = this.bufferList.filter(buffer => {
            return (buffer.initialTime + buffer.duration) > Date.now();
        });
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

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
        public player: Player,
        public entityManager: EntityManager,
    ) {
        instancePool.push(this);
        this.spawnTimer = new CountDown(1000, this.spawn);
    }

    emit(
        position: Vector,
    ) {
        if (this.pool.length < 4) {
            const enemy = new Enemy(cloneAnimationSprites(this.spirtes), this.container, this.entityManager);
            this.pool.push(enemy);
            enemy.init(
                position,
                this.player
            );
        } else {
            this.pool.find(Enemy => {
                if (Enemy.dead) {
                    Enemy.init(
                        position,
                        this.player
                    );
                    return true;
                }
            });
        }
    }

    update() {
        this.spawnTimer.update();
        this.pool.forEach(x => x.update());
    }
    spawn = () => {
        const living_enemys = this.pool.filter(x => !x.dead).length;

        if (living_enemys < 1) {

            const pos = new Vector(
                500 + Math.floor(Math.random() * 100),
                500 + Math.floor(Math.random() * 100),
            );

            this.emit(pos);
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
