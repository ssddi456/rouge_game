import * as PIXI from 'pixi.js'
import { Mesh, Point } from 'pixi.js';

import { default as initPlayerAttack } from './demos/player_attack_demo';
import { default as initAmmoDemo } from './demos/ammo_demo';
import { default as initRopeDemo } from './demos/rope_demo';
import { default as initIkDemo } from './demos/ik_demo';
import { default as initBowDemo } from './demos/bow_demo';
import { default as initTreeDemo } from './demos/tree_demo';
import { default as initAoeDemo } from './demos/aoe_demo';
import { default as initSegmentDemo } from './demos/segment_demo';
import { default as initEmitDemo } from './demos/emit_demo';
import { default as initVectorDemo } from './demos/vector_demo';
import { default as initFogBallDemo } from './demos/fog_ball_demo';

import { getRunnerApp } from './runnerApp';
import { Camera } from './camara';
import { Player } from './player';
import { Vector } from './vector';
import { EnemyStub } from './demos/enemy_stub';
import { setupResource } from './loadAnimation';
import { createGroups } from './groups';
import { Stage } from '@pixi/layers';
import { GameSession } from './game_session';

const app = new PIXI.Application({
    backgroundColor: 0x1099bb,
    // resizeTo: window,
    width: 2000,
    height: 2000,
});
// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);
document.body.style.margin = "0";
document.documentElement.style.margin = "0";

app.stage = new Stage();
app.stage.sortableChildren = true;

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
const camera = new Camera(
    ({
        position: new Vector(500, 500),
    } as any) as Player,
    new Vector(1000, 1000),
);
const runnerApp = getRunnerApp();
runnerApp.setApp(app);
runnerApp.setCamera(camera);
runnerApp.setGameView(app.stage);
app.stage.sortableChildren = true;
runnerApp.setSession(new (class extends GameSession  {
    ifSessionFailed() {
        return false;
    }
}));

(async function () {
    
    const cloneResourceMap = await setupResource(app);
    const resourceMap = cloneResourceMap();

    const enemys = new EnemyStub(
        resourceMap.enemyAnimateMap,
        app.stage,
        [
            new Vector(600, 100),
            new Vector(600, 200),
        ]
    );
    runnerApp.setEnemys(enemys);
    runnerApp.setGroups(createGroups(app.stage as Stage));
    
    app.ticker.add(() => {
        enemys.update();
    
        runnerApp.updateParticles();
        runnerApp.updateAOE();
    });

    initPlayerAttack(app);
    initAmmoDemo(app);
    initRopeDemo(app);
    initIkDemo(app);
    initBowDemo(app);
    initTreeDemo(app);
    initAoeDemo(app);
    initSegmentDemo(app);
    initEmitDemo(app);
    initVectorDemo(app);
    initFogBallDemo(app);
})();
