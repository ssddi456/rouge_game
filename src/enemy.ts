import { AnimatedSprite, Container, Graphics, Sprite, Texture } from "pixi.js";
import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import * as PIXI from 'pixi.js';


function cloneAnimationSprites( spriteMap: Record<string, AnimatedSprite>){
    const ret: Record<string, AnimatedSprite> = {};
    for (const key in spriteMap) {
        if (Object.prototype.hasOwnProperty.call(spriteMap, key)) {
            const element = spriteMap[key];
            
            ret[key] = new AnimatedSprite(element.textures);
        }
    }
    return ret;
}


export class Enemy {

    dead = false;
    direct = new Vector(0, 0);
    prev_direct = new Vector(0, 0);
    position = new Vector(0, 0);
    speed = 1;
    player: Player | undefined;
    mainSpirtIndex = 1
    sprite = new Container();
    facing = "bottom";
    prev_facing = "prev_facing";

    shadow: Graphics;

    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
    ) {
        // soft shadow
        const shadow = new PIXI.Graphics();
        this.sprite.addChild(shadow);
        this.shadow = shadow;
        shadow.beginFill(0x000000);
        shadow.drawEllipse(40, 120, 30, 10);
        shadow.endFill();
        shadow.filters = [new PIXI.filters.BlurFilter(5, 5)];

        this.sprite.addChild(this.spirtes.idle);

     }

    init(
        position: Vector,
        player: Player
    ) {
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;

        this.dead = false;
        this.container.addChild(this.sprite);
        this.player = player;
    }

    cacheProperty() {
        this.prev_direct.x = this.direct.x;
        this.prev_direct.y = this.direct.y;
        this.prev_facing = this.facing;
    }

    updatePosition() {
        this.direct.setV(new Vector(
            this.player!.sprite.x, 
            this.player!.sprite.y)
            .sub(this.position)
            .normalize()
            .multiplyScalar(this.speed));

        this.position.x += this.direct.x;
        this.position.y += this.direct.y;
        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;
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
                this.facing = "bottom";
            }
            if (this.direct.y < 0) {
                this.facing = "top";
            }
        }

        if (this.facing != this.prev_facing) {
            this.sprite.removeChildAt(this.mainSpirtIndex);
            if (this.facing == "top") {
                this.sprite.addChildAt(this.spirtes.idle_back, this.mainSpirtIndex);
            }
            if (this.facing == "bottom") {
                this.sprite.addChildAt(this.spirtes.idle, this.mainSpirtIndex);
            }
        }
    }

    update() {
        if (this.dead) {
            return;
        }
        this.cacheProperty();
        this.updatePosition();
        this.updateSprite();
    }
}

export class EnemyPool {

    enemys: Enemy[] = [];
    spawnTimer: CountDown;
    
    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
        public player: Player,
    ) {
        this.spawnTimer = new CountDown(1000, this.spawn);
    }

    emit(
        position: Vector,
    ) {
        if (this.enemys.length < 100) {
            const enemy = new Enemy(cloneAnimationSprites(this.spirtes), this.container);
            this.enemys.push(enemy);
            enemy.init(
                position,
                this.player
            );
        } else {
            this.enemys.find(Enemy => {
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
        this.enemys.forEach(x => x.update());
    }
    spawn = () => {
        const living_enemys = this.enemys.filter(x => !x.dead).length;

        if (living_enemys < 10) {

            const pos = new Vector(
                200 + Math.floor(Math.random() * 100),
                200 + Math.floor(Math.random() * 100),
            );

            this.emit(pos);
        }
    }
}