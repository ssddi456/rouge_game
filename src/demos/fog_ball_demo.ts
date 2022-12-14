import { AnimatedSprite, Container, DisplayObject, Graphics, Point, Renderer, SimplePlane, Sprite, Texture } from "pixi.js";
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
            const mist = app.loader.resources?.['mist']?.texture as Texture || await new Promise<Texture>(resolve => {
                app.loader.add('mist', getImageUrl('Purple_Nebula_04-1024x1024.png'))
                    .load((loader, resources) => {
                        resolve(resources.mist.texture!);
                    });
            });
            mist.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            const perlin = app.loader.resources?.['perlin']?.texture as Texture || await new Promise<Texture>(resolve => {
                app.loader.add('perlin', getImageUrl('perlin.jpg'))
                    .load((loader, resources) => {
                        resolve(resources.perlin.texture!);
                    });
            });
            perlin.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            const center = new Point(0, 0);

            const point = animateContainer.addChild(new Graphics());

            function drawMask(graphic: Graphics, offset = 0) {
                const r1 = 30;
                const r2 = 50;
                const r3 = 90;

                const offsetRad = Math.sin(offset / 30);
                graphic
                    .drawCircle(0, 0, r2 - 10)

                // for (let index = 0; index < 6; index++) {
                //     const baseRad = index * Math.PI * 120 / 360;
                //     const rad = Math.PI * 20 / 360;
                //     const start = new Vector(r1, 0).rotate(-rad + baseRad);
                //     const end = new Vector(r1, 0).rotate(rad + baseRad);
                //     const seg1Rad = - Math.PI / 12 * offsetRad + baseRad
                //     const seg1start = new Vector(r2, 0).rotate(-rad / 3 + seg1Rad );
                //     const seg1end = new Vector(r2, 0).rotate(rad / 3 + seg1Rad);
                //     const pointer = new Vector(r3, 0).rotate(0 + Math.PI / 36 * offsetRad + baseRad);
                    
                //     graphic
                //         .moveTo(start.x, start.y)
                //         .lineTo(seg1start.x, seg1start.y)
                //         .lineTo(pointer.x, pointer.y)
                //         .lineTo(seg1end.x, seg1end.y)
                //         .lineTo(end.x, end.y)
                // }
                
                // const offsetRadOut = Math.cos(offset / 40);

                // for (let index = 0; index < 6; index++) {
                //     const baseRad = index * Math.PI * 120 / 360 + Math.PI * 60 / 360;
                //     const rad = Math.PI * 20 / 360;
                //     const start = new Vector(r1 + 10, 0).rotate(-rad + baseRad);
                //     const end = new Vector(r1 + 10, 0).rotate(rad + baseRad);
                //     const seg1Rad = - Math.PI / 12 * offsetRadOut + baseRad
                //     const seg1start = new Vector(r2 + 20, 0).rotate(-rad / 3 + seg1Rad);
                //     const seg1end = new Vector(r2 + 20, 0).rotate(rad / 3 + seg1Rad);
                //     const pointer = new Vector(r3 + 30, 0).rotate(0 + Math.PI / 18 * offsetRadOut + baseRad);

                //     graphic
                //         .moveTo(start.x, start.y)
                //         .lineTo(seg1start.x, seg1start.y)
                //         .lineTo(pointer.x, pointer.y)
                //         .lineTo(seg1end.x, seg1end.y)
                //         .lineTo(end.x, end.y)
                // }
            }

            drawMask(point
                .lineStyle(1, 0xff0000, 1));
            point.position.set(center.x, center.y);
            


            
            function makeShadeTangle({
                scale = 1,
                alpha = 1,
                minRad = 20,
                deltaRad = 10,
            }){
                const container = animateContainer.addChild(new Container());
                // container.position.set(center.x + 300, center.y - 100);

                const bodyContainer = new Container();
                const body = bodyContainer.addChild(new Graphics());
                body.beginFill(0xff0000, 0.3)
                    .drawCircle(0, 0, 90);
                body.filters = [new PIXI.filters.BlurFilter(30, 30)];
                // body.position.set(100, 100);
                body.cacheAsBitmap = true;

                const tangles = bodyContainer.addChild(new Graphics());
                drawMask(tangles
                    .clear()
                    .beginFill(0xff0000, 0.6));
                tangles.endFill();
                tangles.filters = [new PIXI.filters.BlurFilter(10, 10)];
                body.cacheAsBitmap = true;
                // tangles.position.set(100, 100);

                bodyContainer.scale.set(scale, scale);
                bodyContainer.alpha = alpha;

                container.addChild(bodyContainer);

                // const perlinSprite = new Sprite(perlin);
                // container.addChild(perlinSprite);

                const mistSprite = new SimplePlane(mist, 2, 2);
                mistSprite.width = 200;
                mistSprite.height = 200;
                // mistSprite.filters = [new PIXI.filters.DisplacementFilter(perlinSprite, 10)]
                // mistSprite.mask = bodyContainer;
                // container.addChild(mistSprite);

                let last = 0;
                let last1 = 0;
                let last2 = 0;
                return {
                    updateTexture() {
                        last1 ++;
                        drawMask(tangles
                            .clear()
                            .beginFill(0xff0000, 0.6), last1);
                    },
                    updateUV() {
                        last += Math.random() * 2;
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
                    updatePosition(dir: number = 1) {
                        // last2 += (Math.random() * 2 * dir);
                        // const radius = minRad + Math.sin(last2 / 120) * deltaRad;
                        // mask.x = Math.sin(last2 / 100) * radius + (1 - scale) * 100;
                        // mask.y = Math.cos(last2 / 100) * radius + (1 - scale) * 100;
                    }
                }
            }

            const tangle1 = makeShadeTangle({});
            // const tangle2 = makeShadeTangle({
            //     scale: 0.8,
            //     alpha: 1,
            // });
            // const tangle3 = makeShadeTangle({
            //     scale: 0.6,
            //     alpha: 1,
            // });

            return function () {

                tangle1.updateTexture();
                tangle1.updateUV();

                // tangle2.updateTexture(texture);
                // tangle2.updateUV();
                // tangle2.updatePosition();

                // tangle3.updateTexture(texture);
                // tangle3.updateUV();
                // tangle3.updatePosition(-1);

                // move randomly in a circle, radius changes over time


            }
        }
    });

export default context.initDemo