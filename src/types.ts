import { AmmoPool } from "./ammo";
import { Vector } from "./vector"

export interface GameObject {
    start_position: Vector;
    prev_position: Vector;
    dead: boolean;
    update(): void;
}

export enum EFacing {
    top = "top",
    bottom = "bottom",
}

export interface ICollisionable extends GameObject {
    size: number;
    start_position: Vector;
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

export interface Shootable {
    shootCd: number;
    ammoPools: AmmoPool;
}

export interface IObjectPools {
    pools: ICollisionable[]
}