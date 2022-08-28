import { Container, Graphics, Sprite, Text } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { BaseMenu } from "./base";

export class UpgradeMenu extends BaseMenu {
    sprite!: Container | null;

    paddingHorizontal = 500;
    paddingVertical = 100;
    containerPadding = 50;

    init() {
        if (!this.sprite) {
            this.sprite = this.container.addChild(new Container());
        } else {
            return;
        }

        this.addBg();
        this.addCancel();
        this.addUpgrades();

    }


    addUpgrades() {
        const currentUpgrades = getRunnerApp().getSession().upgrades;
        
        const upgradesPerRow = 6;
        const rows = Math.ceil(currentUpgrades.length / upgradesPerRow);
        for (let index = 0; index < rows; index++) {
            const row = this.addRow();
            for (let jndex = 0; jndex < upgradesPerRow; jndex++) {
                const u_index = jndex + index * upgradesPerRow;
                const upgrade = currentUpgrades[u_index];
                if (upgrade) {
                    const iconPlaceholder = row.addChild(new Container())
                    iconPlaceholder.position.x = jndex * (30 + 10)
                    iconPlaceholder
                        .addChild(upgrade.icon!)
                }
            }
        }
    }

}