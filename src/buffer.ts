import { Enemy } from './enemy';
import { getRunnerApp } from './runnerApp';
import { Buffer, EntityManager, EventBuffer, IMovable, TimerBuffer } from './types';
import { Vector } from './vector';
import { ColorOverlayFilter } from 'pixi-filters';
import { AnimatedSprite, DisplayObject, Sprite, Texture } from 'pixi.js';
import { assign } from 'lodash';
import easingsFunctions, { twean } from './easingFunctions';

export interface Buffable {
    bufferList: Buffer[];
    assets: DisplayObject[];
    ground_assets: DisplayObject[];
}

export function execBuffer(buffer: Buffer, target: Buffable, app = getRunnerApp(), ...rest: any[]) {
    if (buffer.takeEffect) {

        const percent = buffer.type == 'timer'
            ? (app.getSession().now() - buffer.initialTime) / buffer.duration
            : (buffer.type == 'counter'
                ? buffer.currentCount / buffer.maxCount
                : 1);

        buffer.takeEffect(target, percent, ...rest);
    } else {
        if (buffer.properties.direct) {
            const movable = (target as unknown) as IMovable;
            movable.direct.add(buffer.properties.direct);
        }
    }
}

export function applyBuffer(target: Buffable) {
    const app = getRunnerApp();
    const bufferList = target.bufferList;
    bufferList.forEach(buffer => {
        if (buffer.dead) {
            return;
        }
        if (buffer.type !== 'timer' && buffer.type !== 'counter') {
            return;
        }
        if (buffer.canEffect) {
            if (!buffer.canEffect(target)) {
                return;
            }
        }
        execBuffer(buffer, target, app);
    });
}

export function createTimerBuffer(buffer: Omit<TimerBuffer, 'type' | 'initialTime'>) {
    return {
        ...buffer,
        type: 'timer',
        initialTime: getRunnerApp().getSession().now(),
    } as TimerBuffer;
}

export const KNOCKBACK_ID = 'knock_back';
export function createKnockBack(direct: Vector, duration: number) {
    return createTimerBuffer({
        duration,
        id: KNOCKBACK_ID,
        properties: {
            direct,
        },
        afterEffect(target) {
            (target.direct as Vector).set(0, 0);
        },
    })
}

export function applyKnockback(target: Buffable, direct: Vector, duration = 200) {
    if (hasKnockback(target)) {
        return
    }

    target.bufferList.push(createKnockBack(direct, duration))
}

export function hasKnockback(target: Buffable) {
    return target.bufferList.some(x => x.id == KNOCKBACK_ID);
}

function ifBufferShouldNotRemove(buffer: Buffer, app: EntityManager) {
    if (buffer.dead) {

        return false;
    }
    if (buffer.type == 'event') {
        return true;
    }
    if (buffer.type == 'timer') {
        return buffer.initialTime + buffer.duration > app.now();
    }
    if (buffer.type == 'counter') {
        return buffer.currentCount > 0;
    }
    return false;
}

export function checkBufferAlive(target: Buffable) {
    const bufferList = target.bufferList;
    const app = getRunnerApp();

    const toRemoveBufferList: Buffer[] = [];
    const newBufferList = bufferList.filter(buffer => {
        if (ifBufferShouldNotRemove(buffer, app)) {
            return true;
        }
        toRemoveBufferList.push(buffer);
        return false;
    });

    toRemoveBufferList.forEach(buffer => {
        if (buffer.afterEffect) {
            buffer.afterEffect(target);
        }
    });

    return newBufferList;
}

export const DAMAGE_ID = 'damage_flash';
const damageFilter = new ColorOverlayFilter(
    [1, 1, 1],
    0.8
);
export function createDamageFlash(duration: number) {
    return createTimerBuffer({
        duration,
        id: DAMAGE_ID,
        properties: {},
        takeEffect(target: Enemy) {
            if (!target.sprite.filters || !target.sprite.filters.some(x => x == damageFilter)) {
                target.sprite.filters = target.sprite.filters || [];
                target.sprite.filters.push(damageFilter);
            }
        },
        afterEffect(target: Enemy) {
            target.sprite.filters = target.sprite.filters ? target.sprite.filters.filter(x => x !== damageFilter) : [];
        },
    })
}

export function applyDamageFlash(target: Buffable, duration = 100) {
    const buffer = target.bufferList.find(x => x.id == DAMAGE_ID);
    if (buffer) {
        buffer.dead = true;
    }
    target.bufferList.push(createDamageFlash(duration))
}

export const CAST_CHARGING_ID = 'cast_charging_flash';
const castCharginFilter = new ColorOverlayFilter(
    [1, 0.2, 0.2],
    0.8
);
export function createCastChargingFlash(duration: number) {
    return createTimerBuffer({
        duration,
        id: CAST_CHARGING_ID,
        properties: {},
        takeEffect(target: Enemy) {
            if (!target.sprite.filters || !target.sprite.filters.some(x => x == castCharginFilter)) {
                target.sprite.filters = target.sprite.filters || [];
                target.sprite.filters.push(castCharginFilter);
            }
        },
        afterEffect(target: Enemy) {
            target.sprite.filters = target.sprite.filters ? target.sprite.filters.filter(x => x !== castCharginFilter) : [];
        },
    })
}
export function applyCastChargingFlash(target: Buffable, duration = 100) {
    target.bufferList.push(createCastChargingFlash(duration))
}

