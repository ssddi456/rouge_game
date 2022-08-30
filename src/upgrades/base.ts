import { Sprite } from "pixi.js";
import { GameSession } from "../game_session";
import { Player } from "../player";
import { health } from "./health";
import { ice_arrow } from "./icon_arrow";

export interface Upgrade {
    title: string;
    id: string;
    description: string;
    icon?: Sprite;
    upgradeTree: Upgrade[];
    iconIdentifier: any;
    requirements: string[];
    apply( player: Player, session: GameSession): void;
}


export const allUpgrades : Upgrade[] = [
    ...health,
    ...ice_arrow
];

export const upgradeManager = {
    pickableUpgrades(session: GameSession, pickCount = 4) {
        const currentUpgrades: Upgrade[] = session.upgrades;
        const currentUpgradesIds = currentUpgrades.reduce((sum, cur) => {
            sum[cur.id] = sum[cur.id] || 0;
            sum[cur.id] += 1;
            return sum;
        }, {} as Record<string, number>);
        const ret: Upgrade[] = [];
        
        for (let index = 0; index < allUpgrades.length; index++) {
            const element = allUpgrades[index];
            if (!currentUpgradesIds[element.id]) {
                if (!element.requirements.length) {
                    Math.random() > 0.5 ? ret.push(element) : ret.unshift(element);
                } else if(element.requirements.some( x => currentUpgradesIds[x])) {
                    Math.random() > 0.5 ? ret.push(element) : ret.unshift(element);
                }
            }
        }

        return ret.slice(0, pickCount);
    }
};

export function initUpgradeSprites(spriteMap: Record<string, Sprite>) {
    for (let index = 0; index < allUpgrades.length; index++) {
        const element = allUpgrades[index];
        element.icon = spriteMap[element.iconIdentifier];
    }
}