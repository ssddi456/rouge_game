import { CountDown } from "../countdown";
import { UpdatableMisc } from "../types";

export abstract class ActiveSkill implements UpdatableMisc {
    dead: boolean = false;
    canCast: boolean = true;
    casting: boolean = false;
    owner: UpdatableMisc | null = null;

    countDownController = new CountDown(this.countdown, () => {
        this.canCast = true;
    });
    target: UpdatableMisc | null = null;

    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
    ) {

    }

    setOwner(owner: UpdatableMisc) {
        this.owner = owner;
    }

    setTarget(target: UpdatableMisc) {
        this.target = target;
    }

    update(...args: any[]): void {
        if (this.autoCast) {
            if (this.canCast) {
                this.doCast();
            }
        }
        if (this.casting) {
            this.castCountroller?.update(this);
        }
        this.countDownController.update();
    }

    doCast() {
        if (!this.canCast) {
            return;
        }
        if (this.immediately) {
            this.cast();
            this.canCast = false;
            this.countDownController.start();
        } else {
            this.casting = true;
        }
    }

    endCast() {
        this.casting = false;
        this.countDownController.start();
    }

    abstract cast(): void;
    castCountroller?: UpdatableMisc;

    disposed: boolean = false;
    dispose(): void {
        this.disposed = true;
        this.castCountroller?.dispose();
        this.countDownController.dispose();
    }
}