export const FIRE_AURA_ID = 'fire_aura';

export function applyFireAura(target: Buffable) {
    if (target.bufferList.some(x => x.id == FIRE_AURA_ID)) {
        return;
    }
    const app = getRunnerApp();
    const sprites = app.getGetResourceMap()();

    const maskInner = new Sprite((sprites.playerAnimateMap.magicCircle2 as AnimatedSprite).textures[0] as Texture);
    maskInner.anchor.set(0.5, 0.5);
    maskInner.tint = 0x560f0f;
    maskInner.y = 100;
    maskInner.scale.y = 0.5;
    maskInner.parentGroup = app.getGroups().overGroundGroup;
    target.ground_assets.push(maskInner);
}

export function execEventBuffer(target: Buffable, eventName: string, ...rest: any[]) {
    const app = getRunnerApp();
    const bufferList = target.bufferList;
    for (let index = 0; index < bufferList.length; index++) {
        const buffer = bufferList[index];
        if (!buffer.dead
            && buffer.type === 'event'
            && buffer.eventName === eventName
            && (buffer.canEffect ? buffer.canEffect(target) : true)
        ) {
            execBuffer(buffer, target, app, ...rest);
        }
    }
}

export function addEventBuffer(target: Buffable, eventName: string, handler: EventBuffer['takeEffect'] | Pick<EventBuffer, 'id' | 'takeEffect' | 'canEffect' | 'afterEffect'>) {
    const buffer: EventBuffer = {
        type: 'event',
        eventName,
        id: '',
        properties: {}
    };
    if (typeof handler == 'function') {
        buffer.takeEffect = handler;
    } else {
        assign(buffer, handler);
    }
    target.bufferList.push(buffer);
}
// when enemy dead
export const BUFFER_EVENTNAME_DEAD = 'dead';
// when ammo or aoe hitted
export const BUFFER_EVENTNAME_HIT = 'hit';
// when enemy or player hitted
export const BUFFER_EVENTNAME_HITTED = 'hitted';
// when enemy or player health change
export const BUFFER_EVENTNAME_HEALTH_CHANGE = 'health_change';
// when unit move
export const BUFFER_EVENTNAME_MOVE = 'move';
// when prepare ammo
export const BUFFER_BEFORE_SHOOT = 'before_shoot';
// when shoot last bullet
export const BUFFER_BEFORE_RELOAD = 'before_reload';
// when full reload
export const BUFFER_AFTER_RELOAD = 'after_reload';


export const ICE_MARK_ID = 'ice_mark';
const iceMarkFilter = new ColorOverlayFilter(
    [0.5, 0.5, 1],
    0.8
);
export function createIceMark(duration: number) {
    return createTimerBuffer({
        duration,
        id: ICE_MARK_ID,
        properties: {},
        takeEffect(target: Enemy) {
            if (!target.sprite.filters || !target.sprite.filters.some(x => x == iceMarkFilter)) {
                target.sprite.filters = target.sprite.filters || [];
                target.sprite.filters.push(iceMarkFilter);
            }
        },
        afterEffect(target: Enemy) {
            target.sprite.filters = target.sprite.filters ? target.sprite.filters.filter(x => x !== iceMarkFilter) : [];
        },
    })
}
export function applyIceMark(target: Buffable, duration = Infinity) {
    if (hasIceMark(target)) {
        return;
    }

    target.bufferList.push(createIceMark(duration))
}

export function hasIceMark(target: Buffable,) {
    const buffer = target.bufferList.find(x => x.id == ICE_MARK_ID);
    return !!buffer;
}

export const CHARGE_ID = 'charge';
export function applyCharge(target: Buffable,
    duration: number,
    properties: {
        start_pos: Vector, direct: Vector,
        chargingTime?: number
    }
) {
    let startPercent = 0;
    let runPercent = 1;
    const chargingTime = properties.chargingTime || 0;
    const fullDuration = duration + chargingTime;
    if (chargingTime) {
        applyCastChargingFlash(target, properties.chargingTime);
        startPercent = chargingTime / fullDuration;
        runPercent = 1 - startPercent;
    }


    const buffer = createTimerBuffer({
        duration: fullDuration,
        id: CHARGE_ID,
        takeEffect(target: IMovable, percent: number) {
            if (percent > startPercent) {
                const chargePercent = (percent - startPercent) / runPercent;
                target.position.x = properties.start_pos.x + twean(0, properties.direct.x, easingsFunctions.easeOutCubic, chargePercent);
                target.position.y = properties.start_pos.y + twean(0, properties.direct.y, easingsFunctions.easeOutCubic, chargePercent);
            }
        },
        properties
    });

    target.bufferList.push(buffer);

    return applyCasting(target, fullDuration);
}
export function hasCharge(target: Buffable) {
    const buffer = target.bufferList.find(x => x.id == CHARGE_ID);
    return !!buffer;
}

export const CASTING_ID = 'casting';
export function applyCasting(target: Buffable,
    duration: number,
    properties = {}
) {
    return new Promise<void>((resolve) => {
        const buffer = createTimerBuffer({
            duration,
            id: CASTING_ID,
            takeEffect(target: IMovable, percent: number) {},
            properties,
            afterEffect() {
                resolve();
            }
        });
    
        target.bufferList.push(buffer);
    })
}

export function hasCasting(target: Buffable) {
    const buffer = target.bufferList.find(x => x.id == CASTING_ID);
    return !!buffer;
}
