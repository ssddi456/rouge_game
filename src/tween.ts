import { AnimatedSprite } from "pixi.js";


export default function tween(func: (this: AnimatedSprite, value: number) => void, options = {
    speedFactor: 1,
}) {
    let passedFrame = 0;
    return function name(this: AnimatedSprite, frame:number) {
        const totalFrames = Math.floor(this.totalFrames * options.speedFactor);
        passedFrame = passedFrame + 1;
        if (passedFrame === totalFrames) {
            console.log(passedFrame, totalFrames)
            passedFrame = 0;
        }
        const percent = passedFrame / totalFrames;
        return func.call(this, percent);
    }
}

// https://easings.net/

export function easeInQuart(x: number): number {
    return x * x * x * x;
}

export function easeInExpo(x: number): number {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}