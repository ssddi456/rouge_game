/*
 * @class Vector
 * @constructor 
 * @param x {Number} position of the point
 * @param y {Number} position of the point
 */
export class Vector {

    constructor(
        public x: number,
        public y: number
    ) {
    }

    /**
     * Creates a clone of this point
     *
     * @method clone
     * @return {Vector} a copy of the point
     */
    clone() {
        return new Vector(this.x, this.y);
    };

    add(v: { x: number, y: number }) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };

    sub(v: { x: number, y: number }) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };

    invert() {
        this.x *= -1;
        this.y *= -1;
        return this;
    };

    multiplyScalar(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
    };

    divideScalar(s: number) {
        if (s === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            var invScalar = 1 / s;
            this.x *= invScalar;
            this.y *= invScalar;
        }
        return this;
    };

    dot(v: { x: number, y: number }) {
        return this.x * v.x + this.y * v.y;
    };

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    lengthSq() {
        return this.x * this.x + this.y * this.y;
    };

    normalize() {
        return this.divideScalar(this.length);
    };

    distanceTo(v: { x: number, y: number }) {
        return Math.sqrt(this.distanceToSq(v));
    };

    distanceToSq(v: { x: number, y: number }) {
        var dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;
    };

    set(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    };

    setX(x: number) {
        this.x = x;
        return this;
    };

    setY(y: number) {
        this.y = y;
        return this;
    };

    setV(v: Vector) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    set length(l: number) {
        var oldLength = this.length;
        if (oldLength !== 0 && l !== oldLength) {
            this.multiplyScalar(l / oldLength);
        }
    };


    lerp(v: { x: number, y: number }, alpha: number) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        return this;
    };

    rad() {
        return Math.atan2(this.x, this.y);
    };

    deg() {
        return this.rad() * 180 / Math.PI;
    };

    equals(v: { x: number, y: number }) {
        return this.x === v.x && this.y === v.y;
    };

    rotate(/** in rad */theta: number) {
        var xtemp = this.x;
        var cosR = Math.cos(theta);
        var sinR = Math.sin(theta);
        this.x = this.x * cosR - this.y * sinR;
        this.y = xtemp * sinR + this.y * cosR;
        return this;
    };
}