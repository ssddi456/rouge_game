import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
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
            const offset = new Vector(200, 200);
            const root = offset.clone().add( new Vector(0, 0));
            const target = offset.clone().add( new Vector(0, 30));
            const target2 = offset.clone().add( new Vector(0, 130));

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
            ]; 

            function updateSegs(root: Vector, target: Vector, segs: { rotate: number, length: number }[]){
                const dir = target.clone().sub(root);
                const dirLength = dir.length;
                const dirRotate = dir.rad();
                const segsLength = segs.reduce((prev, curr) => prev + curr.length, 0);
                const segsRotate = segs.reduce((prev, curr) => prev + curr.rotate, 0);

                const diffLength = dirLength - segsLength;
                if (diffLength >= 0) {
                    for (let index = 0; index < segs.length; index++) {
                        const element = segs[index];
                        element.rotate = dirRotate;
                    }
                } else {
                    // wrap segs rotate
                    if (segs.length % 2 === 0) {
                        const deltaLength = dirLength / segs.length;
                        const segsRotatePerSeg = Math.acos(deltaLength / segLength);
                        for (let index = 0; index < segs.length; index++) {
                            const element = segs[index];
                            if (index >= segs.length / 2) {
                                element.rotate = - segsRotatePerSeg;
                            } else {
                                element.rotate = segsRotatePerSeg;
                            }
                        }
                    } else {
                        const evenDiffLength = dirLength - segLength;
                        const segsRotatePerSeg = Math.asin(Math.abs(evenDiffLength / (segs.length - 1) / segLength));
                        const dir = evenDiffLength < 0 ? 1 : -1;
                        console.log('segsRotatePerSeg', segsRotatePerSeg, evenDiffLength, dirLength, segLength, evenDiffLength / (segs.length - 1), dir);
                        let currentRad = 0;
                        for (let index = 0; index < segs.length; index++) {
                            const element = segs[index];
                            if (index > segs.length / 2) {
                                element.rotate = - Math.PI / 2 - segsRotatePerSeg * dir
                                currentRad += element.rotate;
                            } else if (index < (segs.length - 1) / 2) {
                                element.rotate = Math.PI / 2 + segsRotatePerSeg * dir;
                                console.log('element.rotate', element.rotate, 'segsRotatePerSeg', segsRotatePerSeg);
                                currentRad += element.rotate;
                            } else {
                                element.rotate = 0;
                                currentRad = Math.PI / 2;
                            }

                        }
                    }
                }
            }

            updateSegs(root, target, segs);
            updateSegs(root, target2, segs1);
            updateSegs(root, target, segs2);

            const segsEl = animateContainer.addChild(new Graphics());

            function drawSegs(graphic: Graphics, segs: { rotate: number, length: number }[]){
                let nextPoint = root.clone();
                segsEl.beginFill(0xff0000)
                    .drawCircle(nextPoint.x, nextPoint.y, 3)
                    .endFill()
    
                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    const _nextPoint = nextPoint.clone()
                    .add(new Vector(
                        Math.sin(element.rotate) * element.length, 
                        Math.cos(element.rotate) * element.length
                    ));
                    segsEl.beginFill(0xff0000)
                        .drawCircle(_nextPoint.x, _nextPoint.y, 3)
                        .endFill()
                    segsEl
                        .lineStyle(1, 0xff0000)
                        .moveTo(nextPoint.x, nextPoint.y)
                        .lineTo(
                            _nextPoint.x,
                            _nextPoint.y,
                        );
                    nextPoint = _nextPoint;
                }
            }
            segsEl.clear()
            // drawSegs(segsEl, segs);
            // drawSegs(segsEl, segs1);
            drawSegs(segsEl, segs2);

            const targetEl = animateContainer.addChild(new Graphics());
            targetEl.beginFill(0x00ff00)
                .drawCircle(target.x, target.y, 3)

            return function () {

            }
        }
    });

export default context.initDemo