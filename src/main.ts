import * as PIXI from 'pixi.js'
import LiezerotaDarkImage from './assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.rgba.png';
import GrassImage from './assets/THX0.png';

import LiezerotaDarkInfo from './assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.marked.json';
import './user_input';

import { Viewport } from 'pixi-viewport'
import { Player } from './player';
import { AnimatedSprite } from 'pixi.js';

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    backgroundColor: 0x1099bb,
});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

// create viewport
const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,

    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})

// add the viewport to the stage
app.stage.addChild(viewport)

// load the texture we need
app.loader.add('LiezerotaDark',
    LiezerotaDarkImage
).add('grass', GrassImage)
.load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    const LiezerotaDark = resources.LiezerotaDark.texture!;

    const animateIndexMap: Record<string, number[]> = {
        idle: [7, 8, 10, 11, 9, 6],
        idle_back: [1, 2, 3, 0, 4, 5],

        attack: [20, 21, 13, 14, 24, 25, 25, 25],
        attack_back: [17, 15, 18, 16, 22, 23, 23, 23],

        heavy_attack: [28, 29, 35, 32, 38, 40, 40, 40],
        heavy_attack_back: [30, 31, 34, 36, 39, 37, 37, 37],
    };

    const animateMap: Record<string, AnimatedSprite> = {};
    for (const key in animateIndexMap) {
        if (Object.prototype.hasOwnProperty.call(animateIndexMap, key)) {
            const element = animateIndexMap[key];
            // Add the bunny to the scene we are building
            const LiezerotaDarkAnimate = new PIXI.AnimatedSprite(
                element.map((index) => {
                    return new PIXI.Texture(LiezerotaDark.baseTexture,
                        new PIXI.Rectangle(...LiezerotaDarkInfo[index]))
                })
            );
            LiezerotaDarkAnimate.anchor.set(0.5, 0.5);
            LiezerotaDarkAnimate.x = 0;
            LiezerotaDarkAnimate.y = 0;
            LiezerotaDarkAnimate.animationSpeed = 1 / 6;
            animateMap[key] = LiezerotaDarkAnimate;

            if (key === 'idle' || key === 'idle_back') {
                LiezerotaDarkAnimate.play();
            }

            if (key === 'attack' || key === 'attack_back') {
                LiezerotaDarkAnimate.loop = false;
            }
        }
    }
    const ammo = new PIXI.Graphics();
    ammo.beginFill(0xffffff);
    ammo.drawCircle(0, 0, 10);
    ammo.endFill();
    animateMap.ammo = ammo as any;

    const grass = new PIXI.TilingSprite(resources.grass.texture!, 1000, 1000);

    viewport.addChild(grass);

    const player = new Player(animateMap, 100, viewport);

    viewport.addChild(player.spirte);


    // Listen for frame updates
    app.ticker.add(() => {
        // each frame we spin the bunny around a bit
        player.update();
    });
});