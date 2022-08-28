import { HotClass } from "./helper/class_reloader";
import { Player } from "./player";
import { Upgrade } from "./upgrades/base";

@HotClass({ module })
export class GameSession {
    player!: Player;
    metric:Record<string, number> = {};
    
    upgrades: Upgrade[] = [];

    constructor() {
        
    }

    init(player: Player) {
        this.player = player;
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
        return false;
    }

    update() {
        if (this.ifSessionSuccess()) {
            return true;
        }
        if (this.ifSessionFailed()) {
            return true;
        }
    }

}