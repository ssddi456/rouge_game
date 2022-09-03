import { Application, Container } from "pixi.js";
import { Level } from "../level";

export class DimmyLevel extends Level {

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
