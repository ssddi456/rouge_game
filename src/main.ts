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

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    backgroundColor: 0x1099bb,
    resizeTo: window,
});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);
document.body.style.margin = "0";
document.documentElement.style.margin = "0";
app.stage = new Stage();
app.stage.sortableChildren = true;
// create viewport
const gameView = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,

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

        const forestLevel = new ForestLevel(app, cloneResourceMap);

        const snowFieldLevel = new SnowFieldLevel(app, cloneResourceMap);

        const runnerApp = getRunnerApp();
        runnerApp.setApp(app);
        runnerApp.setGameView(gameView);
        const levelManager = new LevelManager(app, gameView);

        // may lazyload but not now
        levelManager.registerLevel('forest', forestLevel);
        levelManager.registerLevel('snowfield', snowFieldLevel);

        levelManager.enterLevel('forest');

        (window as any).switchLevel = function (level: string) {
            levelManager.enterLevel(level);
        };

    });