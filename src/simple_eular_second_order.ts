import { SecondOrder } from "./secondary_order";
import { UpdatableObject } from "./types";
import { Vector } from "./vector";

export class EularSecondaryDynamics extends SecondOrder {

    k1: number;
    k2: number;

    constructor(/** for max leading */f: number, /** for leading speed */z: number, xe: Vector) {
        super(xe);

        this.k1 = f;
        this.k2 = z;
    }


    update(): void {
        const t: number = this.getT();
        const xd = this.updateXd();

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

enum LegSecondaryDynamicsState {
    onGround = 1,
    inAir = 2
}

export class LegSecondaryDynamics extends SecondOrder {
    k1: number;
    last = 0;
    state = LegSecondaryDynamicsState.onGround;

    constructor(
        /** for leading p */f: number,
        public frameCountOnGround: number, public frameCountInAir: number, startOffSet: number,
        xe: Vector
    ) {
        super(xe);

        this.k1 = f;
        this.last = startOffSet
    }

    update(): void {
        const xd = this.updateXd();

        if (this.state == LegSecondaryDynamicsState.onGround) {
            // do nothing
        } else {
            this.y.setV({
                x: this.x.x + this.yd.x,
                y: this.x.y + this.yd.y,
            });
            // wip
            // dacc
            
            this.yd.add({
                x: this.k1 * xd.x,
                y: this.k1 * xd.y,
            });
        }

        if (this.state == LegSecondaryDynamicsState.onGround) {
            if (this.last > this.frameCountOnGround) {
                this.last = 0;
                this.state = LegSecondaryDynamicsState.inAir;
            }
        } else if (this.state == LegSecondaryDynamicsState.inAir) {
            if (this.last > this.frameCountInAir) {
                this.last = 0;
                this.state = LegSecondaryDynamicsState.inAir;
            }
        }

        this.last++;
    }
}
