import { Application, Container } from "pixi.js";

export interface Level {
    init(gameView: Container): void;
    update(): void;
    dispose(): void;
}



export class LevelManager {
    currentLevel: Level | undefined = undefined;

    levelMap: Record<string, Level> = {};

    constructor(
        public app: Application,
        public gameView: Container,
    ) {

    }

    enterLevel(levelId: string) {
        this.app.ticker.stop();
        if (this.currentLevel) {
            this.app.ticker.remove(this.currentLevel.update);
            this.currentLevel.dispose();
        }

        const currentLevel = this.levelMap[levelId];
        if (!currentLevel) {
            throw new Error(`cannot found level ${levelId}`);
        }

        this.currentLevel = currentLevel;
        currentLevel.init(this.gameView);
        this.app.ticker.add(this.currentLevel.update);
        this.app.ticker.start();
    }
}