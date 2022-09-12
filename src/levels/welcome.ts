import { Container, Graphics, Text } from "pixi.js";
import { Level } from "../level";
import { getRunnerApp } from "../runnerApp";

export class WelcomeLevel extends Level {
    sprite: Container | undefined;
    init(
        gameView: Container,
    ): void {

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
    dispose(): void {
        super.dispose();
        this.sprite!.destroy();
        this.sprite = undefined;
    }
}
