export class CountDown {
    last_update_time = 0;
    exec_times = 0;
    constructor(
        public interval: number,
        public exec: Function
    ) {
        
    }

    update() {
        if (this.last_update_time + this.interval > Date.now()) {
            return;
        }
        this.last_update_time = Date.now();
        this.exec();
        this.exec_times++;
    }
}