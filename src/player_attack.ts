import { AnimatedSprite, Container, Sprite, Texture, Text, Graphics } from "pixi.js";
import { cloneAnimationSprite } from "./sprite_utils";


export default function (playerAnimateMap: Record<string, AnimatedSprite>) {
    const heavyAttack = function playHeavyAttack({
        showDebug = true,
        deltaFrame = 1,
        facing = 'bottom',
        dir = 'left',
    }) {
        const attackAnimateContainer = new Container();
        if (dir == 'right') {
            attackAnimateContainer.scale.x = -1;
        }

        const animate = facing == 'top' ? cloneAnimationSprite(playerAnimateMap.heavy_attack_back) : cloneAnimationSprite(playerAnimateMap.heavy_attack);
        animate.loop = false;
        animate.animationSpeed = 0.15;
        console.log(animate.loop);
        const bodyContainer = new Container();
        attackAnimateContainer.addChild(bodyContainer);

        const frames = animate.totalFrames;
        const startFrame = 1;
        const stopFrame = frames - 4;
        const realFrames = stopFrame - startFrame;
        let onceEnd: (() => void) | undefined;
        const isAnimationEnd = (frame: number) => {
            if (frame >= frames - 1) {
                onceEnd?.();
            }
        }

        let swordTip: Sprite;
        let body: Sprite[];
        if (facing == 'top') {
            bodyContainer.scale.y = -1;
            swordTip = new Sprite(playerAnimateMap.sword.textures[2] as Texture);
            swordTip.anchor.set(0.5, 0.5);
            swordTip.scale.y = -1;
            swordTip.rotation = -  Math.PI * 1 / 2;
            body = [
                new Sprite(playerAnimateMap.sword.textures[3] as Texture),
                new Sprite(playerAnimateMap.sword.textures[3] as Texture),
                new Sprite(playerAnimateMap.sword.textures[3] as Texture),
                new Sprite(playerAnimateMap.sword.textures[3] as Texture),
                new Sprite(playerAnimateMap.sword.textures[3] as Texture),
            ];
            for (let index = 0; index < body.length; index++) {
                const element = body[index];
                element.anchor.set(0.5, 0.5);
                element.scale.y = -1;
                element.rotation = - Math.PI * 3 / 8;
            }
            animate.onFrameChange = (frame: number) => {
                const currentFrame = frame > stopFrame ? (stopFrame - startFrame) : (frame < startFrame ? 0 : frame - startFrame);
                swordTip.x = - 80 - currentFrame * 10;
                swordTip.y = 100 + currentFrame * 10;
                body[0].x = swordTip.x + 8 + Math.random() * 4;
                body[0].y = swordTip.y - 50 + Math.random() * 4;
                body[0].alpha = swordTip.alpha = (currentFrame) / realFrames;
                for (let index = 1; index < body.length; index++) {
                    const element = body[index];
                    element.x = body[index - 1].x + 20 + Math.random() * 4;
                    element.y = body[index - 1].y - 20 + Math.random() * 4;
                    element.alpha = (currentFrame - index * 0.3) / realFrames;
                }
                isAnimationEnd(frame);
            };
        } else {
            swordTip = new Sprite(playerAnimateMap.sword.textures[0] as Texture);
            body = [
                new Sprite(playerAnimateMap.sword.textures[1] as Texture),
                new Sprite(playerAnimateMap.sword.textures[1] as Texture),
                new Sprite(playerAnimateMap.sword.textures[1] as Texture),
                new Sprite(playerAnimateMap.sword.textures[1] as Texture),
                new Sprite(playerAnimateMap.sword.textures[1] as Texture),
            ];
            animate.onFrameChange = (frame: number) => {
                const currentFrame = frame > stopFrame ? (stopFrame - startFrame) : (frame < startFrame ? 0 : frame - startFrame);
                swordTip.x = - 150 - currentFrame * 10;
                swordTip.y = 40 + currentFrame * 10;
                body[0].x = swordTip.x + 60 + Math.random() * 4;
                body[0].y = swordTip.y - 35 + Math.random() * 4;
                body[0].alpha = swordTip.alpha = (currentFrame) / realFrames;
                for (let index = 1; index < body.length; index++) {
                    const element = body[index];
                    element.x = body[index - 1].x + 20 + Math.random() * 4;
                    element.y = body[index - 1].y - 20 + Math.random() * 4;
                    element.alpha = (currentFrame - index * 0.3) / realFrames;
                }
                isAnimationEnd(frame);
            };
        }
        bodyContainer.addChild(swordTip);
        bodyContainer.addChild(...body);
        attackAnimateContainer.addChild(animate);
        if (showDebug) {
            const toFrame = deltaFrame;
            animate.gotoAndStop(toFrame);
            animate.onFrameChange(toFrame);
            const runFrale = toFrame > stopFrame ? (stopFrame - startFrame) : (toFrame < startFrame ? 0 : toFrame - startFrame);
            const text = attackAnimateContainer.addChild(new Text(`${toFrame} [${runFrale}] /${frames} [${realFrames}] ${body[0].alpha}`));
            text.y = -100;
        }

        return {
            container: attackAnimateContainer,
            play: () => {
                animate.gotoAndPlay(0);
            },
            stop: () => {
                animate.stop();
            },
            onEnd: (callback: () => void) => {
                onceEnd = callback;
            },
            onceEnd: (callback: () => void) => {
                onceEnd = () => {
                    callback();
                    onceEnd = undefined;
                };
            }
        };
    };


    const castAttack = function playCastAttack({
        showDebug = true,
        deltaFrame = 1,
        castFrame = 10,
        facing = 'bottom',
        dir = 'left',
        circleType = 'magicCircle1',
    }) {
        const attackAnimateContainer = new Container();
        if (dir == 'right') {
            attackAnimateContainer.scale.x = -1;
        }
        const animateBase = facing == 'top' ? playerAnimateMap.attack_back : playerAnimateMap.attack;

        const castOrigin = animateBase.textures.slice(2, -4);
        const castOriginFrames = castOrigin.length;
        console.log('castOriginFrames', animateBase.textures, castOriginFrames);
        const castFrames = [];
        for (let index = 0; index < castFrame; index++) {
            const element = castOrigin[index % castOriginFrames];
            castFrames.push(element);
        }
        const animate = new AnimatedSprite([...animateBase.textures.slice(0, 2), ...castFrames, ...animateBase.textures.slice(-4)] as Texture[]);
        animate.anchor.set(0.5, 0.5);
        animate.animationSpeed = 0.15;
        animate.loop = false;
        console.log('animate.textures', animate.textures.length);
        const frames = animate.totalFrames;
        const keyFrame1 = 2;
        const keyFrame2 = frames - 6;
        const keyFrame3 = frames - 3;
        const realFrames = keyFrame2 - keyFrame1;
        let onceEnd: (() => void) | undefined;
        const isAnimationEnd = (frame: number) => {
            if (frame >= frames - 1) {
                onceEnd?.();
            }
        };
        const maskScaleFactor = 0.015;
        const startY = 100;

        const maskInner = new Sprite(playerAnimateMap[circleType].textures[0] as Texture);
        maskInner.anchor.set(0.5, 0.5);
        maskInner.tint = 0x560f0f;
        const mask = new Container();
        mask.addChild(maskInner);

        mask.scale.y = 0.3 * maskScaleFactor;
        mask.y = startY;
        attackAnimateContainer.addChild(mask);
        animate.onFrameChange = (frame: number) => {
            const currentFrame = frame > keyFrame2 ? (keyFrame2 - keyFrame1) : (frame < keyFrame1 ? 0 : frame - keyFrame1);
            const percent = Math.min((currentFrame + 3) / realFrames, 1);

            maskInner.rotation = (((frame < keyFrame2
                ? percent
                : 0
            ) * 12 ) % 2)* Math.PI ;
            
            mask.y = startY + percent * 20
            mask.scale.x = (
                frame < keyFrame1
                    ? 0
                    : (frame < keyFrame2
                        ? percent
                        : frame < keyFrame3
                            ? 1 - (frame - keyFrame2) / (keyFrame3 - keyFrame2)
                            : 0
                    )
            ) * 40 * maskScaleFactor;
            mask.scale.y = 0.3 * mask.scale.x;

            isAnimationEnd(frame);
        };

        attackAnimateContainer.addChild(animate);
        if (showDebug) {
            const toFrame = deltaFrame;
            animate.gotoAndStop(toFrame);
            // animate.onFrameChange(toFrame);
        }
        return {
            container: attackAnimateContainer,
            play: () => {
                animate.gotoAndPlay(0);
            },
            stop: () => {
                animate.stop();
            },
            onEnd: (callback: () => void) => {
                animate.onComplete = callback;
            },
            onceEnd: (callback: () => void) => {
                onceEnd = () => {
                    callback();
                    onceEnd = undefined;
                };
            }
        };
    }


    return {
        heavyAttack,
        castAttack,
    };
}
