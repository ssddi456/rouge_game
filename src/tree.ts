import { AnimatedSprite, Container, DisplayObject, Sprite, Texture } from "pixi.js";
import { debugInfo } from "./debug_info";
import { Rect } from "./rect";
import { getRunnerApp } from "./runnerApp";
import { GameObject, Updatable } from "./types";
import { Vector } from "./vector";

export class Tree implements GameObject {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);
    sprite = new Container();
    dead = false;
    scale = 0.8 +Math.random() * 0.8;
    debugInfo = debugInfo();
    constructor(
        sprites: Record<string, AnimatedSprite>,
    ) {

        const sprite = new Sprite(sprites[1].textures[0] as Texture);
        // console.log(sprite.width, sprite.height);

        sprite.position.set(
            - sprite.width / 2 * this.scale,
            - (sprite.height - 20) * this.scale
        );

        sprite.scale.set(this.scale, this.scale);
        
        this.sprite.addChild(sprite);
        this.sprite.addChild(this.debugInfo.pointer);
    }

    updatePosition() {

    }

    updateSprite() {
        this.sprite.visible = !this.dead;
    }

    update(): void {
        this.updatePosition();
        this.updateSprite();
    }
}

export class Forest {
    position: Vector = new Vector(0, 0);

    trees: Tree[] = [];

    pieces = 4;
    inited = false;
    constructor(
        public sprites: Record<string, AnimatedSprite>,
        public container: Container
    ) {

        
    }

    createTreePos(toArea: Rect) {
        const poses: {x: number, y:number}[] = [];
        const _w = toArea.w / this.pieces;
        const _h = toArea.h / this.pieces;
        for (let index = 0; index < this.pieces  +1; index++) {
            for (let jndex = 0; jndex < this.pieces; jndex++) {
                poses.push({
                    x: toArea.x + Math.random() * 50 - 25 + _w * (index + (jndex % 2) * 0.5),
                    y: toArea.y + Math.random() * 50 - 25 + _h * jndex,
                });
            }
        }
        // poses.push({
        //     x: toArea.x + toArea.w / 2,
        //     y: toArea.y + toArea.h / 2,
        // });
        return poses;
    }

    updateTree(poses: { x: number, y: number }[]) {
        const deadTrees = this.trees.filter(x => x.dead);
        const trees = [];
        const deadTreesCount = deadTrees.length
        const newTrees = Math.max(poses.length - deadTreesCount, 0);
        const oldTreeCount = Math.min(deadTrees.length, poses.length);
        for (let index = 0; index < oldTreeCount; index++) {
            const element = deadTrees[index];
            element.position.setV(poses[index]);
            element.dead = false;
            trees.push(element);
        }

        for (let index = 0; index < newTrees; index++) {
            const pos = poses[index - deadTreesCount];
            const tree = new Tree(
                this.sprites
            );
            tree.position.setV(pos);
            this.trees.push(tree);
            trees.push(tree);
            this.container.addChild(tree.sprite);
        }
        return trees;
    }
}
