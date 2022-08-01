import { Container, Graphics, Text } from "pixi.js";

export class StatusMenu {
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
        
        const status = [
            'health',

            'ammo power',
            'ammo count',
            'ammo spread',
            'ammo speed',
            'fire rate',
            'recharge rate',

            'summoned ammo power',
            'summoned fire rate',

            'aura power',
            'aura fire rate',
            'aura range',
        ];

        const cancel = main.addChild(new Container())
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

        for (let index = 0; index < status.length; index++) {
            const element = status[index];
            
            const row = this.addRow();

            const label = row.addChild(new Text(element + ' : ', {
                fill: 0x000000
            }));
            label.position.x = - label.width;
            const wrapper = row.addChild(new Text("1", {
                fill: 0x000000
            }));
        }

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