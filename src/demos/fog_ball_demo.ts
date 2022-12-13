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

            function drawMask(graphic: Graphics) {
                const r1 = 30;
                const r2 = 60;
                const r3 = 90;

                
                graphic
                    .drawCircle(0, 0, r2)

                for (let index = 0; index < 6; index++) {
                    const baseRad = index * Math.PI * 120 / 360;
                    const rad = Math.PI * 20 / 360;
                    const start = new Vector(r1, 0).rotate(-rad + baseRad);
                    const end = new Vector(r1, 0).rotate(rad + baseRad);
                    const seg1start = new Vector(r2, 0).rotate(-rad / 3 - Math.PI / 12 + baseRad);
                    const seg1end = new Vector(r2, 0).rotate(rad / 3 - Math.PI / 12 + baseRad);
                    const pointer = new Vector(r3, 0).rotate(0 + baseRad);
                    
                    graphic
                        .moveTo(start.x, start.y)
                        .lineTo(seg1start.x, seg1start.y)
                        .lineTo(pointer.x, pointer.y)
                        .lineTo(seg1end.x, seg1end.y)
                        .lineTo(end.x, end.y)
                }

                for (let index = 0; index < 6; index++) {
                    const baseRad = index * Math.PI * 120 / 360 + Math.PI * 60 / 360;
                    const rad = Math.PI * 20 / 360;
                    const start = new Vector(r1 + 10, 0).rotate(-rad + baseRad);
                    const end = new Vector(r1 + 10, 0).rotate(rad + baseRad);
                    const seg1start = new Vector(r2 + 20, 0).rotate(-rad / 3 - Math.PI / 36 + baseRad);
                    const seg1end = new Vector(r2 + 20, 0).rotate(rad / 3 - Math.PI / 36 + baseRad);
                    const pointer = new Vector(r3 + 30, 0).rotate(0 + baseRad);

                    graphic
                        .moveTo(start.x, start.y)
                        .lineTo(seg1start.x, seg1start.y)
                        .lineTo(pointer.x, pointer.y)
                        .lineTo(seg1end.x, seg1end.y)
                        .lineTo(end.x, end.y)
                }
            }

            drawMask(point
                .lineStyle(1, 0xff0000, 1))
                ;
            point.position.set(center.x, center.y);

            const circle = animateContainer.addChild(new Graphics());
            drawMask(circle
                .clear()
                .beginFill(0xff0000, 0.4));
            circle.endFill();
            circle.filters = [new PIXI.filters.BlurFilter(20, 20)];
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

            function makeShadeTangle({
                scale = 1,
                alpha = 1,
                minRad = 20,
                deltaRad = 10,
            }){
                const mask = new PIXI.Sprite(texture);
                mask.scale.set(scale, scale);
                mask.alpha = alpha;
                container.addChild(mask);
    
                const mistSprite = animateContainer.addChild(new SimplePlane(mist, 2, 2));
                mistSprite.width = 200;
                mistSprite.height = 200;
                mistSprite.mask = mask;
                container.addChild(mistSprite);

                let last = 0;
                return {
                    updateUV() {
                        last++;
                        // move the mist sprite uv
                        const mistUvBuffer = mistSprite.geometry.buffers[1];
                        const mistUvs = mistUvBuffer.data;
                        const delta = 0.001 * (0.8 + Math.sin(last / 90));
                        for (let i = 0; i < mistUvs.length; i += 2) {
                            mistUvs[i] += delta;
                            mistUvs[i + 1] += delta;
                        }
                        mistUvBuffer.update();
                    },
                    updatePosition() {
                        last += Math.random() * 2;
                        const radius = minRad + Math.sin(last / 120) * deltaRad;
                        mask.x = Math.sin(last / 100) * radius + (1 - scale) * 100;
                        mask.y = Math.cos(last / 100) * radius + (1 - scale) * 100;
                    }
                }
            }

            const tangle1 = makeShadeTangle({});
            const tangle2 = makeShadeTangle({
                scale: 0.8,
                alpha: 0.6,
            });
            const tangle3 = makeShadeTangle({
                scale: 0.6,
                alpha: 0.6,
            });
            return function () {

                const uvBuffer = perlinSprite.geometry.buffers[1];
                const uvs = uvBuffer.data;
                // move the perlin sprite uv
                for (let i = 0; i < uvs.length; i += 2) {
                    uvs[i] += 0.001;
                    uvs[i + 1] += 0.001;
                }
                uvBuffer.update();
                tangle1.updateUV();

                tangle2.updatePosition();

                tangle3.updatePosition();

                // move randomly in a circle, radius changes over time


            }
        }
    });

export default context.initDemo