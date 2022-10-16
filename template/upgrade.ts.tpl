import { addEventBuffer, BUFFER_EVENTNAME_HITTED } from "../buffer";
import { GameSession } from "../game_session";
import { Player } from "../player";
import { Upgrade } from "./base"

export const strong: Upgrade = {
    title: "strong",
    id: "strong",
    description: "more hit point",
    iconIdentifier: "52",
    requirements: [],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
    }
};
export const bigboy: Upgrade = {
    title: "bigboy",
    id: "bigboy",
    description: "more hit point, bigger size (all skill)",
    iconIdentifier: "53",
    requirements: [strong.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
    }
};
export const berserker: Upgrade = {
    title: "berserker",
    id: "berserker",
    description: "once hitted, increase shoot and reload speed",
    iconIdentifier: "54",
    requirements: [strong.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        //
    }
};
export const troll: Upgrade = {
    title: "troll",
    id: "troll",
    description: "recover every minute",
    iconIdentifier: "55",
    requirements: [bigboy.id, berserker.id],
    upgradeTree: [],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
    }
};

export const health = [
    strong,
    bigboy,
    berserker,
    troll
];

health.map(x => x.upgradeTree = health);