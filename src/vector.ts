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
    }

    add(v: { x: number, y: number }) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: { x: number, y: number }) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    invert() {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    multiplyScalar(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
    }

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
    }

    dot(v: { x: number, y: number }) {
        return this.x * v.x + this.y * v.y;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        return this.divideScalar(this.length);
    }

    distanceTo(v: { x: number, y: number }) {
        return Math.sqrt(this.distanceToSq(v));
    }

    distanceToSq(v: { x: number, y: number }) {
        var dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    set(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    setX(x: number) {
        this.x = x;
        return this;
    }

    setY(y: number) {
        this.y = y;
        return this;
    }

    setV(v: { x: number, y: number }) {
        if (isNaN(v.x) || isNaN(v.y)) {
            debugger;
        }
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    set length(l: number) {
        var oldLength = this.length;
        if (oldLength !== 0 && l !== oldLength) {
            this.multiplyScalar(l / oldLength);
        }
    }


    lerp(v: { x: number, y: number }, alpha: number) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        return this;
    }

    rad() {
        return Math.atan2(this.x, this.y);
    }

    deg() {
        return this.rad() * 180 / Math.PI;
    }

    equals(v: { x: number, y: number }) {
        return this.x === v.x && this.y === v.y;
    }

    rotate(/** in rad */theta: number) {
        var xtemp = this.x;
        var cosR = Math.cos(theta);
        var sinR = Math.sin(theta);
        this.x = this.x * cosR - this.y * sinR;
        this.y = xtemp * sinR + this.y * cosR;
        return this;
    }

    ifNaN() {
        if (isNaN(this.x)) {
            return true;
        }
        if (isNaN(this.y)) {
            return true;
        }
    }

    reflect(v: Vector) {
        const nv = v.clone().normalize();
        this.sub(nv.multiplyScalar(2 * this.dot(nv)));
    }

    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
    distanceToLine(line: VectorLine) {
        return Math.abs(
            (line.point2.x - line.point1.x) * (line.point1.y - this.y) - (line.point1.x - this.x) * (line.point2.y - line.point1.y)
        ) / line.length
    }

    orthogonal() {
        if (this.y == 0) {
            return new Vector(0, 1);
        }

        return new Vector(1, - (this.x / this.y));
    }
}

export class VectorLine {
    constructor(
        public point1: Vector,
        public point2: Vector,
    ) {}

    get length() {
        return Math.sqrt(this.lengthSq());
    }

    lengthSq() {
        return this.point2.clone().sub(this.point1).lengthSq();
    }
}

export class VectorCircle {
    constructor(
        public center: Vector,
        public radius: number,
    ) {}

    collidesWithCircle(circle: VectorCircle) {
        return this.center.distanceToSq(circle.center) >= (this.radius * this.radius + circle.radius + circle.radius);
    }

    collidesWithSegment(segment: VectorSegment) {
        const maxDist = this.radius + segment.width;
        if (this.center.distanceToLine(segment) > maxDist) {
            return false;
        }
        const orth = segment.orthogonalForm();
        const maxDistOrth = this.radius + orth.width;
        if (this.center.distanceToLine(orth) > maxDistOrth) {
            return false;
        }
        return true;
    }
}

export class VectorSegment extends VectorLine {
    constructor(
        public point1: Vector,
        public point2: Vector,
        public width: number
    ) {
        super(point1, point2);
    }

    direction() {
        return this.point2.clone().sub(this.point1);
    }

    points() {
        const orth = this.direction().orthogonal().normalize().multiplyScalar(this.width);

        return [
            this.point1.clone().sub(orth),
            this.point1.clone().add(orth),
            this.point2.clone().sub(orth),
            this.point2.clone().add(orth),
        ];
    }

    center()  {
        return new Vector(
            this.point2.x / 2 + this.point1.x / 2,
            this.point2.y / 2 + this.point1.y / 2,
        );
    }

    lengthSq() {
        const x = this.point2.x - this.point1.x;
        const y = this.point2.y - this.point1.y;
        return x * x + y * y;
    }

    get length(): number {
        return Math.sqrt(this.lengthSq());
    }

    orthogonalForm() {
        const center = this.center();
        const orth = this.direction().orthogonal().normalize().multiplyScalar(this.width);
        return new VectorSegment(
            center.clone().sub(orth),
            center.clone().add(orth),
            this.length / 2
        );
    }
}
