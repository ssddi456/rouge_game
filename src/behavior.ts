import { DebugInfo } from "./debug_info";
import { Wormling } from "./element/wormling";
import { Enemy } from "./enemy";
import { Player } from "./player";
import { getRunnerApp } from "./runnerApp";
import { ActiveSkill } from "./skills/activeskill";
import { TimedSummoned } from "./timed_life";
import { ECollisionType, UpdatableMisc } from "./types";
import { Vector } from "./vector";


export class Behavior implements UpdatableMisc {
    dead: boolean = false;

    target?: Player | Enemy | UpdatableMisc;
    owner?: Player | Enemy | UpdatableMisc;

    constructor(
        public targetType: 'player' | 'enemy',
        public skills: ActiveSkill[],
        public searchRadius: number,
    ) {}


    update() {
        this.skills.forEach(skill => skill.update());
        if (this.targetAlive()) {
            // donothing
            for (let index = 0; index < this.skills.length; index++) {
                const skill = this.skills[index];
                skill.doCast();
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

    setOwner(owner: Player | Enemy | UpdatableMisc) {
        this.owner = owner;
        for (let index = 0; index < this.skills.length; index++) {
            const element = this.skills[index];
            element.setOwner(this.owner);
        }
        const debugInfo: DebugInfo = (this.owner as any)?.debugInfo;
        if (debugInfo) {
            debugInfo.size = this.searchRadius;
        }
    }

    targetAlive() {
        if (this.target && !this.target.dead) {
            return true;
        } else {
            this.target = undefined;
        }
        return false;
    }

    findTarget() {
        if (this.targetType == 'player') {
            const player = getRunnerApp().getPlayer();
            if (this.owner!.position?.distanceToSq(player.position)! <= this.searchRadius * this.searchRadius) {
                this.target = player;
            }
        } else if (this.targetType == 'enemy') {
            this.target = findEnemy(this.owner!.position!, this.searchRadius, 1, (target) => target === this.owner)[0] as Enemy;
        }
        if (!this.target) {
            return false;
        } else {
            for (let index = 0; index < this.skills.length; index++) {
                const element = this.skills[index];
                element.setTarget(this.target);
            }
        }
        return true;
    }

    updateFacing() {
        if (!this.owner?.sprite) {
            return;
        }
        // maybe we dont need this
        if (this.target) {
            if ('direct' in this.owner) {
                const bodySprite = (this.owner as Enemy).bodySprite;
                const dir = this.target!.position!.x - this.owner!.position!.x;
                const scaleX = this.owner!.sprite?.scale.x;
                if (dir > 0) {
                    bodySprite.scale.set(-1, bodySprite.scale.y);
                } else {
                    bodySprite.scale.set(1, bodySprite.scale.y);
                }
            } else {
                const dir = this.target!.position!.x - this.owner!.position!.x;
                const scaleX = this.owner!.sprite?.scale.x;
                if (dir > 0) {
                    if (scaleX && scaleX < 0) {
                        this.owner!.sprite?.scale.set(-scaleX, this.owner!.sprite?.scale.y);
                    }
                } else {
                    if (scaleX && scaleX > 0) {
                        this.owner!.sprite?.scale.set(-scaleX, this.owner!.sprite?.scale.y);
                    }
                }
            }
        }
    }

    disposed: boolean = false;
    dispose(): void {
        this.target = undefined;
        this.owner = undefined
        for (let index = 0; index < this.skills.length; index++) {
            const element = this.skills[index];
            element.dispose();
        }
    }

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