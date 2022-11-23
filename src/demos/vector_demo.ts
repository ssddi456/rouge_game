import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector, VectorSegment } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";
import { VectorSegmentElement } from "../helper/vector_helper";
import { DebugInfo } from "../debug_info";
import { radToDeg } from "../helper/utils";
import { cloneAnimationSprite } from "../sprite_utils";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;
            const resource = getRunnerApp().getGetResourceMap()();
            const ammo = resource.thunderAnimateMap.projectile;
            const centerPos = new Vector(300, 600);

            const currentSegment = new VectorSegment(centerPos, centerPos.clone().add({ x: 100, y: -100 }), 10)
            const currentSegmentEl = new VectorSegmentElement(currentSegment);

            const refSegment = new VectorSegment(centerPos, centerPos.clone().add({ x: 100, y: -100 }), 10)
            const refSegmentEl = new VectorSegmentElement(refSegment);

            const ammoEl = animateContainer.addChild(cloneAnimationSprite(ammo));

            animateContainer.addChild(currentSegmentEl);
            animateContainer.addChild(refSegmentEl);
            const debugInfo = animateContainer.addChild(new DebugInfo());
            ammoEl.position.x = centerPos.x;
            ammoEl.position.y = centerPos.y;
            debugInfo.position.x = centerPos.x;
            debugInfo.position.y = centerPos.y + 20;

            return function () {
                const worldPos = getRunnerApp().getMouseWorldPos();
                refSegment.point2.setV(worldPos);
                refSegmentEl.segment = refSegment;
                const rad = currentSegment.direction().radTo2(refSegment.direction());
                debugInfo.text = `${Math.floor(radToDeg(rad))}`;

                ammoEl.rotation = rad + currentSegment.direction().rad();
            }
        }
    });

export default context.initDemo