import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { drawPoint, drawSegs, updateTentacleSegs } from "../tentacle_helper";

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

            function updateTentacleDragForceSegs(dir: Vector, segs: { rotate: number, length: number }[], debug: boolean = false) {
                const segCount = segs.length - 1;
                const waveCount = 0.8;
                const startRad = Math.PI * (1 - waveCount);

                const percent = 1 - Math.min(dir.length / getSegsLength(segs), 1);

                const infos = debug ? [] as number[] : undefined;

                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    const _percent = 0.3 * percent * Math.cos(waveCount * index / segCount * Math.PI * 2 + startRad)
                    if (debug) {
                        infos!.push(_percent);
                    }
                    element.rotate -= element.rotate * _percent;
                }
                if (debug) {
                    console.log(...infos!);
                }
            }

            function updateTentacleBackAndForward(segs: { rotate: number, length: number }[], dir: number, debug: boolean = false) {
                if (dir == 0) {
                    return;
                }

                const len = segs.length;
                for (let index = 0; index < segs.length; index++) {
                    const percent = dir * Math.cos(index / (len - 1) * Math.PI) * (len - 1 - index) / (len - 1);

                    segs[index].rotate -= segs[index].rotate * percent;
                }
            }

            function getSegsLength(segs: { rotate: number, length: number }[]) {
                return segs.reduce((prev, cur) => prev + cur.length, 0);
            }



            function drawCurve(graphic: Graphics, func: (k: number) => number, color: number = 0x00ff00) {
                graphic.lineStyle(1, 0x00fff0);
                graphic.moveTo(0, 0);
                graphic.lineTo(1300, 0);

                graphic.lineStyle(1, color);
                graphic.moveTo(0, func(0));
                for (let index = 0; index < 1252; index++) {
                    const k = index;
                    graphic.lineTo(k, func(k) * 20);
                }

            }
            // updateTentacleSegs(root, target, segs);
            // updateTentacleSegs(root, target2, segs1);
            // updateTentacleSegs(root, target3, segs2);
            // updateTentacleSegs(root, target2, segs3);
            const dir3 = target3.clone().sub(root);
            updateTentacleSegs(dir3, segs4)
            updateTentacleDragForceSegs(dir3, segs4, true);
            updateTentacleBackAndForward(segs4, 0);
            // updateTentacleSwingSegs(0, segs4);
            const segsEl = animateContainer.addChild(new Graphics());
            const segsEl1 = animateContainer.addChild(new Graphics());
            segsEl1.position.set(100, 300);
            segsEl1.clear();

            const curve = (last: number) => {
                const seg1 = 200;
                const seg2 = seg1 + 25; // back
                const seg3 = seg2 + 12; // punch
                const seg4 = seg3 + 12; // stay
                const seg5 = seg4 + 12; // back
                const seg6 = seg5 + 25; // back to stable
                const seg7 = seg6 + 100;

                last = last % seg7;
                const max = 2.5;
                const min = -0.5;
                const stable = 0.75;

                // 
                if (last < seg1 || last >= seg7) {
                    return min * (stable + (1 - stable) * Math.sin(last / 50 * Math.PI));
                } else if (last < seg2) {
                    return 1 * min * Math.sin((last - seg1) / 50 * Math.PI) + stable * min;
                } else if (last < seg3) {
                    return max * Math.sin((last - seg2) / 25 * Math.PI) + stable * min;
                } else if (last < seg4) {
                    return max + stable * min;
                } else if (last < seg5) {
                    return - max * Math.cos((last - seg4 + 25) / 25 * Math.PI) + stable * min;
                }

                return min * (0.75 + (1 - stable) * Math.sin(last / 50 * Math.PI));
            }

            const curveMergeIdleAttack = (last: number) => {
                const segIdle = 100;
                const seg1 = 150;
                const seg2 = seg1 + 25 + 50; // back
                const seg3 = seg2 + 12; // punch
                const seg4 = seg3 + 12; // stay
                const seg5 = seg4 + 12; // back
                const seg6 = seg5 + 25; // back to stable
                const seg7 = seg6 + 100;

                last = last % seg7;

                if (last < segIdle) {
                    return 1;
                } else if (last < seg1) {
                    return 1 - Math.pow(Math.sin((last - segIdle) / 50 * Math.PI / 2), 2);
                } else if (last < seg6) {
                    return 0;
                } else if (last < seg7) {
                    return Math.pow((last - seg6) / 100, 2)
                }
                return 1;
            }


            drawCurve(segsEl1, curve);
            drawCurve(segsEl1, curveMergeIdleAttack, 0x666600);

            segsEl.clear();
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

                target3.y = 450 + 120 * curve(last);
                const dir3 = target3.clone().sub(root);

                updateTentacleSegs(dir3, segs4);
                // updateTentacleSegs(dir3, segs4_1);

                updateTentacleDragForceSegs(dir3, segs4);
                // updateTentacleBackAndForward(segs4, -curve(last));
                // updateTentacleSwingSegs(startRad, segs4);

                segsEl.clear()
                drawSegs(segsEl, root, segs4);
                drawSegs(segsEl, root, segs1);
                // drawSegs(segsEl, root, segs4_1);
                drawPoint(segsEl, target3);

            }
        }
    });

export default context.initDemo
