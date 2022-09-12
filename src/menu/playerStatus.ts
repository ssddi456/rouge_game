import { Container, Graphics, ITextStyle, Text } from "pixi.js";
import { formatTime } from "../helper/utils";
import { getRunnerApp } from "../runnerApp";
import { hookRender } from "../sprite_utils";
import { BaseMenu } from "./base";

export class PlayerStatusMenu extends BaseMenu {
    sprite!: Container | null;

    timeNow: Text | undefined;
    timeEnd: Text | undefined;

    healthCurrent: Text | undefined;
    healthMax: Text | undefined;

    expCurrent: Text | undefined;
    expMax: Text | undefined;
    level: Text | undefined;

    skill: Container | undefined;

    init() {
        this.initSprite();
        (this.sprite as any).displayName = 'PlayerStatusMenu';

        this.initTime();
        this.initHealth();
        this.initExp();
    }

    initTime() {
        const time = this.sprite!.addChild(new Container);
        time.position.set(this.width - 300, 10);
        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 55 };
        this.timeNow = time.addChild(new Text('00:00', timeFont));
        const spliter = time.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.timeEnd = time.addChild(new Text('30:00', timeFont));
        this.timeEnd.position.x = 160;
    }

    initHealth() {
        const healthContainer = this.sprite!.addChild(new Container);
        healthContainer.position.set(10, this.height - 300);
        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 80 };
        this.healthCurrent = healthContainer.addChild(new Text('3', timeFont));
        const spliter = healthContainer.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.healthMax = healthContainer.addChild(new Text('3', timeFont));
        this.healthMax.position.x = 160;
    }

    initExp() {
        const expContainer = this.sprite!.addChild(new Container);
        expContainer.position.set(10, this.height - 200);
        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 80 };
        this.expCurrent = expContainer.addChild(new Text('0', timeFont));
        const spliter = expContainer.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.expMax = expContainer.addChild(new Text('0', timeFont));
        this.expMax.position.x = 160;

        this.level = expContainer.addChild(new Text('1', timeFont));
        this.level.position.x = 400;
    }

    update() {
        const app = getRunnerApp();
        const player = app.getPlayer();
        const session = app.getSession();

        this.timeNow!.text = formatTime(session.now());

        this.expCurrent!.text = String(player.exp)
        this.expMax!.text = String(player.nextLevelExp)

        this.level!.text = String(player.lv);

        console.log('this.sprite', this.sprite, this.sprite?.parent);
        
    }

    dispose(): void {
        super.dispose()
    }
}