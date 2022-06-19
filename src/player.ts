import * as PIXI from "pixi.js";
import { AnimatedSprite, Container, DisplayObject, Graphics } from "pixi.js";
import { Vector } from "./vector";
import { keypressed, mouse } from "./user_input";
import { AmmoPool } from "./ammo";
import { ECollisionType, EFacing, EntityManager, ICollisionable, IMovable, Shootable, Buffer, LivingObject, LeveledObject } from "./types";
import { checkCollision } from "./collision_helper";
import { playerZIndex } from "./const";
import { Enemy } from "./enemy";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, checkBufferAlive, createTimerBuffer } from "./buffer";
import { GlowFilter } from '@pixi/filter-glow';

import easingsFunctions, { twean } from "./easingFunctions";
import tween from "./tween";

export class Player implements IMovable, Shootable, ICollisionable, LivingObject, LeveledObject {
    sprite: Container = new Container();
    dead: boolean = false;
    prev_dead: boolean = false;
    prev_position: Vector = new Vector(0, 0);
    position: Vector = new Vector(0, 0);
    size = 30;
    effects: Record<string, DisplayObject> = {};

    collisison_type: ECollisionType = ECollisionType.player;

    prev_direct: Vector = new Vector(0, 0);
    direct: Vector = new Vector(0, 0);

    prev_costing: boolean = false;
    costing: boolean = false;

    prev_facing = EFacing.top;
    facing = EFacing.bottom;

    speed = 4;

    pointer: Graphics;

    mainSpirtIndex = 1;

    lastShootTime = 0;
    shootCd = 400;
    shootInterval = 400;

    ammoPools: AmmoPool;

    bufferList: Buffer[] = [];

    exp: number = 0;
    lv: number = 1;
    nextLevelExp: number = 10;

