import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, DisplayObject, Sprite, Text } from "pixi.js";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { Enemy, EnemyPool } from "./enemy";
import { Particle } from "./particle";
import { Player } from "./player";
import { cloneAnimationSprite } from "./sprite_utils";
import { AreaOfEffect, ECollisionType, EntityManager, GetResourceFunc, ICollisionable } from "./types";
import { Vector } from "./vector";
import { mouse } from './user_input';
import { LevelManager } from "./level";
import { createGroups } from "./groups";
import { GameSession } from "./game_session";
import { checkCollision } from "./collision_helper";

let timeElipsed = 0;
let app: Application;
let player: Player;
let enemys: EnemyPool;
let droplets: DropletPool;
let camera: Camera;
let particles: Particle[] = [];
let textParticles: Particle[] = [];
let gameView: Viewport;
let mouseWorldPos: Vector | undefined;
let levelManager: LevelManager;
let getResourceMap: GetResourceFunc;
let groups: ReturnType<typeof createGroups>;
let session: GameSession;
let aoes: AreaOfEffect<any>[] = [];


let entityTypeCache: Record<string, ICollisionable[]> = {};
let entityGrid: Record<string, ICollisionable[]> | null = null;
function clearEntityTypeCache() {
    entityTypeCache = {};
    entityGrid = null;
}
const collisionCellSize = 40;
function getPositionKey (position: Vector) {
    return Math.floor(position.x / collisionCellSize) + '_' + Math.floor(position.y / collisionCellSize);
}
function getNearbyPositionKey(position: Vector)  {
    const x = Math.floor(position.x / collisionCellSize);
    const y = Math.floor(position.y / collisionCellSize);
    return [
        String(x) + '_' + String(y - 0),

        String(x - 1) + '_' + String(y - 1),
        String(x) + '_' + String(y - 1),
        String(x + 1) + '_' + String(y - 1),

        String(x - 1) + '_' + String(y - 0),
        String(x + 1) + '_' + String(y - 0),
        
        String(x - 1) + '_' + String(y + 1),
        String(x) + '_' + String(y + 1),
        String(x + 1) + '_' + String(y + 1),
    ];
}

function getNearbyPositionKeyInDistance (position: Vector, distance: number) {
    if (distance <= collisionCellSize) {
        return getNearbyPositionKey(position);
    }
    const x = Math.floor(position.x / collisionCellSize);
    const y = Math.floor(position.y / collisionCellSize);

    const ret = [];
    const k = Math.ceil(distance / collisionCellSize);
    let m, n, s;
    for (m = 1; m < k + 1; m++) {
        for (n = - m; n < m + 1; n++) {
            ret.unshift(String(x + n) + '_' + String(y - m));
            ret.push(String(x + n) + '_' + String(y + m));
        }

        for ( s = - m + 1; s < m; s++) {
            ret.push(String(x - m) + '_' + String(y + s));
            ret.push(String(x + m) + '_' + String(y + s));
        }
    }
    ret.unshift(String(x) + '_' + String(y));

    return ret;
}

function initEntityGrid() {
    if (!entityGrid) {
        entityGrid = {};
        // 每帧初始化
        const allItem = (enemys?.pool || []).filter(e => !e.dead);
        for (let index = 0; index < allItem.length; index++) {
            const element = allItem[index];
            const key = getPositionKey(element.position);
            entityGrid[key] = entityGrid[key] || [];
            entityGrid[key].push(element);
        }
    }
}

function getEntitiesNearby(position: Vector): ICollisionable[] {
    initEntityGrid();
    // 

    const keys = getNearbyPositionKey(position);
    const ret: ICollisionable[] = [];
    // consts in loop are much slower than declare in upper scope
    // maybe native const are better
    let k;
    let pack;
    let index;

    for (let jndex = 0; jndex < keys.length; jndex++) {
        k = keys[jndex];
        if (entityGrid!.hasOwnProperty(k)) {
            pack = entityGrid![k];
            for (index = 0; index < pack.length; index++) {
                ret.push(pack[index]);
            }
        }
    }
    
    return ret;
}

function walkEntitiesNearbyInDistance(position: Vector, distance: number, handler: (item: ICollisionable) => boolean | void): void {
    initEntityGrid();
    // 

    const keys = getNearbyPositionKeyInDistance(position, distance);
    const ret: ICollisionable[] = [];
    // consts in loop are much slower than declare in upper scope
    // maybe native const are better
    let k;
    let pack;
    let index;

    out:
    for (let jndex = 0; jndex < keys.length; jndex++) {
        k = keys[jndex];
        if (entityGrid!.hasOwnProperty(k)) {
            pack = entityGrid![k];
            for (index = 0; index < pack.length; index++) {
                const ifStop = handler(pack[index]);
                if (ifStop) {
                    break out;
                }
            }
        }
    }
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
        const entities = getEntitiesNearby(position);


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

        walkEntitiesNearbyInDistance(
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

};

export function getRunnerApp() {
    return runnerApp;
}
