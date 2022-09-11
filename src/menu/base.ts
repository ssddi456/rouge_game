import { Container, Graphics, Text } from "pixi.js";
import { getRunnerApp } from "../runnerApp";

export abstract class BaseMenu {
    sprite!: Container | null;

    paddingHorizontal = 500;
    paddingVertical = 100;
    containerPadding = 50;

    rowsHeight: number[] = [];

    rowHeight = 30;
    rowMargin = 10;

    bgColor = 0xffffff;
    bgAlpha = 1;

    constructor(
        public container: Container,
        public width: number,
        public height: number,
    ) {

    }

    init(...args: any[]) {
        this.initSprite();
        this.addBg();
        this.addCancel();
    }

    initSprite() {
        if (!this.sprite) {
            this.sprite = this.container.addChild(new Container());
            const groups = getRunnerApp().getGroups();
            if (groups) {
                this.sprite.parentGroup = groups.uiGroup;
            }

            this.rowsHeight = [];
        } else {
            return;
        }
    }

    addBg() {
        this.sprite!.addChild(new Graphics())
            .beginFill(this.bgColor, this.bgAlpha)
            .drawRect(0, 0, this.width, this.height)
            .endFill();
    }

    addCancel() {
        const cancel = this.sprite!.addChild(new Container())
        cancel.position.x = this.width - this.paddingHorizontal - 24 - 20;
        cancel.position.y = this.paddingVertical + 20;

        console.log('cancel', cancel.position);

        cancel.interactive = true;
        cancel.on('click', () => {
            this.dispose();
        });
        cancel.addChild(new Graphics())
            .beginFill(0xdddddd)
            .drawRoundedRect(-2, -2, 20, 20, 2)
            .endFill()
            .lineStyle({
                color: 0x000000,
                width: 4
            })
            .moveTo(0, 0).lineTo(20, 20)
            .moveTo(0, 20).lineTo(20, 0)
    }

    addRow(rowHeight = this.rowHeight, rowMargin = this.rowMargin) {
        const main = this.sprite!;
        const containerTop = this.paddingVertical;
        const buttonTop = containerTop + this.containerPadding + this.rowsHeight.reduce((sum, pre) => sum + pre, 0);

        const row = main.addChild(new Container())
        row.position.x = this.paddingHorizontal;
        row.position.y = buttonTop + (this.rowHeight - row.height) / 2;
        this.rowsHeight.push(rowHeight + rowMargin);
        return row;
    }

    getRowWidth() {
        return this.width - 2 * this.paddingHorizontal
    }

    addButton(parent: Container, text: string, options: Partial<{ height: number }>) {
        const cOptioons = {
            height: 20,
            ...options,
        };

        const container = parent.addChild(new Container());
        container.addChild(new Graphics())
            .beginFill(0xdddddd)
            .drawRoundedRect(-2, -2, 120, cOptioons.height, 2)
            .endFill();
        const textEl = container.addChild(new Text(text));
        textEl.anchor.set(0.5, 0.5)
        textEl.position.set(60, cOptioons.height / 2);
        return container;
    }

    dispose() {
        if (this.sprite) {
            this.sprite.parent.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
        this.rowsHeight = [];
    }
}