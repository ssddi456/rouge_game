import { Container, Graphics, ObservablePoint, Sprite, Text } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { cloneSprite } from "../sprite_utils";
import { Upgrade, upgradeManager } from "../upgrades/base";
import { BaseMenu } from "./base";

export class ChooseUpgradeMenu extends BaseMenu {
    paddingHorizontal = 200;
    paddingVertical = 100;
    containerPadding = 50;

    bgColor = 0x333333;
    bgAlpha = 0.8;

    rowMargin = 30;

    currentChoosedUpgrade!: Upgrade;
    detailTitle!: Text;
    detailDesc!: Text;
    detailTree!: Container;
    confirmed: (() => void) | undefined = undefined;

    init(confirmed: () => void) {
        this.initSprite();
        this.addBg();
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
            .drawRect(0, 0, this.getRowWidth(), 3 * 64 + 2 * this.rowHeight + 2 * this.rowMargin + 2 * this.containerPadding)
            .endFill()
            .position.set(left, top)

        console.log(this.width);
    }

    getRowWidth() {
        return this.width - 2 * this.paddingHorizontal
    }

    addChoosable() {

        const row = this.addRow(64);
        const session = getRunnerApp().getSession();
        const choosableUpgrades = upgradeManager.pickableUpgrades(session, 4);
        const rowWidth = this.getRowWidth() - 64 * 2;
        for (let index = 0; index < choosableUpgrades.length; index++) {
            const element = choosableUpgrades[index];
            const item = row.addChild(new Container());

            item.position.set((index + 0.8) * rowWidth / 4, 0);
            item.addChild(upgradeIcon(element.icon!, { size: 1 }));
            item.interactive = true;
            item.on('click', () => {
                this.updateDetail(element);
            });
            console.log(item);
        }
    }

    addDetail() {
        const row = this.addRow(64 * 3);
        const desc = row.addChild(new Container());
        desc.position.x = 200;
        const tree = row.addChild(new Container());
        tree.position.x = this.getRowWidth() - 64 * 1.5;
        tree.position.y = - 10 - 64;

        this.detailTitle = desc.addChild(new Text('', { fontSize: 40, fill: 0xffffff, fontWeight: 'bolder' }));
        this.detailDesc = desc.addChild(new Text('', { fontSize: 28, fill: 0xffffff }));
        this.detailDesc.position.y = 40;
        this.detailTree = tree;
    }

    updateDetail(item: Upgrade) {
        this.currentChoosedUpgrade = item;
        this.detailTitle.text = item.title;
        this.detailDesc.text = item.description;
        this.detailTree.removeChildren();
        const icon1 = this.detailTree.addChild(upgradeIcon(item.upgradeTree?.[0].icon!));
        icon1.position.set(64, 0);
        const icon2 = this.detailTree.addChild(upgradeIcon(item.upgradeTree?.[1].icon!));
        icon2.position.set(64 - 64, 64);
        const icon3 = this.detailTree.addChild(upgradeIcon(item.upgradeTree?.[2].icon!));
        icon3.position.set(64 + 64, 64);
        const icon4 = this.detailTree.addChild(upgradeIcon(item.upgradeTree?.[3].icon!));
        icon4.position.set(64, 64 * 2);
    }

    addConfirm() {
        const row = this.addRow();

        const btn = this.addButton(row, 'Confirm', { height: 30 });
        btn.position.x = this.getRowWidth() / 2;
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
    const click = () => {
        const app = getRunnerApp();
        const chooseUpgradeMenu = new ChooseUpgradeMenu(container, (container as any).worldWidth, (container as any).worldHeight);
        const levelManager = app.getLevelManager();
        levelManager.levelPause();
        chooseUpgradeMenu.init(() => {
            levelManager.levelResume();
        });
    };
    switchButton.on('click', click);
    click();
    return switchButton;
}

export function upgradeIcon(baseIcon: Sprite, options: { size?: number, selected?: boolean } = {}) {
    const resources = getRunnerApp().getGetResourceMap()();
    const ret = new Container();
    ret.addChild(cloneSprite(resources.powerupPanelSpriteMap[options.size ? 3 : 1] as Sprite));
    const border = ret.addChild(cloneSprite(resources.powerupPanelSpriteMap[options.size ? 2 : 0] as Sprite));
    if (!options.selected) {
        border.alpha = 0.5;
    }
    const icon = ret.addChild(cloneSprite(baseIcon));
    const factor = options.size ? 1.5 : 1;
    icon.scale.set(factor, factor);
    ret.scale.set(1.5, 1.5);
    return ret;
}