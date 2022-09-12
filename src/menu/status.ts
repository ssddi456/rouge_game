import { Container, Graphics, Text } from "pixi.js";
import { BaseMenu } from "./base";

export class StatusMenu extends BaseMenu {
    update(): void {}

    sprite!: Container | null;

    paddingHorizontal = 500;
    paddingVertical = 100;
    containerPadding = 50;

    init() {
        console.log('status menu', this.width, this.height);
        this.initSprite();

        this.addBg();
        this.addCancel();

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

}