import { AnimatedSprite } from "pixi.js";
import { applyDamageFlash } from "./buffer";
import { Enemy } from "./enemy";
import { CurrentResourceMapFunc } from "./loadAnimation";
import { getRunnerApp } from "./runnerApp";
import { AreaOfEffect, AreaOfEffectType, ECollisionType, ICollisionable } from "./types";
import { Vector } from "./vector";


export function createExplosion(): AreaOfEffect<Enemy> {
    const resources: CurrentResourceMapFunc = getRunnerApp().getGetResourceMap()() as any;
    const ret: AreaOfEffect<Enemy> = {
        type: AreaOfEffectType.oneTimePropertyChangeApply,
        enabled: false,
        dead: false,
        hitType: [ECollisionType.enemy],
        update: function (): void {
            const sprite = this.sprite as AnimatedSprite;
            if (!sprite.playing) {
                sprite.play();
                sprite.onLoop = () => {
                    this.dead = true;
                    sprite.stop();
                };
            } else {
                const frame = sprite.currentFrame;
                if (frame == 1) {
                    this.enabled = true;
                } else {
                    this.enabled = false;
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