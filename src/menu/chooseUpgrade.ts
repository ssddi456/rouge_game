import { Container, Graphics, Text } from "pixi.js";

export class ChooseUpgradeMenu {
    sprite!: Container | null;

    paddingHorizontal = 500;
    paddingVertical = 100;
    containerPadding = 50;

    rowCount = 0;

    rowHeight = 30;
    rowMargin = 10;

    constructor(
        public container: Container,
        public width: number,
        public height: number,
    ) {

    }
    
    init() {
        if (!this.sprite) {
            this.sprite = this.container.addChild(new Container());
        } else {
            return;
        }
        const main = this.sprite;
        main.addChild(new Graphics())
            .beginFill(0xffffff, 1)
            .drawRect(0, 0, this.width, this.height)
            .endFill();


    }

    addRow() {
        const main = this.sprite!;
        const containerTop = this.paddingVertical;
        const buttonTop = containerTop + this.containerPadding + this.rowCount * (this.rowMargin + this.rowHeight);

        const row = main.addChild(new Container())
        row.position.x = (this.width - row.width) / 2;
        row.position.y = buttonTop + (this.rowHeight - row.height) / 2;
        this.rowCount++;
        return row;
    }

    dispose() {
        if (this.sprite) {
            this.sprite.parent.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
        this.rowCount = 0;    
    }
}