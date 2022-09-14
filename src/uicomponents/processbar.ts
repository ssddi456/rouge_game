import { Container, DisplayObject, Graphics } from "pixi.js";


export class Progressbar extends Container{
    constructor(
        public foregroundColor = 0xffffff,
        public backgroundColor = 0x111111,
    ) {
        super();

        this.init();
    }

    background: Graphics | undefined;
    foreground: Graphics | undefined;

    init(this: Progressbar) {
        this.background = new Graphics()
            .beginFill(this.backgroundColor)
            .drawRoundedRect(0, 0, this._width, this._height, 3)
            .endFill();
        this.foreground = new Graphics()
            .beginFill(this.foregroundColor)
            .drawRoundedRect(0, 0, this._width * this._progress, this._height, 3)
            .endFill();
        Container.prototype.addChild.call(this, this.background);
        Container.prototype.addChild.call(this, this.foreground);
    }

    reinit() {
        this.background
            ?.clear()
            .beginFill(this.backgroundColor)
            .drawRoundedRect(0, 0, this._width, this._height, 3)
            .endFill();
        this.foreground
            ?.clear()
            .beginFill(this.foregroundColor)
            .drawRoundedRect(0, 0, this._width * this._progress, this._height, 3)
            .endFill();
    }

    addChild(...args: DisplayObject[]): DisplayObject {
        throw new Error("cannot add children to progressbar");
    }

    _progress = 0;

    set progress (v: number) {
        this._progress = v;
        this.foreground
            ?.clear()
            .beginFill(this.foregroundColor)
            .drawRoundedRect(0, 0, this._width * this._progress, this._height, 3)
            .endFill();
    }

    /** 0 to 1 */
    get progress () {
        return this._progress;
    }

    _width: number = 100;
    set width(v: number) {
        this._width = v;
        this.dispose();
        this.init();
    }

    get width() {
        return this._width;
    }

    _height: number = 10;
    set height(v: number) {
        this._height = v;
        this.dispose();
        this.init();
    }

    get height() {
        return this._height;
    }

    dispose() {
        this.background?.destroy();
        this.foreground?.destroy();
    }
}