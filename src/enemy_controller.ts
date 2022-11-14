import { CountDown } from "./countdown";
import { Player } from "./player";
import { Vector } from "./vector";
import { getRunnerApp } from "./runnerApp";
import { applyCharge } from "./buffer";
import { Shake } from "./helper/animated_utils";
import { Enemy } from "./enemy";
import { Disposible, Updatable } from "./types";
import { Behavior } from "./behavior";
import { EnemyShooter } from "./skills/shooter";
import { LaserCrossShooter, LaserShooter } from "./skills/laserShooter";

export type controllerKey = (keyof (typeof EnemyControllerMap));
export interface EnemyController<T extends Updatable & Disposible> {
    init(enemy: Enemy): T,
    update(enemy: Enemy, enemyData: T, player?: Player): void,
}

const EnemyControllerDataMap = new WeakMap();

export const EnemyControllerMap: Record<string, EnemyController<any>> = {
    stub: {
        init(enemy) {
            return {
                update() { },
                dispose() { }
            };
        },

        update(enemy: Enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            // just do nothing;
        }
    },
    tracer: {
        init(enemy) {
            return {
                update() { },
                dispose() { }
            };
        },

        update(enemy: Enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            if (player as Player) {
                enemy.direct.setV(
                    Vector.AB(enemy.position, player.position)
                        .normalize()
                        .multiplyScalar(enemy.speed));
            } else {
                enemy.direct.set(0, 0);
            }
        },
    },

    charger: {
        init(enemy: Enemy) {
            const charger = {
                canCharge: true,
                chargerTimer: new CountDown(12000, () => {
                    charger.canCharge = true;
                }),
                shake: new Shake(enemy.bodySprite, {
                    frames: 10,
                    base: 1,
                    height: 0.5,
                }),
                update() {
                    this.chargerTimer.update();
                    this.shake.update();
                },
                dispose() {
                    this.chargerTimer.dispose();
                    this.shake.dispose();
                }
            };
            charger.shake.pause();
            return charger;
        },
        update(enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            if (enemyData.canCharge && enemy.distSqToPlayer < 300 * 300) {
                enemyData.canCharge = false;
                enemyData.chargerTimer.start();
                enemy.idleJump.pause().reset();
                applyCharge(enemy, 1200, {
                    start_pos: enemy.position.clone(),
                    direct: player.position.clone().sub(enemy.position).normalize().multiplyScalar(300 + 100),
                    chargingTime: 1500
                }).then(() => {

                    enemy.idleJump.resume();
                });
            } else {
                EnemyControllerMap.tracer.update(enemy, enemyData, player);
            }
        },
    },
    escaper: {
        init(enemy) {
            return {
                update() { },
                dispose() { }
            };
        },
        update(enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            if (player as Player) {
                enemy.direct.setV(
                    Vector.AB(player.position, enemy.position)
                        .normalize()
                        .multiplyScalar(enemy.speed));
            } else {
                enemy.direct.set(0, 0);
            }
        },
    },
    saunterer: {
        init(enemy) {
            // const _debugInfo = debugInfo();
            const data = {
                dead: false,
                disposed: false,
                current_target_position: undefined,
                // position: undefined,
                // sprite: new Container(),
                update() {
                    // data.position = data.current_target_position;
                },
                dispose() {
                    // data.sprite.destroy();
                    this.disposed = true;
                    this.dead = true;
                }
            };
            // const app = getRunnerApp();
            // data.sprite.addChild(_debugInfo.pointer);
            // data.sprite.addChild(_debugInfo.text);
            // data.sprite.parentGroup = app.getGroups().dropletGroup;
            // app.getGameView().addChild(data.sprite);
            // app.addMisc(data);
            return data;
        },
        update(enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            const saunter_speed = enemy.speed / 2;
            if (!enemyData.current_target_position || Vector.AB(enemy.position, enemyData.current_target_position).length <= saunter_speed) {
                const randomR = Math.random() * 2 * Math.PI;
                const dir = new Vector(
                    saunter_speed * Math.sin(randomR),
                    saunter_speed * Math.cos(randomR)
                );
                enemyData.current_target_position = enemy.position.clone().add({
                    x: dir.x * 60 * 3,
                    y: dir.y * 60 * 3,
                });
                enemy.direct = dir;
            } else if (enemy.direct.x === 0 && enemy.direct.y === 0) {
                enemy.direct = Vector.AB(enemy.position, enemyData.current_target_position).normalize().multiplyScalar(saunter_speed);
            }
        },
    },
    shooter: {
        init(enemy) {
            const resource = getRunnerApp().getGetResourceMap()();
            const shootSkill = new EnemyShooter(
                true,
                3000,
                true,
                resource.thunderAnimateMap.projectile,
                null,
                resource.thunder_hitAnimateMap.hit_effect
            );
            // distance = frame * range * 60 / 1000;
            // range = distance * 1000 / 60 / frame;
            shootSkill.speed = 5;
            shootSkill.distance = 700; // ms;

            const ret = {
                behavior: new Behavior(
                    'player',
                    [shootSkill],
                    500,
                ),
                update() {
                    this.behavior.update();
                },
                dispose() {
                    this.behavior.dispose();
                }
            };
            ret.behavior.setOwner(enemy);
            return ret;
        },
        update(enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            if (enemy.distSqToPlayer > 400 * 400) {
                EnemyControllerMap.tracer.update(enemy, enemyData, player);
            } else if (enemy.distSqToPlayer < 300 * 300) {
                EnemyControllerMap.escaper.update(enemy, enemyData, player);
            } else {
                enemy.direct.set(0, 0);
            }
        }
    },

    laser_shooter: {
        init(enemy) {
            const shootSkill = new LaserShooter(3000,);
            const laserShootSkill = new LaserCrossShooter(5000, 4);
            const laserShootSkill2 = new LaserCrossShooter(7000, 8);

            const ret = {
                behavior: new Behavior(
                    'player',
                    [shootSkill, laserShootSkill, laserShootSkill2],
                    500,
                ),
                update() {
                    this.behavior.update();
                },
                dispose() {
                    this.behavior.dispose();
                }
            };
            ret.behavior.setOwner(enemy);
            return ret;
        },
        update(enemy, enemyData, player: Player = getRunnerApp().getPlayer()) {
            // if (enemy.distSqToPlayer > 400 * 400) {
            //     EnemyControllerMap.tracer.update(enemy, enemyData, player);
            // } else if (enemy.distSqToPlayer < 300 * 300) {
            //     EnemyControllerMap.escaper.update(enemy, enemyData, player);
            // } else {
            // }
            enemy.direct.set(0, 0);
        }
    }
};


export const enemyControllerInit = (enemy: Enemy) => {
    const data = EnemyControllerMap[enemy.controller].init(enemy);
    EnemyControllerDataMap.set(enemy, data);
};

export const enemyControllerUpdate = (enemy: Enemy) => {
    const data = EnemyControllerDataMap.get(enemy);
    data.update()
    EnemyControllerMap[enemy.controller].update(enemy, data);
};

export const enemyControllerDispose = (enemy: Enemy) => {
    const data = EnemyControllerDataMap.get(enemy);
    data.dispose();
    EnemyControllerDataMap.delete(enemy);
};
