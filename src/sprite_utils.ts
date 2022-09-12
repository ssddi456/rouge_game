import { AnimatedSprite, Sprite, Texture } from "pixi.js";

export function cloneAnimationSprites(spriteMap: Record<string, AnimatedSprite>) {
    const ret: Record<string, AnimatedSprite> = {};
    for (const key in spriteMap) {
        if (Object.prototype.hasOwnProperty.call(spriteMap, key)) {
            const element = spriteMap[key];

            ret[key] = cloneAnimationSprite(element);
            ret[key].anchor.set(element.anchor._x, element.anchor._y);
        }
    }
    return ret;
}

export function cloneAnimationSprite(sprite: AnimatedSprite) {
    const ret = new AnimatedSprite(sprite.textures.map(x => (x as Texture).clone()));
    
    ret.anchor.set(sprite.anchor._x, sprite.anchor._y);
    ret.animationSpeed = sprite.animationSpeed;
    ret.loop = sprite.loop;
    ret.animationSpeed = sprite.animationSpeed;
    ret.autoUpdate = sprite.autoUpdate;
    ret.gotoAndStop(0);

    return ret;
}

export function cloneSprite(sprite: Sprite) {
    const ret = new Sprite(sprite.texture);
    return ret;
}


export function hookRender(_oldRender: Function, handle: Function) {
    return function render(this: any, ...args: any[]) {
        handle.call(this);
        return _oldRender.call(this, ...args);
    };
}