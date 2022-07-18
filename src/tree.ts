import { AnimatedSprite, Container, DisplayObject, Sprite, Texture } from "pixi.js";
import { Rect } from "./rect";
import { getRunnerApp } from "./runnerApp";
import { GameObject, Updatable } from "./types";
import { Vector } from "./vector";

export class Tree implements GameObject {
    position: Vector = new Vector(0, 0);
    prev_position: Vector = new Vector(0, 0);
    sprite = new Container();
    dead = false;

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

    pieces = 10;
    inited = false;
    constructor(
        public sprites: Record<string, AnimatedSprite>,
        public container: Container
    ) {

        
    }

    createTreePos(toArea: Rect) {
        const poses: {x: number, y:number}[] = [];
        
        for (let index = 0; index < this.pieces; index++) {
            poses.push({
                x :toArea.x + Math.random() * toArea.w,
                y :toArea.y + Math.random() * toArea.h,
            })
        }
        return poses;
    }

    updateTree(poses: { x: number, y: number }[]) {
        const deadTrees = this.trees.filter(x => x.dead);
        const trees = [];
        const deadTreesCount = deadTrees.length
        const newTrees = poses.length - deadTreesCount;
        const oldTreeCount = Math.min(deadTrees.length, this.pieces);
        for (let index = 0; index < oldTreeCount; index++) {
            const element = deadTrees[index];
            element.position.setV(poses[index]);
            element.dead = false;
            trees.push(element);
        }

        for (let index = 0; index < newTrees; index++) {
            const pos = poses[index - deadTreesCount];
            const tree = new Tree(
                new Vector(
                    pos.y,
                    pos.x,
                ),
                this.sprites
            );
            this.trees.push(tree);
            trees.push(tree);
            this.container.addChild(tree.sprite);
        }
        return trees;
    }
}
