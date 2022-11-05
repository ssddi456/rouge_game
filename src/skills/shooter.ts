import { AnimatedSprite, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { ActiveSkill } from "./activeskill";

export class Shooter extends ActiveSkill {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public poolType: 'AmmoPool' | 'EnemyAmmoPool' = 'AmmoPool',
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(autoCast, countdown, immediately);
    }

    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }
    cast(): void {
        const pool = getRunnerApp()[('get' + this.poolType as 'getAmmoPool' | 'getEnemyAmmoPool')]();

        const ammo = pool.emit(
            this.target!.position!.clone().sub(this.owner!.position!)!.normalize(),
            this.owner?.position!,
            600,
            10,
            this.projectile,
            this.tail,
            this.hitEffect,
        );
        ammo.max_piecing_count = 0;
        ammo.max_bouncing_count = 0;
    }
}

export class AllianceShooter extends Shooter {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(autoCast, countdown, immediately, 'AmmoPool', projectile, tail, hitEffect);
    }
}
export class EnemyShooter extends Shooter {
    constructor(
        public autoCast: boolean,
        public countdown: number,
        public immediately: boolean,
        public projectile: AnimatedSprite,
        public tail: Texture | null,
        public hitEffect: AnimatedSprite,
    ) {
        super(autoCast, countdown, immediately, 'EnemyAmmoPool', projectile, tail, hitEffect);
    }
}