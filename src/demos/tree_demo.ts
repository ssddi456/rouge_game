import { AnimatedSprite, Graphics, Sprite, Text, Texture } from "pixi.js";
import { CountDown } from "../countdown";
import { loadAnimation, loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { Tree } from "../tree";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;
            const runnerApp = getRunnerApp();
            const groups = runnerApp.getGroups();
            const resources = runnerApp.getGetResourceMap()();
            const enemyAnimateMap = resources.enemyAnimateMap;

            inspectAnimation(enemyAnimateMap.succubus_idle as AnimatedSprite, 1100, 500);
            inspectAnimation(enemyAnimateMap.succubus_cast as AnimatedSprite, 1100, 700);

            function inspectAnimation(item: AnimatedSprite, left: number, top: number) {
    
                const firstTexture = item.textures[0] as Texture;
                const newOrig = firstTexture.frame.clone();
                newOrig.x -= 10;
    
                const modifiedTexture = new Texture(
                    firstTexture.baseTexture,
                    firstTexture.frame,
                    undefined,
                    newOrig,
                    firstTexture.rotate,
                    firstTexture.defaultAnchor
                );
    
    
                const f = animateContainer.addChild(new Sprite(firstTexture));
                f.alpha = 0.5;
                f.position.set(left, top);
    
                const t = animateContainer.addChild(new Sprite(modifiedTexture));
                t.alpha = 0.8;
                t.position.set(left, top);
    
                const newTextures = item.textures.map((x, idx) => {
                    const texture = x as Texture;
                    const newTrim = texture.trim.clone();
    
                    const modifiedTexture = new Texture(
                        texture.baseTexture,
                        texture.frame,
                        undefined,
                        newTrim,
                        texture.rotate,
                        // { x: 0.5, y: 0.5 }
                    );
    
                    return modifiedTexture;
                });
                const highLightIndex = 1;
                const newAnimate = animateContainer.addChild(new AnimatedSprite(newTextures));
                newAnimate.animationSpeed = 1 / 24;
                newAnimate.play();
                newAnimate.position.set(left + 300, top);
                newAnimate.scale.set(0.5);
                const framework = animateContainer.addChild(new Graphics);
                framework.alpha = 0.3;
                framework.beginFill(0xffffff)
                    .drawRect(-newAnimate.width / 2, -newAnimate.height / 2, newAnimate.width, newAnimate.height)
                    .endFill();
                framework.position.set(left + 300, top);
                const frameware = animateContainer.addChild(new Graphics);
                newAnimate.onFrameChange = (frameIdx) => {
                    const texture = newAnimate.texture;
                    const vertices = (newAnimate as any).vertexData;
    
                    framework.clear().beginFill(0xffffff)
                        .drawRect(0, 0, texture.width, texture.height)
                        .endFill();
    
                    frameware.clear()
                        .lineStyle({ color: 0xffffff, width: 1})
                        .moveTo(vertices[0], vertices[1])
                        .lineTo(vertices[0 + 2], vertices[1 + 2])
                        .lineTo(vertices[0 + 4], vertices[1 + 4])
                        .lineTo(vertices[0 + 6], vertices[1 + 6])
                        .lineTo(vertices[0], vertices[1]);
                };
                const theta = (1 - 0.3) / newTextures.length / 2;
                newTextures.map((x, idx) => {
                    const s = animateContainer.addChild(new Sprite(x));
                    if (idx == highLightIndex) {
                        s.alpha = 1;
                    } else {
                        s.alpha = Math.min(1, 0.04 + (newTextures.length - Math.abs(idx - highLightIndex)) * theta);
                    }
    
                    s.position.set(left + 500, top);
                });
            }

            return function () {

            }
        }
    });

export default context.initDemo
