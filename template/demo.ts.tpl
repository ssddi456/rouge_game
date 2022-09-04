import { AnimatedSprite, Container, Graphics, Point, Renderer } from "pixi.js";
import { Camera } from "../camara";
import { CountDown } from "../countdown";
import { loadSpriteSheet } from "../loadAnimation";
import { getRunnerApp } from "../runnerApp";
import { Vector } from "../vector";
import { createDemoContext } from "../helper/demo_util";
import { HotClass } from "../helper/class_reloader";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            return function () {

            }
        }
    });

export default context.initDemo