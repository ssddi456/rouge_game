import { createDemoContext } from "../helper/demo_util";
import { Wormling } from "../element/wormling";
import { Vector } from "../vector";
import { Graphics } from "pixi.js";
import { drawPoint, drawSegs, updateTentacleSegs } from "../tentacle_helper";
import { cloneDeep } from "lodash";
const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const animateContainer = context.animateContainer;

            const wormling = animateContainer.addChild(new Wormling());

            wormling.position.set(150, 200);


            const root = new Vector(300, 200);
            const center = new Vector(300, 100);
            const r = 50;
            let last = 0;
            function updateLeadAroundRoot() {
                last = (last + 1) % 360;
                const rad = last * Math.PI / 180;
                const x = Math.cos(rad) * r;
                const y = Math.sin(rad) * r;
                root.set(x, y).add(center);
            }
            const segLength = 100;
            let segs1 = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            let segs2 = [
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
                { rotate: 0, length: segLength },
            ];

            const bodyRoot = new Vector(700, 120);

            function makeTentacle(startRotate: number) {
                return [
                    { rotate: startRotate, length: segLength },
                    { rotate: startRotate, length: segLength },
                    { rotate: startRotate, length: segLength },
                ]
            }

            let segsTenplate = [
                { rotate: 0, length: segLength / 2 },
                { rotate: 0, length: segLength / 2 },
                { rotate: 0, length: segLength / 2 },
                { rotate: 0, length: segLength / 2 },
                { rotate: 0, length: segLength / 2 },
                { rotate: 0, length: segLength / 2 },
            ];
            const tentacles = [
                {
                    root: new Vector(bodyRoot.x + 50, bodyRoot.y + 0),
                    segs: cloneDeep(segsTenplate), initRotate: Math.PI * (1 / 2 - 1 / 12),
                    last: 0,
                },
                {
                    root: new Vector(bodyRoot.x + 30, bodyRoot.y + 20),
                    segs: cloneDeep(segsTenplate), initRotate: Math.PI * (1 / 2 - 1 / 24),
                    last: 0,
                },
                {
                    root: new Vector(bodyRoot.x + 10, bodyRoot.y + 27),
                    target: new Vector(bodyRoot.x + 50, bodyRoot.y + 0),
                    attack: (last: number, target: Vector) => {
                        target.y = 300 + 80 * curveAttackTaget(last);
                    },
                    segs: cloneDeep(segsTenplate),
                    initRotate: Math.PI * (1 / 2 - 1 / 36),
                    segs1: cloneDeep(segsTenplate),
                    last: 0,
                },
                {
                    root: new Vector(bodyRoot.x - 10, bodyRoot.y + 27),
                    target: new Vector(bodyRoot.x - 10, bodyRoot.y + 0),
                    attack: (last: number, target: Vector) => {
                        const percent = curveAttackTaget(last)
                        target.y = 300 + 80 * percent;
                        target.x = bodyRoot.x - 240 + 280 * percent / 2.5;
                    },
                    segs: cloneDeep(segsTenplate),
                    initRotate: Math.PI * (1 / 2 + 1 / 36),
                    segs1: cloneDeep(segsTenplate),
                    mirrorDir: -1,
                    last: 0,
                },
                {
                    root: new Vector(bodyRoot.x - 30, bodyRoot.y + 20),
                    segs: cloneDeep(segsTenplate), initRotate: Math.PI * (1 / 2 + 1 / 24),
                    last: 0,
                },
                {
                    root: new Vector(bodyRoot.x - 50, bodyRoot.y + 0),
                    segs: cloneDeep(segsTenplate), initRotate: Math.PI * (1 / 2 + 1 / 12),
                    last: 0,
                },
            ];

            function segsToVectors(segs: { rotate: number, length: number }[], root: Vector = new Vector(0, 0)) {
                const vectors: Vector[] = [];
                let last = root.clone();
                vectors.push(last);
                for (const seg of segs) {
                    const vector = new Vector(seg.length, 0).rotate(seg.rotate);
                    last = new Vector(
                        last.x + vector.x,
                        last.y + vector.y
                    );
                    vectors.push(last);
                }
                return vectors;
            }

            function vectorsFollowRoot(vectors: Vector[], root: Vector) {
                const points: Vector[] = [];
                let last = root.clone();
                points.push(last);
                for (let index = 1; index < vectors.length; index++) {
                    const element = vectors[index];
                    const oPrev = vectors[index - 1];
                    const oDir = Vector.AB(oPrev, element);
                    const oLength = oDir.length;
                    const nDir = Vector.AB(last, element).normalize();
                    const nPoint = new Vector(
                        last.x + nDir.x * oLength,
                        last.y + nDir.y * oLength,
                    );
                    points.push(nPoint);
                    last = nPoint;
                }
                return points;
            }

            function vectorsToSegs(vectors: Vector[], root: Vector) {
                const segs: { rotate: number, length: number }[] = [];
                let last = root.clone();
                for (let index = 1; index < vectors.length; index++) {
                    const element = vectors[index];
                    const vector = Vector.AB(last, element);
                    segs.push({ rotate: vector.rad(), length: vector.length });
                    last = element;
                }
                return segs;
            }

            function mergeSegs(segs1: { rotate: number, length: number }[], segs2: { rotate: number }[], percent: number) {
                const segs: { rotate: number, length: number }[] = [];
                for (let index = 0; index < segs1.length; index++) {
                    const element1 = segs1[index];
                    const element2 = segs2[index];
                    segs.push({ rotate: element1.rotate * percent + element2.rotate * (1 - percent), length: element1.length });
                }
                return segs;
            }

            function segsWaving(segs: { rotate: number, length: number }[], startRotate: number, percent: number) {
                for (let index = 0; index < segs.length; index++) {
                    const element = segs[index];
                    element.rotate = startRotate + Math.sin(2 * Math.PI * (percent * 10 - index * 0.1)) * Math.PI * 0.1;
                }
            }


            function curveAttackTaget (last: number) {
                const seg1 = 200;
                const seg2 = seg1 + 25; // back
                const seg3 = seg2 + 12; // punch
                const seg4 = seg3 + 12; // stay
                const seg5 = seg4 + 12; // back
                const seg6 = seg5 + 25; // back to stable
                const seg7 = seg6 + 100;

                last = last % seg7;
                const max = 2.5;
                const min = -0.5;
                const stable = 0.75;

                // 
                if (last < seg1 || last >= seg7) {
                    return min * (stable + (1 - stable) * Math.sin(last / 50 * Math.PI));
                } else if (last < seg2) {
                    return 1 * min * Math.sin((last - seg1) / 50 * Math.PI) + stable * min;
                } else if (last < seg3) {
                    return max * Math.sin((last - seg2) / 25 * Math.PI) + stable * min;
                } else if (last < seg4) {
                    return max + stable * min;
                } else if (last < seg5) {
                    return - max * Math.cos((last - seg4 + 25) / 25 * Math.PI) + stable * min;
                }

                return min * (0.75 + (1 - stable) * Math.sin(last / 50 * Math.PI));
            }


            const curveMergeIdleAttack = (last: number) => {
                const segIdle = 100;
                const seg1 = 150;
                const seg2 = seg1 + 25 + 50; // back
                const seg3 = seg2 + 12; // punch
                const seg4 = seg3 + 12; // stay
                const seg5 = seg4 + 12; // back
                const seg6 = seg5 + 25; // back to stable
                const seg7 = seg6 + 100;

                last = last % seg7;

                if (last < segIdle) {
                    return 1;
                } else if (last < seg1) {
                    return 1 - Math.pow(Math.sin((last - segIdle) / 50 * Math.PI / 2), 2);
                } else if (last < seg6) {
                    return 0;
                } else if (last < seg7) {
                    return Math.pow((last - seg6) / 100, 2)
                }
                return 1;
            }


            const graphic = animateContainer.addChild(new Graphics());
            const points = segsToVectors(segs1, root);

            let last1 = 0;
            function updateWaving() {
                last1 += 1;
                segsWaving(segs2, segs1[0].rotate, (last1 % 3600) / 3600);
            }
            let segs12;
            return function () {
                wormling.update();
                updateLeadAroundRoot();

                graphic.clear();
                drawPoint(graphic, center, 0xfff0f0);
                drawPoint(graphic, root, 0xff00f0);

                // for (let index = 0; index < points.length; index++) {
                //     const element = points[index];
                //     drawPoint(graphic, element, 0xff0000);
                // }

                const points2 = vectorsFollowRoot(points, root);
                for (let index = 0; index < points2.length; index++) {
                    const element = points2[index];
                    drawPoint(graphic, element, 0xff00f0);
                }

                segs1 = vectorsToSegs(points2, root);
                drawSegs(graphic, root, segs1);
                // const segs2 = vectorsToSegs(points2, root);
                // drawSegs(graphic, root, segs2);
                updateWaving();
                drawSegs(graphic, center, segs2);

                segs12 = mergeSegs(segs1, segs2, 0.6);
                drawSegs(graphic, root, segs12);

                tentacles.forEach((tentacle) => {
                    const { root, segs, segs1, initRotate, last, attack, mirrorDir } = tentacle;
                    tentacle.last += 0.5 + Math.random() * 0.5;
                    drawPoint(graphic, root, 0xff0000);
                    // const segs = vectorsToSegs(points2, root);
                    segsWaving(segs, initRotate, (tentacle.last % 3600) / 3600);

                    if (tentacle.target) {
                        attack!(last, tentacle.target);
                        drawPoint(graphic, tentacle.target, 0x00ff00);

                        const dir3 = tentacle.target.clone().sub(root);

                        updateTentacleSegs(dir3, segs1!, mirrorDir || 1);
                        const mergetSegs = mergeSegs(segs, segs1!, curveMergeIdleAttack(last));
                        drawSegs(graphic, root, mergetSegs);
                    } else {

                        drawSegs(graphic, root, segs);
                    }
                    

                });
            };

        }
    });

export default context.initDemo