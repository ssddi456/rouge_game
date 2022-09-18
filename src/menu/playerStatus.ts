import { Container, Graphics, ITextStyle, Text } from "pixi.js";
import { fixed2, formatTime } from "../helper/utils";
import { getRunnerApp } from "../runnerApp";
import { hookRender } from "../sprite_utils";
import { HealthProgressbar } from "../uicomponents/healthProcessbar";
import { Progressbar } from "../uicomponents/processbar";
import { BaseMenu } from "./base";

export class PlayerStatusMenu extends BaseMenu {
    sprite!: Container | null;

    timeNow: Text | undefined;
    timeEnd: Text | undefined;

    healthCurrent: Text | undefined;
    healthMax: Text | undefined;
    healthProgressBar: HealthProgressbar | undefined;

    expCurrent: Text | undefined;
    expMax: Text | undefined;
    expProgress: Progressbar | undefined;
    level: Text | undefined;

    skill: Container | undefined;

    ammoCurrent: Text | undefined;
    ammoMax: Text | undefined;
    ammoProgress: Progressbar | undefined;
    padding = 30;

    init() {
        this.initSprite();
        (this.sprite as any).displayName = 'PlayerStatusMenu';

        this.initTime();
        this.initHealth();
        this.initExp();
        this.initAmmos();
    }

    initTime() {
        const time = this.sprite!.addChild(new Container);
        time.position.set(this.width - this.padding - 12 * 0.45 * 55, this.padding);
        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 55 };
        this.timeNow = time.addChild(new Text('00:00', timeFont));
        const spliter = time.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.timeEnd = time.addChild(new Text('30:00', timeFont));
        this.timeEnd.position.x = 160;
    }

    initHealth() {
        const healthContainer = this.sprite!.addChild(new Container);
        healthContainer.position.set(this.padding, this.height - this.padding - 80 - 20 - 80);

        this.healthProgressBar = this.sprite!.addChild(new HealthProgressbar);
        this.healthProgressBar.height = 80;
        this.healthProgressBar.position.y = this.height - this.padding - 80 - 20 - 80;

        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 32 };
        this.healthCurrent = healthContainer.addChild(new Text('3', timeFont));
        const spliter = healthContainer.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.healthMax = healthContainer.addChild(new Text('3', timeFont));
        this.healthMax.position.x = 160;
    }

    initExp() {
        const expContainer = this.sprite!.addChild(new Container);
        expContainer.position.set(this.padding, this.height - this.padding - 80);

        this.expProgress =  expContainer.addChild(new Progressbar(0xbb1111));
        this.expProgress.position.x = -3;
        this.expProgress.height = 85;
        this.expProgress.width = this.width - 2 * this.padding + 6;

        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 80 };
        this.expCurrent = expContainer.addChild(new Text('0', timeFont));
        const spliter = expContainer.addChild(new Text('/', timeFont));
        spliter.position.x = 140;
        this.expMax = expContainer.addChild(new Text('0', timeFont));
        this.expMax.position.x = 160;

        this.level = expContainer.addChild(new Text('1', timeFont));
        this.level.position.x = 400;
    }

    initAmmos() {
        const ammoContainer = this.sprite!.addChild(new Container);
        ammoContainer.position.set(this.padding, this.height - this.padding - 80 - 20 - 80 - 10 - 40);
        this.ammoProgress = ammoContainer.addChild(new Progressbar(0x332299))
        this.ammoProgress.height = 42;
        this.ammoProgress.width = 120 + 6;
        this.ammoProgress.position.x = -3;

        const timeFont: Partial<ITextStyle> = { fill: 0xffffff, fontSize: 40 };
        this.ammoCurrent = ammoContainer.addChild(new Text('0', timeFont));
        const spliter = ammoContainer.addChild(new Text('/', timeFont));
        spliter.position.x = 40 / 2 * 2.5;
        this.ammoMax = ammoContainer.addChild(new Text('0', timeFont));
        this.ammoMax.position.x = 40 / 2 * 3;
    }

    update() {
        const app = getRunnerApp();
        const player = app.getPlayer();
        const session = app.getSession();

        this.timeNow!.text = formatTime(session.now());

        this.expCurrent!.text = String(session.exp)
        this.expMax!.text = String(session.nextLevelExp)
        this.expProgress!.progress = session.exp / session.nextLevelExp;

        this.level!.text = 'level : ' + String(session.lv);

        this.healthCurrent!.text = String(player.health);
        this.healthMax!.text = String(player.max_health)
        this.healthProgressBar!.current = 1;
        this.healthProgressBar!.max = player.max_health;

        const shootManager = player.shootManager;
        this.ammoCurrent!.text = fixed2(shootManager.currentAmmoCount);
        this.ammoMax!.text = fixed2(shootManager.maxClipAmmoCount);
        if (shootManager.reloading) {
            this.ammoProgress!.progress = shootManager.reloadPercent();
        } else {
            this.ammoProgress!.progress = shootManager.currentAmmoCount / shootManager.maxClipAmmoCount;
        }
    }

    dispose(): void {
        super.dispose()
    }
}