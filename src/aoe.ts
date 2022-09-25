import uniqueId from "lodash/uniqueId";
import { AnimatedSprite, Container, Graphics } from "pixi.js";
import { applyDamageFlash } from "./buffer";
import { Enemy } from "./enemy";
import { CurrentResourceMapFunc } from "./loadAnimation";
import { getRunnerApp } from "./runnerApp";
import { cloneAnimationSprite } from "./sprite_utils";
import { AreaOfEffect, AreaOfEffectType, ECollisionType, ICollisionable } from "./types";
import { Vector } from "./vector";


export function createExplosion(
    options: Partial<{
        radius: number,
        damage: number
    }> = {}
): AreaOfEffect<Enemy> {

    const { radius = 30, damage = 20 } = options;
    const resources: CurrentResourceMapFunc = getRunnerApp().getGetResourceMap()() as any;
    let _dead: boolean = false;
    let frameCount = 0;
    
    let sprite = new Container();
    let size = 20;
    let scale = radius / size;
    let preFrames = 30;

    let preEffect = sprite.addChild(new Graphics());
    preEffect.beginFill(0xff0000)
    .drawCircle(0, 0, radius)
    .endFill()
    .beginHole()
    .drawCircle(0, 0, radius - 1)
    .endHole();
    
    sprite.addChild(preEffect);
    let animateEffect = cloneAnimationSprite(resources.hitEffect.hit_2);
    sprite.addChild(animateEffect);
    animateEffect.parentGroup = getRunnerApp().getGroups()?.skyGroup;
    animateEffect.visible = false;
    animateEffect.scale.set(scale, scale);

    const ret: AreaOfEffect<Enemy> = {
        type: AreaOfEffectType.oneTimePropertyChangeApply,
        enabled: false,

        get dead() {
            if (_dead) {
                console.log('this.id', ret.id, 'is dead');
            }
            return _dead
        },
        set dead(v: boolean) {
            console.log('this.id', ret.id, 'be killed', !!v);
            _dead = v;
        },

        hitType: [ECollisionType.enemy],
        id: uniqueId('createExplosion'),
        update(): void {
            frameCount += 1;

            if (frameCount > preFrames) {
                preEffect.visible = false;
                animateEffect.visible = true;
                animateEffect.play();
                animateEffect.loop = true;
                animateEffect.onLoop = () => {
                    console.log('this.id', ret.id, 'should be kill');
                    ret.dead = true;
                    animateEffect.stop();
                };

                const frame = animateEffect.currentFrame;
                if (frame == 1) {
                    ret.enabled = true;
                } else {
                    ret.enabled = false;
                }
            }

        },
        apply(target): void {
            console.log('applied', target);
            applyDamageFlash(target);
            target.recieveDamage(damage, target.position);
        },
        // how to debug this?
        size,
        position: new Vector(0, 0),
        collisison_type: ECollisionType.none,
        prev_position: new Vector(0, 0),
        sprite,
    };
    return ret;
}