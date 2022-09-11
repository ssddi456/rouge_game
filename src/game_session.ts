import { HotClass } from "./helper/class_reloader";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { Upgrade } from "./upgrades/base";

@HotClass({ module })
export class GameSession {
    player!: Player;
    metric:Record<string, number> = {};
    
    upgrades: Upgrade[] = [];
    sessionStart: number = 0;
    constructor() {
        
    }

    init(player: Player) {
        this.player = player;
        this.sessionStart = getRunnerApp().now();
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

    ifSessionFailed(): boolean {
        const app = getRunnerApp();
        if (app.now() - this.sessionStart > 30e3) {
            return true;
        }
        return false;
    }

    update() {
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