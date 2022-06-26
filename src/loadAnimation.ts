import { AnimatedSprite } from 'pixi.js';
import * as PIXI from 'pixi.js';

export async function loadAnimation(loader: PIXI.Loader,
    name: string,
    url: string,
    spriteSheet: Record<string, number[]>,
    animateIndexMap: Record<string, number[]>,
): Promise<Record<string, AnimatedSprite>> {
    return new Promise(resolve => {
        if (loader.resources[name]) {
            resourceLoaded();
            return;
        }
        doCheckComplete();

        function doCheckComplete() {
            setTimeout(() => {
                if (loader.loading) {
                    loader.onComplete.once(doCheckComplete)
                } else {
                    if (loader.resources[name]) {
                        resourceLoaded();
                        return;
                    }
    
                    // load the texture we need
                    loader.add(name, url)
                        .load((loader, resources) => {
                            resourceLoaded();
                        })
                }
            });
        }


        function resourceLoaded() {
            // This creates a texture from a 'bunny.png' image
            const LiezerotaDark = loader.resources[name].texture!;
            const animateMap: Record<string, AnimatedSprite> = {};
            for (const key in animateIndexMap) {
                if (Object.prototype.hasOwnProperty.call(animateIndexMap, key)) {
                    const element = animateIndexMap[key];
                    if (!element.length) {
                        animateMap[key] = new PIXI.AnimatedSprite(
                            [
                                new PIXI.Texture(
                                    LiezerotaDark.baseTexture,
                                    new PIXI.Rectangle(0, 0, 10, 10)
                                )
                            ]
                        );
                        continue;
                    }
                    // Add the bunny to the scene we are building
                    const LiezerotaDarkAnimate = new PIXI.AnimatedSprite(
                        element.map((index) => {
                            return new PIXI.Texture(LiezerotaDark.baseTexture,
                                new PIXI.Rectangle(...spriteSheet[index]))
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
            resolve(animateMap);
        }
    })
}

export async function loadSpriteSheet(loader: PIXI.Loader, name: string) {
    const [
        spriteSheet,
        animateIndexMap,
    ] = await Promise.all([
        fetch(
            `http://localhost:7001/get_marked?name=${encodeURIComponent(
                name
            )}`
        )
            .then((res) => res.json())
            .then(({ data: { config } }) => config),
        fetch(
            `http://localhost:7001/get_animation?name=${encodeURIComponent(
                name
            )}`
        )
            .then((res) => res.json())
            .then(({ data: { config } }) => config)
            .catch(() => {
                return {
                    idle: [],
                    idle_back: [],
                };
            }),
    ]);
    const url = getImageUrl(`${name}.rgba.png`);
    return await loadAnimation(loader, name, url, spriteSheet, animateIndexMap);
}

export function getImageUrl(name: string) {
    return `http://localhost:7001/public/${name}`
}