import * as PIXI from 'pixi.js'
import './user_input';

import { Viewport } from 'pixi-viewport'
import { getImageUrl, loadSpriteSheet } from './loadAnimation';
import { getRunnerApp } from './runnerApp';
import { Stage } from '@pixi/layers';
import { ForestLevel } from './levels/forest';
import { LevelManager } from './level';
import { SnowFieldLevel } from './levels/snowfield';
import { cloneAnimationSprites } from './sprite_utils';
import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { LevelMenu } from './menu/level';
import { DimmyLevel } from './levels/dimmy';
import { Curser } from './curser';
import { StatusMenu } from './menu/status';
import { WelcomeLevel } from './levels/welcome';

document.body.style.padding = "0";
document.body.style.margin = "0";
document.body.style.overflow = 'hidden';
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";

console.log(window.innerWidth, document.documentElement.clientWidth, document.body.clientWidth, document.body.offsetWidth);

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);
setTimeout(() => {
    console.log(window.innerWidth, document.documentElement.clientWidth, document.body.clientWidth, document.body.offsetWidth);
}, 1000);

app.stage = new Stage();
app.stage.sortableChildren = true;
// create viewport
const gameView = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: window.innerWidth,
    worldHeight: window.innerHeight,

    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});

gameView.sortableChildren = true;

// add the viewport to the stage
app.stage.addChild(gameView);

// load the texture we need
app.loader
    .add('grass', getImageUrl('THX0.png'))
    .add('snowfield', getImageUrl('TIF9.png'))
    .load(async (loader, resources) => {

        const playerAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
        const bowAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow');
        const gunAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun');
        const enemyAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');
        const hitEffect = await loadSpriteSheet(loader, 'crosscode_hiteffect');
        const treeAnimateMap = await loadSpriteSheet(loader, 'Hazel Tree');


        // seems high render rate leads to some bug
        app.ticker.maxFPS = 60;
        // Listen for frame updates
        const cloneResourceMap = () => ({
            resources,
            playerAnimateMap: cloneAnimationSprites(playerAnimateMap),
            bowAnimateMap: cloneAnimationSprites(bowAnimateMap),
            gunAnimateMap: cloneAnimationSprites(gunAnimateMap),
            enemyAnimateMap: cloneAnimationSprites(enemyAnimateMap),
            hitEffect,
            treeAnimateMap,
        });


        const runnerApp = getRunnerApp();
        runnerApp.setApp(app);
        runnerApp.setGameView(gameView);

        const curserG = new Graphics()
            .beginFill(0xffffff)
            .drawCircle(0, 0, 10)
            .endFill();


        const curserA = new AnimatedSprite([app.renderer.generateTexture(curserG)]);
        curserG.destroy();

        curserA.anchor.set(0.5, 0.5)

        const curser = new Curser(curserA, gameView);

        app.stage.addChild(curser.sprite);
        app.ticker.add(() => {
            curser.update();
            levelManager.update();
        });

        const levelManager = new LevelManager(app, gameView, cloneResourceMap);
        runnerApp.setLevelManager(levelManager);
        // may lazyload but not now
        levelManager.registerLevel('welcome', WelcomeLevel);
        levelManager.registerLevel('forest', ForestLevel);
        levelManager.registerLevel('snowfield', SnowFieldLevel);
        levelManager.registerLevel('dimmy', DimmyLevel);

        levelManager.enterLevel('welcome');

        (window as any).switchLevel = function (level: string) {
            levelManager.enterLevel(level);
        };

        const toolBar = app.stage.addChild(new Container());
        const levelMenu = new LevelMenu(
            app.stage,
            app.stage.width,
            app.stage.height,
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
            app.stage,
            app.stage.width,
            app.stage.height,
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
    });