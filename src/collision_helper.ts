import { ICollisionable } from "./types";

export function checkCollision ( a: ICollisionable, b: ICollisionable){
    const distSq = a.position.distanceToSq(b.position);
    const sizeSq = Math.pow(a.size + b.size, 2);

    if (distSq < sizeSq) {
        const dir = a.position.clone().sub(b.position);
        const dist = Math.sqrt(distSq);
        const overlap = (a.size + b.size) - dist;
        const normal = dir.multiplyScalar(overlap / dist);
        const collisionPos = a.position.clone().add(normal);
        return {
            collision: true,
            collisionPos,
        };
    }
    return false;
}