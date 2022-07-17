import { AnimatedSprite, Container, DisplayObject, Sprite, Texture } from "pixi.js";
import { Rect } from "./rect";
import { getRunnerApp } from "./runnerApp";
import { GameObject, Updatable } from "./types";
import { Vector } from "./vector";

export class Tree implements GameObject {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);
    sprite = new Container();
    constructor(
        position: Vector,
        sprites: Record<string, AnimatedSprite>,
    ) {
        const sprite = new Sprite(sprites[1].textures[0] as Texture);
        sprite.pivot.set(0.5, 1);
        this.sprite.addChild(sprite);
    }

    updatePosition() {

    }

    update(): void {
        this.updatePosition();
    }
}

export class Forest implements Updatable {
    position: Vector = new Vector(0, 0);

    trees: Tree[] = [];

    pieces = 10;
    inited = false;
    constructor(
        public sprites: Record<string, AnimatedSprite>,
        public container: Container
    ) {

        
    }

    emit(sight: Rect, toArea: Rect) {
        const outOfSights = this.trees.filter(tree => {
            return sight.pointNotInRect( tree.position)
        });

        const newTrees = this.pieces - outOfSights.length;

        for (let index = 0; index < outOfSights.length; index++) {
            const element = outOfSights[index];
            element.position.setX(toArea.x + Math.random() * toArea.w);
            element.position.setY(toArea.y + Math.random() * toArea.h);
        }

        for (let index = 0; index < newTrees; index++) {
            const tree = new Tree(
                new Vector(
                    toArea.x + Math.random() * toArea.w,
                    toArea.y + Math.random() * toArea.h
                ),
                this.sprites
            );
            this.trees.push(tree);

            console.log('tree.position', tree.position);

            this.container.addChild(tree.sprite);
        }
    }
    init() {
        const camara = getRunnerApp().getCamera();
        const offset = camara.prevPlayerPos;
        const size = camara.size;

        this.emit(new Rect(0, 0, 0, 0), new Rect(
            offset.x - size.x / 2,
            offset.y - size.y / 2,
            size.x,
            size.y
        ));

        this.position.setV(offset);
        this.inited = true;
    }

    updatePosition() {
        const camara = getRunnerApp().getCamera();
        const offset = camara.prevPlayerPos;
        const size = camara.size;
        const w = size.x * 0.8;
        const h = size.y * 0.8;

        if (
            Math.abs(offset.x - this.position.x) > w
            || Math.abs(offset.y - this.position.y) > h
        ) {
            this.emit(new Rect(
                offset.x - w,
                offset.y - h,
                size.x,
                size.y,
            ), new Rect(
                offset.x < (this.position.x - w) 
                    ? (this.position.x - size.x) 
                    : offset.x > (this.position.x + w) 
                        ? this.position.x + size.x
                        : this.position.x,
                offset.y < (this.position.y - h)
                    ? (this.position.y - size.y)
                    : offset.y > (this.position.y + h)
                        ? this.position.y + size.y
                        : this.position.y,
                size.x,
                size.y,
            ));

            this.position.setV(offset);
        }
    }

    update(): void {
        if (!this.inited) {
            this.init();
        } else {
            this.updatePosition();
        }
    }
    
}