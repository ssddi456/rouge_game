import { AnimatedSprite, Container } from "pixi.js";
import { BUFFER_EVENTNAME_DEAD } from "../buffer";
import { EnemyPool } from "../enemy";
import { Vector } from "../vector";

export class EnemyStub extends EnemyPool {
    simpleEnemyTypes = [
        // bunny
        {
            sprite_names: {
                idle: 'succubus_idle',
                idle_back: 'succubus_idle',
                die: 'succubus_idle',
                die_back: 'succubus_idle'
            },
            scale: 0.5,
            speed: 1.5,
            health: 20,
            controller: ['tracer'],
        },
    ];
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
