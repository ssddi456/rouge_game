import { AnimatedSprite, Container, DisplayObject, Graphics, Sprite } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { cloneAnimationSprite, cloneSprite } from "../sprite_utils";


export class HealthProgressbar extends Container{
    constructor() {
        super();

        this.init();
    }

    background: Container | undefined;
    foreground: Container | undefined;

    init(this: HealthProgressbar) {

        const scale = this._height / this.baseSize;
        const resources = getRunnerApp().getGetResourceMap()();
        this.background = this.addChild(new Container());
        for (let index = 0; index < this._max; index++) {
            const empty = this.background.addChild(cloneSprite(resources.heartAnimationSpriteMap['3'] as Sprite));
            empty.scale.set(scale);
            empty.position.set(index * this._height, 0);
            empty.visible = index >= this.current;

        }

        this.foreground = this.addChild(new Container());
        for (let index = 0; index < this._max; index++) {
            const active = this.foreground.addChild(cloneAnimationSprite(resources.heartAnimationAnimateMap['hit_0'] as AnimatedSprite));
            active.anchor.set(0, 0);
            active.animationSpeed = 0.05;
            active.scale.set(scale);
            active.position.set(index * this._height, 0);
            active.visible = index < this.current;
            active.play();
        }
    }

    updateVisible() {
        for (let index = 0; index < this._max; index++) {
            if (index < this._current) {
                this.foreground!.children[index]!.visible = true;
                this.background!.children[index]!.visible = false;
            } else {
                this.foreground!.children[index]!.visible = false;
                this.background!.children[index]!.visible = true;
            }
        }
    }

    baseSize = 32;
    _height: number = 32;
    set height(v: number) {
        this._height = v;
        this.dispose();
        this.init();
    }

    get height() {
        return this._height;
    }

    _current: number = 10;
    set current(v: number) {
        this._current = v;
        this.updateVisible();
    }

    get current() {
        return this._current;
    }

    _max: number = 10;
    set max(v: number) {
        if (v !== this._max) {
            this._max = v;
            this.dispose();
            this.init();
        }
    }

    get max() {
        return this._max;
    }

    dispose() {
        const children = this.removeChildren();
        children.forEach(x => x.destroy());
    }
}