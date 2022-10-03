import { Enemy } from './enemy';
import { getRunnerApp } from './runnerApp';
import { Buffer, EntityManager, EventBuffer, IMovable, TimerBuffer } from './types';
import { Vector } from './vector';
import { ColorOverlayFilter } from 'pixi-filters';
import { AnimatedSprite, DisplayObject, Sprite, Texture } from 'pixi.js';
import { assign } from 'lodash';

export interface Buffable {
    bufferList: Buffer[];
    assets: DisplayObject[];
    ground_assets: DisplayObject[];
}

export function execBuffer(buffer: Buffer, target: Buffable, app = getRunnerApp(), ...rest: any[]) {
    if (buffer.takeEffect) {

        const percent = buffer.type == 'timer'
            ? (app.now() - buffer.initialTime) / buffer.duration
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

export function createTimerBuffer(buffer: Omit<TimerBuffer, 'type'| 'initialTime'>) {
    return {
        ...buffer,
        type: 'timer',
        initialTime: getRunnerApp().now(),
    } as TimerBuffer;
}

export const KNOCKBACK_ID = 'knock_back';
export function createKnockBack(direct: Vector, duration: number) {
    return createTimerBuffer({
        duration,
        id: KNOCKBACK_ID,
        properties: {
            direct,
        }
    })
}

export function applyKnockback(target: Buffable, direct: Vector, duration = 200) {
    !target.bufferList.some(x => x.id == KNOCKBACK_ID) && target.bufferList.push(createKnockBack(direct, duration))
}

function ifBufferShouldNotRemove(buffer: Buffer, app: EntityManager){
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

export const FIRE_AURA_ID = 'fire_aura';

export function applyFireAura(target: Buffable){
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

export function applyEventBuffer(target: Buffable, eventName: string, ...rest: any[]){
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

export function addEventBuffer(target: Buffable, eventName: string, handler: EventBuffer['takeEffect'] | Pick<EventBuffer, 'id' | 'takeEffect' | 'canEffect' |'afterEffect'> ){
    const buffer: EventBuffer =  {
        type: 'event',
        eventName,
        id: '',
        properties: {}
    };
    if (typeof handler == 'function' ) {
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
