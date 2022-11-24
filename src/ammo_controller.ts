import { Player } from "./player";
import { Vector } from "./vector";
import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable } from "./types";
import { SequenceBehavior } from "./sequance_behavior";
import { Ammo } from "./ammo";
import { BUFFER_EVENTNAME_DEAD } from "./buffer";

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
            subAmmoSpeed: 5,
            radBetween: Math.PI * 2 / 7,
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
                        initDir.clone().multiplyScalar(subAmmoSpeed / 10),
                        ammo.position.clone().add(initDir.clone().normalize().multiplyScalar(radius)),
                        subAmmoRange * 1.5 * 1000 / 60 / subAmmoSpeed,
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
            if (emitCount % Math.floor(2 * Math.PI / radBetween) !== 0) {
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
            }
            currentDir.rotate(radBetween);
            ammoData.emitCount ++;
        }
    },
};

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
