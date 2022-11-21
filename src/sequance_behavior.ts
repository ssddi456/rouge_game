import { Behavior } from "./behavior";
import { DebugInfo } from "./debug_info";
import { Wormling } from "./element/wormling";
import { Enemy } from "./enemy";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { ActiveSkill } from "./skills/activeskill";
import { TimedSummoned } from "./timed_life";
import { ECollisionType, UpdatableMisc } from "./types";
import { Vector } from "./vector";

type SkillSequenceItem = { wait: number, after: number, } & (
    {
        skill: string, params?: any 
    } 
    | {
        skills: { skill: string, params?: any }[]
    }
);

export class SequenceBehavior extends Behavior {
    dead: boolean = false;

    target?: Player | Enemy | UpdatableMisc;
    owner?: Player | Enemy | UpdatableMisc;

    sequanceIndex: number = 0;
    activeCount: number = 0;

    constructor(
        public skills: Record<string, ActiveSkill>,
        public sequance: SkillSequenceItem[],
        public searchRadius: number,
        public resetRadius?: number,
    ) {
        super('player', skills, searchRadius, resetRadius);
        for (let index = 0; index < this.everySkill.length; index++) {
            const element = this.everySkill[index];
            element.autoCast = false;
        }
    }

    onLoseTarget() {
        this.sequanceIndex = 0;
        this.activeCount = 0;
    }

    updateSequance() {
        const currentItem = this.sequance[this.sequanceIndex];
        if (this.activeCount == currentItem.wait) {
            if ('skill' in currentItem) {
                const skill = this.skills[currentItem.skill]!;
                skill.cast(currentItem.params);
            } else if (currentItem.skills) {
                for (let index = 0; index < currentItem.skills.length; index++) {
                    const element = currentItem.skills[index];
                    const skill = this.skills[element.skill]!;
                    skill.cast(element.params);
                }
            }
        }

        if (this.activeCount == (currentItem.wait + currentItem.after)) {
            this.sequanceIndex += 1;
            this.activeCount = 0;
            if (this.sequanceIndex >= this.sequance.length) {
                this.sequanceIndex = 0;
            }
        } else {
            this.activeCount += 1;
        }
    }

    update() {
        this.everySkill.forEach(skill => skill.update());
        if (this.targetAlive()) {
            if (this.owner!.position?.distanceToSq(this.target!.position!)! > this._resetRadiusSq ) {
                this.target = undefined;
                this.onLoseTarget();
            } else {
                // donothing
                // cast skills by sequance
                this.updateSequance();
            }
        } else {
            this.findTarget();
        }
        this.updateFacing();

        const debugInfo = (this.owner as any)?.debugInfo;
        if (debugInfo) {
            debugInfo.text = `target: ${!!this.target}`;
        }
    };


}

export function findEnemy(currentCenter: Vector, radius: number, count: number = Infinity, excludes?: (target: Enemy) => boolean) {

    const branchingTarget: Enemy[] = [];
    let disSq = radius * radius;
    getRunnerApp().walkNearbyEntityInDistance({
        collisionTypes: [ECollisionType.enemy],
        position: currentCenter,
        distance: radius,
        handler(item) {
            (item as Enemy).debugInfo.text = 'checked ! : ' + currentCenter.distanceToSq(item.position);
            if (excludes && excludes(item as Enemy)) {
                return;
            }
            const dist = currentCenter.distanceToSq(item.position);
            if (dist < disSq) {
                (item as Enemy).debugInfo.text = 'selected ! : ' + currentCenter.distanceToSq(item.position);
                branchingTarget.push(item as Enemy);
                if (branchingTarget.length > count) {
                    return true;
                }
            }
        }
    });
    return branchingTarget;
}


export class WormlingBehavior extends Behavior {
    owner?: TimedSummoned;
    update(): void {
        super.update();
        this.owner!.shoot_position = this.owner!.position.clone().add((this.owner!.sprite as Wormling).endPoint);
    }
}