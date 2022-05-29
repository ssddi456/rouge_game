import { AnimatedSprite, Sprite } from "pixi.js";
import { AmmoPool } from "./ammo";
import { Vector } from "./vector"

export interface GameObject {
    position: Vector;
    prev_position: Vector;

    update(): void;
}

export enum EFacing {
    top = "top",
    bottom = "bottom",
}
export enum ECollisionType {
    none = "none",
    player = "player",
    enemy = "enemy",
}

export interface ICollisionable extends GameObject {
    size: number;
    position: Vector;
    collisison_type: ECollisionType;
}

export interface IMovable extends GameObject {
    prev_direct: Vector;
    direct: Vector;

    prev_facing: EFacing;
    facing: EFacing;

    speed: number;

    updatePosition(): void;
    updateSprite(): void;
}


export interface LivingObject {
    health: number;
    prev_health: number;
    dead: boolean;
    prev_dead: boolean;

    recieveHealth(amount: number): void;
    recieveDamage(damage: number, hitPos: Vector): void;
}

export interface Shootable {
    shootCd: number;
    ammoPools: AmmoPool;
}

export interface IObjectPools {
    pool: ICollisionable[]
}

export interface EntityManager {
    getEntities(options: { collisionTypes: ECollisionType[]}): ICollisionable[];
    emitParticles(position: Vector, animation: AnimatedSprite | Sprite, updateFunc: ((percent:number) => void) | undefined, duration: number): void;
    emitDamageParticles(position: Vector, amount: number): void;
}


export interface Buffer {
    id: string;
    initialTime: number;
    duration: number;
    properties: Record<string, any>;
}

if (module.hot) {
    module.hot.accept();
}
