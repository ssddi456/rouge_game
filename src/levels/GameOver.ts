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
import { CurrentResourceMapFunc } from "../loadAnimation";

@HotClass({ module })
export class GameOverLevel extends Level {

    ui: GameOverMenu;

    constructor(
        public app: Application,
        public getResources: CurrentResourceMapFunc
    ) {
        super(app, getResources);
        this.ui = new GameOverMenu((null as any) as Container, 0, 0,);
    }

    minDisplayTimer: CountDown | undefined;
    listeningKey: boolean = false;
    updateFrames = 0;

    init(
        gameView: Container,
    ): void {
        getRunnerApp().setSession(null as any);

        this.ui.container = gameView;
        this.ui.width = (gameView as any).worldWidth;
        this.ui.height = (gameView as any).worldHeight;
        this.listeningKey = false;
        this.updateFrames = 0;
        this.minDisplayTimer = new CountDown(3000, () => {
            console.log('updateFrames', this.updateFrames, 'change this.listeningKey', this.listeningKey);
            cleanInput();
            this.listeningKey = true;
        });

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
        super.update();

        if (this.listeningKey) {
            this.waitForAnyKey();
        } else {
            this.minDisplayTimer!.update();
        }
        this.updateFrames ++;

    }

    dispose(): void {
        super.dispose();

        this.minDisplayTimer = undefined;
    }
}
