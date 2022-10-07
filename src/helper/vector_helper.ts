import { Container, Graphics } from 'pixi.js';
import { Vector, VectorCircle, VectorSegment } from '../vector';

export class VectorElement extends Container {
    _vector: Vector;
    _vectorG: Graphics;
    constructor(vector: Vector) {
        super();
        this._vector = vector;

        this._vectorG = new Graphics()
            .beginFill(0xff0000)
            .drawCircle(0, 0, 2)
            .endFill();

        this.addChild(this._vectorG);

        this.position.set(vector.x, vector.y);
    }

    set vector(vector: Vector) {
        this._vector = vector;
        this.position.set(vector.x, vector.y);
    }
}


export class VectorCircleElement extends Container {
    _circle: VectorCircle;
    _circleG: Graphics;
    _fill = 0xff0000;
    constructor(circle: VectorCircle) {
        super();
        this._circle = circle;
        this._circleG = new Graphics()
            .beginFill(this._fill)
            .drawCircle(0, 0, circle.radius + 1)
            .endFill()
            .beginHole()
            .drawCircle(0, 0, Math.max(circle.radius - 1, 0))
            .endHole()
        this.addChild(this._circleG);
        this.position.set(circle.center.x, circle.center.y);
    }

    set circle(circle: VectorCircle) {
        if (this._circle.radius !== circle.radius) {
            this._circleG.clear()
                .beginFill()
                .drawCircle(0, 0, circle.radius + 1)
                .endFill()
                .beginHole()
                .drawCircle(0, 0, Math.max(circle.radius - 1, 0))
                .endHole()
        }
        this._circle = circle;
        this.position.set(circle.center.x, circle.center.y);
    }

    set fill(color: number) {
        this._fill = color;
        this._circleG.clear()
            .beginFill(this._fill)
            .drawCircle(0, 0, this._circle.radius + 1)
            .endFill()
            .beginHole()
            .drawCircle(0, 0, Math.max(this._circle.radius - 1, 0))
            .endHole()
    }
}


export class VectorSegmentElement extends Container {
    _segment: VectorSegment;
    _segmentG: Graphics;

    _points: VectorElement[];


    constructor(segment: VectorSegment) {
        super();
        this._segment = segment;

        const points = segment.localPoints();

        this._segmentG = new Graphics()
            .lineStyle({
                color: 0xff0000,
                width: 1
            })
            .lineTo(0, 0)
            .lineTo(points[1].x, points[1].y)
            .lineTo(points[3].x, points[3].y)
            .lineTo(points[2].x, points[2].y)
            .lineTo(points[0].x, points[0].y);

        this._points = points.map(x => this.addChild(new VectorElement(x)));
        this.addChild(this._segmentG);
        this.position.set(segment.point1.x, segment.point1.y);
    }

    set segment(segment: VectorSegment) {
        this._segment = segment;

        const points = segment.localPoints();

        this._segmentG.clear()
            .lineStyle({
                color: 0xff0000,
                width: 1
            })
            .lineTo(0, 0)
            .lineTo(points[1].x, points[1].y)
            .lineTo(points[3].x, points[3].y)
            .lineTo(points[2].x, points[2].y)
            .lineTo(points[0].x, points[0].y);
        points.forEach((x, index) => this._points[index].vector = x);

        this.position.set(segment.point1.x, segment.point1.y);
    }
}
