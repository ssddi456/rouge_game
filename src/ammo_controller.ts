import { Player } from "./player";
import { Vector } from "./vector";
import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable } from "./types";
import { SequenceBehavior } from "./sequance_behavior";
import { Ammo } from "./ammo";
import { BUFFER_EVENTNAME_DEAD } from "./buffer";
import { getBBoxOfShape, getDirectionOutOfShape, rotateShapeFromCenter } from "./shape_utitls";
import { AnimatedSprite, Texture } from "pixi.js";
import { easeInExpo, easeInQuart } from "./tween";

export type AmmoControllerKey = (keyof (typeof AmmoControllerMap));
export interface AmmoController<T extends { last: number}> {
    init(ammo: Ammo, params: Partial<T>): T,
    update(ammo: Ammo, ammoData: T, player?: Player): void,
}

const AmmoControllerDataMap = new WeakMap<Ammo, { last: number }>();

export interface ContinualTrackAmmoData {
    prepare: number,
    origin_speed: number,
    aim: number,
    aimMaxTurnRad: number,

    maxTrace: number,
    maxTurnRad: number,

    last: number,
}

const continual_track: AmmoController<ContinualTrackAmmoData> = {
    init(ammo: Ammo, params: Partial<ContinualTrackAmmoData>) {
        return {
            prepare: 0,
            aim: 0,
            maxTrace: 6 * 60,
            maxTurnRad: Math.PI,
            aimMaxTurnRad: Math.PI,
            origin_speed: ammo.direct.length,
            ...params,
            last: 0,
        };
    },

    update(ammo: Ammo, ammoData: ContinualTrackAmmoData, player: Player = getRunnerApp().getPlayer()) {
        const {
            last,
            prepare,
            aim,
            maxTrace,
            aimMaxTurnRad,
            maxTurnRad,
            origin_speed,
        } = ammoData;
        if (last > maxTrace + prepare + aim) {

        } else if (last > prepare + aim) {
            if (maxTurnRad !== 0 && player as Player) {
                const targetDir = Vector.AB(ammo.position, player.position);
                // howto?
                let turnRad = ammo.direct.clone().radTo2(targetDir);
                if (Math.abs(turnRad) > maxTurnRad) {
                    turnRad = Math.abs(turnRad) / turnRad * maxTurnRad;
                }
                ammo.direct.normalize().rotate(turnRad).multiplyScalar(origin_speed);
            }
        } else if (last == prepare + aim) {
            ammo.direct.normalize().multiplyScalar(origin_speed);
        } else if (last > prepare) {
            if (aimMaxTurnRad !== 0 && player as Player) {
                const targetDir = Vector.AB(ammo.position, player.position);
                // howto?
                let turnRad = ammo.direct.clone().radTo2(targetDir);
                if (Math.abs(turnRad) > aimMaxTurnRad) {
                    turnRad = Math.abs(turnRad) / turnRad * aimMaxTurnRad;
                }
                ammo.direct.normalize().rotate(turnRad).multiplyScalar(0.001);
            }
        } else {
            // do nothing
        }
    },
}

interface TweenSpeedAmmoData {
    last: number,
    maxTick: number,
    initDirect: Vector,
}

const tween_speed: AmmoController<TweenSpeedAmmoData> = {
    init(ammo: Ammo, ammoParams) {

        const params  = {
            ...ammoParams,
            maxTick: Math.floor(ammo.range * 60 / 1000),
            initDirect: ammo.direct.clone(),
            last: 0,
        };

        return params;
    },
    update(ammo: Ammo, ammoData) {
        const percent = ammoData.last / ammoData.maxTick;
        console.log('percent', percent, ammoData.last, ammoData.maxTick, easeInExpo(percent), easeInQuart(percent));
        ammo.direct.setV(ammoData.initDirect.clone().multiplyScalar(5 * easeInQuart(1 - percent)));
    }
};    



export interface IceBallAmmoParams {
    currentDir: Vector,
    subAmmoSpeed: number,
    radBetween: number,
    delayFramePerWave: number,
    subAmmoRange: number,
    subAmmoController?: AmmoControllerKey,
    subAmmoControllerParams?: any,
    radius: number,
    emitCount: number,
    last: number,
}

const ice_ball: AmmoController<IceBallAmmoParams> = {
    init(ammo, params) {
        const ammoData = {
            currentDir: ammo.direct.clone().normalize(),
            subAmmoSpeed: 3,
            radBetween: Math.PI * 2 / 8,
            delayFramePerWave: 3,
            subAmmoRange: 500,
            radius: ammo.size,
            ...params,
            emitCount: 0,
            bustCount: 12,
            last: 0,
        };
        ammo.bufferList.push({
            type: 'event',
            eventName: BUFFER_EVENTNAME_DEAD,
            id: 'ice_ball_bust',
            properties: {},
            takeEffect(ammo: Ammo) {
                const {
                    subAmmoSpeed,
                    subAmmoRange,
                    subAmmoController,
                    subAmmoControllerParams,
                    radius,
                    bustCount,
                } = ammoData;

                const ammoPool = getRunnerApp().getEnemyAmmoPool();
                const initDir = ammo.direct.clone();
                const delta = Math.PI / 6;

                for (let index = 0; index < bustCount; index++) {
                    ammoPool.emit(
                        initDir.clone().multiplyScalar(subAmmoSpeed * 1.5 / 10),
                        ammo.position.clone().add(initDir.clone().normalize().multiplyScalar(radius)),
                        subAmmoRange * 1.5 * 1000 / 60 / (subAmmoSpeed * 1.5),
                        1,
                        ammo.head,
                        null,
                        ammo.hit_effect,
                        subAmmoController,
                        subAmmoControllerParams,
                    );
                    initDir.rotate(delta);
                }
            },
        })
        return ammoData;
    },
    update(ammo, ammoData, player?) {
        const {
            last,
            delayFramePerWave,
            currentDir,
            subAmmoSpeed,
            radBetween,
            subAmmoRange,
            subAmmoController,
            subAmmoControllerParams,
            radius,
            emitCount,
        } = ammoData;

        const ammoPool = getRunnerApp().getEnemyAmmoPool();
        if ((last % delayFramePerWave) == 0) {
            ammoPool.emit(
                currentDir.clone().multiplyScalar(subAmmoSpeed / 10),
                ammo.position.clone().add(currentDir.orthogonal().normalize().multiplyScalar(radius)),
                subAmmoRange * 1000 / 60 / subAmmoSpeed,
                1,
                ammo.head,
                null,
                ammo.hit_effect,
                subAmmoController,
                subAmmoControllerParams,
            );
            currentDir.rotate(radBetween - Math.PI / 48);
            ammoData.emitCount ++;
        }
    },
};

