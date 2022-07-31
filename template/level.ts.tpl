import { Container } from "pixi.js";
import { Level } from "../level";

export class <%= templateName %>Level implements Level {
    constructor(
        public app: Application,
        public getResources: () => Record<string, Record<string, any>>
    ) {

    }

    init(
        gameView: Container,
    ): void {
        
    }
    update(): void {
        
    }
    dispose(): void {
        
    }
}
