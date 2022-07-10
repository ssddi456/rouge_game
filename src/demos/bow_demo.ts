import { AnimatedSprite, Application, Container, Graphics, Point, Renderer } from "pixi.js";
import { Bow1, Bow2, Bow3, Bow4, Bow5 } from "../bow";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { mouse } from "../user_input";
import { Gun1, Gun2, Gun3, Gun4, Gun5 } from "../gun";

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
    const bowAnimateMap = await loadSpriteSheet(app.loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow');
    const gunAnimateMap = await loadSpriteSheet(app.loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun');

    const bows: Bow1[] = [];
    const guns: Gun1[] = [];

    function addBow(bowConstructor: new (map: Record<string, AnimatedSprite>) => Bow1) {

        const bow1 = new bowConstructor(bowAnimateMap);

        const bowContainer = new Container();

        bow1.position.x = 1000 + bows.length * 200;
        bow1.position.y = 100;
        bowContainer.addChild(bow1.sprite);
        animateContainer.addChild(bowContainer);
        bows.push(bow1);
    }

    function addGun(gunConstructor: new (map: Record<string, AnimatedSprite>) => Gun1) {

        const gun1 = new gunConstructor(gunAnimateMap);

        const gunContainer = new Container();
        gunContainer.rotation = -1 * Math.PI / 2;

        gun1.position.x = gunContainer.position.x = 1100 + guns.length * 150;
        gun1.position.y = gunContainer.position.y = 300;
        gunContainer.addChild(gun1.sprite);
        animateContainer.addChild(gunContainer);
        guns.push(gun1);
    }
    addBow(Bow1);
    addBow(Bow2);
    addBow(Bow3);
    addBow(Bow4);
    addBow(Bow5);

    addGun(Gun1);
    addGun(Gun2);
    addGun(Gun3);
    addGun(Gun4);
    addGun(Gun5);

    const totalFrame = 120;
    let currentFrame = 0;
    const runnerApp = getRunnerApp();

    console.log(bows.length);

    tickerFunction = function () {
        currentFrame++;
        if (currentFrame >= totalFrame) {
            currentFrame = 0;
        }

        for (let index = 0; index < bows.length; index++) {
            const bow = bows[index];
            bow.update();
        }

        for (let index = 0; index < guns.length; index++) {
            const gun = guns[index];
            gun.update();
        }
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
    module.hot.accept([
        '../bow',
        '../gun'
    ], () => {
        dispose();
        initScence();
    });
    module.hot.dispose((module) => {
        dispose();
        module.app = app;
        module.animateContainer = animateContainer;
    });
}
