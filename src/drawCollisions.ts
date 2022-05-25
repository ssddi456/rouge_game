import { ICollisionable, IObjectPools, Shootable } from "./types";
import * as PIXI from 'pixi.js'

export class CollisionView {

    collisions: PIXI.Sprite[] = [];
    collisionsIndex = 0;
    texture: PIXI.Texture;

    constructor(
        public renderer: PIXI.Renderer,
        public container: PIXI.Container,
        public objects: (ICollisionable | IObjectPools)[]
    ) {
        const circle = new PIXI.Graphics();
        circle.beginFill(0xff0000);
        circle.drawCircle(0, 0, 300);
        circle.endFill();
        circle.beginHole();
        circle.drawCircle(0, 0, 290);
        circle.endHole();
        this.texture = renderer.generateTexture(circle);

    }

    showCollision(obj: ICollisionable) {
        if (obj.dead) {
            return;
        }

        if (!this.collisions[this.collisionsIndex]) {
            const sprite = new PIXI.Sprite(this.texture);
            sprite.anchor.set(0.5, 0.5);
            this.container.addChild(sprite);
            this.collisions[this.collisionsIndex] = sprite;

        }
        const collision = this.collisions[this.collisionsIndex];
        collision.x = obj.position.x;
        collision.y = obj.position.y;
        collision.width = obj.size;
        collision.height = obj.size;
        collision.visible = true;


        this.collisionsIndex++;
    }
    update() {
        this.collisionsIndex = 0;
        for (let i = 0; i < this.collisions.length; i++) {
            const element = this.collisions[i];
            element.visible = false;
        }

        for (let i = 0; i < this.objects.length; i++) {
            const element = this.objects[i];
            if ((element as IObjectPools).pools) {
                for (let j = 0; j < (element as IObjectPools).pools.length; j++) {
                    const item = (element as IObjectPools).pools[j];
                    this.showCollision(item);
                }
            } else {
                this.showCollision(element as ICollisionable);
                if (((element as any) as Shootable).ammoPools) {
                    for (let j = 0; j < ((element as any) as Shootable).ammoPools.pools.length; j++) {
                        const ammo = ((element as any) as Shootable).ammoPools.pools[j];
                        this.showCollision(ammo);
                    }
                }
            }
        }
    }
}