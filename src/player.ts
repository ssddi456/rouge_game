import * as PIXI from "pixi.js";
import { AnimatedSprite, Container, DisplayObject, Graphics, Text } from "pixi.js";
import { Vector } from "./vector";
import { keypressed, mouse } from "./user_input";
import { AmmoPool } from "./ammo";
import { ECollisionType, EFacing, ICollisionable, IMovable, Shootable, Buffer, LivingObject, LeveledObject, UpdatableObject } from "./types";
import { checkCollision } from "./collision_helper";
import { Enemy } from "./enemy";
import { getRunnerApp } from "./runnerApp";
import { applyBuffer, applyDamageFlash, applyEventBuffer, applyFireAura, applyKnockback, Buffable, BUFFER_EVENTNAME_HEALTH_CHANGE, checkBufferAlive, createTimerBuffer } from "./buffer";
import { GlowFilter } from '@pixi/filter-glow';

import easingsFunctions, { twean } from "./easingFunctions";
import tween from "./tween";
import { Bow1 } from "./bow";
import { overGroundCenterHeight } from "./groups";
import { HotClass } from "./helper/class_reloader";
import { ShootManager } from "./shootManager";
import { CountDown } from "./countdown";
@HotClass({ module })
export class Player extends UpdatableObject
    implements
    IMovable,
    Shootable,
    ICollisionable,
    LivingObject,
    Buffable {
    sprite: Container = new Container();
    bodyContainer: Container = this.sprite.addChild(new Container());

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

    // text = this.sprite.addChild(new Text('', {
    //     fill: '#ffffff',
    //     fontSize: 14,
    //     fontWeight: "700",
    // }));

    mainSpirtIndex = 1;

    lastShootTime = 0;
    shootCd = 400;
    shootInterval = 400;

    
    bufferList: Buffer[] = [];

    baseScale = 0.5;
    centerHeight = overGroundCenterHeight;
    showBuff = false;
    
    
    ammoPools: AmmoPool;
    bow!: Bow1;
    shootManager!: ShootManager;

    constructor(
        public playerSpirtes: Record<string, AnimatedSprite>,
        public weaponSpirtes: Record<string, AnimatedSprite>,
        public ammoTextures: Record<string, PIXI.Texture>,
        public hitSpirtes: Record<string, AnimatedSprite>,
        public hp: number,
        public container: Container,
        startPosition: Vector,
    ) {
        super();

        container.addChild(this.sprite);
        this.position.setV(startPosition);

        // soft shadow
        const shadow = new PIXI.Graphics();
        this.bodyContainer.position.y = - this.centerHeight;
        this.bodyContainer.scale.set(this.baseScale, this.baseScale);
        this.effects.shadow = shadow;

        shadow.beginFill(0x000000);
        shadow.drawEllipse(-10, 80, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        // main character

        const buff_left = playerSpirtes.buff_left;
        const buff_right = playerSpirtes.buff_right;
        buff_left.anchor.set(0.5, 0.5);
        buff_right.anchor.set(0.5, 0.5);
        buff_left.x = -58;
        buff_right.x = 58;
        buff_left.play();
        buff_right.play();
        this.effects.buff_left = buff_left;
        this.effects.buff_right = buff_right;

        const buff_left_back = playerSpirtes.buff_left_back;
        const buff_right_back = playerSpirtes.buff_right_back;
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
        buff_left.onFrameChange = tween(function (percent) {
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
        buff_left.filters = [glow];
        buff_right.filters = [glow];
        buff_left_back.filters = [glow];
        buff_right_back.filters = [glow];


        this.ammoPools = new AmmoPool(
            this.playerSpirtes.ammo,
            this.ammoTextures.ammoTrail,
            this.container,
            this.hitSpirtes.hit_1,
        );

        this.equipeRangedWeapon(
            ShootManager,
            Bow1
        );
        
        // center point indicator
        const pointer = new PIXI.Graphics();
        this.pointer = pointer;
        pointer.beginFill(0xff0000);
        pointer.drawCircle(0, 0, 10);
        pointer.endFill();
        this.sprite.addChild(pointer);
        applyFireAura(this);
    }
    assets: PIXI.DisplayObject[] = [];
    ground_assets: PIXI.DisplayObject[] = [];

    health: number = 3;
    prev_health: number = 3;

    max_health: number = 3;
 
    recieveHealth(amount: number): void {
        throw new Error("Method not implemented.");
    }

    immutating = false;
    // recover immutating
    immutationTimer = new CountDown(3000, () => {
        this.collisison_type = ECollisionType.player;
        this.immutating = false;
    });

    enterImutating() {
        this.immutating = true;
        this.collisison_type = ECollisionType.none;
        this.immutationTimer.start();
    }

    recieveDamage(damage: number, hitPos: Vector): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.dead = true;
        }

        applyEventBuffer(this, BUFFER_EVENTNAME_HEALTH_CHANGE);

        const app = getRunnerApp();
        app.emitDamageParticles(hitPos, damage);
        applyDamageFlash(this);

        this.enterImutating();
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
        const app = getRunnerApp();

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
            // 射击后200毫秒内移速减半
            if (this.shootManager.shooting) {
                this.direct.multiplyScalar(0.5);
            }
        }

        applyBuffer(this);
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
                    applyKnockback(enemy,
                        enemy.position.clone().sub(this.position).normalize().multiplyScalar(this.speed * 3.1)
                    );
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


    current_attack_animation: AnimatedSprite | null = null;
    getAttackSprite() {
        if (!this.prev_costing) {
            const attack_animation = keypressed.heavy_attack
                ? (this.facing == EFacing.top ? this.playerSpirtes.heavy_attack_back : this.playerSpirtes.heavy_attack)
                : (this.facing == EFacing.top ? this.playerSpirtes.attack_back : this.playerSpirtes.attack);
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
            if (this.facing == EFacing.top) {
                return this.playerSpirtes.idle_back;
            }
            if (this.facing == EFacing.bottom) {
                return this.playerSpirtes.idle;
            }
        }

        return this.playerSpirtes.idle;
    }
    updateSprite() {


        if (!this.costing) {

            const worldPos = getRunnerApp().screenPosToWorldPos(new Vector(mouse.x, mouse.y));
            const deltaX = worldPos.x - this.position.x;
            const deltaY = worldPos.y - this.position.y;

            if (deltaX > 0 && this.bodyContainer.scale.x > 0) {
                this.bodyContainer.scale.x = -this.baseScale;
            } else if (deltaX < 0 && this.bodyContainer.scale.x < 0) {
                this.bodyContainer.scale.x = this.baseScale;
            }

            if (deltaY > 0 && this.facing == EFacing.top) {
                this.facing = EFacing.bottom;
            } else if (deltaY < 0 && this.facing == EFacing.bottom) {
                this.facing = EFacing.top;
            }
        }
        // reset order
        const mainSprite = this.getMainSpirt();
        console.assert(mainSprite != null, 'mainSprite != null');
        this.bodyContainer.removeChildren();
        this.bodyContainer.addChild(
            ...(this.facing == EFacing.bottom ? [
                this.effects.shadow,
                ...this.ground_assets,
                this.showBuff && this.effects.buff_left,
                mainSprite,
                this.showBuff && this.effects.buff_right,
                ...this.assets,
            ] : [
                this.effects.shadow,
                ...this.ground_assets,
                this.showBuff && this.effects.buff_left_back,
                mainSprite,
                this.showBuff && this.effects.buff_right_back,
                ...this.assets,
            ]).filter(Boolean) as DisplayObject[]
        );
    }

    updateBuffer() {
        this.bufferList = checkBufferAlive(this);
    }

    equipeRangedWeapon(
        ShootManagerClass: new (center: Vector, ammoPools: AmmoPool) => ShootManager,
        BowClass: new (weaponSpirtes: Record<string, AnimatedSprite>) => Bow1
    ) {
        this.shootManager = new ShootManagerClass(new Vector(0, 0), this.ammoPools);
        this.bow = new BowClass(this.weaponSpirtes);
        this.bow.sprite.scale.set(0.6 * this.baseScale, 0.6 * this.baseScale);
        this.bow.sprite.position.y = - this.centerHeight;
        this.sprite.addChild(this.bow.sprite);
    }

    updateRangedWeapon() {
        this.shootManager.position.set(this.position.x, this.position.y);
        this.shootManager.update();
        this.bow.position.set(this.position.x, this.position.y - this.centerHeight);
        this.bow.update();
        this.ammoPools.update();
    }

    update() {
        super.update();
        if (this.immutating) {
            this.immutationTimer.update();
        }

        this.updateBuffer();

        this.getInput();

        this.updatePosition();
        this.updateSprite();

        this.updateRangedWeapon();
    }

    dispose() {
        super.dispose();
        this.ammoPools.pool = [];
        this.bufferList = [];
    }
}
