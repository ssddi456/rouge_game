import { ICollisionable } from "./types";

export function checkCollision ( a: ICollisionable, b: ICollisionable){
    const distSq = a.position.distanceToSq(b.position);
    const sizeSq = Math.pow(a.size + b.size, 2);

    if (distSq < sizeSq) {
        const b_position = distSq === 0 ? b.position.clone().add({ x: 0.0001, y: 0.0001 }) : b.position;
        const dir = a.position.clone().sub(b_position);
        const dist = distSq === 0 ? 0.0000001 : Math.sqrt(distSq);
        const overlap = (a.size + b.size) - dist;
        const normal = dir.multiplyScalar(overlap / dist);
        const collisionPos = a.position.clone().add(normal);
        const collisionHitPos = a.position.clone().sub(dir.clone().normalize().multiplyScalar(a.size));

        if (collisionPos && collisionPos.ifNaN()) {
            debugger
        }

        if (collisionHitPos && collisionHitPos.ifNaN()) {
            debugger
        }

        return {
            collision: true,
            collisionPos,
            collisionHitPos,
        };
    }
    return false;
}