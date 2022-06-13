import { getRunnerApp } from "./runnerApp";

export class CountDown {
    last_update_time = 0;
    exec_times = 0;
    constructor(
        public interval: number,
        public exec: Function
    ) {
        
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
}