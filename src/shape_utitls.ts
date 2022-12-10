import { Vector } from "./vector";

export function getBBoxOfShape(shape: Vector[]){
    const x = shape.map(v => v.x);
    const y = shape.map(v => v.y);
    return {
        x: Math.min(...x),
        y: Math.min(...y),
        width: Math.max(...x) - Math.min(...x),
        height: Math.max(...y) - Math.min(...y)
    };
}

export function getCenterOfShape(shape: Vector[]){
    const bbox = getBBoxOfShape(shape);
    return new Vector(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
}

export function getDirectionIntoShape(shape: Vector[]){
    const center = getCenterOfShape(shape);
    return shape.map(v => center.clone().sub(v));
}

export function getDirectionOutOfShape(shape: Vector[]){
    const center = getCenterOfShape(shape);
    return shape.map(v => v.clone().sub(center));
}

export function rotateShapeFromCenter(shape: Vector[], rad: number, center: Vector = getCenterOfShape(shape)){
    return shape.map(v => v.clone().sub(center).rotate(rad).add(center));
}