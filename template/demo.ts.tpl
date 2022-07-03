import { AnimatedSprite, Application, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
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
    const hitAnimateMap = await loadSpriteSheet(app.loader, 'crosscode_hiteffect');
    const enemyAnimateMap = await loadSpriteSheet(app.loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');

    tickerFunction = function () {

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
    module.hot.accept(['./player_attack'], () => {
        dispose();
        initScence();
    });
    module.hot.dispose((module) => {
        dispose();
        module.app = app;
        module.animateContainer = animateContainer;
    });
}
