import { getRunnerApp } from './runnerApp';
import { Buffer, IMovable, TimerBuffer } from './types';

export function applyBuffer(bufferList: Buffer[], target: any) {
    const app = getRunnerApp();

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
                const movable = target as IMovable;
                movable.direct.add(buffer.properties.direct);
            }
        }

        if (buffer.afterEffect) {
            buffer.afterEffect(target);
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

export function checkBufferAlive(bufferList: Buffer[]) {
    const app = getRunnerApp();
    return bufferList.filter(buffer => {
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
    });
}