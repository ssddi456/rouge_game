import { Point } from "pixi.js";
import { Vector } from "./vector";

/**
 * Cubic interpolation based on https://github.com/osuushi/Smooth.js
 */
function clipInput(k: number, arr: any[]) {
    if (k < 0) k = 0;
    if (k > arr.length - 1) k = arr.length - 1;
    return arr[k];
}

function getTangent(k: number, factor: number, array: number[]) {
    return factor * (clipInput(k + 1, array) - clipInput(k - 1, array)) / 2;
}

export function cubicInterpolation(array: number[], t: number, tangentFactor: number = 1) {
    const k = Math.floor(t);
    const m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
    const p = [clipInput(k, array), clipInput(k + 1, array)];
    t -= k;
    const t2 = t * t;
    const t3 = t * t2;
    return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
}

export function makePointsArray(n: number) {
    const ret: Point[] = [];
    for (let index = 0; index < n; index++) {
        ret.push(new Point(0, 0))
    }
    return ret;
}

export function updatePointsFromControlPoint(points: Point[], historyX: number[], historyY:number[]) {
    const ropeSize = points.length;
    const historySize = historyX.length;
    for (let i = 0; i < ropeSize; i++) {
        const p = points[i];

        // Smooth the curve with cubic interpolation to prevent sharp edges.
        const ix = cubicInterpolation(historyX, i / ropeSize * historySize);
        const iy = cubicInterpolation(historyY, i / ropeSize * historySize);

        p.x = ix;
        p.y = iy;
    }
}
