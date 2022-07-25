import * as PIXI from 'pixi.js'
import './user_input';

import { Viewport } from 'pixi-viewport'
import { Player } from './player';
import { AnimatedSprite, Container, Point, Sprite } from 'pixi.js';
import { Curser } from './curser';
import { EnemyPool } from './enemy';
import { getImageUrl, loadSpriteSheet } from './loadAnimation';
import { CollisionView } from './drawCollisions';
import { Vector } from './vector';
import { Camera } from './camara';
import { DropletPool } from './droplet';
import { getRunnerApp } from './runnerApp';
import { Forest, Tree } from './tree';
import { createBlockContext } from './block_context';
import { createGroups, overGroundZindex } from './groups';
import { Stage } from '@pixi/layers';
import WarFog from './warfog';

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
app.loader.add('grass', getImageUrl('THX0.png'))
    .load(async (loader, resources) => {

        const playerAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
        const bowAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow');
        const gunAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun');
        const enemyAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');
        const hitEffect = await loadSpriteSheet(loader, 'crosscode_hiteffect');
        const treeAnimateMap = await loadSpriteSheet(loader, 'Hazel Tree');

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
        const ammoA = new AnimatedSprite([app.renderer.generateTexture(ammoG)]);
        playerAnimateMap.ammo = ammoA;


        const grass = new PIXI.TilingSprite(resources.grass.texture!, app.view.width, app.view.height);
        gameView.addChildAt(grass, 0);
        const overGroundContainer = gameView.addChild(new Container());
        // const overGroundContainer = new Container();
        overGroundContainer.zIndex = overGroundZindex;
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
                ...bowAnimateMap,
                ...gunAnimateMap,
            },
            {
                ammoTrail: triangleT,
            },
            hitEffect,
            100, 
            overGroundContainer, 
            new Vector(
                app.view.width / 2,
                app.view.height / 2,
            )
        );
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
        const enemys = new EnemyPool(enemyAnimateMap, overGroundContainer);
        runnerApp.setEnemys(enemys);
        const droplets = new DropletPool(gameView, dropS);
        runnerApp.setDroplets(droplets);
        const camera = new Camera(player, new Vector(
            app.view.width,
            app.view.height,
        ));
        runnerApp.setCamera(camera);

        const forest = new Forest(treeAnimateMap, overGroundContainer);
        const blockContext = createBlockContext({
            blockWidth: app.view.width,
            blockHeight: app.view.height,
            createInitBlockInfo(id, rect) {
                return {
                    id,
                    rect,
                    treePos: forest.createTreePos(rect),
                    trees: [] as Tree[]
                };
            },
            loadBlock(id, block) {
                block.trees = forest.updateTree(block.treePos);
            },
            releasBlock(id, block) {
                const releaseTrees = block.trees.splice(0, block.trees.length);
                for (let index = 0; index < releaseTrees.length; index++) {
                    const tree = releaseTrees[index];
                    tree.dead = true;
                }
            },
        });

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
        // 
        // controll layers here
        //
        
        const groups = createGroups(gameView);

        const warfog = new WarFog(
            app.view.width,
            app.view.height,
        );
        gameView.addChild(warfog.graphic);
        warfog.graphic.parentGroup = groups.skyGroup;

        // seems high render rate leads to some bug
        app.ticker.maxFPS = 60;
        // Listen for frame updates
        app.ticker.add(() => {
            // each frame we spin the bunny around a bit
            player.update();
            camera.update(player);
            warfog.update();

            enemys.update();

            droplets.update();
            curser.update();
            blockContext.update(player.position.x, player.position.y);

            // for debugers
            // collisionView.update();
            
            player.sprite.parentGroup = groups.overGroundGroup;
            camera.updateItemPos(player);

            overGroundContainer.children.sort((a, b) => {
                if (a.position.y > b.position.y) {
                    return 1;
                }
                if (a.position.y < b.position.y) {
                    return -1;
                }
                if (a.position.x > b.position.x) {
                    return 1;
                }
                if (a.position.x < b.position.x) {
                    return -1;
                }
                return a.updateOrder! - b.updateOrder!;
            });

            grass.tilePosition = camera.offset.clone().multiplyScalar(-1) as any;
            for (let index = 0; index < player.ammoPools.pool.length; index++) {
                const element = player.ammoPools.pool[index];
                element.sprite.parentGroup = groups.ammoGroup;

                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
            for (let index = 0; index < enemys.pool.length; index++) {
                const element = enemys.pool[index];
                element.sprite.parentGroup = groups.overGroundGroup;
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }

            for (let index = 0; index < droplets.pool.length; index++) {
                const element = droplets.pool[index];
                element.sprite.parentGroup = groups.dropletGroup;

                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }

            for (let index = 0; index < forest.trees.length; index++) {
                const element = forest.trees[index];
                if (!element.dead) {
                    element.sprite.parentGroup = groups.overGroundGroup;
                    element.update();
                    camera.updateItemPos(element);
                }
            }

            runnerApp.updateParticles();
            const particles = runnerApp.getPariticles();

            for (let index = 0; index < particles.length; index++) {
                const element = particles[index];
                element.sprite.parentGroup = groups.overGroundGroup;
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
            const textParticles = runnerApp.getTextParticles();

            for (let index = 0; index < textParticles.length; index++) {
                const element = textParticles[index];
                element.sprite.parentGroup = groups.textGroup;
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }

        });
    });