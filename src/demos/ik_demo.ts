import { AnimatedSprite, Application, Container, Geometry, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { line_of_circle_x_circle } from "../ik_utils";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";

let app: Application = module.hot?.data?.app;
let animateContainer: Container = module.hot?.data?.animateContainer || new Container();
let tickerFunction: (this: any, dt: number) => any;
animateContainer.position.set(0, 0);

export default function initDemo(_app: Application) {
    app = _app;
    initScence();
}

async function initScence() {
    if (!app) {
        return;
    }
    app.stage.addChild(animateContainer);

    const geometry = new Graphics();
    geometry.lineStyle({
        width: 3,
        color: 0xffffff
    });
    geometry.moveTo(0, 0);
    geometry.lineTo(30, 0);
    geometry.lineTo(30, 30);
    geometry.beginHole();
    geometry.drawCircle(0, 0, 10);
    geometry.drawCircle(30, 0, 10);
    geometry.drawCircle(30, 30, 10);
    animateContainer.addChild(geometry);
    geometry.position.x = 150;
    geometry.position.y = 10;

    const points: Vector[] = [
        new Vector(0, 0),
        new Vector(30, 0),
        new Vector(30, 0),
        new Vector(30, 0),
    ];

    const center = [60, -60];
    const r = 10;
    const startPoint = points[0];
    const jointPoint1 = points[1];
    const jointPoint2 = points[2];
    const endPoint = points[3];
    let frame = 0;
    const totalFrame = 100;

    function redraw(){
        geometry.clear();
        geometry.lineStyle({
            width: 3,
            color: 0xffffff
        });
        frame ++;

        const theta = (frame % totalFrame) * 2 * Math.PI / totalFrame;
        endPoint.x = center[0] + r * Math.cos(theta);
        endPoint.y = center[1] + r * Math.sin(theta);

        const mayJointPoints1 = line_of_circle_x_circle(
            [startPoint.x, startPoint.y, 40],
            [endPoint.x, endPoint.y, 70]
        );
        jointPoint1.x = mayJointPoints1[1][0];
        jointPoint1.y = mayJointPoints1[1][1];

        const mayJointPoints2 = line_of_circle_x_circle(
            [startPoint.x, startPoint.y, 70],
            [endPoint.x, endPoint.y, 40]
        );
        jointPoint2.x = mayJointPoints2[1][0];
        jointPoint2.y = mayJointPoints2[1][1];

        geometry.moveTo(points[0].x + 30, points[0].y + 60);
        for (let index = 1; index < points.length; index++) {
            const element = points[index];
            geometry.lineTo(element.x, element.y);
        }
        geometry.beginHole();

        geometry.drawCircle(points[0].x + 30, points[0].y + 60, 10);
        for (let index = 0; index < points.length; index++) {
            const element = points[index];
            geometry.drawCircle(element.x, element.y, 10);
        }
    }

    animateContainer.addChild(geometry);
    geometry.position.x = 150;
    geometry.position.y = 100;


    tickerFunction = function () {
        redraw();
    };
    app.ticker.add(tickerFunction);
}

initScence()

function dispose() {
    animateContainer.removeChildren();
    app.ticker.remove(tickerFunction);
}

if (module.hot) {
    module.hot.accept();
    module.hot.dispose((module) => {
        dispose();
        module.app = app;
        module.animateContainer = animateContainer;
    });
}
