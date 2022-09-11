import { Container, Application, TilingSprite } from "pixi.js";
import { Level } from "../level";
import { HotClass } from "../helper/class_reloader";
import { Group } from "@pixi/layers";
import { Camera } from "../camara";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { GameSession } from "../game_session";
import { Player } from "../player";
import { Forest } from "../tree";
import { Updatable, Disposible } from "../types";
import warfog from "../warfog";
import { GameOverMenu } from "../menu/gameOver";
import { cleanInput, keypressed } from "../user_input";
import { getRunnerApp } from "../runnerApp";
import { CountDown } from "../countdown";

@HotClass({ module })
export class GameOverLevel implements Level {

    ui: GameOverMenu;

    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {
        this.ui = new GameOverMenu((null as any) as Container, 0, 0,);
    }

    player: Player | undefined;
    warfog: warfog | undefined;
    camera: Camera | undefined;
    enemys: EnemyPool | undefined;
    droplets: DropletPool | undefined;
    blockContext: (Updatable & Disposible) | undefined;
    groups: { uiGroup: Group; skyGroup: Group; textGroup: Group; ammoGroup: Group; overGroundGroup: Group; groundGroup: Group; dropletGroup: Group; } | undefined;
    ground: TilingSprite | undefined;
    forest: Forest | undefined;
    session: GameSession | undefined;

    minDisplayTimer: CountDown | undefined;
    listeningKey: boolean = false;

    init(
        gameView: Container,
    ): void {
        this.ui.container = gameView;
        this.ui.width = (gameView as any).worldWidth;
        this.ui.height = (gameView as any).worldHeight;

        this.minDisplayTimer = new CountDown(3000, () => {
            cleanInput();
            this.listeningKey = true;
        });
        this.listeningKey = false;

        this.ui.init();
    }

    waitForAnyKey() {
        for (const key in keypressed) {
            if (Object.prototype.hasOwnProperty.call(keypressed, key)) {
                const element = keypressed[key];
                if (element == 1) {
                    getRunnerApp().getLevelManager().enterLevel('welcome');
                    return;
                }
            }
        }
    }

    update(): void {
        // make a keyup events
        
        this.minDisplayTimer!.update();
        if (this.listeningKey) {
            this.waitForAnyKey();
        }
    }

    dispose(): void {
        this.ui.dispose();
        this.minDisplayTimer = undefined;
    }
}
