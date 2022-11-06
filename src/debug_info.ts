import { Container, Graphics, Text } from 'pixi.js';

export class DebugInfo extends Container {
    textEl: Text;
    pointerEl: Graphics;
    sizeEl: Graphics;

    constructor() {
        super();
        this.textEl = this.addChild(new Text('', {
            fill: 0xffffff,
            fontSize: 14,
        }));
        this.textEl.visible = false;
        this.pointerEl = this.addChild(new Graphics());
        this.pointerEl.beginFill(0xff0000)
            .drawCircle(0, 0, 3)
            .endFill();
        
        this.sizeEl = this.addChild(new Graphics());

        this.sizeEl.beginFill(0xff0000)
            .drawCircle(0, 0, 10)
            .endFill()
            .beginHole()
            .drawCircle(0, 0, 9)
            .endHole();
        this.sizeEl.visible = false;
    }

    set text (text: string) {
        this.textEl.text = text;
        if (text) {
            this.textEl.visible = true;
        }
    }

    set size (size: number) {
        if (size) {
            this.sizeEl.visible = true;
            this.sizeEl.clear()
                .beginFill(0xff0000)
                .drawCircle(0, 0, size)
                .endFill()
                .beginHole()
                .drawCircle(0, 0, size - 1)
                .endHole()
        } else {
            this.sizeEl.visible = false;
        }
    }


}


export function rect({ width = 100, height = 10, fill = 0xffffff }) {
    return new Graphics()
        .beginFill(fill)
        .drawRect(0, 0, width, height)
        .endFill();
}