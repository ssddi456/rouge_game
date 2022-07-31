import { Application, Container } from "pixi.js";
import { Level } from "../level";

export class DimmyLevel implements Level {
    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {

    }

    init(
        gameView: Container,
    ): void {
        console.log(gameView.children.length);
    }

    update(): void {
        
    }
 
    dispose(): void {
        
    }
}
