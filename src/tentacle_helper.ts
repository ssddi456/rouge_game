import { Graphics } from "pixi.js";
import { Vector } from "./vector";

export function drawSegs(graphic: Graphics, root: Vector, segs: { rotate: number, length: number }[]) {
    let nextPoint = root.clone();
    graphic.beginFill(0xff0000)
        .drawCircle(nextPoint.x, nextPoint.y, 3)
        .endFill()

    for (let index = 0; index < segs.length; index++) {
        const element = segs[index];
        const _nextPoint = nextPoint.clone()
            .add(new Vector(
                Math.cos(element.rotate) * element.length,
                Math.sin(element.rotate) * element.length
            ));
        graphic.beginFill(0xff0000)
            .drawCircle(_nextPoint.x, _nextPoint.y, 3)
            .endFill()
        graphic
            .lineStyle(1, 0xff0000)
            .moveTo(nextPoint.x, nextPoint.y)
            .lineTo(
                _nextPoint.x,
                _nextPoint.y,
            );
        nextPoint = _nextPoint;
    }
}

export function drawPoint(graphic: Graphics, point: Vector, color: number = 0x00ff00, radius: number = 5) {
    graphic.beginFill(color);
    graphic.drawCircle(point.x, point.y, radius);
    graphic.endFill();
}

export function updateTentacleSegs(dir: Vector, segs: { rotate: number, length: number }[], mirrorDir: number = 1) {

    const dirLength = dir.length;
    const dirRotate = dir.rad();
    const segsLength = segs.reduce((prev, curr) => prev + curr.length, 0);

    const _maxReFactor = 0.4;
    const segLength = segs[0].length;
    const diffLength = dirLength - segsLength;
    if (diffLength >= 0) {
        for (let index = 0; index < segs.length; index++) {
            const element = segs[index];
            element.rotate = dirRotate;
        }
    } else {
        // wrap segs rotate
        const halfCount = Math.floor(segs.length / 2);
        if (segs.length % 2 === 0) {
            const deltaLength = dirLength / segs.length;
            // deltaLength * (1 - refactor) < segLength
            // 1 - refactor < segLength / deltaLength
            // refactor > 1 - segLength / deltaLength
            const maxReFactor = Math.min(_maxReFactor, (segLength / deltaLength - 1) * 0.8);
            for (let index = 0; index < segs.length; index++) {
                const element = segs[index];
                if (index >= halfCount) {
                    // 1 + (index - halfCount) / (halfCount - 1) 
                    // (index - 1) / (halfCount - 1)
                    const refactor = halfCount > 1 ? (maxReFactor * Math.cos(Math.PI * (index - 1) / (halfCount - 1))) : 0;
                    const segsRotatePerSeg = Math.acos(deltaLength * (1 - refactor) / segLength);
                    element.rotate = mirrorDir * segsRotatePerSeg + dirRotate;
                    if (isNaN(element.rotate)) {
                        // debugger
                    }
                } else {
                    const refactor = halfCount > 1 ? (maxReFactor * Math.cos(Math.PI * index / (halfCount - 1))) : 0;
                    const segsRotatePerSeg = Math.acos(deltaLength * (1 - refactor) / segLength);
                    element.rotate = - mirrorDir *  segsRotatePerSeg + dirRotate;
                    if (isNaN(element.rotate)) {
                        // debugger
                    }
                }
            }
        } else {
            const evenDiffLength = dirLength - segLength;
            const deltaLength = Math.abs(evenDiffLength / (segs.length - 1));
            const maxReFactor = Math.min(_maxReFactor, (segLength / deltaLength - 1) * 0.8);
            const dir = evenDiffLength > 0 ? 1 : -1;
            for (let index = 0; index < segs.length; index++) {
                const element = segs[index];
                console.log(index, halfCount, (index - 2) / (halfCount - 1), index / (halfCount - 1));

                if (index > halfCount) {
                    // console.log(index, halfCount, (index - 1) / halfCount );
                    // 1 + (index - halfCount - 1) / (halfCount - 1)
                    // (index - 2) / (halfCount - 1)
                    const refactor = halfCount > 1 ? (maxReFactor * Math.cos(Math.PI * (index - 2) / (halfCount - 1))) : 0;
                    const segsRotatePerSeg = Math.acos(deltaLength * (1 - refactor) / segLength);
                    element.rotate = mirrorDir * segsRotatePerSeg * dir + dirRotate;
                } else if (index < (segs.length - 1) / 2) {
                    const refactor = halfCount > 1 ? (maxReFactor * Math.cos(Math.PI * index / (halfCount - 1))) : 0;
                    const segsRotatePerSeg = Math.acos(deltaLength * (1 - refactor) / segLength);
                    element.rotate = - mirrorDir * segsRotatePerSeg * dir + dirRotate;
                } else {
                    element.rotate = dirRotate;
                }

            }
        }
    }
}
