import { AnimatedSprite } from "pixi.js";
import { Ammo, DamageInfo } from "../ammo";
import { createExplosion } from "../aoe";
import { findEnemy } from "../behavior";
import { applyIceMark, BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HIT, hasIceMark } from "../buffer";
import { Enemy } from "../enemy";
import { GameSession } from "../game_session";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { EventBuffer } from "../types";
import { Upgrade } from "./base"

const ID_APPLY_ICE_SLOW = "apply_ice_slow";
function getAmmoIceSlow(): EventBuffer {
    return {
        type: 'event',
        eventName: BUFFER_EVENTNAME_HIT,
        takeEffect(ammo: Ammo, percent: number, target: Enemy) {
            if (!hasIceMark(target)) {
                applyIceMark(target);
                target.speed *= 0.8;
            }
        },
        id: ID_APPLY_ICE_SLOW,
        properties: {}
    };
}
export const ice_mark: Upgrade = {
    title: "ice mark",
    id: "ice_mark",
    description: "apply ice mark, hitted enemy will be slowed",
    iconIdentifier: "100",
    requirements: [],
    apply: function (player: Player, session: GameSession): void {
        player.shootManager.hiteffects.push(getAmmoIceSlow());
    },
    upgradeTree: []
};

export const ice_hurts: Upgrade = {
    title: "ice hurts",
    id: "ice_hurts",
    description: "deal more damage, if target have ice_slow, deal a lot more",
    iconIdentifier: "101",
    requirements: [ice_mark.id],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
        player.shootManager.damage *= 1.5;
        const index_id_apply_ice_slow = player.shootManager.hiteffects.findIndex(x => x.id == ID_APPLY_ICE_SLOW);
        player.shootManager.hiteffects.splice(index_id_apply_ice_slow, 0, {
            type: 'event',
            eventName: BUFFER_EVENTNAME_HIT,
            takeEffect(ammo: Ammo, percet, target: Enemy, damageInfo: DamageInfo) {
                if (hasIceMark(target)) {
                    damageInfo.damage *= 1.5;
                }
            },
            id: "ice_slow_hurts",
            properties: {}
        });
    },
    upgradeTree: []
};

export const arrow_brancing: Upgrade = {
    title: "arrow brancing",
    id: "arrow brancing",
    description: "the ice arrow will brancing small pieces when hit, slow the enemies around, upto 2 target",
    iconIdentifier: "102",
    requirements: [ice_mark.id],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");

        player.shootManager.hiteffects.push({
            eventName: BUFFER_EVENTNAME_HIT,
            type: 'event',
            id: 'ice arrow brancing',
            properties: {},

            async takeEffect(ammo, percent, enemy: Enemy,) {
                console.log('trigger ice arrow brancing');
                const resource = getRunnerApp().getGetResourceMap()();
                const currentCenter = enemy.position.clone();
                const branchingTarget = findEnemy(enemy.position.clone(), 300, 1, (target) => target !== enemy);
                if (branchingTarget.length) {
                    for (let index = 0; index < branchingTarget.length; index++) {
                        const element = branchingTarget[index];
                        const ammo = player.shootManager.ammoPool.emit(
                            element.position.clone().sub(currentCenter).normalize(),
                            currentCenter,
                            3000,
                            10,
                            resource.iceAnimateMap.projectile as AnimatedSprite,
                            null,
                            resource.ice_hitAnimateMap.hit_effect as AnimatedSprite,
                        );
                        ammo.max_piecing_count = 0;
                        ammo.max_bouncing_count = 0;
                        ammo.current_hitting_items = [enemy];
                        ammo.bufferList.push(getAmmoIceSlow());
                    }
                }
            },
        })
    },
    upgradeTree: []
};

export const dead_explosion: Upgrade = {
    title: "dead explosion",
    id: "dead_explosion",
    description: "explosion when killed with ice mark, based on its max hitpoints",
    iconIdentifier: "103",
    requirements: [ice_hurts.id, arrow_brancing.id],
    apply: function (player: Player, session: GameSession): void {
        player.shootManager.hiteffects.push({
            type: 'event',
            eventName: BUFFER_EVENTNAME_HIT,
            takeEffect(ammo, percent, target: Enemy) {
                target.bufferList.push({
                    type: 'event',
                    eventName: BUFFER_EVENTNAME_DEAD,
                    takeEffect(target: Enemy) {
                        getRunnerApp().emitAOE(target.position, createExplosion({ radius: 90, damage: target.max_health }))
                    },
                    id: 'ice_dead_explosion',
                    properties: {}
                })
            },
            id: "apply_ice_dead_explosion",
            properties: {}
        });
    },
    upgradeTree: []
};

export const ice_arrow = [
    ice_mark,
    ice_hurts,
    arrow_brancing,
    dead_explosion
];
ice_arrow.map(x => x.upgradeTree = ice_arrow);
