import { Viewport } from "pixi-viewport";
import { AnimatedSprite, Application, Sprite, Text } from "pixi.js";
import { Camera } from "./camara";
import { textParticleZIndex } from "./const";
import { DropletPool } from "./droplet";
import { EnemyPool } from "./enemy";
import { Particle } from "./particle";
import { Player } from "./player";
import { ECollisionType, EntityManager, ICollisionable } from "./types";
import { Vector } from "./vector";

let timeElipsed = 0;
let app: Application;
let player: Player;
let enemys: EnemyPool;
let droplets: DropletPool;
let camera: Camera;
let particles: Particle[];
let gameView: Viewport;

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
        }, [] as ICollisionable[]);
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
                    ? new AnimatedSprite(animation.textures)
                    : new Sprite(animation.texture),
                gameView,
                updateFunc,
                duration,
            )
        );
    },
    emitDamageParticles: (
        position,
        damage,
    ) => {
        particles.push(
            new Particle(
                position.clone(),
                new Text(`- ${damage}`, {
                    fill: 0xffffff,
                    fontSize: 14,
                }),
                gameView,
                function (this: Particle, p: number) {
                    this.position.y = this.startPosition.y - p * 20;
                },
                1200,
                textParticleZIndex
            )
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
            timeElipsed += app.ticker.elapsedMS;
        });
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
    setParticles( _particles: Particle[]) {
        particles = _particles;
    },
    setGameView( _gameView: Viewport) {
        gameView = _gameView;
    },

};

export function getRunnerApp (){
    return runnerApp;
}