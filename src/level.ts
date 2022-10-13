import { Stage } from "@pixi/layers";
import { Viewport } from "pixi-viewport";
import { Application, Container, DisplayObject, Graphics, State, TilingSprite } from "pixi.js";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { GameSession } from "./game_session";
import { createGroups, maskZIndex } from "./groups";
import { Fade } from "./helper/animated_utils";
import { BaseMenu } from "./menu/base";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { Forest } from "./tree";
import { Updatable, Disposible } from "./types";
import WarFog from "./warfog";

export abstract class Level {
    ui: BaseMenu | undefined = undefined;
    player: Player | undefined = undefined;
    warfog: WarFog | undefined = undefined;
    camera: Camera | undefined = undefined;
    enemys: EnemyPool | undefined = undefined;
    droplets: DropletPool | undefined = undefined;
    blockContext: (Updatable & Disposible) | undefined = undefined;
    ground: TilingSprite | undefined = undefined;
    forest: Forest | undefined = undefined;
    session: GameSession | undefined = undefined;

    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {}

    abstract init(gameView: Container): void;
    
    update() {
        const session = this.session;
        const player = this.player;
        const warfog = this.warfog;
        const camera = this.camera;
        const enemys = this.enemys;
        const droplets = this.droplets;
        const blockContext = this.blockContext;
        const grass = this.ground;
        const forest = this.forest;
        const ui = this.ui;

        const runnerApp = getRunnerApp();
        const groups = runnerApp.getGroups();

        // each frame we spin the bunny around a bit
        session?.update();
        player?.update();
        camera?.update(player!);
        warfog?.update();

        runnerApp?.updateAOE();
        enemys?.update();

        droplets?.update();
        blockContext?.update(player?.position.x, player?.position.y);
        ui?.update();

        // for debugers
        // collisionView.update();

        player && (player.sprite.parentGroup = groups?.overGroundGroup);
        camera?.updateItemPos(player!);
        // do
        if (enemys && camera) {
            for (let index = 0; index < enemys.pool.length; index++) {
                const element = enemys.pool[index];
                element.sprite.parentGroup = groups?.overGroundGroup;
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        }

        // this.debug();
        if (grass && camera) {
            grass.tilePosition = camera.offset.clone().multiplyScalar(-1) as any;
        }

        if (player && camera) {
            for (let index = 0; index < player.ammoPools.pool.length; index++) {
                const element = player.ammoPools.pool[index];
                element.sprite.parentGroup = groups?.ammoGroup;
                
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        }

        if (droplets && camera) {
            for (let index = 0; index < droplets.pool.length; index++) {
                const element = droplets.pool[index];
                element.sprite.parentGroup = groups?.dropletGroup;
    
                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        }

        if (forest && camera) {
            for (let index = 0; index < forest.trees.length; index++) {
                const element = forest.trees[index];
                if (!element.dead) {
                    element.sprite.parentGroup = groups?.overGroundGroup;
                    element.update();
                    camera.updateItemPos(element);
                }
            }
        }

        runnerApp.updateParticles();
    }

    dispose() {
        const session = this.session;

        const player = this.player;
        player?.dispose();

        const warfog = this.warfog;
        warfog?.graphic.destroy();
        const camera = this.camera;

        const enemys = this.enemys;
        enemys?.dispose();

        const droplets = this.droplets;
        droplets && (droplets.pool = []);

        const blockContext = this.blockContext;
        blockContext?.dispose();

        const grass = this.ground;
        grass?.destroy();

        const forest = this.forest;
        forest && forest.dispose();

        const ui = this.ui;
        ui?.dispose();

        this.session = undefined;
        this.player = undefined;
        this.warfog = undefined;
        this.camera = undefined;
        this.enemys = undefined;
        this.droplets = undefined;
        this.blockContext = undefined;
        this.ground = undefined;
        this.forest = undefined;
        this.ui = undefined;
    }
}


export class LevelManager {
    currentLevel: Level | undefined = undefined;

    levelMap: Record<string, Level> = {};
    levelClassMap: Record<string, new (...args: any[]) => Level> = {};
    levelPaused = false;

    fadeEffect: Fade = new Fade(this.gameView, (this.gameView as Viewport).worldWidth, (this.gameView as Viewport).worldHeight);
    constructor(
        public app: Application,
        public gameView: Container,
        public getResources: () => Record<string, Record<string, any>>
    ) {
    }

    levelPause() {
        this.levelPaused = true;
    }

    levelResume() {
        this.levelPaused = false;
    }

    update() {
        if (!this.levelPaused) {
            if (this.currentLevel) {
                this.currentLevel.update();
            }
        }
        this.fadeEffect.update();
    }

    enterLevel(levelId: string) {
        this.levelPause();
        return new Promise<void>(resolve => {
            requestAnimationFrame(async () => {
                
                if (!this.levelClassMap[levelId]) {
                    throw new Error(`cannot found level ${levelId}`);
                }
                const lastLevel = this.currentLevel;
                if (lastLevel) {
                    await this.fadeEffect.doFade(0, 1, 2000);
                    lastLevel.dispose();
                }
                getRunnerApp().setGroups(createGroups(this.gameView as Stage));
                if (!this.levelMap[levelId]) {
                    this.levelMap[levelId] = new this.levelClassMap[levelId](this.app, this.getResources);
                }

                const currentLevel = this.levelMap[levelId];
                currentLevel.init(this.gameView);
                this.currentLevel = currentLevel;
                this.levelResume();

                await this.fadeEffect.doFade(1, 0, 2000);
                resolve();
            });
        });
    }

    registerLevel(name: string, level: new (...args: any[]) => Level) {
        this.levelClassMap[name] = level;
    }

    dispose() {
        if (this.currentLevel) {
            this.currentLevel.dispose();
            this.currentLevel = undefined;
            getRunnerApp().disposeGameView();
        }
        this.fadeEffect.dispose();
    }
}
