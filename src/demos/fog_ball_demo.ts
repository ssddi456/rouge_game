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
            const center = new Point(1200, 100);

            const point = animateContainer.addChild(new Graphics());

            const bbox = { width: 60, height: 60 };
            const eyeConfig = [
                { size: 1, pos: new Vector(0, 0), rotate: 0 },
                { size: 0.8, pos: new Vector(bbox.width * 0.7, bbox.height * - 0.5), rotate: Math.PI * 1 / 24 },
                { size: 0.8, pos: new Vector(bbox.width * 0.6, bbox.height * 0.5), rotate: 0 },
                { size: 0.6, pos: new Vector(bbox.width * 0.1, bbox.height * - 0.8), rotate: Math.PI * - 1 / 12 },
                { size: 0.6, pos: new Vector(bbox.width * - 0.5, bbox.height * -0.6), rotate: 0 },
                { size: 0.4, pos: new Vector(bbox.width * 0.1, bbox.height * 0.8), rotate: Math.PI * 1 / 6 },
                { size: 0.3, pos: new Vector(bbox.width * 0.6, bbox.height * 0.2), rotate: Math.PI * 1 / 2 },
                { size: 0.3, pos: new Vector(bbox.width * -0.5, bbox.height * 0.5), rotate: Math.PI * 1 / 3 },
            ];
            const eye = animateContainer.addChild(new Graphics());


            function drawMask(graphic: Graphics, offset = 0) {
                const r1 = 30;
                const r2 = 50;
                const r3 = 70;
                const r4 = 90;

                const offsetRad = Math.sin(offset / 30);
                graphic
                    .drawCircle(0, 0, r2 - 10)

                for (let index = 0; index < 6; index++) {
                    const baseRad = index * Math.PI * 120 / 360;
                    const rad = Math.PI * 20 / 360;
                    const start = new Vector(r1, 0).rotate(-rad + baseRad);
                    const end = new Vector(r1, 0).rotate(rad + baseRad);
                    const seg1Rad = - Math.PI / 12 * offsetRad + baseRad;
                    const seg1start = new Vector(r2, 0).rotate(-rad / 3 + seg1Rad);
                    const seg1end = new Vector(r2, 0).rotate(rad / 3 + seg1Rad);
                    const pointer = new Vector(r4, 0).rotate(0 + Math.PI / 36 * offsetRad + baseRad);

                    graphic
                        .moveTo(start.x, start.y)
                        .lineTo(seg1start.x, seg1start.y)
                        .lineTo(pointer.x, pointer.y)
                        .lineTo(seg1end.x, seg1end.y)
                        .lineTo(end.x, end.y)
                }

                const offsetRadOut = Math.cos(offset / 40);

                for (let index = 0; index < 6; index++) {
                    const baseRad = index * Math.PI * 120 / 360 + Math.PI * 60 / 360;
                    const rad = Math.PI * 20 / 360;
                    const start = new Vector(r1 - 10, 0).rotate(-rad + baseRad);
                    const end = new Vector(r1 - 10, 0).rotate(rad + baseRad);
                    const seg1Rad = - Math.PI / 12 * offsetRadOut + baseRad
                    const seg1start = new Vector(r2 + 0, 0).rotate(-rad / 3 + seg1Rad);
                    const seg1end = new Vector(r2 + 0, 0).rotate(rad / 3 + seg1Rad);
                    const seg2Rad = - Math.PI / 24 * offsetRad + baseRad;
                    const seg2start = new Vector(r3 + 10, 0).rotate(-rad / 6 + seg2Rad);
                    const seg2end = new Vector(r3 + 10, 0).rotate(rad / 6 + seg2Rad);
                    const pointer = new Vector(r4 + 10, 0).rotate(0 + Math.PI / 18 * offsetRadOut + baseRad);

                    graphic
                        .moveTo(start.x, start.y)
                        .lineTo(seg1start.x, seg1start.y)
                        .lineTo(seg2start.x, seg2start.y)
                        .lineTo(pointer.x, pointer.y)
                        .lineTo(seg2end.x, seg2end.y)
                        .lineTo(seg1end.x, seg1end.y)
                        .lineTo(end.x, end.y)
                }
            }

            function drawEye(graphic: Graphics, rotate = 0, scale = 1, offset = 0) {
                if (offset < 0) {
                    return;
                }
                const skinColor = 0x05051e;
                const irisColor = 0xffd700;
                const pupilColor = 0x580251;

                const fadeInFrame = 30;
                const totalEyeExistsFrame = 120;
                const coreAppearFrame = 60;
                const exposeFrame = 10;
                const clampedOffset = Math.max(0, offset % (fadeInFrame + totalEyeExistsFrame + exposeFrame));
                const maxOpenRad = Math.PI * 0.33;
                const x = 15 * scale;

                const alpha = clampedOffset < fadeInFrame
                    ? clampedOffset / fadeInFrame
                    : clampedOffset > (totalEyeExistsFrame + fadeInFrame)
                        ? 1 - (clampedOffset - (totalEyeExistsFrame + fadeInFrame)) / exposeFrame
                        : 1;
                graphic
                    .lineStyle({ width: 0 })
                    .beginFill(skinColor, alpha)
                    .drawCircle(0, 0, x * 1.3)

                if (
                    clampedOffset > fadeInFrame
                    && clampedOffset < (totalEyeExistsFrame + fadeInFrame)
                ) {
                    const x1 = Math.cos(rotate - Math.PI) * x;
                    const y1 = - Math.sin(rotate - Math.PI) * x;
                    const x2 = Math.cos(rotate) * x;
                    const y2 = - Math.sin(rotate) * x;

                    // graphic
                    //     .lineStyle({ width: 0 })
                    //     .beginFill(0xffd700)
                    //     .drawCircle(x1, y1, 3)
                    //     .drawCircle(x2, y2, 3)
                    //     .endFill()
                    // draw a half open golden eye with a black pupil
                    const halfRad = maxOpenRad * Math.pow(Math.sin(Math.PI * (clampedOffset - fadeInFrame) / (totalEyeExistsFrame * 2)), 2);
                    const startRad = Math.PI / 2 - halfRad;
                    const endRad = Math.PI - startRad;
                    const r = x / Math.sin(halfRad);
                    const y = r * Math.cos(halfRad);
                    const cx1 = Math.sin(rotate - Math.PI) * y;
                    const cy1 = Math.cos(rotate - Math.PI) * y;
                    const cx2 = Math.sin(rotate) * y;
                    const cy2 = Math.cos(rotate) * y;

                    // graphic
                    //     .lineStyle({ width: 0 })
                    //     .beginFill(0xffd700)
                    //     .drawCircle(cx1, cy1, 3)
                    //     .drawCircle(cx2, cy2, 3)
                    //     .endFill()

                    graphic
                        .lineStyle({ width: 0 })
                        .beginFill(0xffd700)
                        .moveTo(x1, y1)
                        .arc(cx1, cy1, r, startRad - rotate, endRad - rotate,)
                        .moveTo(x2, y2)
                        .arc(cx2, cy2, r, - endRad - rotate, - startRad - rotate,)
                        .endFill()


                    if (
                        clampedOffset > (coreAppearFrame + fadeInFrame)
                    ) {
                        const size = 3 + Math.sin(Math.PI * ((clampedOffset - fadeInFrame) % totalEyeExistsFrame) / (totalEyeExistsFrame * 2)) * 4;
                        graphic
                            .beginFill(pupilColor)
                            .drawCircle(0, 0, size * scale)

                    }
                }

                if (clampedOffset > (totalEyeExistsFrame + fadeInFrame)) {
                    const maxR = x / Math.sin(maxOpenRad);
                    const maxY = maxR * Math.cos(maxOpenRad);
                    const maxCx = Math.sin(rotate - Math.PI) * maxY;
                    const maxCy = Math.cos(rotate - Math.PI) * maxY;
                    const maxStartRad = Math.PI / 2 - maxOpenRad;

                    // draw crack pieces
                    const crackCount = 6;
                    const crackRad = maxOpenRad * 2 / (crackCount + 1);
                    const percent = (clampedOffset - totalEyeExistsFrame - fadeInFrame) / exposeFrame;
                    const cScale = 0.8 + 0.4 * Math.sin(percent * Math.PI / 2)
                    const size = (3 - 1 * percent) * scale;
                    const crackR = maxR * cScale;
                    let centerx1, centery1, centerx2, centery2;
                    let deltaRad;

                    for (let index = 0; index < crackCount; index++) {
                        deltaRad = maxStartRad - rotate + crackRad * (index + 0.5);
                        centerx1 = crackR * Math.cos(deltaRad) + maxCx;
                        centery1 = crackR * Math.sin(deltaRad) + maxCy;
                        centerx2 = crackR * Math.cos(deltaRad) - maxCx;
                        centery2 = crackR * Math.sin(deltaRad) - maxCy;
                        graphic
                            .lineStyle({ width: 0 })
                            .beginFill(irisColor)
                            .drawPolygon([
                                centerx1 - size, centery1 - size,
                                centerx1 + size, centery1 - size,
                                centerx1 + size, centery1 + size,
                                centerx1 - size, centery1 + size,
                            ])
                            .drawPolygon([
                                - centerx1 + size, - centery1 + size,
                                - centerx1 - size, - centery1 + size,
                                - centerx1 - size, - centery1 - size,
                                - centerx1 + size, - centery1 - size,
                            ])

                    }
                }
            }

            drawMask(point
                .lineStyle(1, 0xff0000, 1));



            point.position.set(center.x, center.y);
            eye.position.set(center.x, center.y);
            let eyeLast = 0;
            function updateEye() {
                eyeLast += 1;
                eye.clear();
                drawEye(eye, - Math.PI / 6, 0.3, eyeLast);

                eyeConfig.forEach((config, index) => {
                    eyes[index].clear();
                    drawEye(eyes[index], config.rotate, config.size, eyeLast - index * 20);
                });
            }

            function makeShadeTangle({
                scale = 1,
                alpha = 1,
                minRad = 20,
                deltaRad = 10,
            }) {
                const container = animateContainer.addChild(new Container());
                container.position.set(center.x + 300, center.y - 100);

                const bodyContainer = new Container();
                const body = bodyContainer.addChild(new Graphics());
                body.beginFill(0xff0000, 0.3)
                    .drawCircle(0, 0, 60);
                body.filters = [new PIXI.filters.BlurFilter(30, 30)];
                body.position.set(100, 100);
                // body.cacheAsBitmap = true;

                const tangles = bodyContainer.addChild(new Graphics());
                drawMask(tangles
                    .clear()
                    .beginFill(0xff0000, 0.6));
                tangles.endFill();
                tangles.filters = [new PIXI.filters.BlurFilter(10, 10)];
                // tangles.cacheAsBitmap = true;
                tangles.position.set(100, 100);

                const texture = app.renderer.generateTexture(bodyContainer);
                let sprite = new Sprite(texture);
                container.addChild(sprite);

                // bodyContainer.scale.set(scale, scale);
                bodyContainer.alpha = alpha;

                // container.addChild(bodyContainer);

                // const perlinSprite = new Sprite(perlin);
                // container.addChild(perlinSprite);

                const mistSprite = new SimplePlane(mist, 2, 2);
                mistSprite.width = 200;
                mistSprite.height = 200;
                // mistSprite.filters = [new PIXI.filters.DisplacementFilter(perlinSprite, 10)]
                mistSprite.mask = sprite;
                container.addChild(mistSprite);

                let last = Math.random() * 100;
                let last1 = 0;
                let last2 = 0;
                return {
                    updateTexture() {
                        last1 += Math.random() * 2;
                        drawMask(tangles
                            .clear()
                            .beginFill(0xff0000, 0.8), last1);

                        sprite.destroy({
                            children: true,
                            texture: true,
                            baseTexture: true,
                        });

                        const texture = app.renderer.generateTexture(bodyContainer);
                        sprite = new Sprite(texture);
                        container.addChild(sprite);
                        mistSprite.mask = sprite;

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
                        last2 += (Math.random() * 2 * dir);
                        const radius = minRad + Math.sin(last2 / 120) * deltaRad;

                        return container.position.set(
                            center.x + 300 + Math.sin(last2 / 100) * radius + (1 - scale) * 100,
                            center.y - 100 + Math.cos(last2 / 100) * radius + (1 - scale) * 100,
                        );
                    }
                }
            }

            const tangle1 = makeShadeTangle({});
            const tangle2 = makeShadeTangle({
                scale: 0.8,
                alpha: 0.8,
            });
            const tangle3 = makeShadeTangle({
                scale: 0.6,
                alpha: 1,
            });

            const eyes = eyeConfig.map((config, index) => {
                const e = animateContainer.addChild(new Graphics());
                e.position.set(center.x + config.pos.x + 400, center.y + config.pos.y + 25);
                return e;
            });

            return function () {
                updateEye();

                tangle1.updateTexture();
                tangle1.updateUV();

                tangle2.updateTexture();
                tangle2.updateUV();
                const pos2 = tangle2.updatePosition();
                eyes.slice(3, 6).forEach((e, index) => {
                    const config = eyeConfig[index + 2];
                    e.position.set(pos2.x + config.pos.x + 100, pos2.y + config.pos.y + 100);
                });

                tangle3.updateTexture();
                tangle3.updateUV();
                const pos3 = tangle3.updatePosition(-1);
                eyes.slice(6).forEach((e, index) => {
                    const config = eyeConfig[index + 3];
                    e.position.set(pos3.x + config.pos.x + 100, pos3.y + config.pos.y + 100);
                });
                // move randomly in a circle, radius changes over time
            }
        }
    });

export default context.initDemo