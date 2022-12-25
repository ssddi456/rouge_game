import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { drawSegs, updateTentacleSegs } from "../tentacle_helper";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;
            const offset = new Vector(200, 200);
            const root = offset.clone().add(new Vector(0, 0));
            const target = offset.clone().add(new Vector(30, 30));
            const target2 = offset.clone().add(new Vector(0, 330));
            const target3 = offset.clone().add(new Vector(0, 330));

            const segLength = 100;
            const segs = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            const segs1 = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            const segs2 = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            const segs3 = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            const segLength1 = 80;
            const segs4 = [
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
            ];
            const segs4_1 = [
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 },
            ];
            function updateTentacleDragForceSegs(segs: { rotate: number, length: number }[], debug: boolean = false) {
                const segCount = segs.length - 1;
                const startRad = Math.PI * 1 / 4;
                const waveCount = 0.8;
                const infos = debug ? [] as number[] : undefined;

                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    if (debug) {
                        infos!.push(Math.sin(waveCount * index / segCount * Math.PI * 2 + startRad));
                    }
                    element.rotate -= element.rotate * 0.2 * Math.cos(waveCount * index / segCount * Math.PI * 2 + startRad);
                }
                if (debug) {
                    console.log(...infos!);
                }
            }

            function updateTentacleSwingSegs(startRad: number, segs: { rotate: number, length: number }[], debug: boolean = false) {
                const segCount = segs.length - 1;

                const waveRad = 0.05 * Math.PI;
                const waveCount = 0.8;
                const infos = debug ? [] as number[] : undefined;
                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    if (debug) {
                        infos!.push(waveRad * Math.sin(waveCount * index / segCount * Math.PI * 2 + startRad));
                    }
                    element.rotate += waveRad * Math.sin(waveCount * index / segCount * Math.PI * 2 + startRad);
                }
                if (debug) {
                    console.log(...infos!);
                }
            }


            function drawPoint(graphic: Graphics, point: Vector, color: number = 0x00ff00, radius: number = 5) {
                graphic.beginFill(color);
                graphic.drawCircle(point.x, point.y, radius);
                graphic.endFill();
            }


            // updateTentacleSegs(root, target, segs);
            // updateTentacleSegs(root, target2, segs1);
            // updateTentacleSegs(root, target3, segs2);
            // updateTentacleSegs(root, target2, segs3);
            updateTentacleDragForceSegs(segs4, true);
            updateTentacleSwingSegs(0, segs4);
            const segsEl = animateContainer.addChild(new Graphics());


            segsEl.clear()
            // drawSegs(segsEl, root, segs);
            // drawSegs(segsEl, root, segs1);
            // drawSegs(segsEl, root, segs2);
            // drawSegs(segsEl, root, segs3);
            drawSegs(segsEl, root, segs4);
            // drawSegs(segsEl, root, segs4_1);
            drawPoint(segsEl, target2);

            const targetEl = animateContainer.addChild(new Graphics());
            targetEl.beginFill(0x00ff00)
                .drawCircle(target.x, target.y, 3)

            let last = 0;
            let startRad = 0;
            return function () {
                last++;
                startRad += 0.1 * Math.PI / 6;
                updateTentacleSegs(root, target3, segs4);
                updateTentacleSegs(root, target3, segs4_1);

                updateTentacleDragForceSegs(segs4);
                updateTentacleSwingSegs(startRad, segs4);

                segsEl.clear()
                drawSegs(segsEl, root, segs4);
                // drawSegs(segsEl, root, segs4_1);
                drawPoint(segsEl, target2);

            }
        }
    });

export default context.initDemo
