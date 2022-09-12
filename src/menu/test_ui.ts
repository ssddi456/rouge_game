import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics } from "pixi.js";
import { LevelManager } from "../level";
import { LevelMenu } from "./level";
import { StatusMenu } from "./status";

export function addTestToolbar(app: Application, gameView: Viewport, levelManager: LevelManager) {

    const toolBar = app.stage.addChild(new Container());
    const levelMenu = new LevelMenu(
        gameView,
        gameView.worldWidth,
        gameView.worldHeight,
        [
            {
                label: 'switch to forest',
                handle: () => levelManager.enterLevel('forest')
            },
            {
                label: 'switch to snowfield',
                handle: () => levelManager.enterLevel('snowfield')
            },
            {
                label: 'switch to dimmy',
                handle: () => levelManager.enterLevel('dimmy')
            },
            {
                label: 'switch to welcome',
                handle: () => levelManager.enterLevel('welcome')
            },
        ],
        () => {
            levelManager.levelResume();
            toolBar.visible = true;
        },
    );

    const switchButton = toolBar.addChild(new Graphics())
        .beginFill(0x666666)
        .drawRoundedRect(10, 10, 50, 50, 3)
        .endFill()
        .lineStyle({
            color: 0xffffff,
            width: 4
        })
        .moveTo(10 + 5, 15 + 5,).lineTo(10 + 50 - 5, 15 + 5,)
        .moveTo(10 + 5, 30 + 5,).lineTo(10 + 50 - 5, 30 + 5,)
        .moveTo(10 + 5, 45 + 5,).lineTo(10 + 50 - 5, 45 + 5,);

    switchButton.interactive = true;
    switchButton.on('click', () => {
        levelManager.levelPause();
        levelMenu.init();
        toolBar.visible = false;
    });

    const statusMenu = new StatusMenu(
        gameView,
        gameView.worldWidth,
        gameView.worldHeight,
    );
    const statusButton = toolBar.addChild(new Graphics())
        .beginFill(0x666666)
        .drawRoundedRect(10, 10, 50, 50, 3)
        .endFill()
        .lineStyle({
            color: 0xffffff,
            width: 4
        })
        .moveTo(10 + 5, 15 + 5,).lineTo(10 + 50 - 5, 15 + 5,)
        .moveTo(10 + 5, 30 + 5,).lineTo(10 + 50 - 5, 30 + 5,)
        .moveTo(10 + 5, 45 + 5,).lineTo(10 + 50 - 5, 45 + 5,);

    statusButton.position.x = 60;
    statusButton.interactive = true;
    statusButton.on('click', () => {
        statusMenu.init();
    });
}