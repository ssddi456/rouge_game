import { DisplayObject, Ticker } from "pixi.js";
import { Disposible, } from "../types";

export class IdleJump implements Disposible {

    currentFrame = 0;

    constructor(
        public target: DisplayObject,
        public options: {
            frames: number,
            base: number,
            height: number
        }
    ) {
        Ticker.shared.add(this.handler);
    }

    handler = () => {
        this.currentFrame += 1;
        const realFrame = this.currentFrame % this.options.frames;
        const percent = realFrame / this.options.frames;

        this.target.position.y = this.options.base + Math.sin(percent * Math.PI) * this.options.height;
    }

    dispose(): void {
        Ticker.shared.remove(this.handler);
    }
}