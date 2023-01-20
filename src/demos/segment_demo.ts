import { AnimatedSprite, Container, Graphics, Mesh, MeshMaterial, PlaneGeometry, Point, Renderer, SimplePlane, Texture } from "pixi.js";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector, VectorCircle, VectorSegment } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { VectorCircleElement, VectorSegmentElement } from '../helper/vector_helper';

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;
            const laserAnimateMap = await loadSpriteSheet(app.loader, '20m2d_ShoggothLaser');

            const demoSegment = new VectorSegment(
                new Vector(30, 400),
                new Vector(30, 700),
                10
            );

            const demoSegmentElement =  new VectorSegmentElement(demoSegment);
            animateContainer.addChild(demoSegmentElement);

            const demoCircle = new VectorCircle(new Vector(40, 330), 30);
            const demoCircleElement = new VectorCircleElement(demoCircle);
            animateContainer.addChild(demoCircleElement);
            let dir = new Vector(0, 3);
            let deg = 0;
            let radius = 300;
            
            const laser = animateContainer.addChild(new Container);
            laser.pivot.set(0.5, 1);
            laser.position.set(demoSegment.point1.x, demoSegment.point1.y);
            const laserCenter = laser.addChild(laserAnimateMap.hit_1);
            const laserBeam = laserAnimateMap.hit_0;
            laserBeam.position.y = - 16;
            laserBeam.anchor.set(0.5, 1);
            laser.addChild(laserBeam);
            laserCenter.animationSpeed = laserBeam.animationSpeed = 1/100;
            laserCenter.play();
            laserBeam.play();

            const beamTexture = laserAnimateMap.hit_0.textures[2] as Texture;
            const beam = new class extends Mesh {
                constructor() {
                    var planeGeometry = new PlaneGeometry(32, -800, 2, 2);
                    var meshMaterial = new MeshMaterial(Texture.WHITE);
                    super(planeGeometry, meshMaterial);
                    // lets call the setter to ensure all necessary updates are performed
                    this.texture = beamTexture; // streched not repeated
                }
            };
            beam.position.x = -16;
            beam.position.y = -32;
            laser.addChild(beam);
            
            laserBeam.onFrameChange = (index) => {
                beam.texture = laserBeam._texture;
            };

            /** update func */
            return function () {
                if (demoCircle.center.y > 900) {
                    dir.y = -3;
                } else if (demoCircle.center.y < 300) {
                    dir.y = 3;
                }
                demoCircle.center.add(dir);
                demoCircleElement.circle = demoCircle;

                deg += 1;
                laser.angle = deg + 180;

                demoSegment.point2 = new Vector(0, radius).rotate(Math.PI * deg  / 180).add(demoSegment.point1);
                demoSegmentElement.segment = demoSegment;
                if (demoCircle.collidesWithSegment(demoSegment)) {
                    demoCircleElement.fill = 0xffffff;
                } else {
                    demoCircleElement.fill = 0xff0000;
                }
            }
        }
    });

export default context.initDemo
