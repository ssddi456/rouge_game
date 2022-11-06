import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, DisplayObject, Sprite, Text } from "pixi.js";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { Enemy, EnemyPool } from "./enemy";
import { Particle } from "./particle";
import { Player } from "./player";
import { cloneAnimationSprite } from "./sprite_utils";
import { AreaOfEffect, ECollisionType, EntityManager, ICollisionable, UpdatableMisc } from "./types";
import { Vector } from "./vector";
import { mouse } from './user_input';
import { LevelManager } from "./level";
import { createGroups } from "./groups";
import { GameSession } from "./game_session";
import { checkCollision } from "./collision_helper";
import { Ammo, AmmoPool } from "./ammo";
import { CurrentResourceMapFunc } from "./loadAnimation";

let timeElipsed = 0;
let app: Application;
let player: Player;
export let enemys: EnemyPool;
let droplets: DropletPool;
let camera: Camera;
let particles: Particle[] = [];
let textParticles: Particle[] = [];
let gameView: Viewport;
let mouseWorldPos: Vector | undefined;
let levelManager: LevelManager;
let getResourceMap: CurrentResourceMapFunc;
let groups: ReturnType<typeof createGroups>;
let session: GameSession;
let aoes: AreaOfEffect<any>[] = [];
let misc: UpdatableMisc[] = [];
let ammoPool: AmmoPool;
let enemyAmmoPool: AmmoPool;

export let entityTypeCache: Record<string, ICollisionable[]> = {};
export function clearEntityTypeCache() {
    entityTypeCache = {};
}

