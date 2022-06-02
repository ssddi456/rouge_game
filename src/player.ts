import * as PIXI from "pixi.js";
import { AnimatedSprite, Container, Graphics } from "pixi.js";
import { Vector } from "./vector";
import { keypressed, mouse } from "./user_input";
import { AmmoPool } from "./ammo";
import { ECollisionType, EFacing, EntityManager, ICollisionable, IMovable, Shootable, Buffer, LivingObject } from "./types";
import { checkCollision } from "./collision_helper";
import { playerZIndex } from "./const";
import { Enemy } from "./enemy";

export class Player implements IMovable, Shootable, ICollisionable, LivingObject {
    sprite: Container = new Container();
    dead: boolean = false;
    prev_dead: boolean = false;
    prev_position: Vector = new Vector(0, 0);
    position: Vector = new Vector(0, 0);
    size = 70;

    collisison_type: ECollisionType = ECollisionType.player;

    prev_direct: Vector = new Vector(0, 0);
    direct: Vector = new Vector(0, 0);

    prev_costing: boolean = false;
    costing: boolean = false;

    prev_facing = EFacing.top;
    facing = EFacing.bottom;

    speed = 4;

    shadow: Graphics;
    pointer: Graphics;

    mainSpirtIndex = 1;

    lastShootTime = 0;
    shootCd = 400;
    shootInterval = 400;

    ammoPools: AmmoPool;

    bufferList: Buffer[] = [];

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public hp: number,
        public container: Container,
        startPosition: Vector,
        public entityManager: EntityManager,
    ) {
        container.addChild(this.sprite);
        this.position.setV(startPosition);
        instanceList.push(this);

        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.addChild(shadow);
        this.sprite.zIndex = playerZIndex;
        this.shadow = shadow;
        shadow.beginFill(0x000000);
        shadow.drawEllipse(-10, 80, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        // main character
        this.sprite.addChild(spirtes.idle);

        // center point indicator
        const pointer = this.sprite.addChild(new PIXI.Graphics());
        this.pointer = pointer
        pointer.beginFill(0xff0000);
        pointer.drawCircle(0, 0, 10);
        pointer.endFill();

        this.ammoPools = new AmmoPool(this.spirtes.ammo, this.container, entityManager);
    }

    health: number = 100;
    prev_health: number = 100;

    recieveHealth(amount: number): void {
        throw new Error("Method not implemented.");
    }

    recieveDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.dead = true;
        }
        this.entityManager // 插入一个死亡动画
    }

    cacheProperty() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_position.x = this.position.x;
        this.prev_position.y = this.position.y;
        this.prev_costing = this.costing;
        this.prev_facing = this.facing;
        this.prev_dead = this.dead;
        this.prev_health = this.health;
    }

    getInput() {

        if (keypressed.up) {
            this.direct.y = -1 * this.speed;
        } else if (keypressed.down) {
            this.direct.y = 1 * this.speed;
        } else {
            this.direct.y = 0;
        }

        if (keypressed.left) {
            this.direct.x = -1 * this.speed;
        } else if (keypressed.right) {
            this.direct.x = 1 * this.speed;
        } else {
            this.direct.x = 0;
        }

        if (this.prev_costing) {
            const animated = this.sprite.children[this.mainSpirtIndex] as AnimatedSprite;
            if (animated.currentFrame == animated.totalFrames - 1) {
                this.costing = false;
                animated.gotoAndStop(0);
            }
        } else if (!this.costing) {
            if (
                keypressed.attack
                || keypressed.heavy_attack
            ) {
                this.costing = true;
                if (keypressed.heavy_attack) {
                    this.bufferList.push({
                        initialTime: Date.now(),
                        duration: 200,
                        id: 'heavy_attack',
                        properties: {
                            direct: this.direct.clone().normalize().multiplyScalar(this.speed * 3.1),
                        }
                    })
                }
            }
        }



        if (this.costing) {
            this.direct.x = 0;
            this.direct.y = 0;
        } else {
            if (this.shootCd + this.lastShootTime < Date.now()) {
                if (keypressed.shoot
                    || mouse.left
                ) {
                    this.lastShootTime = Date.now();
                    this.doShoot();
                }
            }
            // 射击后200毫秒内移速减半
            if (this.lastShootTime + this.shootInterval > Date.now()) {
                this.direct.multiplyScalar(0.5);
            }
        }

        this.bufferList.filter(buffer => {
            if (buffer.properties.direct) {
                this.direct.add(buffer.properties.direct);
            }
        });
    }

    updatePosition() {
        this.position.add(this.direct);

        const enemies = this.entityManager.getEntities({
            collisionTypes: [ECollisionType.enemy],
        }) as Enemy[];

        const is_rush = this.bufferList.find(buffer => buffer.id === 'heavy_attack');
        if (is_rush) {
            for (let index = 0; index < enemies.length; index++) {
                const enemy = enemies[index];
                const checkRes = checkCollision(this, enemy);
                if (checkRes) {
                    !enemy.bufferList.some(x => x.id == 'knock_back') && enemy.bufferList.push({
                        initialTime: Date.now(),
                        duration: 200,
                        id: 'knock_back',
                        properties: {
                            direct: enemy.position.clone().sub(this.position).normalize().multiplyScalar(this.speed * 3.1),
                        }
                    })
                }
            }
        } else {
            for (let index = 0; index < enemies.length; index++) {
                const enemy = enemies[index];
                const checkRes = checkCollision(this, enemy);
                if (checkRes) {
                    this.position.setV(checkRes.collisionPos);
                }
            }
        }

    }

    doShoot() {
        const worldPos = this.entityManager.screenPosToWorldPos(new Vector(mouse.x, mouse.y));

        this.ammoPools.emit(
            worldPos.sub(this.position).normalize(),
            this.position.clone(),
            2000,
        );
    }

    updateSprite() {
        if (this.costing && !this.prev_costing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            const attack_animation = keypressed.heavy_attack
                ? (this.facing == "top" ? this.spirtes.heavy_attack_back : this.spirtes.heavy_attack)
                : (this.facing == "top" ? this.spirtes.attack_back : this.spirtes.attack);
            this.sprite.addChildAt(attack_animation, this.mainSpirtIndex);
            attack_animation.play();
        }

        if (!this.costing && this.prev_costing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == "top") {
                this.sprite.addChildAt(this.spirtes.idle_back, this.mainSpirtIndex);
            }
            if (this.facing == "bottom") {
                this.sprite.addChildAt(this.spirtes.idle, this.mainSpirtIndex);
            }
        }

        if (this.costing) {
            return;
        }

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
            if (this.facing == "top") {
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
        this.cacheProperty();
        this.getInput();
        this.updatePosition();
        this.updateBuffer();
        this.updateSprite();
        this.ammoPools.update();
    }
}

export const instanceList: Player[] = module?.hot?.data?.instanceList || [];
if (module.hot) {
    module.hot.accept();
    module.hot.dispose((module) => {
        module.instanceList = instanceList;
    });
    instanceList.forEach(player => {
        if (player.constructor.toString() !== Player.toString()) {
            location.reload();
        }
        player.constructor = Player;
        (player as any).__proto__ = Player.prototype;
    });
}
