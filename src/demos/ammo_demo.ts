import { AnimatedSprite, Application, Container, Graphics, Point, Renderer } from "pixi.js";
import { AmmoPool } from "../ammo";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { CollisionView } from "../drawCollisions";
import { DropletPool } from "../droplet";
import { Enemy, EnemyPool } from "../enemy";
import { loadSpriteSheet } from "../loadAnimation";
import { Particle } from "../particle";
import { Player } from "../player";
import { getRunnerApp } from "../runnerApp";
import { cloneAnimationSprite } from "../sprite_utils";
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

    (function () {
        const ammoPool = new AmmoPool(
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
    });
    class EnemyStub extends EnemyPool {
        constructor(
            public spirtes: Record<string, AnimatedSprite>,
            public container: Container,
        ) {
            super(spirtes, container);
            this.spawnTimer = new CountDown(5000, this.spawn);
        }
        spawn = () => {
            this.emit(new Vector(600, 100));
        };
    }
    const enemys = new EnemyStub(
        enemyAnimateMap,
        animateContainer,
    );
    const runnerApp = getRunnerApp();
    runnerApp.setCamera(camara);
    runnerApp.setGameView(animateContainer);
    runnerApp.setEnemys(enemys);
    runnerApp.setDroplets(({
        emit: () => {}
    } as any) as DropletPool);

    const ammos = new AmmoPool(
        ammoA,
        triangleT,
        animateContainer,
        hitAnimateMap.hit_1
    );

    const shootTimer = new CountDown(1000, () => {
        ammos.emit(
            new Vector(1, 0),
            new Vector(400, 80),
            600
        );
        runnerApp.emitDamageParticles(
            new Vector(400, 80),
            1000
        );
        runnerApp.emitParticles(new Vector(400, 80),
            cloneAnimationSprite(hitAnimateMap.hit_1),
            function (this: Particle, percent) {
                const sprite = this.sprite.children[0] as AnimatedSprite;
                if (!sprite.playing) {
                    sprite.play();
                    sprite.animationSpeed = 1 / 6;
                    sprite.onLoop = () => {
                        this.die();
                        sprite.stop();
                    }
                }
            }, -1);
    });

    tickerFunction = function () {
        shootTimer.update();
        ammos.update();

        for (let index = 0; index < ammos.pool.length; index++) {
            const ammo = ammos.pool[index];
            camara.updateItemPos(ammo);
        }
        enemys.update();
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
