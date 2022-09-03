import { GameSession } from "../game_session";
import { Player } from "../player";
import { Upgrade } from "./base"

export const ice_mark: Upgrade = {
    title: "ice mark",
    id: "ice_mark",
    description: "apply ice mark stack, the slower the more stack applied",
    iconIdentifier: "100",
    requirements: [],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
    },
    upgradeTree: []
};
export const ice_hurts: Upgrade = {
    title: "ice hurts",
    id: "ice_hurts",
    description: "more hit point, bigger size (all skill)",
    iconIdentifier: "101",
    // requirements: [ice_mark.id],
    requirements: [],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
    },
    upgradeTree: []
};
export const arrow_brancing: Upgrade = {
    title: "arrow brancing",
    id: "arrow brancing",
    description: "the ice arrow will brancing when hit",
    iconIdentifier: "102",
    // requirements: [ice_mark.id],
    requirements: [],
    apply: function (player: Player, session: GameSession): void {
        // throw new Error("Function not implemented.");
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
        // throw new Error("Function not implemented.");
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