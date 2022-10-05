import clamp from "lodash/clamp";
import { Container, DisplayObject, Graphics, Ticker } from "pixi.js";
import easingsFunctions, { twean } from '../easingFunctions';
import { maskZIndex } from '../groups';
import { getRunnerApp } from "../runnerApp";
import { Disposible, Updatable, UpdatableObject, } from "../types";

export class IdleJump implements Disposible {

    currentFrame = 0;
    disposed: boolean = false;

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
        if (this.disposed) {
            return;
        }
        this.currentFrame += 1;
        const realFrame = this.currentFrame % this.options.frames;
        const percent = realFrame / this.options.frames;

        this.target.position.y = this.options.base + Math.sin(percent * Math.PI) * this.options.height;
    }

    dispose(): void {
        Ticker.shared.remove(this.handler);
    }
}


export class Fade extends UpdatableObject implements Disposible {

    sprite: Graphics;
    startTime: number;
    stopped: boolean = true;

    from: number = 0;
    to: number = 1;
    time: number = 300;

    complete: (() => void) | undefined;

    constructor(
        public container: Container,
        public width: number,
        public height: number,
        public fill = 0x000000
    ) {
        super();

        this.sprite = new Graphics()
            .beginFill(this.fill)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
        this.sprite.visible = true;
        this.sprite.zIndex = maskZIndex;    

        this.container.addChild(this.sprite);
        this.startTime = getRunnerApp().realWorldNow();
    }

    async doFade(
        from: number,
        to: number,
        time: number,
    ) {
        this.startTime = getRunnerApp().realWorldNow();
        this.stopped = false;
        this.from = clamp(from, 0, 1);
        this.to = clamp(to, 0, 1);
        this.time = time;
        return new Promise<void>((resolve) => {
            this.complete = resolve;
        });
    }
    
    update(): void {
        if (this.stopped) {
            return;
        }
        const ct = getRunnerApp().realWorldNow();

        const percent = clamp ((ct - this.startTime) / this.time, 0, 1);
        const realV = twean(this.from, this.to, easingsFunctions.easeOutCubic, percent);


        this.sprite.alpha = realV;
        if (ct > this.startTime + this.time) {
            this.stopped = true;
            this.complete?.();
            this.complete = undefined;
        }
    }

    dispose(): void {
        this.sprite.destroy();
    }
}
