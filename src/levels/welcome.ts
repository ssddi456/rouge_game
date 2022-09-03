import { Group } from "@pixi/layers";
import { Application, Container, Graphics, Text, TilingSprite } from "pixi.js";
import { Camera } from "../camara";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { GameSession } from "../game_session";
import { Level } from "../level";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { Forest } from "../tree";
import { Updatable, Disposible } from "../types";
import warfog from "../warfog";

export class WelcomeLevel implements Level {
    sprite: Container | undefined = undefined;
    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {

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
        if (this.sprite) {
            return;
        }
        const screenWidth = this.app.view.width;
        const screenHeight = this.app.view.height;
        this.sprite = gameView.addChild(new Container());
        const padingTop = 200;
        const titleFontSize = 120;
        // background
        this.sprite.addChild(new Graphics())
            .beginFill(0x000000)
            .drawRect(0, 0, screenWidth, screenHeight)
            .endFill();
        const title = this.sprite.addChild(new Text('something like a shoot game', {
            fill: 0xeeeeee,
            fontSize: titleFontSize,
        }));
        title.position.x = (screenWidth - title.width) /2;
        title.position.y = padingTop;

        const beginNewGame = this.sprite.addChild(new Text('new game',
            {
                fill: 0xdddddd,
                fontSize: 40,
            }));
        beginNewGame.position.x = (screenWidth - beginNewGame.width) / 2;
        beginNewGame.position.y = padingTop + titleFontSize + 200;
        beginNewGame.interactive = true;
        beginNewGame.on('click', () => {
            const levelManager = getRunnerApp().getLevelManager();
            levelManager.enterLevel('forest');
        });
        const credit = this.sprite.addChild(new Text('credit', {
            fill: 0xdddddd,
            fontSize: 40,
        }));
        credit.position.x = (screenWidth - credit.width) / 2;
        credit.position.y = padingTop + titleFontSize + 200 + 40 + 40;
    }


    update(): void {
        
    }
    dispose(): void {
        if (this.sprite) {
            this.sprite.destroy({ children: true});
            this.sprite = undefined;
        }
    }
}
