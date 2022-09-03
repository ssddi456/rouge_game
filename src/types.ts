import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, Container, DisplayObject, Sprite } from "pixi.js";
import { AmmoPool } from "./ammo";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { GameSession } from "./game_session";
import { createGroups } from "./groups";
import { LevelManager } from "./level";
import { Particle } from "./particle";
import { Player } from "./player";
import { Vector } from "./vector"

export interface Updatable {
    update(...args: any[]): void;
}

export interface Disposible {
    dispose(): void
}

export abstract class UpdatableObject implements Updatable, Disposible {
    updations: Updatable[] = [];
    dispositions: Disposible[] = [];
    disposed = false;

    cacheProperty?(): void;

    addChildren( obj: Updatable & Disposible ) {
        this.updations.push(obj);
        this.dispositions.push(obj);
    }

    update() {
        this.cacheProperty?.();

        for (let index = 0; index < this.updations.length; index++) {
            const element = this.updations[index];
            element.update();
        }
    }

    dispose() {
        this.disposed = true;
        for (let index = 0; index < this.dispositions.length; index++) {
            const element = this.dispositions[index];
            element.dispose();
        }
        this.updations.length = 0;
        this.dispositions.length = 0;
    }
}

export interface GameObject {
    position: Vector;
    prev_position: Vector;
    sprite: DisplayObject;
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

export interface GetResourceFunc {
    (): Record<string, Record<string, DisplayObject>>;
}
export interface EntityManager {
    getEntities(options: { collisionTypes: ECollisionType[]}): ICollisionable[];

    emitParticles(position: Vector, animation: AnimatedSprite | Sprite, updateFunc: ((percent:number) => void) | undefined, duration: number): void;
    emitTextParticles(position: Vector, sprite: Sprite, updateFunc: ((percent: number) => void) | undefined, duration: number, id?: string): void;
    emitDamageParticles(position: Vector, amount: number): void;

    getPariticles(): Particle[];
    getTextParticles(): Particle[];
    updateParticles(): void;

    emitDroplets(position: Vector, pickUp: () => void, duration: number): void;
    emitAOE(position: Vector, aoe: AreaOfEffect): void;
    updateAOE(): void;

    pause(): void;
    resume(): void;
    now(): number;

    setApp(a: Application): void;
    getApp(): Application;

    setPlayer(_player: Player): void;

    setEnemys(_enemys: EnemyPool): void;

    setDroplets(_droplets: DropletPool): void;

    setCamera(_camera: Camera): void;
    getCamera(): Camera;

    getMouseWorldPos(): Vector;
    screenPosToWorldPos(position: Vector): Vector;

    setGameView(_gameView: Container): void;
    getGameView(): Container;
    disposeGameView(): void;

    getLevelManager(): LevelManager;
    setLevelManager(_levelManager: LevelManager): void;

    getGetResourceMap(): GetResourceFunc;
    setGetResourceMap(getResources: GetResourceFunc): void;

    getGroups(): ReturnType<typeof createGroups>;
    setGroups(groups: ReturnType<typeof createGroups>): void;

    getSession(): GameSession;
    setSession(session: GameSession): void;
}

export enum AreaOfEffectType {
    oneTimePropertyChangeApply,
    bufferApply,
}
export interface AreaOfEffect extends ICollisionable, GameObject {
    type: AreaOfEffectType
    enabled: boolean;
    dead: boolean;
    hitType: ECollisionType;
    update: () => void;
    apply: (target: ICollisionable) => void;
}

export interface BaseBuffer {
    id: string;
    properties: Record<string, any>;
    dead?: boolean;
    canEffect?: (target: any) => boolean;
    takeEffect?: (target: any, percent: number) => void;
    afterEffect?: (target: any) => void;
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
