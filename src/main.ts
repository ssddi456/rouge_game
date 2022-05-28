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
import { ECollisionType, EntityManager, ICollisionable } from './types';
import { Particle } from './particle';

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
});
viewport.sortableChildren = true;

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
        playerAnimateMap.ammo = ammoA;


        const grass = new PIXI.TilingSprite(resources.grass.texture!, app.view.width, app.view.height);
        app.stage.addChildAt(grass, 0);

        window.addEventListener('resize', () => {
            grass.width = app.view.width;
            grass.height = app.view.height;
        });

        const runnerApp: EntityManager = {
            getEntities: ({
                collisionTypes
            }) => {
                return collisionTypes.reduce((acc, type) => {
                    switch (type) {
                        case ECollisionType.player:
                            return [...acc, player];
                        case ECollisionType.enemy:
                            return [...acc, ...enemys.pool.filter(e => !e.dead)];
                        case ECollisionType.none:
                            return [...acc, ...player.ammoPools.pool];
                        default:
                            return acc;
                    }
                }, [] as ICollisionable[]);
            },
            emitParticles: (
                position,
                animation,
                duration,
            ) => {
                new Particle(
                    position,
                    new AnimatedSprite(animation.textures),
                    viewport,
                    duration,
                );
            }
        };
    
        const player = new Player(playerAnimateMap, 100, viewport, runnerApp);
        const curserG = new PIXI.Graphics();
        curserG.beginFill(0xffffff);
        curserG.drawCircle(0, 0, 10);
        curserG.endFill();
        const curserA = new AnimatedSprite([app.renderer.generateTexture(curserG)]);
        curserA.anchor.set(0.5, 0.5)

        const curser = new Curser(curserA, viewport);
        const enemys = new EnemyPool(enemyAnimateMap, viewport, player, runnerApp);

        const collisionView = new CollisionView(
            app.renderer as PIXI.Renderer,
            viewport, 
            [
                player,
                enemys,
                // player.ammoPools,
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