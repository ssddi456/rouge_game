import { Graphics, Text } from 'pixi.js';

export function debugInfo() {

    const text = new Text('', {
        fill: 0xffffff,
        fontSize: 14,
    });
    const pointer = new Graphics();

    pointer.beginFill(0xff0000);
    pointer.drawCircle(0, 0, 10);
    pointer.endFill();
    return {
        text,
        pointer,
        update(info: any) {
            text.text = typeof info == 'string' ? info : JSON.stringify(info);
        }
    }
}


export function rect({ width = 100, height = 10, fill = 0xffffff }) {
    return new Graphics()
        .beginFill(fill)
        .drawRect(0, 0, width, height)
        .endFill();
}