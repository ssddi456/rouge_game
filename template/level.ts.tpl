import { Container, Application } from "pixi.js";
import { Level } from "../level";

export class <%= (templateName[0].toUpperCase() + templateName.slice(1)) %>Level implements Level {
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
