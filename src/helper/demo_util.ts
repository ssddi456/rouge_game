import { Application, Container } from "pixi.js";


interface LifeCycle {
    initScence(context: DemoContext): Promise<void | ((frame: number) => void)> | void | ((frame: number) => void);
    dispose?(): void;
}

interface DemoContext {
    app: Application;
    animateContainer: Container;
    initDemo: (_app: Application) => void;
}
export function createDemoContext(
    module: NodeModule,
    submodules: string[], 
    lifeCycle: LifeCycle,
) {
    let app: Application = module.hot?.data?.app;
    let animateContainer: Container = module.hot?.data?.animateContainer || new Container();
    animateContainer.position.set(0, 0);
    let tickerFunction: (frame: number) => void;
    let currentFrame = 0;
    const context = {
        app,
        animateContainer,
        async initDemo(_app: Application) {
            if (!app) {
                _app.stage.addChild(animateContainer);
            }
            context.app = app = _app;
            currentFrame = 0;

            const _tickerFunction = await lifeCycle.initScence(context);
            if (_tickerFunction) {
                tickerFunction = () => {
                    currentFrame += 1;
                    _tickerFunction(currentFrame);
                };
                app.ticker.add(tickerFunction);
            }
        }
    };

    function dispose() {
        lifeCycle.dispose?.();
        animateContainer.removeChildren();
        if (tickerFunction) {
            app.ticker.remove(tickerFunction);
        }
    }

    if (app) {
        // re init
        context.initDemo(app);
    }
    if (module.hot) {
        module.hot.accept();

        if (submodules.length) {
            module.hot.accept(submodules, () => {
                dispose();
                context.initDemo(app);
            });
        }
        module.hot.dispose((module) => {
            dispose();
            module.app = app;
            module.animateContainer = animateContainer;
        });
    }

    return context;
}