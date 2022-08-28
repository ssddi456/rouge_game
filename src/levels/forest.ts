import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, Container, DisplayObject, Graphics, Point, Sprite, TilingSprite } from "pixi.js";
import { createBlockContext } from "../block_context";
import { Camera } from "../camara";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { GameSession } from "../game_session";
import { createGroups } from "../groups";
import { HotClass } from "../helper/class_reloader";
import { Level } from "../level";
import { withChooseUpgradeMenuBtn } from "../menu/chooseUpgrade";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { Forest, Tree } from "../tree";
import { Disposible, Updatable } from "../types";
import { Vector } from "../vector";
import WarFog from "../warfog";

@HotClass({ module })
export class ForestLevel implements Level {
    player: Player | undefined = undefined;
    warfog: WarFog | undefined = undefined;
    camera: Camera | undefined = undefined;
    enemys: EnemyPool | undefined = undefined;
    droplets: DropletPool | undefined = undefined;
    blockContext: (Updatable & Disposible) | undefined = undefined;
    groups: ReturnType<typeof createGroups> | undefined = undefined;
    grass: TilingSprite | undefined = undefined;
    forest: Forest | undefined = undefined;
    session: GameSession | undefined = undefined;

    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {}


    init(gameView: Viewport) {
        const app = this.app
        const ammoG = new Graphics();
        ammoG.beginFill(0xffffff);
        ammoG.drawCircle(0, 5, 5);
        ammoG.endFill();

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
        const ammoA = new AnimatedSprite([app.renderer.generateTexture(ammoG)]);
        const playerAnimateMap = newResources.playerAnimateMap;
        const bowAnimateMap = newResources.bowAnimateMap;
        const gunAnimateMap = newResources.gunAnimateMap;
        const enemyAnimateMap = newResources.enemyAnimateMap;
        const treeAnimateMap = newResources.treeAnimateMap;
        const hitEffect = newResources.hitEffect;
        const resources = newResources.resources;

        playerAnimateMap.ammo = ammoA;

        ammoG.destroy();
        triangle.destroy();


        const grass = new TilingSprite(resources.grass.texture!, app.view.width, app.view.height);
        gameView.addChildAt(grass, 0);
        this.grass = grass;

        window.addEventListener('resize', () => {
            grass.width = app.view.width;
            grass.height = app.view.height;

            gameView.resize(app.view.width, app.view.height);
        });

        const runnerApp = getRunnerApp();
        const groups = createGroups(gameView);
        this.groups = groups;
        runnerApp.setGroups(groups);

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
            gameView,
            new Vector(
                app.view.width / 2,
                app.view.height / 2,
            )
        );
        this.player = player;
        runnerApp.setPlayer(player);

        this.session = new GameSession();
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

        const button = withChooseUpgradeMenuBtn(gameView);
        button.position.set(150, 10);

        // const warfog = new WarFog(
        //     app.view.width,
        //     app.view.height,
        // );
        // gameView.addChild(warfog.graphic);
        // warfog.graphic.parentGroup = groups.skyGroup;
        // this.warfog = warfog;
    }


    update() {
        const session = this.session!;
        const player = this.player!;
        const warfog = this.warfog!;
        const camera = this.camera!;
        const enemys = this.enemys!;
        const droplets = this.droplets!;
        const blockContext = this.blockContext!;
        const groups = this.groups!;
        const grass = this.grass!;
        const forest = this.forest!;
        
        const runnerApp = getRunnerApp();
        
        // each frame we spin the bunny around a bit
        session.update();
        player.update();
        camera.update(player);
        warfog?.update();

        enemys.update();

        droplets.update();
        blockContext.update(player.position.x, player.position.y);

        // for debugers
        // collisionView.update();

        player.sprite.parentGroup = groups.overGroundGroup;
        camera.updateItemPos(player);
        // do

        for (let index = 0; index < enemys.pool.length; index++) {
            const element = enemys.pool[index];
            element.sprite.parentGroup = groups.overGroundGroup;
            if (!element.dead) {
                camera.updateItemPos(element);
            }
        }

        // this.debug();

        grass.tilePosition = camera.offset.clone().multiplyScalar(-1) as any;
        for (let index = 0; index < player.ammoPools.pool.length; index++) {
            const element = player.ammoPools.pool[index];
            element.sprite.parentGroup = groups.ammoGroup;

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
    }
    
    dispose() {
        const session = this.session!;

        const player = this.player!;
        player.dispose();

        const warfog = this.warfog!;
        warfog?.graphic.destroy();
        const camera = this.camera!;

        const enemys = this.enemys!;
        enemys.pool = [];

        const droplets = this.droplets!;
        droplets.pool = [];

        const blockContext = this.blockContext!;
        blockContext.dispose();

        const groups = this.groups!;
        const grass = this.grass!;

        const forest = this.forest!;
        forest.trees = [];

        this.session = undefined;
        this.player = undefined;
        this.warfog = undefined;
        this.camera = undefined;
        this.enemys = undefined;
        this.droplets = undefined;
        this.blockContext = undefined;
        this.groups = undefined;
        this.grass = undefined;
        this.forest = undefined;
    }
}
