import * as PIXI from 'pixi.js'
import LiezerotaDarkImage from './assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.png';
import LiezerotaDarkInfo from './assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.marked.json';

console.log(LiezerotaDarkImage, LiezerotaDarkInfo);


// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

// load the texture we need
app.loader.add('LiezerotaDark', 
    LiezerotaDarkImage
).load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    const LiezerotaDark = resources.LiezerotaDark.texture;

    const animateIndexMap = {
        seqs1: [7, 8, 10, 11, 9, 6],
        seqs2: [1, 2, 3, 0, 4, 5],
        seqs3: [20, 21, 13, 14, 24, 25],
        seqs4: [17, 15, 18, 16, 22, 23, 12, 19],
        seqs5: [28, 29, 35, 32, 38, 40],
    };

    const animateMap = {};
    let offsetLeft = 0;
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
            LiezerotaDarkAnimate.x = offsetLeft;
            LiezerotaDarkAnimate.animationSpeed = 1 / 6;
            LiezerotaDarkAnimate.play();
            animateMap[key] = LiezerotaDarkAnimate;
            
            app.stage.addChild(LiezerotaDarkAnimate);

            const offset = Math.max(...element.map(x => LiezerotaDarkInfo[x][2]));
            offsetLeft += offset;
        }
    }


    // Listen for frame updates
    app.ticker.add(() => {
        // each frame we spin the bunny around a bit
    });
});