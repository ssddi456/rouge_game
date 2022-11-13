import { AnimatedSprite, Container, DisplayObject, Mesh, MeshMaterial, PlaneGeometry, Texture } from "pixi.js";
import { getRunnerApp } from "../runnerApp";

export class Laser extends Container {
    beam: Beam;
    laserCenter: AnimatedSprite;
    laserBeamTextures: AnimatedSprite;

    constructor(length: number) {
        super();

        const laserAnimateMap = getRunnerApp().getGetResourceMap()().laserAnimateMap;

        this.laserBeamTextures = laserAnimateMap.hit_0;
        
        const beam = new Beam(length);
        beam.position.x = -16;
        beam.position.y = 0;
        this.beam = this.addChild(beam);
        this.laserCenter = this.addChild(laserAnimateMap.hit_1);

    }

    set index(val: 0 | 1 | 2 | 3 | 4 | 5) {
        this.beam.texture = this.laserBeamTextures.textures[val] as Texture;
        this.laserCenter.gotoAndStop(val);
    }
}

export class Beam extends Mesh {
    constructor(length: number) {
        var planeGeometry = new PlaneGeometry(32, -length, 2, 2);
        var meshMaterial = new MeshMaterial(Texture.EMPTY);
        super(planeGeometry, meshMaterial);
        // lets call the setter to ensure all necessary updates are performed
    }

    set length(length: number) {
        this.geometry = new PlaneGeometry(32, -length, 2, 2);
    }
};

enum LaserState {
    idle,
    charging,
    firing,
    ending
}

export class LaserController {
    currentFrame = -1;
    state:  LaserState = LaserState.idle;

    maxFiringFrame = 1;
    maxFrame = 5;

    constructor(
        public indicator: DisplayObject,
        public laser: Laser
    ) {

    }

    get idle () {
        return this.state == LaserState.idle;
    }
    get charging () {
        return this.state == LaserState.charging;
    }
    get firing () {
        return this.state == LaserState.firing;
    }
    get ending () {
        return this.state == LaserState.ending;
    }

    charge() {
        if (!this.idle) {
            return;
        }
        this.state = LaserState.charging;
    }

    fire() {
        if(this.firing) {
            return;
        }
        this.state = LaserState.firing;
    }
    
    end() {
        this.state = LaserState.ending;
    }
    update() {
        if (this.idle) {
            this.indicator.visible = false;
            this.laser.visible = false;
        } else {
            if (this.charging) {
                this.indicator.visible = true;
                this.laser.visible = false;
            } else {
                this.indicator.visible = false;
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
                        this.state = LaserState.idle;
                    } else if (this.currentFrame < this.maxFiringFrame) {
                        this.currentFrame = 2;
                    } else if (this.currentFrame > this.maxFrame) {
                        this.state = LaserState.idle;
                    } else {
                        this.currentFrame +=  1 / 6;
                    }
                }
    
                this.laser.index = Math.floor(this.currentFrame) as 0 | 1 | 2 | 3 | 4 | 5;
            }
        }
    }
}