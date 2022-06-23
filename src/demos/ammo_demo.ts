import { AnimatedSprite, Application, Container, Graphics, Point, Renderer } from "pixi.js";
import { AmmoPool } from "../ammo";
import { Camera } from "../camara";
import { CollisionView } from "../drawCollisions";
import { loadSpriteSheet } from "../loadAnimation";
import { Player } from "../player";
import { Vector } from "../vector";

let app: Application = module.hot?.data?.app;
let animateContainer: Container = module.hot?.data?.animateContainer || new Container();
let tickerFunction: (this: any, dt: number) => any;
animateContainer.position.set(0, 0);

export default function initDemo(_app: Application) {
    app = _app;
    initScence();
}

async function initScence(){
    if (!app) {
        return;
    }
    app.stage.addChild(animateContainer);
    const hitAnimateMap = await loadSpriteSheet(app.loader, 'crosscode_hiteffect');


    const ammoG = new Graphics();
    ammoG.beginFill(0xffffff);
    ammoG.drawCircle(0, 5, 5);
    ammoG.endFill();

    const triangle = new Graphics();
    triangle.beginFill(0xffffff);
    triangle.drawPolygon([
        new Point(0, 0),
        new Point(10, 5),
        new Point(0, 10),
    ]);
    triangle.endFill();

    const triangleT = app.renderer.generateTexture(triangle);
    const ammoA = new AnimatedSprite([app.renderer.generateTexture(ammoG)]);


    const camara = new Camera(
        ({
            position: new Vector(500, 500),
        } as any) as Player,
        new Vector(1000, 1000),
    );

    const ammoPool = new AmmoPool(
        ammoA,
        triangleT,
        animateContainer,
        hitAnimateMap.hit_1
    );

    const ammos = new AmmoPool(
        ammoA,
        triangleT,
        animateContainer,
        hitAnimateMap.hit_1
    );

    for (let index = 0; index < 10; index++) {
        const ammo = ammoPool.emit(
            new Vector(0, 0.3),
            new Vector(60 + 20 * index, 10),
            1000
        )!;
        for (let jndex = 0; jndex < index * 10; jndex++) {
            ammo.update();
        }
        camara.updateItemPos(ammo);
    }

    const collisionView = new CollisionView(
        app.renderer as Renderer,
        app.stage,
        camara, ammoPool.pool);

    for (let index = 0; index < ammoPool.pool.length; index++) {
        const ammo = ammoPool.pool[index];
        camara.updateItemPos(ammo);
    }
    collisionView.update();


    ammos.emit(
        new Vector(0, 1),
        new Vector(200, 10),
        600
    );
    tickerFunction = function () {
        // ammos.update();
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
