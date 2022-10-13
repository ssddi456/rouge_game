import { Graphics, Mesh } from "pixi.js";

export function genWireframe(sprite: Mesh, graphics = new Graphics()) {
    sprite.calculateVertices();

    const indices = sprite.geometry.getIndex().data;
    const vertices = sprite.geometry.getBuffer('aVertexPosition').data;

    graphics.lineStyle(0.3, 0xff9999 | 0);
    // generating it in current sprite world coords.
    // they are local if sprite wasnt added yet

    for (let i = 0; i < indices.length; i += 3) {
        let ind = indices[i + 2];
        graphics.moveTo(vertices[ind * 2], vertices[ind * 2 + 1]);
        for (let j = 0; j < 3; j++) {
            ind = indices[i + j];
            graphics.lineTo(vertices[ind * 2], vertices[ind * 2 + 1]);
        }
    }

    return graphics;
}
