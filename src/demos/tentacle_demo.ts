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

            const segLength1 = 60;

            const segs4 = [
                { rotate: 0, length: segLength1 },
                { rotate: 0, length: segLength1 * 0.9 },
                { rotate: 0, length: segLength1 * 0.8 },
                { rotate: 0, length: segLength1 * 0.7 },
            ];

            function updateTentacleSwingSegs(root: Vector, target: Vector, startRad: number, segs: { rotate: number, length: number }[]) {
                const rad = Vector.AB(root, target).rad();
                const segCount = segs.length - 1;

                const waveRad = 0.05 * Math.PI;
                const waveCount = 0.8;
                
                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    element.rotate = rad + waveRad * Math.sin(waveCount * index / segCount * Math.PI * 2 + startRad);
                }
            }


            function drawPoint(graphic: Graphics, point: Vector, color: number = 0x00ff00, radius: number = 5 ) {
                graphic.beginFill(color);
                graphic.drawCircle(point.x, point.y, radius);
                graphic.endFill();
            }


            updateTentacleSegs(root, target, segs);
            updateTentacleSegs(root, target2, segs1);
            updateTentacleSegs(root, target3, segs2);
            updateTentacleSegs(root, target2, segs3);

            updateTentacleSwingSegs(root, target3, 0, segs4);
            const segsEl = animateContainer.addChild(new Graphics());


            segsEl.clear()
            // drawSegs(segsEl, root, segs);
            // drawSegs(segsEl, root, segs1);
            // drawSegs(segsEl, root, segs2);
            // drawSegs(segsEl, root, segs3);
            drawSegs(segsEl, root, segs4);
            drawPoint(segsEl, target2);

            const targetEl = animateContainer.addChild(new Graphics());
            targetEl.beginFill(0x00ff00)
                .drawCircle(target.x, target.y, 3)

            let last = 0;
            let startRad = 0;
            return function () {
                last ++;
                startRad += 0.1 * Math.PI / 6;
                updateTentacleSwingSegs(root, target3, startRad, segs4);

                segsEl.clear()
                drawSegs(segsEl, root, segs4);
                drawPoint(segsEl, target2);

            }
        }
    });

export default context.initDemo
