import { AnimatedSprite, LoaderResource, Texture } from "pixi.js";
import { loadSpriteSheet } from "../loadAnimation";
import player_attack from "../player_attack";
import { createDemoContext } from "../helper/demo_util";

const context = createDemoContext(
    module,
    ['../player_attack'],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            const playerAnimateMap = await loadSpriteSheet(app.loader, 'Nintendo Switch - Disgaea 5 Complete - LiezerotaDark');
            await new Promise<void>(r => {
                const name1 = 'magicCircle1';
                const name2 = 'magicCircle2';
                if (app.loader.resources[name1]
                    || app.loader.resources[name1]
                ) {
                    final(app.loader.resources);
                    return;
                }
                app.loader
                    .add(name1, 'http://localhost:7001/public/spell_circle_1.rgba.png')
                    .add(name2, 'http://localhost:7001/public/spell_circle_2.rgba.png')
                    .load((loader, resources) => {
                        final(resources);
                    });

                function final(resources: Record<string, LoaderResource>) {
                    playerAnimateMap[name1] = new AnimatedSprite([
                        resources[name1].texture as Texture
                    ]);
                    playerAnimateMap[name2] = new AnimatedSprite([
                        resources[name2].texture as Texture
                    ]);
                    r();
                }
            });

            const {
                heavyAttack: playHeavyAttack,
                castAttack: playCastAttack,
                whipAttack: playWhipAttack,
            } = player_attack(playerAnimateMap);
            const instance1 = playHeavyAttack({
                showDebug: false
            });
            instance1.container.x = 300;
            instance1.container.y = 400;

            const instance2 = playHeavyAttack({
                dir: 'right',
            });
            instance2.container.x = 600;
            instance2.container.y = 400;
            instance2.onEnd(() => {
                instance2.play();
            });
            instance2.play();
            const instance3 = playHeavyAttack({
                showDebug: false,
                facing: 'top',
                deltaFrame: 1,
            });
            instance3.container.x = 300;
            instance3.container.y = 800;
            const instance4 = playHeavyAttack({
                facing: 'top',
                dir: 'right',
            });
            instance4.container.x = 600;
            instance4.container.y = 800;
            instance4.onEnd(() => {
                instance4.play();
            });
            instance4.play();

            const instance5 = playCastAttack({
                showDebug: false,
                deltaFrame: 0,
            });
            instance5.container.x = 900;
            instance5.container.y = 400;
            instance5.onEnd(() => {
                instance5.play();
            });
            instance5.play();

            const instance6 = playCastAttack({
                showDebug: true,
                // deltaFrame: 9,
                facing: 'top',
                dir: 'right',
                circleType: 'magicCircle2',
            });
            instance6.container.x = 900;
            instance6.container.y = 800;
            instance6.onEnd(() => {
                instance6.play();
            });
            instance6.play();

            const instance7 = playWhipAttack({
                showDebug: true
            });
            instance7.container.x = 300;
            instance7.container.y = 1200;
            instance7.onEnd(() => {
                instance7.play();
            });
            instance7.play();

            animateContainer.addChild(
                instance1.container,
                instance2.container,
                instance3.container,
                instance4.container,
                instance5.container,
                instance6.container,
                instance7.container
            );
        }
    });

export default context.initDemo;
