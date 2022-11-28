import { UpdatableObject } from "./types";
import { Vector } from "./vector";

// https://www.youtube.com/watch?v=KPoeNZZ6H4s
export class SecondaryDynamics extends UpdatableObject {
    // track by ref;
    x: Vector;
    xp: Vector;
    y: Vector;
    yd: Vector;
    k1: number;
    k2: number;
    k3: number;

    w: number;
    z: number;
    d: number;

    constructor(f: number, z: number, r: number, xe: Vector) {
        super();
        // compute constants
        this.w = 2 * Math.PI * f;
        this.z = z;
        this.d = this.w * Math.sqrt(Math.abs(z * z - 1));
        this.k1 = this.z / (Math.PI * f);
        this.k2 = 1/ (this.w * this.w);
        this.k3 = r * this.z / this.w;

        this.x = xe;
        this.xp = xe.clone();
        this.y = xe.clone();
        this.yd = new Vector(0,0);
    }

    update(): void {
        const t: number = 1;
        const xp = this.x.clone();
        const xd = xp.sub(this.xp).divideScalar( t);
        this.xp = xp;
        let k1_stable, k2_stable;
        if (this.w * t < this.z) {
            k1_stable = this.k1;
            k2_stable = Math.max(this.k2, t * t /2 + t * this.k1 / 2, t * this.k1);
        } else {
            const t1 = Math.exp(- this.z * this.w * t);
            const alpha = 2 * t1 * (this.z <= 1? Math.cos(t * this.d): Math.cosh(t * this.d));
            const beta = t1 * t1;
            const t2 = t / (1 + beta - alpha);
            k1_stable = (1 - beta) * t2;
            k2_stable = t * t2;
        }

        this.y.add({ x: this.yd.x * t, y: this.yd.y * t });
        this.yd.add({ 
            x: t * (this.x.x + this.k3 * xd.x - this.y.x - k1_stable * this.yd.x) / k2_stable,
            y: t * (this.x.y + this.k3 * xd.y - this.y.y - k1_stable * this.yd.y) / k2_stable
        });
    }
}
