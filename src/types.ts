import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, Container, DisplayObject, Sprite } from "pixi.js";
import { AmmoPool } from "./ammo";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { Particle } from "./particle";
import { Player } from "./player";
import { Vector } from "./vector"

export interface GameObject {
    position: Vector;
    prev_position: Vector;
    sprite: DisplayObject;
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
    droplets = "droplets",
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
export interface LeveledObject {
    exp: number;
    lv: number;
    nextLevelExp: number;
    receiveExp(exp: number): void;
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
    emitDroplets(position: Vector, pickUp: () => void, duration: number): void;
    screenPosToWorldPos(position: Vector): Vector;
    pause(): void;
    resume(): void;
    now(): number;

    setApp(a: Application): void;
    setPlayer(_player: Player): void;
    setEnemys(_enemys: EnemyPool): void;
    setDroplets(_droplets: DropletPool): void;
    setCamera(_camera: Camera): void;
    getCamera(): Camera;
    setGameView(_gameView: Container): void;
}

export interface BaseBuffer {
    id: string;
    properties: Record<string, any>;
    dead?: boolean;
    canEffect?: (target: any) => boolean;
    takeEffect?: (target: any, percent: number) => void;
    afterEffect?: (target: any) => boolean;
}

export interface TimerBuffer extends BaseBuffer {
    type: "timer";
    initialTime: number;
    duration: number;
}

export interface CounterBuffer extends BaseBuffer {
    type: "counter";
    currentCount: number;
    maxCount: number;
}

export interface EventBuffer extends BaseBuffer {
    type: "event";
}

export type Buffer = TimerBuffer | CounterBuffer | EventBuffer;

if (module.hot) {
    module.hot.accept();
}
