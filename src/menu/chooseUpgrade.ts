import { Container, Graphics, Sprite, Text } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { Upgrade, upgradeManager } from "../upgrades/base";
import { BaseMenu } from "./base";

export class ChooseUpgradeMenu extends BaseMenu {
    paddingHorizontal = 200;
    paddingVertical = 100;
    containerPadding = 50;

    bgColor = 0x333333;
    bgAlpha = 0.8;

    currentChoosedUpgrade!: Upgrade;
    detailTitle!: Text;
    detailDesc!: Text;
    detailTree!: Container;
    confirmed: (() => void) | undefined = undefined;

    init(confirmed: () => void) {
        super.init();
        this.confirmed = confirmed;
        this.addBorder();
        this.addChoosable();
        this.addDetail();
        this.addConfirm();
    }

    addBorder() {
        const left = this.paddingHorizontal;
        const top = this.paddingVertical
        this.sprite?.addChild(new Graphics())
            .beginFill(0x333131, 0.8)
            .drawRect(0, 0, this.width - 2 * left, 5 * this.rowHeight + 2 * this.rowMargin + 2 * this.containerPadding)
            .endFill()
            .position.set(left, top)

        console.log(this.width);
    }

    addChoosable() {
        
        const row = this.addRow();
        const session = getRunnerApp().getSession();
        const choosableUpgrades = upgradeManager.pickableUpgrades(session, 4);

        for (let index = 0; index < choosableUpgrades.length; index++) {
            const element = choosableUpgrades[index];
            const item = row.addChild(new Container());

            item.position.set(index * row.width / 4, 0);
            item.addChild(element.icon!);

            item.interactive = true;
            item.on('click', () => {
                this.updateDetail(element);
            });
            console.log(item);
        }
    }

    addDetail() {
        const row = this.addRow(this.rowHeight * 3);
        const desc = row.addChild(new Container());

        const tree = row.addChild(new Container());
        tree.position.x = row.width / 2;

        this.detailTitle = desc.addChild(new Text(''));
        this.detailDesc = desc.addChild(new Text(''));
        this.detailDesc.position.y = 40;
        this.detailTree = tree;
    }
    
    updateDetail(item: Upgrade) {
        this.currentChoosedUpgrade = item;
        this.detailTitle.text = item.title;
        this.detailDesc.text = item.description;
        this.detailTree.removeChildren();
        this.detailTree.addChild(item.icon!)
            .position.set(this.width / 4, 0);
        this.detailTree.addChild(item.icon!)
            .position.set(0, this.rowHeight);
        this.detailTree.addChild(item.icon!)
            .position.set(this.width / 4  - 20, this.rowHeight);
        this.detailTree.addChild(item.icon!)
            .position.set(this.width / 4, this.rowHeight*2);
    }

    addConfirm() {
        const row = this.addRow();

        const btn = this.addButton(row, 'Confirm', {});
        btn.interactive = true;
        btn.addListener('click', () => {
            if (!this.currentChoosedUpgrade) {
                return;
            }
            const session = getRunnerApp().getSession();
            session.pickUpgrade(this.currentChoosedUpgrade);
            this.confirmed?.();
            this.dispose();
        });
    }

    dispose(): void {
        super.dispose();
        this.confirmed = undefined;
        (this.detailTitle as any) = null;
        (this.detailDesc as any) = null;
        (this.detailTree as any) = null;
    }
}

export function withChooseUpgradeMenuBtn(container: Container) {
    const switchButton = container.addChild(new Graphics())
        .beginFill(0x666666)
        .drawRoundedRect(10, 10, 50, 50, 3)
        .endFill()
        .lineStyle({
            color: 0xffffff,
            width: 4
        })
        .moveTo(10 + 5, 15 + 5,).lineTo(10 + 50 - 5, 15 + 5,)
        .moveTo(10 + 5, 30 + 5,).lineTo(10 + 50 - 5, 30 + 5,)
        .moveTo(10 + 5, 45 + 5,).lineTo(10 + 50 - 5, 45 + 5,);

    switchButton.interactive = true;
    switchButton.on('click', () => {
        const app = getRunnerApp();
        const chooseUpgradeMenu = new ChooseUpgradeMenu(container, (container as any).worldWidth, (container as any).worldHeight);
        const levelManager = app.getLevelManager();
        levelManager.levelPause();
        chooseUpgradeMenu.init(() => {
            levelManager.levelResume();
        });
    });

    return switchButton;
}