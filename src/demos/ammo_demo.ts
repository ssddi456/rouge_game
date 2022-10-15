import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { AmmoPool } from "../ammo";
import { CountDown } from "../countdown";
import { CollisionView } from "../drawCollisions";
import { DropletPool } from "../droplet";
import { EnemyPool } from "../enemy";
import { ShootManager } from "../shootManager";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { ColorOverlayFilter } from "pixi-filters";
import { BUFFER_EVENTNAME_DEAD } from "../buffer";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

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

            const runnerApp = getRunnerApp();

            const colorOverlay = animateContainer.addChild(new Container());
            colorOverlay.filters = [
                new ColorOverlayFilter(
                    [1, 1, 1],
                    0.8
                )
            ];
            colorOverlay.addChild(enemyAnimateMap.idle_back);

            colorOverlay.position.set(400, 30);

            (function () {
                const camera = runnerApp.getCamera();
                const ammoPool = new AmmoPool(
                    ammoA,
                    triangleT,
                    animateContainer,
                    hitAnimateMap.hit_1
                );

                for (let index = 0; index < 10; index++) {
                    const ammo = ammoPool.emitLast(
                        new Vector(0, 0.3),
                        new Vector(60 + 20 * index, 10),
                        1000,
                        1
                    )!;
                    for (let jndex = 0; jndex < index * 10; jndex++) {
                        ammo.update();
                    }
                    camera.updateItemPos(ammo);
                }

                const collisionView = new CollisionView(
                    app.renderer as Renderer,
                    app.stage,
                    camera, ammoPool.pool);

                for (let index = 0; index < ammoPool.pool.length; index++) {
                    const ammo = ammoPool.pool[index];
                    camera.updateItemPos(ammo);
                }
                collisionView.update();
            });


            runnerApp.setDroplets(({
                emit: () => { }
            } as any) as DropletPool);

            const ammos = new AmmoPool(
                ammoA,
                triangleT,
                animateContainer,
                hitAnimateMap.hit_1
            );
            const gun = new ShootManager(new Vector(0, 0), ammos);
            gun.position.setV(new Vector(400, 80))
            gun.dispersionRad = (10 * Math.PI) / 180;
            gun.projectileCount = 3;

            return function () {
                gun.shoot(new Vector(600, 80))
                ammos.update();
                gun.update();
                const camera = runnerApp.getCamera();

                for (let index = 0; index < ammos.pool.length; index++) {
                    const ammo = ammos.pool[index];
                    camera.updateItemPos(ammo);
                }
            };
        }
    });

export default context.initDemo
