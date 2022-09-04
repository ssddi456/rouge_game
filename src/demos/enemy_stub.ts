import { AnimatedSprite, Container } from "pixi.js";
import { BUFFER_EVENTNAME_DEAD } from "../buffer";
import { EnemyPool } from "../enemy";
import { Vector } from "../vector";

export class EnemyStub extends EnemyPool {
    constructor(
        public spirtes: Record<string, AnimatedSprite>,
        public container: Container,
        public positions: Vector[]
    ) {
        super(spirtes, container);
        this.spawnTimer = { update: () => { } };
        setTimeout(() => {

            for (let index = 0; index < positions.length; index++) {
                const element = positions[index];
                this.spawnAtPosition(element);
            }

        }, 300);
    }

    spawnAtPosition(position: Vector) {
        const stub = this.emit(position);
        stub.bufferList.push({
            type: 'event',
            eventName: BUFFER_EVENTNAME_DEAD,
            id: 'stub_respawn',
            properties: {},
            takeEffect: () => setTimeout(() => this.spawnAtPosition(position), 2000)
        })
    }

}