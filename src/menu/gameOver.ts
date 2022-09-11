import { Container, Graphics, Text } from "pixi.js";
import { BaseMenu } from "./base";

export class GameOverMenu extends BaseMenu {
    sprite!: Container | null;

    bgColor = 0x000000;

    init() {
        this.initSprite();

        this.addBg();

        const firstRow = this.addRow(240, 40);
        const rowWidth = this.getRowWidth();
        const title = firstRow.addChild(new Text('Game Over', {
            fill: 0x880000,
            fontWeight: 'bolder',
            fontSize: 240
        }));
        title.anchor.set(0.5, 0.5);
        title.position.set(rowWidth / 2, 120);
        const secondRow = this.addRow(80);
        const subTitle = secondRow.addChild(new Text('press anykey to back to welcome', {
            fill: 0xdddddd,
            fontSize: 80
        }))
        subTitle.anchor.set(0.5, 0.5);
        subTitle.position.set(rowWidth / 2, 80);
    }

}