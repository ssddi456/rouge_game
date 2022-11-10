import { AnimatedSprite, Container, Mesh, MeshMaterial, PlaneGeometry, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";

export class Laser extends Container {
    beam: Beam;
    laserCenter: AnimatedSprite;
    laserBeamTextures: AnimatedSprite;

    constructor(length: number) {
        super();

        const laserAnimateMap = getRunnerApp().getGetResourceMap()().laserAnimateMap;

        this.laserCenter = this.addChild(laserAnimateMap.hit_1);
        this.laserBeamTextures = laserAnimateMap.hit_0;

        const beam = new Beam(length);
        beam.position.x = -16;
        beam.position.y = -32;
        this.beam = this.addChild(beam);

    }

    set index(val: 0 | 1 | 2 | 3 | 4 | 5) {
        this.beam.texture = this.laserBeamTextures.textures[val] as Texture;
        this.laserCenter.gotoAndStop(val);
    }
}

export class Beam extends Mesh {
    constructor(length: number) {
        var planeGeometry = new PlaneGeometry(32, -length, 2, 2);
        var meshMaterial = new MeshMaterial(Texture.WHITE);
        super(planeGeometry, meshMaterial);
        // lets call the setter to ensure all necessary updates are performed
    }

    set length(length: number) {
        this.geometry = new PlaneGeometry(32, -length, 2, 2);
    }
};

export class LaserController {
    currentFrame = -1;
    firing: boolean = false;
    ending: boolean = false;
    idle: boolean = true;

    maxFiringFrame = 1;
    maxFrame = 5;

    constructor(
        public laser: Laser
    ) {

    }

    end() {
        this.firing = false;
        this.idle = false;
        this.ending = true;
    }

    fire() {
        if(this.firing) {
            return;
        }
        this.firing = true;
        this.idle = false;
    }

    update() {
        if (this.idle) {
            this.laser.visible = false;
        } else {
            this.laser.visible = true;
            if (this.firing) {
                if (this.currentFrame > this.maxFiringFrame) {
                    this.currentFrame = -1
                } else if (this.currentFrame < this.maxFiringFrame) {
                    this.currentFrame += 1;
                }
            } else if (this.ending) {
                if (this.currentFrame < 0) {
                    // pass
                    this.idle = true;
                } else if (this.currentFrame < this.maxFiringFrame) {
                    this.currentFrame = 2;
                } else if (this.currentFrame > this.maxFrame) {
                    this.idle = true;
                } else {
                    this.currentFrame += 1;
                }
            }
            this.laser.index = this.currentFrame as 0 | 1 | 2 | 3 | 4 | 5;
        }
    }
}