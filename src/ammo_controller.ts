import { Player } from "./player";
import { Vector } from "./vector";
import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable } from "./types";
import { SequenceBehavior } from "./sequance_behavior";
import { Ammo } from "./ammo";

export type AmmoControllerKey = (keyof (typeof AmmoControllerMap));
export interface AmmoController<T extends Updatable & Disposible> {
    init(ammo: Ammo, params: any): T,
    update(ammo: Ammo, ammoData: T, player?: Player): void,
}

const AmmoControllerDataMap = new WeakMap();

export interface ContinualTrackAmmoData {
    prepare: number,
    maxTrace: number,
    maxTurnRad: number,
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
    continual_track: {
        init(enemy, params: Partial<ContinualTrackAmmoData>) {
            return {
                prepare: 0,
                maxTrace: 1000000,
                maxTurnRad: Math.PI,
                ...params,
                last: 0,
            };
        },

        update(ammo: Ammo, ammoData: ContinualTrackAmmoData, player: Player = getRunnerApp().getPlayer()) {
            const {
                last,
                prepare,
                maxTrace,
                maxTurnRad,
            } = ammoData;
            if (last > maxTrace + prepare) {
                
            } else if (last > prepare) {
                if (player as Player) {
                    const targetRad = Vector.AB(ammo.position, player.position).normalize();
                    // howto?
                    let turnRad = ammo.direct.clone().normalize().radTo2(targetRad);
                    if (Math.abs(turnRad) > maxTurnRad) {
                        turnRad = Math.abs(turnRad) / turnRad * maxTurnRad;
                    }
                    ammo.direct.rotate(turnRad);
                }
            } else {
                // do nothing
            }
            ammoData.last ++;
        },
    },

};


export const ammoControllerInit = (ammo: Ammo, params?: any) => {
    if (ammo.controller) {
        const data = AmmoControllerMap[ammo.controller].init(ammo, params);
        AmmoControllerDataMap.set(ammo, data);
    }
};

export const ammoControllerUpdate = (ammo: Ammo) => {
    if (ammo.controller) {
        const data = AmmoControllerDataMap.get(ammo);
        AmmoControllerMap[ammo.controller].update(ammo, data);
    }
};

export const ammoControllerDispose = (ammo: Ammo) => {
    if (ammo.controller) {
        const data = AmmoControllerDataMap.get(ammo);

        AmmoControllerDataMap.delete(ammo);
        ammo.controller = undefined;
    }
};
