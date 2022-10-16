import { AnimatedSprite, Container, Graphics, Point, Renderer, RopeGeometry, SimplePlane, SimpleRope, Sprite, Texture, WRAP_MODES } from "pixi.js";
import { line_of_circle_x_circle } from "../ik_utils";
import { getRunnerApp } from "../runnerApp";
import { makePointsArray, updatePointsFromControlPoint } from "../smooth_util";
import { Disposible, Updatable } from "../types";
import { getBlobShadow } from "../uicomponents/blobShadow";
import { Vector } from "../vector";

export class Wormling extends Container implements Updatable, Disposible {

    rootPoint = new Vector(0, 0);
    startPoint = new Vector(0, -30);
    jointPoint1 = new Vector(0, 0);
    jointPoint2 = new Vector(0, 0);
    endPoint = new Vector(0, 0);

    pointsX = [0, 0, 0, 0, 0];
    pointsY = [0, 0, 0, 0, 0];
    points = makePointsArray(15);

    center = [30, -100];
    r = 10;

    jointPoint1R1 = 40;
    jointPoint1R2 = 70;

    jointPoint2R1 = 70;
    jointPoint2R2 = 50;

    textureHeight: number;

    rope: SimpleRope;
    head: Sprite;
    
    frame = 0;
    totalFrame = 100;
    debugInfo: Graphics;

    debug = false;

    constructor() {
        super();
        
        const resource = getRunnerApp().getGetResourceMap()();
        const app = getRunnerApp().getApp();
        this.addChild(getBlobShadow(app.renderer as Renderer)).position.y = - 20;

        const wormling = (resource.playerAnimateMap.wormling as AnimatedSprite).textures;

        const geometry = new Container();
        const plane = geometry.addChild(new SimplePlane(wormling[1] as Texture, 2, 2));
        plane.rotation = Math.PI /2;
        plane.scale.set( 0.6, 0.8)
        const uvBuffer = plane.geometry.buffers[1];
        const uvs = uvBuffer.data;
        uvs[0] = 0.05; uvs[1] = 0.1; uvs[2] = 0.95; uvs[3] = 0.1;
        uvs[4] = 0.05; uvs[5] = 0.9; uvs[6] = 0.95; uvs[7] = 0.9;

        uvBuffer.update();

        this.addChild(geometry);
        const texturePiece = app.renderer.generateTexture(geometry);
        geometry.destroy();

        texturePiece.baseTexture.wrapMode = WRAP_MODES.REPEAT;
        this.textureHeight = texturePiece.baseTexture.width;

        this.rope = this.addChild(new SimpleRope(texturePiece, this.points));
        this.head = this.addChild(new Sprite(wormling[0] as Texture));

        this.head.anchor.set(0.5, 0.5);
        this.head.scale.set(-0.7, 0.7);
        this.head.position.set(this.endPoint.x, this.endPoint.y);


        this.debugInfo = this.addChild(new Graphics());
        this.debugInfo.visible = this.debug;

    }


    updatePoints() {
        this.frame++;
        const frame = this.frame;
        const theta = (frame % this.totalFrame) * 2 * Math.PI / this.totalFrame;
        this.endPoint.x = this.center[0] + this.r * Math.cos(theta);
        this.endPoint.y = this.center[1] + this.r * Math.sin(theta);

        const mayJointPoints1 = line_of_circle_x_circle(
            [this.startPoint.x, this.startPoint.y, this.jointPoint1R1],
            [this.endPoint.x, this.endPoint.y, this.jointPoint1R2]
        );
        this.jointPoint1.x = mayJointPoints1[1][0];
        this.jointPoint1.y = mayJointPoints1[1][1];

        const mayJointPoints2 = line_of_circle_x_circle(
            [this.startPoint.x, this.startPoint.y, this.jointPoint2R1],
            [this.endPoint.x, this.endPoint.y, this.jointPoint2R2]
        );
        this.jointPoint2.x = mayJointPoints2[1][0];
        this.jointPoint2.y = mayJointPoints2[1][1];


        this.pointsX[1] = this.startPoint.x;
        this.pointsX[2] = this.jointPoint1.x;
        this.pointsX[3] = this.jointPoint2.x;
        this.pointsX[4] = this.endPoint.x;

        this.pointsY[1] = this.startPoint.y;
        this.pointsY[2] = this.jointPoint1.y;
        this.pointsY[3] = this.jointPoint2.y;
        this.pointsY[4] = this.endPoint.y;
    }

    smoothUV() {
        const uvBuffer = this.rope.geometry.buffers[1];
        const uvs = uvBuffer.data;
        const total = this.points.length;
        let totalLength = 0;
        const length: number[] = [];
        let curr, pre, dist, dx, dy;
        for (let index = 1; index < this.points.length; index++) {
            curr = this.points[index];
            pre = this.points[index -1];
            dx = curr.x - pre.x;
            dy = curr.y - pre.y;
            dist = Math.sqrt( dx * dx + dy * dy);
            totalLength += dist;
            length.push(totalLength);
        }
        const factor = totalLength / this.textureHeight;

        let amount = 0;
        for (let i = 1; i < total; i++) {
            // time to do some smart drawing!
            const index = i * 4;
            amount = factor * (length[i - 1] / totalLength);
            uvs[index] = amount;
            uvs[index + 2] = amount;
        }
        uvBuffer.update();
    }

    updateSprite() {
        updatePointsFromControlPoint(this.points, this.pointsX, this.pointsY);
        this.smoothUV();

        this.head.position.set(this.endPoint.x, this.endPoint.y);
    }

    updateDebugInfo() {
        this.debugInfo.clear();
        const geometry = this.debugInfo;
        geometry.lineStyle({
            width: 3,
            color: 0xff0000
        })
        geometry.moveTo(this.startPoint.x, this.startPoint.y);
        geometry.lineTo(this.jointPoint1.x, this.jointPoint1.y);
        geometry.lineTo(this.jointPoint2.x, this.jointPoint2.y);
        geometry.lineTo(this.endPoint.x, this.endPoint.y);
        geometry.beginHole();
        geometry.drawCircle(this.startPoint.x, this.startPoint.y, 10);
        geometry.drawCircle(this.startPoint.x, this.startPoint.y, this.jointPoint1R1);
        geometry.drawCircle(this.startPoint.x, this.startPoint.y, this.jointPoint2R1);

        geometry.drawCircle(this.jointPoint1.x, this.jointPoint1.y, 10);
        geometry.drawCircle(this.jointPoint2.x, this.jointPoint2.y, 10);
        geometry.drawCircle(this.endPoint.x, this.endPoint.y, 10);
        geometry.drawCircle(this.endPoint.x, this.endPoint.y, this.jointPoint1R2);
        geometry.drawCircle(this.endPoint.x, this.endPoint.y, this.jointPoint2R2);

    }

    update() {
        this.updatePoints();
        this.updateSprite();
        if (this.debug) {
            this.updateDebugInfo();
        }
    }

    disposed: boolean = false;
    dispose() {
        this.destroy();
    }
}