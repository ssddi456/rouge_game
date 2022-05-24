import * as PIXI from 'pixi.js'
import GrassImage from './assets/THX0.png';
import './user_input';

import { Viewport } from 'pixi-viewport'
import { Player } from './player';
import { AnimatedSprite, Sprite } from 'pixi.js';
import { Curser } from './curser';
import { EnemyPool } from './enemy';
import { loadSpriteSheet } from './loadAnimation';
import { CollisionView } from './drawCollisions';

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

// create viewport
const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,

    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})

// add the viewport to the stage
app.stage.addChild(viewport);


// load the texture we need
app.loader.add('grass', GrassImage)
    .load(async (loader, resources) => {

        const playerAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
        const enemyAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');

        const ammoG = new PIXI.Graphics();
        ammoG.beginFill(0xffffff);
        ammoG.drawCircle(0, 0, 10);
        ammoG.drawEllipse(-10, 0, 20, 10);
        ammoG.endFill();
        const ammoT = app.renderer.generateTexture(ammoG);
        const ammoA = new AnimatedSprite([ammoT]);
        ammoA.anchor.set(0.5, 0.5)
        playerAnimateMap.ammo = ammoA;


        const grass = new PIXI.TilingSprite(resources.grass.texture!, 1000, 1000);

        viewport.addChild(grass);

        const ammoDemo = new Sprite(ammoT);
        ammoDemo.x = 100;
        ammoDemo.y = 200;
        viewport.addChild(ammoDemo);

        const player = new Player(playerAnimateMap, 100, viewport);

        viewport.addChild(player.sprite);

        const curserG = new PIXI.Graphics();
        curserG.beginFill(0xffffff);
        curserG.drawCircle(0, 0, 10);
        curserG.endFill();
        const curserA = new AnimatedSprite([app.renderer.generateTexture(curserG)]);
        curserA.anchor.set(0.5, 0.5)

        const curser = new Curser(curserA, viewport);
        viewport.addChild(curser.sprite);

        const enemys = new EnemyPool(enemyAnimateMap, viewport, player);

        const collisionView = new CollisionView(viewport, [
            player,
            enemys
        ]);

        // Listen for frame updates
        app.ticker.add(() => {
            // each frame we spin the bunny around a bit
            player.update();
            enemys.update();
            curser.update();
            // for debugers
            collisionView.update();
        });
    });