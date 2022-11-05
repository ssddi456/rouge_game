import { AnimatedSprite } from "pixi.js";
import { WormlingBehavior } from "../behavior";
import { addEventBuffer, BUFFER_EVENTNAME_HITTED } from "../buffer";
import { CountDown } from "../countdown";
import { Wormling } from "../element/wormling";
import { GameSession } from "../game_session";
import { randomPosAround } from "../helper/utils";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { AllianceShooter, Shooter } from "../skills/shooter";
import { TimedSummoned } from "../timed_life";
import { Upgrade } from "./base"

export const pet: Upgrade = {
    title: "pet",
    id: "pet",
    description: "generate pet over time",
    iconIdentifier: "12",
    requirements: [],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
        const spawnWormling = player.addChildren(new CountDown(5e3, () => {
            const app = getRunnerApp();
            const resource = app.getGetResourceMap()();

            const wormling = new TimedSummoned(
                15e3,
                randomPosAround(player.position, 300),
                new Wormling,
                new WormlingBehavior(
                    'enemy',
                    [
                        new AllianceShooter(false, 600, true,
                            resource.iceAnimateMap.projectile,
                            null,
                            resource.ice_hitAnimateMap.hit_effect,
                        )
                    ],
                    600)
                );
            
            app.addMisc(wormling);
        }));
    }
};
export const more_pet: Upgrade = {
    title: "more pet",
    id: "more_pet",
    description: "more pet",
    iconIdentifier: "13",
    requirements: [pet.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
    }
};
export const pet_shoot_faster: Upgrade = {
    title: "pet shoot faster",
    id: "pet_shoot_faster",
    description: "pet shoot faster",
    iconIdentifier: "14",
    requirements: [pet.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
    }
};
export const pet_damage_aoe: Upgrade = {
    title: "pet damage aoe",
    id: "pet_damage_aoe",
    description: "pet damage aoe",
    iconIdentifier: "15",
    requirements: [more_pet.id, pet_shoot_faster.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
    }
};

export const pets = [
    pet,
    more_pet,
    pet_shoot_faster,
    pet_damage_aoe
];

pets.map(x => x.upgradeTree = pets);