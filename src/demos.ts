import * as PIXI from 'pixi.js'
import { AnimatedSprite, Mesh, Point, Sprite } from 'pixi.js';
import { Ammo, AmmoPool } from './ammo';
import { Camera } from './camara';
import { CollisionView } from './drawCollisions';
import { Player } from './player';
import { Vector } from './vector';
import { default as initPlayerAttack } from './demos/player_attack';
import { default as initAmmoDemo } from './demos/ammo_demo';

const app = new PIXI.Application({
    backgroundColor: 0x1099bb,
    resizeTo: window,
});
// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);
document.body.style.margin = "0";
document.documentElement.style.margin = "0";

const triangle = new PIXI.Graphics();
triangle.beginFill(0xffffff);
triangle.drawPolygon([
    new Point(0, 0),
    new Point(10, 5),
    new Point(0, 10),
]);
triangle.endFill();
const triangleT = app.renderer.generateTexture(triangle);

const triangleS = new PIXI.Sprite(triangleT);
triangleS.anchor.set(0.5);
triangleS.position.set(40, 10);
app.stage.addChild(triangleS);

const points: Point[] = [];
for (let i = 0; i < 30; i++) {
    // relative position
    const point = new Point(
        10 + Math.random() * 10,
        10 + i * 10,
    );
    points.push(point);
}
const rope = new PIXI.SimpleRope(triangleT, points);
rope.blendMode = PIXI.BLEND_MODES.ADD;
rope.x = 10;
rope.y = 0;
app.stage.addChild(rope);
function updateRope() {
    setTimeout(updateRope, 1000);
    for (let i = 0; i < 30; i++) {
        // relative position
        points[i].x = Math.random() * 10;
        points[i].y = i * 10;
    }
}
updateRope();

initPlayerAttack(app);
initAmmoDemo(app);

function genWireframe(sprite: Mesh) {
    const graphics = new PIXI.Graphics();
    sprite.calculateVertices();

    const indices = sprite.indices;
    const vertices = (sprite as any).vertexData;

    graphics.lineStyle(0.3, 0xff9999 | 0);
    // generating it in current sprite world coords.
    // they are local if sprite wasnt added yet
    console.log(indices);
    console.log(vertices);
    for (let i = 0; i < indices.length; i += 3) {
        let ind = indices[i + 2];
        graphics.moveTo(vertices[ind * 2], vertices[ind * 2 + 1]);
        for (let j = 0; j < 3; j++) {
            ind = indices[i + j];
            graphics.lineTo(vertices[ind * 2], vertices[ind * 2 + 1]);
        }
    }

    return graphics;
}