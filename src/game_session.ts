import { HotClass } from "./helper/class_reloader";
import { showChooseUpgradeMenu } from "./menu/chooseUpgrade";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { LeveledObject } from "./types";
import { Upgrade } from "./upgrades/base";

@HotClass({ module })
export class GameSession implements LeveledObject {
    player!: Player;
    metric:Record<string, number> = {};
    
    upgrades: Upgrade[] = [];
    sessionStart: number = 0;
    timeElipsed: number = 0;

    exp: number = 0;
    lv: number = 1;
    nextLevelExp: number = 10;
    receiveExp(exp: number) {
        this.exp += exp;
        if (this.exp >= this.nextLevelExp) {
            this.lv += 1;
            // 升级动画
            // 选技能
            this.nextLevelExp *= 2;
            console.log('lvup', this.lv);
            showChooseUpgradeMenu();
        }
    }

    constructor() {
        
    }

    init(player: Player) {
        this.player = player;
        this.sessionStart = getRunnerApp().now();
        this.timeElipsed = 0;
        // init values
    }

    metricInc(logName: string, val: number = 1) {
        this.metric[logName] = this.metric[logName] || 0;
        this.metric[logName] += val
    }

    pickUpgrade(upgrade: Upgrade) {
        this.upgrades.push(upgrade);
        upgrade.apply(this.player, this);
    }

    ifSessionSuccess(): boolean {
        return false;
    }

    now(): number {
        return this.timeElipsed;
    }

    ifSessionFailed(): boolean {
        if (this.now() > 30*60e3) {
            return true;
        }
        if (getRunnerApp().getPlayer().health <= 0){
            return true;
        }
        return false;
    }

    update() {
        this.timeElipsed += getRunnerApp().getApp().ticker.elapsedMS;

        if (this.ifSessionSuccess()) {
            getRunnerApp().getLevelManager().enterLevel('gamesuccess');
            return true;
        }
        if (this.ifSessionFailed()) {
            getRunnerApp().getLevelManager().enterLevel('gameover');
            return true;
        }
    }

}
