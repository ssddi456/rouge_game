import { ICollisionable, IObjectPools, Shootable } from "./types";
import * as PIXI from 'pixi.js'
import { Camera } from "./camara";

export class CollisionView {

    collisions: PIXI.Sprite[] = [];
    collisionsIndex = 0;
    texture: PIXI.Texture;

    constructor(
        public renderer: PIXI.Renderer,
        public container: PIXI.Container,
        public camara: Camera,
        public objects: (ICollisionable | IObjectPools)[]
    ) {
        const circle = new PIXI.Graphics();
        circle.beginFill(0xff0000);
        circle.drawCircle(0, 0, 300);
        circle.endFill();
        circle.beginHole();
        circle.drawCircle(0, 0, 200);
        circle.endHole();
        this.texture = renderer.generateTexture(circle);

    }

    showCollision(obj: ICollisionable) {
        if ((obj as any).dead) {
            return;
        }

        if (!this.collisions[this.collisionsIndex]) {
            const sprite = new PIXI.Sprite(this.texture);
            sprite.anchor.set(0.5, 0.5);
            sprite.zIndex = 2000;
            this.container.addChild(sprite);
            this.collisions[this.collisionsIndex] = sprite;

        }
        const collision = this.collisions[this.collisionsIndex];
        const screanPos = this.camara.worldPosToScreenPos(obj.position);
        collision.x = screanPos.x;
        collision.y = screanPos.y;
        collision.width = obj.size * 2;
        collision.height = obj.size * 2;
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
            if ((element as IObjectPools).pool) {
                for (let j = 0; j < (element as IObjectPools).pool.length; j++) {
                    const item = (element as IObjectPools).pool[j];
                    this.showCollision(item);
                }
            } else {
                this.showCollision(element as ICollisionable);
                if (((element as any) as Shootable).ammoPools) {
                    for (let j = 0; j < ((element as any) as Shootable).ammoPools.pool.length; j++) {
                        const ammo = ((element as any) as Shootable).ammoPools.pool[j];
                        this.showCollision(ammo);
                    }
                }
            }
        }
    }
}