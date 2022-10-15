import { AnimatedSprite, Application, LoaderResource, Rectangle, Sprite, Texture } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { initUpgradeSprites } from './upgrades/base';
import { cloneAnimationSprites } from './sprite_utils';
import { getRunnerApp } from './runnerApp';
import { GetResourceFunc } from './types';

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
export async function loadSprites(loader: PIXI.Loader, name: string): Promise<Record<string, Sprite>> {
    const [
        spriteSheet,
    ] = await Promise.all([
        fetch(
            `http://localhost:7001/get_marked?name=${encodeURIComponent(name)}`
        )
            .then((res) => res.json())
            .then(({ data: { config } }) => config),
    ]);
    const url = getImageUrl(`${name}.rgba.png`);
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
            const spriteMap: Record<string, Sprite> = {};

            for (const key in spriteSheet) {
                if (Object.prototype.hasOwnProperty.call(spriteSheet, key)) {
                    const element = spriteSheet[key];
                    spriteMap[key] = new Sprite(
                        new Texture(LiezerotaDark.baseTexture,
                            new Rectangle(...element)
                        ));
                }
            }

            resolve(spriteMap);
        }
    });
}
export function getImageUrl(name: string) {
    return `http://localhost:7001/public/${name}`
}

const animations = {
    player: 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark',
    bow: 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow',
    gun: 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun',
    enemy: 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters',
    heartAnimation: '20m2d_HeartAnimation',
    hitEffect: 'crosscode_hiteffect',
    laser: '20m2d_ShoggothLaser',
    tree: 'Hazel Tree',

    ice: "IceVFX 1 Repeatable",
    ice_hit: "Ice VFX 1 Hit",

    thunder: "Thunder projectile1 w blur",
    thunder_hit: "Thunder hit w blur",

};

const sprites = {
    upgrade: '20m2d_powerups',
    freezeFXSmall: '20m2d_FreezeFXSmall',
    powerupPanel: '20m2d_PowerupPanel',
    heartAnimation: '20m2d_HeartAnimation',
};

/** not config start */
({
    "animations": [
        "20m2d_FreezeFXSmall",
        "20m2d_PowerupPanel",
        "20m2d_powerups",
        "bullet souls",
        "Dark VFX 1 (40x32)",
        "Dark VFX 2 (48x64)",
        "Projectile 2 w blur"
    ],
    "sprites": [
        "20m2d_ShoggothLaser",
        "bullet souls",
        "crosscode_hiteffect",
        "Dark VFX 1 (40x32)",
        "Dark VFX 2 (48x64)",
        "Hazel Tree",
        "Ice VFX 1 Hit",
        "IceVFX 1 Repeatable",
        "Nintendo Switch - Disgaea 5 Complete - LiezerotaDark",
        "Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters",
        "Nintendo Switch - Disgaea 5 Complete - Weapons Bow",
        "Nintendo Switch - Disgaea 5 Complete - Weapons Gun",
        "Projectile 2 w blur",
        "spell_circle_2",
        "Texture2D",
        "Thunder hit w blur",
        "Thunder projectile1 w blur"
    ]
})
/** not config end */

export async function setupResource(app: Application,) {
    const loader = app.loader;
    const resources = app.loader.resources;

    /** load resource start */
    const playerAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
    const bowAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow');
    const gunAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun');
    const enemyAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters');
    const heartAnimationAnimateMap = await loadSpriteSheet(loader, '20m2d_HeartAnimation');
    const hitEffectAnimateMap = await loadSpriteSheet(loader, 'crosscode_hiteffect');
    const laserAnimateMap = await loadSpriteSheet(loader, '20m2d_ShoggothLaser');
    const treeAnimateMap = await loadSpriteSheet(loader, 'Hazel Tree');
    const iceAnimateMap = await loadSpriteSheet(loader, 'IceVFX 1 Repeatable');
    const ice_hitAnimateMap = await loadSpriteSheet(loader, 'Ice VFX 1 Hit');
    const thunderAnimateMap = await loadSpriteSheet(loader, 'Thunder projectile1 w blur');
    const thunder_hitAnimateMap = await loadSpriteSheet(loader, 'Thunder hit w blur');

    const upgradeSpriteMap = await loadSprites(loader, '20m2d_powerups');
    const freezeFXSmallSpriteMap = await loadSprites(loader, '20m2d_FreezeFXSmall');
    const powerupPanelSpriteMap = await loadSprites(loader, '20m2d_PowerupPanel');
    const heartAnimationSpriteMap = await loadSprites(loader, '20m2d_HeartAnimation');
/** load resource end */

    await new Promise<void>(r => {
        const name1 = 'magicCircle1';
        const name2 = 'magicCircle2';
        if (app.loader.resources[name1]
            || app.loader.resources[name1]
        ) {
            final(app.loader.resources);
            return;
        }
        app.loader
            .add(name1, 'http://localhost:7001/public/spell_circle_1.rgba.png')
            .add(name2, 'http://localhost:7001/public/spell_circle_2.rgba.png')
            .load((loader, resources) => {
                final(resources);
            });

        function final(resources: Record<string, LoaderResource>) {
            playerAnimateMap[name1] = new AnimatedSprite([
                resources[name1].texture as Texture
            ]);
            playerAnimateMap[name2] = new AnimatedSprite([
                resources[name2].texture as Texture
            ]);
            r();
        }
    });

    initUpgradeSprites(upgradeSpriteMap);

    // Listen for frame updates
    const cloneResourceMap = () => ({
        resources,

        /** declare resource start */
        playerAnimateMap: cloneAnimationSprites(playerAnimateMap),
        bowAnimateMap: cloneAnimationSprites(bowAnimateMap),
        gunAnimateMap: cloneAnimationSprites(gunAnimateMap),
        enemyAnimateMap: cloneAnimationSprites(enemyAnimateMap),
        heartAnimationAnimateMap: cloneAnimationSprites(heartAnimationAnimateMap),
        hitEffectAnimateMap: cloneAnimationSprites(hitEffectAnimateMap),
        laserAnimateMap: cloneAnimationSprites(laserAnimateMap),
        treeAnimateMap: cloneAnimationSprites(treeAnimateMap),
        iceAnimateMap: cloneAnimationSprites(iceAnimateMap),
        ice_hitAnimateMap: cloneAnimationSprites(ice_hitAnimateMap),
        thunderAnimateMap: cloneAnimationSprites(thunderAnimateMap),
        thunder_hitAnimateMap: cloneAnimationSprites(thunder_hitAnimateMap),

        upgradeSpriteMap,
        freezeFXSmallSpriteMap,
        powerupPanelSpriteMap,
        heartAnimationSpriteMap,
/** declare resource end */
    });

    const runnerApp = getRunnerApp();
    runnerApp.setGetResourceMap((cloneResourceMap as unknown) as GetResourceFunc);

    return cloneResourceMap;
}

type ResolveType<T extends Promise<any>> = T extends Promise<infer R> ? R : any;


export type CurrentResourceMapFunc = ReturnType<(ResolveType<(ReturnType<(typeof setupResource)>)>)>;
