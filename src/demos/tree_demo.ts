import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
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
            const treeAnimateMap = await loadSpriteSheet(app.loader, 'Hazel Tree');

            const tree = new Tree(treeAnimateMap);

            animateContainer.addChild(tree.sprite);
            tree.position.set(1100, 500);
            tree.update();

            return function () {

            }
        }
    });

export default context.initDemo