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
import { GameSuccessMenu } from "../menu/gameSuccess";
import { getRunnerApp } from "../runnerApp";
import { CurrentResourceMapFunc } from "../loadAnimation";

@HotClass({ module })
export class GameSuccessLevel extends Level {
    ui: GameSuccessMenu;

    constructor(
        public app: Application,
        public getResources: CurrentResourceMapFunc
    ) {
        super(app, getResources);
        this.ui = new GameSuccessMenu((null as any) as Container, 0, 0,);
    }

    init(
        gameView: Container,
    ): void {

        this.session = new GameSession();
        getRunnerApp().setSession(this.session);

        this.ui.container = gameView;
        this.ui.width = (gameView as any).worldWidth;
        this.ui.height = (gameView as any).worldHeight;

        this.ui.init();
    }

    update(): void {
        super.update();

        // make a keyup events
        getRunnerApp().getLevelManager().enterLevel('welcome');

    }

    dispose(): void {
        super.dispose();

        this.ui.dispose();
        (this.ui as any) = undefined;
    }
}
