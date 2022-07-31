import { Application, Container } from "pixi.js";
import { getRunnerApp } from "./runnerApp";

export interface Level {
    init(gameView: Container): void;
    update(): void;
    dispose(): void;
}



export class LevelManager {
    currentLevel: Level | undefined = undefined;

    levelMap: Record<string, Level> = {};
    levelPaused = false;

    constructor(
        public app: Application,
        public gameView: Container,
    ) {
        this.app.ticker.add(() => {
            if (!this.levelPaused) {
                if (this.currentLevel) {
                    this.currentLevel.update();
                }
            }
        });

    }

    levelPause() {
        this.levelPaused = true;
    }

    levelResume() {
        this.levelPaused = false;
    }

    enterLevel(levelId: string) {
        this.app.ticker.stop();
        if (this.currentLevel) {
            const currentLevel = this.currentLevel;
            this.currentLevel = undefined;
            currentLevel.dispose();
            getRunnerApp().disposeGameView();
        }

        const currentLevel = this.levelMap[levelId];
        if (!currentLevel) {
            throw new Error(`cannot found level ${levelId}`);
        }

        currentLevel.init(this.gameView);
        this.currentLevel = currentLevel;
        this.app.ticker.start();
    }

    registerLevel(name: string, level: Level) {
        this.levelMap[name] = level;
    }
}