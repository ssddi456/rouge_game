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

        const deltaX = this.x.x - this.y.x;
        const decx = (Math.abs(deltaX) < 1) ? deltaX : this.k2 * deltaX;

        const deltaY = this.x.y - this.y.y;
        const decy = (Math.abs(deltaY) < 1) ? deltaY : this.k2 * deltaY;

        this.y.setV({
            x: Math.floor(this.y.x + this.yd.x + decx),
            y: Math.floor(this.y.y + this.yd.y + decy),
        });

        // wip
        this.yd.add({
            x: this.k1 * xd.x,
            y: this.k1 * xd.y,
        });
        
        // dacc to 0
        if (this.yd.x !== 0) {
            this.yd.x -= 0.18 * this.yd.x;
        }
        if (this.yd.y !== 0) {
            this.yd.y -= 0.18 * this.yd.y;
        }

        // max yd
        // (yd + k1 * xd) * (1 - k3) = yd
        // (1 - k3)yd  + (1-k3) * k1 * xd = yd
        // - k3 * yd = (k3 -1 ) * k1 * xd
        // yd = ((1 - k3) / k3) * k1 * xd;
        // z = (1 - k3) * k1 / k3
        // k1 * k3 * z + k1 * k3 - k1 = 0
        // k3 = k1 / ( k1 - z )

        // max follow = max leading + air frame * xd
        // max leading :
        // yd = dec
        // yd = k1 * delta
        // delta = yd / k2
        // delta = ((1 - k3) / k3) * k1 * xd / k2;
        // delta = t * xd
    }
}

export enum LegSecondaryDynamicsState {
    onGround = 1,
    inAir = 2
}

export class LegSecondaryDynamics extends EularSecondaryDynamics {
    last = 0;
    state = LegSecondaryDynamicsState.onGround;
    _y: Vector = new Vector(0,0);
    lastStepPos = new Vector(0, 0);
    shouldLegUp = false;

    constructor(
        /** for leading p */f: number, /** for leading speed */z: number,
        public frameCountOnGround: number, public frameCountInAir: number, startOffSet: number,
        xe: Vector
    ) {
        super(f, z, xe);
        this.last = startOffSet
    }

    update(): void {
        
        if (this.state == LegSecondaryDynamicsState.onGround) {
            this.updateXd();
            // do nothing
        } else {
            this.y.setV(this._y);
            super.update();
            this._y.setV(this.y);
            const d = Vector.AB(this.lastStepPos, this._y).lengthSq();
            if (d > 4) {
                this.y.y -= 10 * Math.sin(Math.PI * (this.last/this.frameCountInAir));
            }
        }

        if (this.state == LegSecondaryDynamicsState.onGround) {
            if (this.last == this.frameCountOnGround) {
                this.lastStepPos.setV(this.y);
                this.yd.setV({ x: 0, y: 0});
                this.last = 0;
                this.state = LegSecondaryDynamicsState.inAir;
            }
        } else if (this.state == LegSecondaryDynamicsState.inAir) {
            if (this.last == this.frameCountInAir) {
                this.last = 0;
                this.state = LegSecondaryDynamicsState.onGround;
            }
        }

        this.last++;
    }
}