const runnerApp: EntityManager = {
    getEntities: ({
        collisionTypes
    }) => {
        const typeKey = collisionTypes.join('_');
        if (entityTypeCache[typeKey]) {
            return entityTypeCache[typeKey];
        }

        const ret = collisionTypes.reduce((acc, type) => {
            switch (type) {
                case ECollisionType.player:
                    acc.push(player);
                    break
                case ECollisionType.enemy:
                    acc.push(...(enemys?.pool || []).filter(e => !e.dead));
                    break
                default:
                    break
            }
            return acc;
        }, [] as ICollisionable[]).filter(Boolean);

        entityTypeCache[typeKey] = ret;
        return ret;
    },

    getNearbyEntity: ({
        collisionTypes,
        position
    }) => {
        const entities = enemys.lookupHelper.getEntitiesNearby(position);

        const ret = collisionTypes.reduce((acc, type) => {
            switch (type) {
                case ECollisionType.player:
                    acc.push(player);
                    break
                case ECollisionType.enemy:
                    acc.push(...entities);
                    break
                default:
                    break
            }
            return acc;
        }, [] as ICollisionable[]).filter(Boolean);

        return ret;
    },


    walkNearbyEntityInDistance: ({
        collisionTypes,
        position,
        distance,
        handler
    }) => {

        enemys.lookupHelper.walkEntitiesNearbyInDistance(
            position,
            distance,
            function (item) {
                if (collisionTypes.includes(item.collisison_type)) {
                    return handler(item);
                }
            }
        );
    },

    emitParticles: (
        position,
        animation,
        updateFunc,
        duration,
    ) => {
        const particle = new Particle(
            position.clone(),
            animation instanceof AnimatedSprite
                ? cloneAnimationSprite(animation)
                : new Sprite(animation.texture),
            gameView,
            updateFunc,
            duration,
        )
        particles.push(particle);
        return particle;
    },

    emitTextParticles: (
        position,
        sprite,
        updateFunc,
        duration,
        id?: string,
    ) => {
        const particle = new Particle(
            position.clone(),
            sprite,
            gameView,
            updateFunc,
            duration,
            id
        )
        textParticles.push(particle);
        return particle;
    },

    emitDamageParticles: function (
        this: EntityManager,
        position,
        damage,
    ) {
        return this.emitTextParticles(
            position,
            new Text(`- ${damage}`, {
                fill: 0xffffff,
                fontSize: 14,
            }),
            function (this: Particle, p: number) {
                this.position.y = this.startPosition.y - p * 40;
                this.sprite.scale.x = this.sprite.scale.y = 1 + p * 0.4
            },
            800,
            'damage particle'
        );
    },
    emitDroplets: (
        position: Vector,
        pickUp: () => void,
        duration: number,
    ) => {
        return droplets.emit(position, pickUp, duration);
    },

    emitAOE: (
        position: Vector,
        aoe
    ) => {
        if (aoe.position) {
            aoe.position?.setV(position);
        } else {
            aoe.position = position;
        }

        aoes.push(aoe as AreaOfEffect<any>);
        gameView.addChild(aoe.sprite);
        return aoe as AreaOfEffect<any>;
    },

    updateAOE: () => {
        // 这里应该预先分组
        // 首先假设aoe只能打敌人
        const enemies = getRunnerApp().getEntities({ collisionTypes: [ECollisionType.enemy] }) as Enemy[];
        let newAoes: AreaOfEffect<any>[] = [];
        for (let index = 0; index < aoes.length; index++) {
            const aoe = aoes[index];
            // console.log('aoe.id', aoe.id, aoe.dead);
            aoe.update();
            if (!aoe.dead) {
                if (aoe.enabled) {
                    for (let jndex = 0; jndex < enemies.length; jndex++) {
                        const enemy = enemies[jndex] as Enemy;
                        if (!enemy.dead) {
                            const ifCollision = checkCollision(aoe, enemy);
                            if (ifCollision) {
                                aoe.apply(enemy);
                            }
                        }
                    }
                }
                newAoes.push(aoe);
                camera.updateItemPos(aoe);
            } else {
                console.log('aoe.id', aoe.id, 'removed');
                aoe.sprite.destroy();
            }
        }
        aoes = newAoes;
    },

    addMisc(item) {
        misc.push(item);
        if (item.sprite) {
            gameView.addChild(item.sprite);
        }
    },

    updateMisc: () => {
        let newMisc: (typeof misc) = [];
        for (let index = 0; index < misc.length; index++) {
            const element = misc[index];
            element.update();
            if (!element.dead) {
                newMisc.push(element);
                if (element.sprite && element.position) {
                    camera.updateItemPos(element as { position: Vector, sprite: DisplayObject});
                }
            } else {
                element.dispose();
            }
        }
        misc = newMisc;
    },

    screenPosToWorldPos: (screenPos: Vector) => {
        return camera.screenPosToWorldPos(screenPos);
    },
    pause() {
        app.ticker.stop();
    },
    resume() {
        app.ticker.start();
    },
    now() {
        return session ? session.now() : timeElipsed;
    },
    realWorldNow() {
        return timeElipsed;
    },
    setApp(a: Application) {
        app = a;
        app.ticker.add(() => {
            mouseWorldPos = undefined;
            timeElipsed += app.ticker.elapsedMS;

            clearEntityTypeCache();
        });
    },
    getApp() {
        return app;
    },

    updateParticles() {
        let newParticals: Particle[] = [];
        for (let index = 0; index < particles.length; index++) {
            const particle = particles[index];
            particle.update();
            if (!particle.dead) {
                particle.sprite.parentGroup = groups?.overGroundGroup;
                camera.updateItemPos(particle);
                newParticals.push(particle);
            }
        }
        particles = newParticals;
        let newTextParticals: Particle[] = [];
        for (let index = 0; index < textParticles.length; index++) {
            const particle = textParticles[index];
            particle.update();
            particle.sprite.parentGroup = groups?.textGroup;
            if (!particle.dead) {
                camera.updateItemPos(particle);
                newTextParticals.push(particle);
            }
        }
        textParticles = newTextParticals;
    },

    getPariticles() {
        return particles.filter(p => !p.dead);
    },

    getTextParticles() {
        return textParticles.filter(p => !p.dead);
    },

    getPlayer() {
        return player;
    },
    setPlayer(_player: Player) {
        player = _player;
    },
    setEnemys(_enemys: EnemyPool) {
        enemys = _enemys;
    },
    setDroplets(_droplets: DropletPool) {
        droplets = _droplets;
    },
    setCamera(_camera: Camera) {
        camera = _camera;
    },
    getCamera() {
        return camera;
    },
    getGameView() {
        return gameView;
    },
    setGameView(_gameView: Viewport) {
        gameView = _gameView;
    },

    getLevelManager(): LevelManager {
        return levelManager;
    },

    setLevelManager(_levelManager: LevelManager) {
        levelManager = _levelManager;
    },

    disposeGameView() {
        if (gameView) {
            const children = gameView.children;
            for (let index = 0; index < children.length; index++) {
                const element = children[index];
                element.destroy({
                    children: true
                });
            }
            gameView.removeChildren();

            particles.splice(0, particles.length);
            textParticles.splice(0, textParticles.length);
            aoes.splice(0, aoes.length);
        }
    },
    getMouseWorldPos() {
        if (mouseWorldPos) {
            return mouseWorldPos.clone();
        }
        mouseWorldPos = runnerApp.screenPosToWorldPos(new Vector(mouse.x, mouse.y));
        return mouseWorldPos.clone();
    },

    getGetResourceMap() {
        return getResourceMap;
    },
    setGetResourceMap(_getResourceMap) {
        getResourceMap = _getResourceMap
    },

    getGroups() {
        return groups;
    },
    setGroups(_groups) {
        groups = _groups;
    },

    getSession() {
        return session;
    },
    setSession(_session) {
        session = _session
    },

    setAmmoPool(_ammoPool: AmmoPool) {
        ammoPool = _ammoPool;
    },

    getAmmoPool() {
        return ammoPool;
    },

    updateAmmoPool() {
        if (ammoPool && camera) {
            ammoPool.update();
            ammoPool.updateHit();

            for (let index = 0; index < ammoPool.pool.length; index++) {
                const element = ammoPool.pool[index];
                element.sprite.parentGroup = groups?.ammoGroup;

                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        }
    },

    setEnemyAmmoPool(_ammoPool: AmmoPool) {
        enemyAmmoPool = _ammoPool;
    },

    getEnemyAmmoPool() {
        return enemyAmmoPool;
    },

    updateEnemyAmmoPool() {
        if (enemyAmmoPool && camera) {
            enemyAmmoPool.update();
            if (player) {
                const ammos = enemyAmmoPool.lookupHelper.getEntitiesNearby(player.position);
                for (let index = 0; index < ammos.length; index++) {
                    const ammo = ammos[index];
                    
                    const ifCollision = checkCollision(ammo, player);
                    if (ifCollision) {
                        enemyAmmoPool.ammoHitTarget(ammo as Ammo, player, ifCollision);
                    }
                }
            }

            for (let index = 0; index < enemyAmmoPool.pool.length; index++) {
                const element = enemyAmmoPool.pool[index];
                element.sprite.parentGroup = groups?.ammoGroup;

                if (!element.dead) {
                    camera.updateItemPos(element);
                }
            }
        }
    },

    disposeStage() {
        for (let index = 0; index < misc.length; index++) {
            const element = misc[index];
            element.dispose();
        }
        misc.length = 0;
        if (ammoPool) {
            for (let index = 0; index < ammoPool.pool.length; index++) {
                const element = ammoPool.pool[index];
                element.container.removeChild(element.sprite);
            }
            ammoPool.pool.length = 0
        }
        if (enemyAmmoPool) {
            for (let index = 0; index < enemyAmmoPool.pool.length; index++) {
                const element = enemyAmmoPool.pool[index];
                element.container.removeChild(element.sprite);
            }
            enemyAmmoPool.pool.length = 0
        }
        this.disposeGameView();
    }
};

export function getRunnerApp() {
    return runnerApp;
}
