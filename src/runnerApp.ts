import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, Sprite, Text } from "pixi.js";
import { Camera } from "./camara";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { Particle } from "./particle";
import { Player } from "./player";
import { cloneAnimationSprite } from "./sprite_utils";
import { ECollisionType, EntityManager, ICollisionable } from "./types";
import { Vector } from "./vector";
import {mouse} from './user_input';
import { LevelManager } from "./level";

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

const runnerApp: EntityManager = {
    getEntities: ({
        collisionTypes
    }) => {
        return collisionTypes.reduce((acc, type) => {
            switch (type) {
                case ECollisionType.player:
                    return [...acc, player];
                case ECollisionType.enemy:
                    return [...acc, ...enemys.pool.filter(e => !e.dead)];
                case ECollisionType.none:
                    return [...acc, ...player.ammoPools.pool];
                default:
                    return acc;
            }
        }, [] as ICollisionable[]).filter(Boolean);
    },
    emitParticles: (
        position,
        animation,
        updateFunc,
        duration,
    ) => {
        particles.push(
            new Particle(
                position.clone(),
                animation instanceof AnimatedSprite
                    ? cloneAnimationSprite(animation)
                    : new Sprite(animation.texture),
                gameView,
                updateFunc,
                duration,
            )
        );
    },

    emitTextParticles: (
        position,
        sprite,
        updateFunc,
        duration,
        id?: string,
    ) => {
        textParticles.push(
            new Particle(
                position.clone(),
                sprite,
                gameView,
                updateFunc,
                duration,
                id
            )
        );
    },

    emitDamageParticles: function (
        this: EntityManager,
        position,
        damage,
    )  {
        this.emitTextParticles(
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
        droplets.emit(position, pickUp, duration);
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
        return timeElipsed;
    },
    setApp(a: Application) {
        app = a;
        app.ticker.add(() => {
            mouseWorldPos = undefined;
            timeElipsed += app.ticker.elapsedMS;
        });
    },
    getApp() {
        return app;
    },

    updateParticles() {
        for (let index = 0; index < particles.length; index++) {
            const particle = particles[index];
            particle.update();
        }

        for (let index = 0; index < textParticles.length; index++) {
            const particle = textParticles[index];
            particle.update();
        }
    },

    getPariticles() {
        return particles.filter(p => !p.dead);
    },
    
    getTextParticles() {
        return textParticles.filter(p => !p.dead);
    },

    setPlayer( _player: Player) {
        player = _player;
    },
    setEnemys( _enemys: EnemyPool) {
        enemys = _enemys;
    },
    setDroplets( _droplets: DropletPool) {
        droplets = _droplets;
    },
    setCamera( _camera: Camera) {
        camera = _camera;
    },
    getCamera() {
        return camera;
    },
    getGameView() {
        return gameView;
    },
    setGameView( _gameView: Viewport) {
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
        }
    },
    getMouseWorldPos() {
        if (mouseWorldPos) {
            return mouseWorldPos.clone();
        }
        mouseWorldPos = runnerApp.screenPosToWorldPos(new Vector(mouse.x, mouse.y));
        return mouseWorldPos.clone();
    }
};

export function getRunnerApp (){
    return runnerApp;
}