import { Container, Sprite } from "pixi.js";
import { checkCollision } from "./collision_helper";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { ECollisionType, GameObject, ICollisionable, IObjectPools } from "./types";
import { Vector } from "./vector";


export class Droplets implements GameObject, ICollisionable {
    prev_position: Vector = new Vector(0, 0);
    position: Vector = new Vector(0, 0);
    sprite = new Container();
    picked = false;

    pickUp?: () => void;
    player?: Player;

    initTime?: number;
    duration?: number;

    dead = false;
    constructor(
        sprite: Sprite,
        public container: Container,
    ) {
        this.sprite.addChild(sprite);
        container.addChild(this.sprite);
    }

    size: number = 200;
    collisison_type =  ECollisionType.droplets;

    init(
        position: Vector,
        pickUp: () => void,
        duration: number,
        player: Player,
    ): void {
        this.dead = false;
        this.picked = false;
        this.duration = duration;
        this.player = player;
        this.position.setV(position);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.sprite.visible = true;
        this.pickUp = pickUp;
    }

    speed = 10;
    updatePosition(): void {
        const dir = this.player!.position.clone().sub(this.position);
        if (dir.lengthSq() < this.player!.size * this.player!.size) {
            this.pickUp!();
            this.dead = true;
            this.sprite.visible = false;
        } else {
            this.position.add(dir.normalize().multiplyScalar(this.speed));
        }
    }

    update(): void {
        if (this.picked) {
            this.updatePosition();
        }
    }
}

export class DropletPool implements IObjectPools {
    pool: Droplets[] = [];
    constructor(
        public container: Container,
        public sprite: Sprite,
    ) {
    }

    emit(
        position: Vector,
        pickUp: () => void,
        duration: number,
    ) {
        const _droplet = this.pool.find(d => d.dead);
        const player = getRunnerApp().getEntities({ collisionTypes: [ECollisionType.player] })[0] as Player;
        if (_droplet) {
            _droplet.init(position, pickUp, duration, player);
        } else {
            const droplet = new Droplets(new Sprite(this.sprite.texture), this.container);
            droplet.init(position, pickUp, duration, player);
            this.pool.push(droplet);
        }
    }

    update(): void {
        const livingDroplets = this.pool.filter(d => !d.dead);

        const player = getRunnerApp().getEntities({ collisionTypes: [ECollisionType.player] })[0] as Player;
        for (let index = 0; index < livingDroplets.length; index++) {
            const element = livingDroplets[index];
            if (element.picked) {
                element.update();
            } else {
                const checkCollisionRes = checkCollision(player, element);
                if (checkCollisionRes) {
                    element.picked = true;
                }
            }
        }

    }

}