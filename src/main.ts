import * as PIXI from 'pixi.js'
import './user_input';

import { Viewport } from 'pixi-viewport'
import { getImageUrl, setupResource } from './loadAnimation';
import { getRunnerApp } from './runnerApp';
import { Stage } from '@pixi/layers';
import { ForestLevel } from './levels/forest';
import { LevelManager } from './level';
import { SnowFieldLevel } from './levels/snowfield';
import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { LevelMenu } from './menu/level';
import { DimmyLevel } from './levels/dimmy';
import { Curser } from './curser';
import { StatusMenu } from './menu/status';
import { WelcomeLevel } from './levels/welcome';
import { GameOverLevel } from './levels/GameOver';
import { GameSuccessLevel } from './levels/GameSuccess';
import { addTestToolbar } from './menu/test_ui';
import { dead_explosion, ice_mark, ice_hurts } from './upgrades/icon_arrow';

document.body.style.padding = "0";
document.body.style.margin = "0";
document.body.style.overflow = 'hidden';
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";

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

        const cloneResourceMap = await setupResource(app);

        // seems high render rate leads to some bug
        app.ticker.maxFPS = 60;

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
        const levelManager = new LevelManager(app, gameView, cloneResourceMap);
        runnerApp.setLevelManager(levelManager);

        app.ticker.add(() => {
            curser.update();
            levelManager.update();
        });

        window.addEventListener('keypress', e => {
            if (e.key == ' ') {
                if (app.ticker.started) {
                    app.ticker.stop();
                } else {
                    app.ticker.start();
                }
            }
        });


        // may lazyload but not now
        levelManager.registerLevel('welcome', WelcomeLevel);
        levelManager.registerLevel('forest', ForestLevel);
        levelManager.registerLevel('snowfield', SnowFieldLevel);
        levelManager.registerLevel('dimmy', DimmyLevel);
        levelManager.registerLevel('gameover', GameOverLevel);
        levelManager.registerLevel('gamesuccess', GameSuccessLevel);

        // levelManager.enterLevel('welcome');
        await levelManager.enterLevel('forest');
        // levelManager.enterLevel('gameover');

        const session = getRunnerApp().getSession();
        session.pickUpgrade(ice_mark);
        session.pickUpgrade(ice_hurts);
        // addTestToolbar(app, gameView, levelManager);
    });
