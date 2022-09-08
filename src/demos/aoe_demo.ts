import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { cloneAnimationSprite } from "../sprite_utils";
import { createExplosion } from "../aoe";

let countdown = undefined as (CountDown | undefined);


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

            });

            countdown = new CountDown(3000, () => {
                getRunnerApp().emitAOE(new Vector(600, 200), createExplosion());
                getRunnerApp().emitAOE(new Vector(900, 200), createExplosion({ radius: 90 }));

            });

            return function () {
                countdown!.update();
            }
        },
        dispose() {
            countdown = undefined;
        }
    });

export default context.initDemo