    receiveExp(exp: number) {
        this.exp += exp;
        if (this.exp >= this.nextLevelExp) {
            this.lv += 1;
            // 升级动画
            // 选技能
            this.nextLevelExp *= 2;
            console.log('lvup', this.lv);
        }
    }

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public textures: Record<string, PIXI.Texture>,
        public hp: number,
        public container: Container,
        startPosition: Vector,
    ) {
        container.addChild(this.sprite);
        this.position.setV(startPosition);
        instanceList.push(this);

        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.zIndex = playerZIndex;
        this.sprite.scale.set(0.5, 0.5);
        this.sprite.sortableChildren = true;
        this.effects.shadow = shadow;

        shadow.beginFill(0x000000);
        shadow.drawEllipse(-10, 80, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        // main character

        const buff_left = spirtes.buff_left;
        const buff_right = spirtes.buff_right;
        buff_left.anchor.set(0.5, 0.5);
        buff_right.anchor.set(0.5, 0.5);
        buff_left.x = -58;
        buff_right.x = 58;
        buff_left.play();
        buff_right.play();
        this.effects.buff_left = buff_left;
        this.effects.buff_right = buff_right;
        
        const buff_left_back = spirtes.buff_left_back;
        const buff_right_back = spirtes.buff_right_back;
        buff_left_back.anchor.set(0.5, 0.5);
        buff_right_back.anchor.set(0.5, 0.5);
        buff_left_back.x = 58;
        buff_right_back.x = -58;
        buff_left_back.play();
        buff_right_back.play();
        this.effects.buff_left_back = buff_left_back;
        this.effects.buff_right_back = buff_right_back;
        buff_left.tint = 0xffffff;
        const glow = new GlowFilter({ distance: 15, outerStrength: 2 })
        buff_left.onFrameChange = tween(function(percent){
            const tint = 0xff2600 + Math.floor(38 + Math.sin(percent * Math.PI) * 200);
            glow.color = tint;
            buff_left.tint = tint;
            buff_right.tint = tint;
            buff_left_back.tint = tint;
            buff_right_back.tint = tint;
            pointer.tint = tint;
        }, {
            speedFactor: 4
        });
        buff_left.filters = [glow ];
        buff_right.filters = [ glow ];
        buff_left_back.filters = [ glow ];
        buff_right_back.filters = [ glow ];

        // center point indicator
        const pointer = new PIXI.Graphics();
        this.pointer = pointer;
        pointer.beginFill(0xff0000);
        pointer.drawCircle(0, 0, 10);
        pointer.endFill();

        this.ammoPools = new AmmoPool(
            this.spirtes.ammo, 
            this.textures.ammoTrail,
            this.container);
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
            this.checkCostingSprite();
        } else if (!this.costing) {
            if (
                keypressed.attack
                || keypressed.heavy_attack
            ) {
                this.costing = true;
                if (keypressed.heavy_attack) {
                    const direct = this.direct.clone().normalize().multiplyScalar(400);
                    this.bufferList.push(createTimerBuffer({
                        duration: 200,
                        id: 'heavy_attack',
                        takeEffect(target: IMovable, percent: number) {
                            target.position.x = this.properties.start_pos.x + twean(0, this.properties.direct.x, easingsFunctions.easeOutCubic, percent);
                            target.position.y = this.properties.start_pos.y + twean(0, this.properties.direct.y, easingsFunctions.easeOutCubic, percent);
                        },
                        properties: {
                            start_pos: this.position.clone(),
                            direct,
                        }
                    }))
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

        applyBuffer(this.bufferList, this);
    }

    updatePosition() {
        this.position.add(this.direct);

        const enemies = getRunnerApp().getEntities({
            collisionTypes: [ECollisionType.enemy],
        }) as Enemy[];

        const is_rush = this.bufferList.find(buffer => buffer.id === 'heavy_attack');
        if (is_rush) {
            for (let index = 0; index < enemies.length; index++) {
                const enemy = enemies[index];
                const checkRes = checkCollision(this, enemy);
                if (checkRes) {
                    !enemy.bufferList.some(x => x.id == 'knock_back') && enemy.bufferList.push(createTimerBuffer({
                        duration: 200,
                        id: 'knock_back',
                        properties: {
                            direct: enemy.position.clone().sub(this.position).normalize().multiplyScalar(this.speed * 3.1),
                        }
                    }))
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
        const worldPos = getRunnerApp().screenPosToWorldPos(new Vector(mouse.x, mouse.y));

        this.ammoPools.emit(
            worldPos.sub(this.position).normalize().multiplyScalar(Math.random() * 1 + 2),
            this.position.clone(),
            800,
        );
    }

    current_attack_animation: AnimatedSprite | null = null;
    getAttackSprite() {
        if (!this.prev_costing) {
            const attack_animation = keypressed.heavy_attack
                ? (this.facing == "top" ? this.spirtes.heavy_attack_back : this.spirtes.heavy_attack)
                : (this.facing == "top" ? this.spirtes.attack_back : this.spirtes.attack);
            attack_animation.play();
            this.current_attack_animation = attack_animation;
        }
        return this.current_attack_animation;
    }
    checkCostingSprite() {
        if (this.current_attack_animation) {
            const animated = this.current_attack_animation;
            if (animated.currentFrame == animated.totalFrames - 1) {
                this.costing = false;
                this.current_attack_animation.gotoAndStop(0);
                this.current_attack_animation = null;
            }
        }
    }
    getMainSpirt() {
        if (this.costing) {
            return this.getAttackSprite()!;
        }

        if (!this.costing) {
            if (this.facing == "top") {
                return this.spirtes.idle_back;
            }
            if (this.facing == "bottom") {
                return this.spirtes.idle;
            }
        }

        return this.spirtes.idle;
    }
    updateSprite() {


        if (!this.costing) {
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
        }
        // reset order
        this.sprite.removeChildren(0, this.sprite.children.length);
        const mainSprite = this.getMainSpirt();
        console.assert(mainSprite != null, 'mainSprite != null');
        (this.facing == EFacing.bottom ? [
            this.effects.shadow,
            this.effects.buff_left,
            mainSprite,
            this.effects.buff_right,
            this.pointer
        ] : [
            this.effects.shadow,
            this.effects.buff_left_back,
            mainSprite,
            this.effects.buff_right_back,
            this.pointer
        ]).forEach(sprite => {
            this.sprite.addChild(sprite);
        });

    }

    updateBuffer() {
        this.bufferList = checkBufferAlive(this.bufferList);
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
