import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { cloneAnimationSprite } from "../sprite_utils";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;
            const hitAnimateMap = await loadSpriteSheet(app.loader, 'crosscode_hiteffect');

            [
                {
                    animation: hitAnimateMap.hit_2,
                    position: [800, 50],
                    scale: 2,
                },
                {
                    animation: hitAnimateMap.hit_5,
                    position: [950, 50],
                    scale: 2,
                },
                {
                    animation: hitAnimateMap.hit_8,
                    position: [1100, 50],
                    scale: 2,
                },
                {
                    animation: hitAnimateMap.hit_11,
                    position: [1250, 50],
                    scale: 2,
                },
                {
                    animation: hitAnimateMap.hit_14,
                    position: [1250, 50],
                    scale: 2,
                },
            ].forEach(x => {
                const item = animateContainer.addChild(cloneAnimationSprite(x.animation));
                item.position.set(...x.position);
                item.anchor.set(0.5, 0.5);
                item.scale.set(x.scale, x.scale);
                item.play();

            })

            return function () {

            }
        }
    });

export default context.initDemo