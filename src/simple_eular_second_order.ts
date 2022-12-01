import { UpdatableObject } from "./types";
import { Vector } from "./vector";

export class EularSecondaryDynamics extends UpdatableObject {
    x: Vector;
    xp: Vector;
    y: Vector;
    yd: Vector;

    k1: number;
    k2: number;

    constructor(/** for max leading */f: number, /** for leading speed */z: number, xe: Vector) {
        super();

        this.k1 = f;
        this.k2 = z;

        this.x = xe;
        this.xp = xe.clone();
        this.y = xe.clone();
        this.yd = new Vector(0, 0);
    }


    update(): void {
        const t: number = 1;
        const xp = this.x.clone();
        const xd = new Vector(
            (xp.x - this.xp.x) / t,
            (xp.y - this.xp.y) / t,
        );
        this.xp = xp;

        this.y.setV({
            x: this.x.x + this.yd.x,
            y: this.x.y + this.yd.y,
        });
        // wip
        // dacc
        const deltaX = this.y.x - this.x.x;
        const decx = -1 * this.k2 * deltaX;

        const deltaY = this.y.y - this.x.y;
        const decy = -1 * this.k2 * deltaY;

        this.yd.add({
            x: this.k1 * xd.x + decx,
            y: this.k1 * xd.y + decy,
        })
    }
}
