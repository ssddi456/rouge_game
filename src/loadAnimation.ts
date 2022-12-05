import { AnimatedSprite, Application, BaseTexture, LoaderResource, Rectangle, Sprite, Texture } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { initUpgradeSprites } from './upgrades/base';
import { cloneAnimationSprites } from './sprite_utils';
import { getRunnerApp } from './runnerApp';
import { Coords, GetResourceFunc, TextureConfig } from './types';
import { Vector } from './vector';

export function createTextureFromConfig(base: BaseTexture, config: TextureConfig) {
    if (Array.isArray(config)) {
        return new Texture(base,
            new Rectangle(...config));
    }
    if (config.frame && config.offset) {
        return new Texture(base,
            new Rectangle(...config.frame),
            undefined,
            new Rectangle(
                - config.offset[0] / 2, - config.offset[1] / 2,
                config.frame[2], config.frame[3],
            ),
            undefined,
            // { x: 0.5, y: 0.5 }
        );
    }
    throw new Error('illegal config');
}

export function getCoordFromTextureConfig(config: TextureConfig): Coords {
    if (Array.isArray(config)) {
        return config;
    }
    if (config.frame && config.offset) {
        return config.frame;
    }
    throw new Error('illegal config');
}

export function getOffsetFromTextureConfig(config: TextureConfig): Coords {
    if (Array.isArray(config)) {
        return [0, 0, 0, 0];
    }
    if (config.frame && config.offset) {
        return config.offset;
    }
    throw new Error('illegal config');
}


export function copyTextureConfig(config: TextureConfig): TextureConfig {
    if (Array.isArray(config)) {
        return {
            frame: [...config],
            offset: [0, 0, config[2], config[3]],
        };
    }
    if (config.frame && config.offset) {
        return {
            frame: [...config.frame],
            offset: [...config.offset.slice(0, 2), ...config.frame.slice(2)] as Coords,
        };
    }
    throw new Error('illegal config');
}


export function updateOffset(config: TextureConfig, offset: Coords): TextureConfig {
    if (Array.isArray(config)) {
        return {
            frame: [...config],
            offset: [...offset]
        };
    }
    if (config.frame && config.offset) {
        return {
            frame: [...config.frame],
            offset: [...offset],
        };
    }
    throw new Error('illegal config');
}


export async function loadAnimation(loader: PIXI.Loader,
    name: string,
    url: string,
    spriteSheet: Record<string, TextureConfig>,
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
                            return createTextureFromConfig(LiezerotaDark.baseTexture, spriteSheet[index]);
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
                        createTextureFromConfig(LiezerotaDark.baseTexture, element));
                }
            }

            resolve(spriteMap);
        }
    });
}

export function getImageUrl(name: string) {
    return `http://localhost:7001/public/${name}`
}

export async function loadShapes(loader: PIXI.Loader, name: string): Promise<Record<string, VectorGroup>> {
    const [
        shapeConfig,
    ] = await Promise.all([
        fetch(
            `http://localhost:7001/get_shape?name=${encodeURIComponent(name)}`
        )
            .then((res) => res.json())
            .then(({ data: { config } }) => config),
    ]);
    return shapeConfig;
}

interface VectorGroup {
    vectors: { x: number, y: number }[];
}

