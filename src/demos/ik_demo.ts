import { createDemoContext } from "../helper/demo_util";
import { Wormling } from "../element/wormling";

const context = createDemoContext(
    module,
    [],
    {
        async initScence(context) {
            const app = context.app;
            const animateContainer = context.animateContainer;

            const  wormling = animateContainer.addChild(new Wormling());

            wormling.position.set(150, 200);

            return function () {
                wormling.update();
            };

        }
    });

export default context.initDemo