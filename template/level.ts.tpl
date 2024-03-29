import { Container, Application } from "pixi.js";
import { Level } from "../level";
import { HotClass } from "../helper/class_reloader";

@HotClass({ module })
export class <%= camelCasetemplateName %>Level implements Level {
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
