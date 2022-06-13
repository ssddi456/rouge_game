import * as PIXI from 'pixi.js'
import GrassImage from './assets/THX0.png';
import './user_input';

import { Viewport } from 'pixi-viewport'
import { Player } from './player';
import { AnimatedSprite, ObservablePoint, Point, Sprite } from 'pixi.js';
import { Curser } from './curser';
import { EnemyPool } from './enemy';
import { loadSpriteSheet } from './loadAnimation';
import { CollisionView } from './drawCollisions';
import { Particle } from './particle';
import { Vector } from './vector';
import { Camera } from './camara';
import { DropletPool } from './droplet';
import { getRunnerApp } from './runnerApp';
import { Ammo } from './ammo';

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
app.loader.add('grass', GrassImage)
    .load(async (loader, resources) => {

        const playerAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
        const enemyAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');

        const ammoG = new PIXI.Graphics();
        ammoG.beginFill(0xffffff);
        ammoG.drawCircle(0, 5, 5);
        ammoG.endFill();

        const triangle = new PIXI.Graphics();
        triangle.beginFill(0xffffff);
        triangle.drawPolygon([
            new Point(0, 0),
            new Point(10, 5),
            new Point(0, 10),
        ]);
        triangle.endFill();

        const triangleT = app.renderer.generateTexture(triangle);
        const ammoA = new AnimatedSprite([triangleT]);
        playerAnimateMap.ammo = ammoA;


        const grass = new PIXI.TilingSprite(resources.grass.texture!, app.view.width, app.view.height);
        gameView.addChildAt(grass, 0);

        window.addEventListener('resize', () => {
            grass.width = app.view.width;
            grass.height = app.view.height;

            gameView.resize(app.view.width, app.view.height);
        });

        const runnerApp = getRunnerApp();
        runnerApp.setApp(app);
        runnerApp.setGameView(gameView);

        const player = new Player(playerAnimateMap, 
            {
                ammoTrail: triangleT,
            },
            100, gameView, new Vector(
            app.view.width / 2,
            app.view.height / 2,
        ));
        runnerApp.setPlayer(player);

        const curserG = new PIXI.Graphics();
        curserG.beginFill(0xffffff);
        curserG.drawCircle(0, 0, 10);
        curserG.endFill();
        const curserT = app.renderer.generateTexture(curserG);
        const curserA = new AnimatedSprite([curserT]);
        curserA.anchor.set(0.5, 0.5)
        
        const dropS = new Sprite(curserT);
        dropS.anchor.set(0.5, 0.5);

        const curser = new Curser(curserA, gameView);
        const enemys = new EnemyPool(enemyAnimateMap, gameView, player);
        runnerApp.setEnemys(enemys);
        const droplets = new DropletPool(gameView, dropS);
        runnerApp.setDroplets(droplets);
        const camera = new Camera(player, new Vector(
            app.view.width,
            app.view.height,
        ));
        runnerApp.setCamera(camera);
        const collisionView = new CollisionView(
            app.renderer as PIXI.Renderer,
            gameView,
            camera,
            [
                player,
                enemys,
                // droplets,
                // player.ammoPools,
            ]);
        let particles: Particle[] = [];
        runnerApp.setParticles(particles);

        // Listen for frame updates
        app.ticker.add(() => {
            // each frame we spin the bunny around a bit
            player.update();
            camera.update(player);
            enemys.update();
            droplets.update();
            curser.update();
            
            for (let index = 0; index < particles.length; index++) {
                const particle = particles[index];
                particle.update();
            }
            particles = particles.filter(p => !p.dead);
            runnerApp.setParticles(particles);
            
            // for debugers
            collisionView.update();
            
            camera.updateItemPos(player);
            grass.tilePosition = camera.offset.clone().multiplyScalar(-1) as any;
            for (let index = 0; index < player.ammoPools.pool.length; index++) {
                const element = player.ammoPools.pool[index];
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
            for (let index = 0; index < enemys.pool.length; index++) {
                const element = enemys.pool[index];
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }

            for (let index = 0; index < droplets.pool.length; index++) {
                const element = droplets.pool[index];
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }

            for (let index = 0; index < particles.length; index++) {
                const element = particles[index];
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        });
    });