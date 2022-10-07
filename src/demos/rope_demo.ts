import { AnimatedSprite, Application, Container, Geometry, Graphics, Point, Renderer, RopeGeometry, SCALE_MODES, SimplePlane, SimpleRope, Texture, WRAP_MODES } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { genWireframe } from "../mesh_utils";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            const hitAnimateMap = await loadSpriteSheet(app.loader, 'crosscode_hiteffect');
            const texture = (hitAnimateMap.hit_1.textures as Texture[])[0];

            const geometry = new SimplePlane(texture, 2, 2);
            const texturePiece = app.renderer.generateTexture(geometry);
            texturePiece.baseTexture.wrapMode = WRAP_MODES.REPEAT;

            const textures = (hitAnimateMap.hit_1.textures as Texture[]).map( x => {
                geometry.texture = x;
                const texturePiece = app.renderer.generateTexture(geometry);
                texturePiece.baseTexture.wrapMode = WRAP_MODES.REPEAT;
                return texturePiece;
            });

            const points: Point[] = [];
            const total = 15;
            const seg = 20;
            for (let i = 0; i < total; i++) {
                // relative position
                const point = new Point(
                    0,
                    i * seg,
                );
                points.push(point);
            }
            const rope = new SimpleRope(
                texturePiece,
                points,
            );

            console.log(rope.geometry.buffers[1]);
            const uvBuffer = rope.geometry.buffers[1];
            const uvs = uvBuffer.data;
            const height = texture.height;
            const length = total * seg;
            const factor = length / height;
            for (let i = 0; i < total; i++) {
                // time to do some smart drawing!
                const index = i * 4;
                const amount = i * factor / ((total - 1) * 1);
                uvs[index] = amount;
                uvs[index + 2] = amount;
            }
            uvBuffer.update();
            (rope.geometry as RopeGeometry).updateVertices();
            animateContainer.addChild(rope);
            let ropeMesh = genWireframe(rope);
            animateContainer.addChild(ropeMesh);
            ropeMesh.position.x =
                rope.position.x = 80;

            ropeMesh.position.y =
                rope.position.y = 40;
            function updateRope() {
                for (let i = 0; i < total; i++) {
                    // relative position
                    points[i].x = Math.random() * 10;
                }

                frameIndex += 1;
                rope.texture = textures[frameIndex % textures.length];
            }
            let counter = 0;
            let frameIndex = 0;
            return function () {
                counter++;
                if (!(counter % 10)) {
                    updateRope();
                }
                animateContainer.removeChild(ropeMesh);
                ropeMesh.destroy();
                ropeMesh = genWireframe(rope);
                animateContainer.addChild(ropeMesh);

                ropeMesh.position.x =
                    rope.position.x = 80;

                ropeMesh.position.y =
                    rope.position.y = 40;
            };
        }
    });

export default context.initDemo
