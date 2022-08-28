import { Application, Container } from "pixi.js";
import { GameSession } from "./game_session";
import { getRunnerApp } from "./runnerApp";

export interface Level {
    init(gameView: Container): void;
    update(): void;
    dispose(): void;
}

interface LevelConstructor {
    new(app: Application, getResources: () => Record<string, Record<string, any>>): Level
}


export class LevelManager {
    currentLevel: Level | undefined = undefined;

    levelMap: Record<string, Level> = {};
    levelClassMap: Record<string, LevelConstructor> = {};
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

    registerLevel(name: string, level: LevelConstructor) {
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