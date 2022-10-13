import { getRunnerApp } from "./runnerApp";
import { Disposible, Updatable } from "./types";

export class CountDown implements Updatable, Disposible {
    last_update_time = 0;
    exec_times = 0;
    constructor(
        public interval: number,
        public exec: Function
    ) {
        this.last_update_time = getRunnerApp().now() || 0;
    }
    disposed: boolean = false;
    dispose(): void {
        this.exec_times = 0;
    }

    update() {
        const app = getRunnerApp();
        const now = app.now();

        if (this.last_update_time + this.interval > now) {
            return;
        }
        this.last_update_time = now;
        this.exec();
        this.exec_times++;
    }

    start() {
        this.last_update_time = getRunnerApp().now() || 0;
    }
}
