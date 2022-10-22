import { AnimatedSprite } from "pixi.js";
import { getRunnerApp } from "../runnerApp";
import { ActiveSkill } from "./activeskill";

export class Shooter extends ActiveSkill {
    castCheck(): boolean {
        return !!this.owner && !!this.target;
    }
    cast(): void {
        const pool = getRunnerApp().getPlayer().shootManager.ammoPool;
        const resource = getRunnerApp().getGetResourceMap()();

        const ammo = pool.emit(
            this.target!.position!.clone().sub(this.owner!.position!)!.normalize(),
            this.owner?.position!,
            600,
            10,
            resource.iceAnimateMap.projectile as AnimatedSprite,
            null,
            resource.ice_hitAnimateMap.hit_effect as AnimatedSprite,
        );
        ammo.max_piecing_count = 0;
        ammo.max_bouncing_count = 0;
    }
}