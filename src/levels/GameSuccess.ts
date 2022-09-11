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
import { GameSuccessMenu } from "../menu/gameSuccess";
import { getRunnerApp } from "../runnerApp";

@HotClass({ module })
export class GameSuccessLevel implements Level {    ui: GameSuccessMenu;

    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {
        this.ui = new GameSuccessMenu((null as any) as Container, 0, 0,);
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

    init(
        gameView: Container,
    ): void {
        this.ui.container = gameView;
        this.ui.width = (gameView as any).worldWidth;
        this.ui.height = (gameView as any).worldHeight;

        this.ui.init();
    }

    update(): void {
        // make a keyup events
        getRunnerApp().getLevelManager().enterLevel('welcome');

    }

    dispose(): void {
        this.ui.dispose();
        (this.ui as any) = undefined;
    }
}