export interface ShapeBombAmmoParams {
    currentDir: Vector,
    subAmmoRange: number,
    subAmmoHead?: AnimatedSprite,
    subAmmoTail?: Texture | null,
    subAmmoHitEffect?: AnimatedSprite,
    shape: Vector[],
    sizeFactor: number,
    time: number,
    last: number,
}

const shape_bomb: AmmoController<ShapeBombAmmoParams> = {
    init(ammo, ammoParams) {
        const params: ShapeBombAmmoParams = {
            currentDir: ammo.direct.clone().normalize(),
            shape: [],
            sizeFactor: 1.5,
            time: 2000,
            subAmmoRange: 500,
            ...ammoParams,
            last: 0,
        };

        const {
            shape,
            sizeFactor,
            time,
            subAmmoHead,
            subAmmoTail,
            subAmmoHitEffect,
        }  = params;

        ammo.bufferList.push({
            type: 'event',
            eventName: BUFFER_EVENTNAME_DEAD,
            id: 'shape_bomb_bust',
            properties: {},
            takeEffect(ammo: Ammo) {
                const ammoPool = getRunnerApp().getEnemyAmmoPool();
                const dirs = getDirectionOutOfShape(shape);
                const bbox = getBBoxOfShape(dirs);

                function emitShape({
                    shape,
                    center,
                    delay = 0,
                    sizeFactor,
                    time = 1000,
                }: { shape: Vector[], center: Vector, sizeFactor: number, delay?: number, time: number, }) {
                    const timeFacktor = 1 / (time / 1000) / 60;
                    for (let index = 0; index < shape.length; index++) {
                        const dir = shape[index];
                        ammoPool.emitDelay(
                            delay,
                            dir.multiplyScalar(timeFacktor * sizeFactor / 10),
                            center,
                            time,
                            1,
                            subAmmoHead || ammo.head,
                            subAmmoTail || null,
                            subAmmoHitEffect || ammo.hit_effect,
                            'tween_speed'
                        );
                    }
                }

                [
                    { size: 1, pos: new Vector(0, 0) },
                    { size: 0.8, pos: new Vector(bbox.width * 0.7, bbox.height * - 0.6) },
                    { size: 0.8, pos: new Vector(bbox.width * 0.6, bbox.height * 0.7) },
                    { size: 0.5, pos: new Vector(bbox.width * 0.1, bbox.height * - 1.3) },
                    { size: 0.5, pos: new Vector(bbox.width * - 0.5, bbox.height * -0.7) },
                    { size: 0.3, pos: new Vector(bbox.width * 0.1, bbox.height * 1.2) },
                    { size: 0.2, pos: new Vector(bbox.width * 1.1, bbox.height * 0.2) },
                    { size: 0.2, pos: new Vector(bbox.width * -0.5, bbox.height * 0.6) },
                ].forEach(({ size, pos }, idx) => {

                    emitShape({
                        shape: dirs.map(dir => dir.clone()),
                        center: ammo.position.clone().add(pos),
                        sizeFactor: size,
                        time: time * (1 - 0.13 * idx),
                        delay: time * 0.1 * idx,
                    });
                });

            }
        });

        return params;
    },

    update(ammo: Ammo, ammoData, player: Player = getRunnerApp().getPlayer()) {
        // just do nothing;
    }
};


export interface MoveByAmmoParams {
    last: number,
}

export const AmmoControllerMap: Record<string, AmmoController<any>> = {
    stub: {
        init(enemy) {
            return {
            };
        },

        update(ammo: Ammo, ammoData, player: Player = getRunnerApp().getPlayer()) {
            // just do nothing;
        }
    },
    continual_track,

    ice_ball,

    shape_bomb,

    tween_speed,
};


export const ammoControllerInit = (ammo: Ammo, params?: any) => {
    if (ammo.controller) {
        const data = AmmoControllerMap[ammo.controller].init(ammo, params);
        AmmoControllerDataMap.set(ammo, data);
    }
};

export const ammoControllerUpdate = (ammo: Ammo) => {
    if (ammo.controller) {
        const data = AmmoControllerDataMap.get(ammo)!;
        AmmoControllerMap[ammo.controller].update(ammo, data);
        data.last += 1;
    }
};

export const ammoControllerDispose = (ammo: Ammo) => {
    if (ammo.controller) {
        const data = AmmoControllerDataMap.get(ammo);

        AmmoControllerDataMap.delete(ammo);
        ammo.controller = undefined;
    }
};
