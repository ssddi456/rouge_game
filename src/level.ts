import { Application, Container, TilingSprite } from "pixi.js";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { GameSession } from "./game_session";
import { createGroups } from "./groups";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { Forest } from "./tree";
import { Updatable, Disposible } from "./types";
import WarFog from "./warfog";

export abstract class Level {
    player: Player | undefined = undefined;
    warfog: WarFog | undefined = undefined;
    camera: Camera | undefined = undefined;
    enemys: EnemyPool | undefined = undefined;
    droplets: DropletPool | undefined = undefined;
    blockContext: (Updatable & Disposible) | undefined = undefined;
    groups: ReturnType<typeof createGroups> | undefined = undefined;
    ground: TilingSprite | undefined = undefined;
    forest: Forest | undefined = undefined;
    session: GameSession | undefined = undefined;

    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {}

    abstract init(gameView: Container): void;
    
    update() {
        const session = this.session!;
        const player = this.player!;
        const warfog = this.warfog!;
        const camera = this.camera!;
        const enemys = this.enemys!;
        const droplets = this.droplets!;
        const blockContext = this.blockContext!;
        const groups = this.groups!;
        const grass = this.ground!;
        const forest = this.forest!;

        const runnerApp = getRunnerApp();

        // each frame we spin the bunny around a bit
        session.update();
        player.update();
        camera.update(player);
        warfog?.update();

        runnerApp.updateAOE();
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
        const grass = this.ground!;

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
        this.ground = undefined;
        this.forest = undefined;
    }
}


export class LevelManager {
    currentLevel: Level | undefined = undefined;

    levelMap: Record<string, Level> = {};
    levelClassMap: Record<string, new (...args: any[]) => Level> = {};
    levelPaused = false;

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
    }

    enterLevel(levelId: string) {
        this.app.ticker.stop();
        this.dispose();

        if (!this.levelClassMap[levelId]) {
            throw new Error(`cannot found level ${levelId}`);
        }
        if (!this.levelMap[levelId]) {
            this.levelMap[levelId] = new this.levelClassMap[levelId](this.app, this.getResources);
        }
        const currentLevel = this.levelMap[levelId];

        currentLevel.init(this.gameView);
        this.currentLevel = currentLevel;
        this.app.ticker.start();
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
    }
}