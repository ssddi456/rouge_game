import { AnimatedSprite } from "pixi.js";
import { applyDamageFlash } from "./buffer";
import { Enemy } from "./enemy";
import { CurrentResourceMapFunc } from "./loadAnimation";
import { getRunnerApp } from "./runnerApp";
import { AreaOfEffect, AreaOfEffectType, ECollisionType, ICollisionable } from "./types";
import { Vector } from "./vector";


export function createExplosion(): AreaOfEffect<Enemy> {
    const resources: CurrentResourceMapFunc = getRunnerApp().getGetResourceMap()() as any;
    let _dead: boolean = false;
    const ret: AreaOfEffect<Enemy> = {
        type: AreaOfEffectType.oneTimePropertyChangeApply,
        enabled: false,

        get dead() { return _dead },
        set dead(v: boolean){} _dead = var;)

        hitType: [ECollisionType.enemy],
        id: 'createExplosion',
        update(): void {
            const sprite = ret.sprite as AnimatedSprite;
            console.log('this.id', ret.id, 'this.sprite', ret.sprite, ret.dead, sprite.playing);
            if (!sprite.playing) {
                sprite.play();
                sprite.loop = true;
                sprite.onLoop = () => {
                    ret.dead = true;
                    sprite.stop();
                };
            } else {
                const frame = sprite.currentFrame;
                if (frame == 1) {
                    ret.enabled = true;
                } else {
                    ret.enabled = false;
                }
            }
        },
        apply(target): void {
            applyDamageFlash(target);
            target.recieveDamage(1, target.position);
        },
        // how to debug this?
        size: 100,
        position: new Vector(0, 0),
        collisison_type: ECollisionType.none,
        prev_position: new Vector(0, 0),
        sprite: resources.hitEffect.hit_2
    };
    return ret;
}