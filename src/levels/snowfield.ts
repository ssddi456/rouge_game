import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Graphics, Point, Sprite, TilingSprite } from "pixi.js";
import { AmmoPool } from "../ammo";
import { createBlockContext } from "../block_context";
import { Camera } from "../camara";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { GameSession } from "../game_session";
import { createGroups } from "../groups";
import { Level } from "../level";
import { PlayerStatusMenu } from "../menu/playerStatus";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { Forest, Tree } from "../tree";
import { Vector } from "../vector";
import WarFog from "../warfog";


export class SnowFieldLevel extends Level {


    init(gameView: Viewport) {
        const app = this.app

        const triangle = new Graphics();
        triangle.beginFill(0xffffff);
        triangle.drawPolygon([
            new Point(0, 0),
            new Point(10, 5),
            new Point(0, 10),
        ]);
        triangle.endFill();

        const triangleT = app.renderer.generateTexture(triangle);

        const newResources = this.getResources();

        const playerAnimateMap = newResources.playerAnimateMap;
        const bowAnimateMap = newResources.bowAnimateMap;
        const gunAnimateMap = newResources.gunAnimateMap;
        const enemyAnimateMap = newResources.enemyAnimateMap;
        const treeAnimateMap = newResources.treeAnimateMap;
        const hitEffect = newResources.hitEffectAnimateMap;
        const resources = newResources.resources;

        triangle.destroy();


        const snowfield = new TilingSprite(resources.snowfield.texture!, app.view.width, app.view.height);
        gameView.addChildAt(snowfield, 0);
        this.ground = snowfield;

        window.addEventListener('resize', () => {
            snowfield.width = app.view.width;
            snowfield.height = app.view.height;

            gameView.resize(app.view.width, app.view.height);
        });

        const runnerApp = getRunnerApp();
        const groups = runnerApp.getGroups();
        runnerApp.setAmmoPool(new AmmoPool(
            newResources.iceAnimateMap.projectile as AnimatedSprite,
            triangleT,
            gameView,
            hitEffect.hit_1,
        ));
        runnerApp.setEnemyAmmoPool(new AmmoPool(
            newResources.thunderAnimateMap.projectile as AnimatedSprite,
            triangleT,
            gameView,
            hitEffect.hit_1,
        ));
        const player = new Player(playerAnimateMap,
            {
                ...bowAnimateMap,
                ...gunAnimateMap,
            },
            100,
            gameView,
            new Vector(
                app.view.width / 2,
                app.view.height / 2,
            )
        );
        this.player = player;
        runnerApp.setPlayer(player);
        this.session = new GameSession();
        this.session.init(this.player);
        runnerApp.setSession(this.session);

        const curserG = new Graphics();
        curserG.beginFill(0xffffff);
        curserG.drawCircle(0, 0, 10);
        curserG.endFill();
        
        const curserT = app.renderer.generateTexture(curserG);
        curserG.destroy();
        const dropS = new Sprite(curserT);
        dropS.anchor.set(0.5, 0.5);

        const enemys = new EnemyPool(enemyAnimateMap, gameView);
        runnerApp.setEnemys(enemys);
        this.enemys = enemys;

        const droplets = new DropletPool(gameView, dropS);
        runnerApp.setDroplets(droplets);
        this.droplets = droplets;

        const camera = new Camera(player, new Vector(
            app.view.width,
            app.view.height,
        ));
        runnerApp.setCamera(camera);
        this.camera = camera;

        const forest = new Forest(treeAnimateMap, gameView);
        this.forest = forest;

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
        this.blockContext = blockContext;

        const warfog = new WarFog(
            app.view.width,
            app.view.height,
        );
        gameView.addChild(warfog.graphic);
        warfog.graphic.parentGroup = groups.skyGroup;
        this.warfog = warfog;

        this.ui = new PlayerStatusMenu(gameView, (gameView as any).worldWidth, (gameView as any).worldHeight);
        this.ui.init();
    }

}