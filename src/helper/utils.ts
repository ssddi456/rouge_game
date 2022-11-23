import { Vector } from "../vector";

export function fixed2(num: number) {
    return num > 9 ? String(num) : '0' + num;
}

export function formatTime(time: number) {
    return fixed2(Math.floor(time / 60e3)) + ':' + fixed2(Math.floor((time % 60e3) / 1e3));
}

export function randomPosAround(positon: Vector, distance: number) {
    const r = Math.random() * 2 * Math.PI;

    return new Vector(
        positon.x + distance * Math.sin(r),
        positon.y + distance * Math.cos(r)
    );
}

export function radToDeg(rad: number) {
    return rad * 180 / Math.PI;
}

export function degToRad(deg: number) {
    return deg * Math.PI / 180;
}