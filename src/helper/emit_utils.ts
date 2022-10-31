import { Vector } from "../vector";


export function pointsCircleAround(center: Vector, radius: number, n: number){
    const minR = 20;
    const kR = 3;
    let r = Math.random() * 2 * Math.PI;
    let j = Math.PI / 180;
    const ret: Vector[] = [];
    for (let index = 0; index < n; index++) {
        r += (Math.floor(Math.random() * index) * minR / 180) * Math.PI;
        for (let jndex = 0; jndex < 5; jndex++) {
            r += kR / 180 * Math.PI;
            ret.push(new Vector(
                center.x + Math.sin(r) * radius,
                center.y + Math.cos(r) * radius
            ));
        }
    }
    return ret;
}