const animations = {
    player: 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark',
    bow: 'Nintendo Switch - Disgaea 5 Complete - Weapons Bow',
    gun: 'Nintendo Switch - Disgaea 5 Complete - Weapons Gun',
    enemy: 'Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters',
    succubus: "Nintendo Switch - Disgaea 4 - Succubus",

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

const shapes = {
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
        "${encodeURIComponent(name)}",
        "20m2d_ShoggothLaser",
        "bullet souls",
        "crosscode_hiteffect",
        "Dark VFX 1 (40x32)",
        "Dark VFX 2 (48x64)",
        "Hazel Tree",
        "Ice VFX 1 Hit",
        "IceVFX 1 Repeatable",
        "Nintendo Switch - Disgaea 4 - Succubus",
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
    const succubusAnimateMap = await loadSpriteSheet(loader, 'Nintendo Switch - Disgaea 4 - Succubus');
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
    const cloneResourceMap = () => {
        const map = ({
            resources,

            /** declare resource start */
        playerAnimateMap: cloneAnimationSprites(playerAnimateMap) as Record<"idle" | "idle_back" | "attack" | "attack_back" | "heavy_attack" | "heavy_attack_back" | "laugh" | "laugh_back" | "buff_left" | "buff_left_back" | "buff_right" | "buff_right_back" | "circle" | "sword" | "whip" | "wormling", AnimatedSprite>,
        bowAnimateMap: cloneAnimationSprites(bowAnimateMap) as Record<"idle" | "idle_back" | "bow1" | "bow2" | "bow3" | "bow4" | "bow5", AnimatedSprite>,
        gunAnimateMap: cloneAnimationSprites(gunAnimateMap) as Record<"idle" | "idle_back" | "gun1" | "gun2" | "gun3" | "gun4" | "gun5", AnimatedSprite>,
        enemyAnimateMap: cloneAnimationSprites(enemyAnimateMap) as Record<"idle" | "idle_back" | "run" | "die" | "die_back" | "run_back" | "bunny_idle" | "bunny_idle_back" | "bunny_die" | "bunny_die_back", AnimatedSprite>,
        succubusAnimateMap: cloneAnimationSprites(succubusAnimateMap) as Record<"succubus_idle" | "succubus_cast", AnimatedSprite>,
        heartAnimationAnimateMap: cloneAnimationSprites(heartAnimationAnimateMap) as Record<"hit_0", AnimatedSprite>,
        hitEffectAnimateMap: cloneAnimationSprites(hitEffectAnimateMap) as Record<"hit_0" | "hit_1" | "hit_2" | "hit_3" | "hit_4" | "hit_5" | "hit_6" | "hit_7" | "hit_8" | "hit_9" | "hit_10" | "hit_11" | "hit_12" | "hit_13" | "hit_14" | "hit_15", AnimatedSprite>,
        laserAnimateMap: cloneAnimationSprites(laserAnimateMap) as Record<"hit_0" | "hit_1", AnimatedSprite>,
        treeAnimateMap: cloneAnimationSprites(treeAnimateMap) as Record<"0" | "1" | "2" | "3", AnimatedSprite>,
        iceAnimateMap: cloneAnimationSprites(iceAnimateMap) as Record<"projectile", AnimatedSprite>,
        ice_hitAnimateMap: cloneAnimationSprites(ice_hitAnimateMap) as Record<"hit_effect", AnimatedSprite>,
        thunderAnimateMap: cloneAnimationSprites(thunderAnimateMap) as Record<"projectile", AnimatedSprite>,
        thunder_hitAnimateMap: cloneAnimationSprites(thunder_hitAnimateMap) as Record<"hit_effect", AnimatedSprite>,

        upgradeSpriteMap: upgradeSpriteMap as Record<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "39" | "40" | "41" | "42" | "43" | "44" | "45" | "46" | "47" | "48" | "49" | "50" | "51" | "52" | "53" | "54" | "55" | "56" | "57" | "58" | "59" | "60" | "61" | "62" | "63" | "64" | "65" | "66" | "67" | "68" | "69" | "70" | "71" | "72" | "73" | "74" | "75" | "76" | "77" | "78" | "79" | "80" | "81" | "82" | "83" | "84" | "85" | "86" | "87" | "88" | "89" | "90" | "91" | "92" | "93" | "94" | "95" | "96" | "97" | "98" | "99" | "100" | "101" | "102" | "103" | "104" | "105" | "106" | "107" | "108" | "109" | "110" | "111" | "112" | "113" | "114" | "115" | "116" | "117" | "118" | "119" | "120" | "121" | "122" | "123" | "124" | "125" | "126" | "127" | "128" | "129" | "130" | "131" | "132" | "133" | "134" | "135" | "136" | "137" | "138" | "139" | "140" | "141" | "142" | "143" | "144" | "145" | "146" | "147" | "148" | "149" | "150" | "151" | "152" | "153" | "154" | "155", Sprite>,
        freezeFXSmallSpriteMap: freezeFXSmallSpriteMap as Record<"0" | "1" | "2" | "3" | "4", Sprite>,
        powerupPanelSpriteMap: powerupPanelSpriteMap as Record<"0" | "1" | "2" | "3", Sprite>,
        heartAnimationSpriteMap: heartAnimationSpriteMap as Record<"0" | "1" | "2" | "3", Sprite>,



/** declare resource end */
        });

        map.enemyAnimateMap = {
            ...map.enemyAnimateMap,
            ...map.succubusAnimateMap
        };

        return map;
    };

    const runnerApp = getRunnerApp();
    runnerApp.setGetResourceMap(cloneResourceMap);

    return cloneResourceMap;
}

type ResolveType<T extends Promise<any>> = T extends Promise<infer R> ? R : any;


export type CurrentResourceMapFunc = ResolveType<(ReturnType<(typeof setupResource)>)>;
