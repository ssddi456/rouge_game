import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { pointsCircleAround } from "../helper/emit_utils";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            const startPos = new Vector(500, 1100);
            
            const points1 = animateContainer.addChild(new Graphics);
            points1.beginFill(0xff0000);
            points1.drawCircle(startPos.x, startPos.y, 2);
            points1.endFill();
            const radius = 100;
            const seg = 20;

            const pointsG = animateContainer.addChild(new Graphics);
            const allPoints: Vector[][] = [];
            const center = startPos.clone().add({ x: 100, y: 100 });
            function showPoints ( ) {
                if (allPoints.length > 4) {
                    allPoints.shift();
                }
                allPoints.forEach(points => {
                    points.forEach(point => {
                        point.add(
                            center.clone().sub(point).normalize().multiplyScalar(seg)
                        );
                    });
                });
                const points = pointsCircleAround(center, 100, 5);
                allPoints.push(points);

                pointsG.clear();
                pointsG.beginFill(0xff0000);

                allPoints.forEach(points => {
                    points.forEach(point => {
                        pointsG.drawCircle(point.x, point.y, 2);
                    });
                });
                
                pointsG.endFill();
            }
            

            showPoints();

            return function (frame: number) {
                if (!(frame % 20)) {
                    showPoints();
                }
            }
        }
    });

export default context.initDemo
