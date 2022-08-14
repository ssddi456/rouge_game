import { Enemy } from './enemy';
import { getRunnerApp } from './runnerApp';
import { Buffer, EntityManager, IMovable, TimerBuffer } from './types';
import { Vector } from './vector';
import { ColorOverlayFilter } from 'pixi-filters';

export interface Buffable {
    bufferList: Buffer[];
}


export function applyBuffer(target: Buffable) {
    const app = getRunnerApp();
    const bufferList = target.bufferList;
    bufferList.forEach(buffer => {

        if (buffer.canEffect) {
            if (!buffer.canEffect(target)) {
                return;
            }
        }

        if (buffer.takeEffect) {

            const percent = buffer.type == 'timer' 
                ? (app.now() - buffer.initialTime) / buffer.duration
                : (buffer.type == 'counter' 
                    ? buffer.currentCount / buffer.maxCount
                    : 1);

            buffer.takeEffect(target, percent);
        } else {
            if (buffer.properties.direct) {
                const movable = (target as unknown) as IMovable;
                movable.direct.add(buffer.properties.direct);
            }
        }
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