import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Graphics, Point, Sprite, TilingSprite } from "pixi.js";
import { AmmoPool } from "../ammo";
import { createBlockContext } from "../block_context";
import { BUFFER_EVENTNAME_DEAD, BUFFER_EVENTNAME_HEALTH_CHANGE } from "../buffer";
import { Camera } from "../camara";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { GameSession } from "../game_session";
import { HotClass } from "../helper/class_reloader";
import { FollowLeg, LeadingLeg } from "../leg";
import { Level } from "../level";
import { PlayerStatusMenu } from "../menu/playerStatus";
import { FollowPet, GuidingPet,} from "../pet";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { Forest, Tree } from "../tree";
import { arrow_brancing } from "../upgrades/ice_arrow";
import { pet } from "../upgrades/pet";
import { Vector } from "../vector";

@HotClass({ module })
export class ForestLevel extends Level {

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


        const grass = new TilingSprite(resources.grass.texture!, app.view.width, app.view.height);
        grass.tint = 0x667766;
        gameView.addChildAt(grass, 0);
        this.ground = grass;

        window.addEventListener('resize', () => {
            grass.width = app.view.width;
            grass.height = app.view.height;

            gameView.resize(app.view.width, app.view.height);
        });

        const runnerApp = getRunnerApp();
        const groups = runnerApp.getGroups();

        runnerApp.setGroups(groups);
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

        const camera = new Camera(player, {
            get x() {
                return app.view.width;
            },
            get y() {
                return app.view.height;
            }
        });
        runnerApp.setCamera(camera);
        this.camera = camera;

        const forest = new Forest(treeAnimateMap, gameView);
        this.forest = forest;
        // should use camara size to collision with blocks
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

        player.bufferList.push({
            type: 'event',
            eventName: BUFFER_EVENTNAME_HEALTH_CHANGE,
            id: 'recover',
            properties: {},
            takeEffect(player: Player) {
                player.health += 1;
            }
        });

        enemys.spawnTimer.pause();
        enemys.simpleEnemyTypes = [{
            sprite_names: {
                idle: 'idle',
                die: 'die',
            },
            speed: 1,
            health: 500,
            controller: ['laser_shooter'],
        }];
        const stubPos = new Vector(300, 300);
        function createStub(){
            const stub = enemys.emit( stubPos, 0);
            stub.bufferList.push({
                eventName: BUFFER_EVENTNAME_DEAD,
                id: 'respawn',
                type: 'event',
                properties: {},
                takeEffect(target, percent, ...rest) {
                    createStub();
                },
            });
        }
        createStub();

        // runnerApp.addMisc(new FollowPet(player, new Vector(30, 30)));
        // runnerApp.addMisc(new GuidingPet(player, new Vector(-30, 30)));

        // spider legs
        // so what?
        runnerApp.addMisc(new LeadingLeg(player, new Vector(-50, -60), new Vector(-10, -20), [50, 80] ));
        runnerApp.addMisc(new FollowLeg(player, new Vector(50, -60), new Vector(10, -20), [50, 80]));

        runnerApp.addMisc(new FollowLeg(player, new Vector(-90, -20), new Vector(-20, -10), [70, 90]));
        runnerApp.addMisc(new LeadingLeg(player, new Vector(90, -20), new Vector(20, -10), [70, 90]));

        runnerApp.addMisc(new LeadingLeg(player, new Vector(-100, 40), new Vector(-25, 10), [80, 90]));
        runnerApp.addMisc(new FollowLeg(player, new Vector(100, 40), new Vector(25, 10), [80, 90]));

        runnerApp.addMisc(new FollowLeg(player, new Vector(-60, 80), new Vector(-10, 20), [80, 70]));
        runnerApp.addMisc(new LeadingLeg(player, new Vector(60, 80), new Vector(10, 20), [80, 70]));

        // this.session.pickUpgrade(arrow_brancing);

        this.ui = new PlayerStatusMenu(gameView, (gameView as any).worldWidth, (gameView as any).worldHeight);
        this.ui.init();
        // const button = withChooseUpgradeMenuBtn(gameView);
        // button.position.set(150, 10);

        // const warfog = new WarFog(
        //     app.view.width,
        //     app.view.height,
        // );
        // gameView.addChild(warfog.graphic);
        // warfog.graphic.parentGroup = groups.skyGroup;
        // this.warfog = warfog;
    }

}
