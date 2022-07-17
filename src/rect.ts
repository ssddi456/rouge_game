
export class Rect {
    constructor(
        public x: number,
        public y: number,
        public w: number,
        public h: number,
    ) {

    }

    clone() {
        return new Rect(
            this.x,
            this.y,
            this.w,
            this.h
        );
    }

    pointInRect(p: { x: number, y: number }) {
        return p.x < this.x
            || p.x > (this.x + this.w)
            || p.y < this.y
            || p.x > (this.y + this.h);
    }

    pointNotInRect(p: { x: number, y: number }) {
        return !this.pointInRect(p);
    }
}