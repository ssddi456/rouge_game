import { AnimatedSprite, Container, Graphics, Point, Renderer, SimplePlane, Sprite, Texture } from "pixi.js";
import * as PIXI from 'pixi.js';
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { getImageUrl, loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            const center = new Point(1500, 100);

            const point = animateContainer.addChild(new Graphics());
            point
                .lineStyle(1, 0xff0000, 1)
                .drawCircle(0, 0, 80);
            point.position.set(center.x, center.y);

            const circle = animateContainer.addChild(new Graphics());
            circle.beginFill(0xff0000, 0.4)
                .drawCircle(0, 0, 80);
            circle.filters = [new PIXI.filters.BlurFilter(40, 40)];
            circle.position.set(center.x, center.y);

            const bounds = new PIXI.Rectangle(-100, -100, 100 * 2, 100 * 2);
            const texture = getRunnerApp().getApp().renderer.generateTexture(circle, {
                scaleMode: PIXI.SCALE_MODES.NEAREST,
                resolution: 1,
                region: bounds,
            });

            const copy = animateContainer.addChild(new PIXI.Sprite(texture));
            copy.position.set(center.x + 100, center.y - 100);
            const mist = app.loader.resources?.['mist']?.texture as Texture || await new Promise<Texture>(resolve => {
                app.loader.add('mist', getImageUrl('Purple_Nebula_04-1024x1024.png'))
                    .load((loader, resources) => {
                        resolve(resources.mist.texture!);
                    });
            });
            mist.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            const perlin = app.loader.resources?.['perlin']?.texture as Texture || await new Promise<Texture>(resolve => {
                app.loader.add('perlin', getImageUrl('perlin.png'))
                    .load((loader, resources) => {
                        resolve(resources.perlin.texture!);
                    });
            });
            perlin.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

            const container = animateContainer.addChild(new Container());
            container.position.set(center.x + 300, center.y - 100);
            const perlinSprite = new SimplePlane(perlin, 2, 2);
            perlinSprite.width = 200;
            perlinSprite.height = 200;
            container.addChild(perlinSprite);

            const mask = new PIXI.Sprite(texture);
            mask.mask = perlinSprite;
            container.addChild(mask);

            const mistSprite = animateContainer.addChild(new SimplePlane(mist, 2, 2));
            mistSprite.width = 200;
            mistSprite.height = 200;
            mistSprite.mask = mask;


            const mask2 = new PIXI.Sprite(texture);
            mask2.mask = perlinSprite;
            mask2.scale.set(0.8, 0.8);
            mask2.alpha = 0.3;
            container.addChild(mask2);

            const mistSprite2 = animateContainer.addChild(new SimplePlane(mist, 2, 2));
            mistSprite2.width = 200;
            mistSprite2.height = 200;
            mistSprite2.mask = mask2;

            container.addChild(mistSprite);
            container.addChild(mistSprite2);

            let last = 0;
            let last2 = 0;
            return function () {
                last ++;
                last2 += Math.random() * 2;

                const uvBuffer = perlinSprite.geometry.buffers[1];
                const uvs = uvBuffer.data;
                // move the perlin sprite uv
                for (let i = 0; i < uvs.length; i += 2) {
                    uvs[i] += 0.001;
                    uvs[i + 1] += 0.001;
                }
                uvBuffer.update();

                // move the mist sprite uv
                const mistUvBuffer = mistSprite.geometry.buffers[1];
                const mistUvs = mistUvBuffer.data;
                const delta = 0.001 * (0.4 + Math.sin(last / 90));
                for (let i = 0; i < mistUvs.length; i += 2) {
                    mistUvs[i] += delta;
                    mistUvs[i + 1] += delta;
                }
                mistUvBuffer.update();

                // move randomly in a circle, radius changes over time
                const radius = 30 + Math.sin(last2 / 100) * 20;
                mask2.x = Math.sin(last2 / 100) * radius;
                mask2.y = Math.cos(last2 / 100) * radius;

            }
        }
    });

export default context.initDemo