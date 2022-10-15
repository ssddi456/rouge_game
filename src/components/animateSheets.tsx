import React from "react";
import * as PIXI from "pixi.js";
import { loadAnimation } from "../loadAnimation";
import { ColorReplaceFilter } from "@pixi/filter-color-replace";

interface AnimationPreviewProps {
    name: string;
    url: string;
    spriteSheet: Record<string, number[]>;
    animateIndexMap: Record<string, number[]>;
    animationName: string;
    width: number;
    height: number;
}
interface AnimationPreviewState {
}
export class AnimationPreview extends React.Component<
    AnimationPreviewProps,
    AnimationPreviewState
> {
    constructor(props: AnimationPreviewProps) {
        super(props);
        this.state = {};
    }

    pixiContainer: HTMLDivElement | null = null;
    pixiApp: PIXI.Application | null = null;

    loadPixi = (div: HTMLDivElement) => {
        this.pixiContainer = div;

        const app = new PIXI.Application({
            width: this.props.width || 800,
            height: this.props.height || 600,
            backgroundColor: 0x1099bb,
            resolution: window.devicePixelRatio || 1,
        });

        div.appendChild(app.view);
        this.pixiApp = app;
        this.tryLoadAnimation();
    };

    shouldComponentUpdate(
        nextProps: AnimationPreviewProps,
        nextState: AnimationPreviewState
    ) {
        if (this.pixiApp) {
            if (nextProps.width !== this.props.width
                || nextProps.height !== this.props.height
            ) {
                this.pixiApp.renderer.resize(nextProps.width, nextProps.height);
            }

            if (nextProps.animationName !== this.props.animationName) {
                this.tryLoadAnimation();
            }
        }

        return (
            nextProps.name !== this.props.name ||
            nextProps.url !== this.props.url ||
            JSON.stringify(nextProps.spriteSheet) !== JSON.stringify(this.props.spriteSheet) ||
            JSON.stringify(nextProps.animateIndexMap) !== JSON.stringify(this.props.animateIndexMap)
        );
    }

    createSpriteSheet() {
        return loadAnimation(
            this.pixiApp!.loader,
            this.props.name,
            this.props.url,
            this.props.spriteSheet,
            this.props.animateIndexMap
        );
    }

    tryLoadAnimation = async () => {
        if (this.pixiApp
            && this.props.name
            && this.props.url
            && this.props.spriteSheet
            && this.props.animateIndexMap
            && this.props.animationName
        ) {
            this.pixiApp.stage.removeChildren();
            const animationMap = await this.createSpriteSheet();
            for (const key in animationMap) {
                if (Object.prototype.hasOwnProperty.call(animationMap, key)) {
                    const element = animationMap[key];
                    element.anchor.set(0, 0);
                    element.x = 0;
                    element.y = 0;
                    element.play();
                    element.loop = true;
                }
            }
            const firstAnimation = animationMap[this.props.animationName || 'idle'];
            if (firstAnimation) {
                this.pixiApp.stage.addChild(firstAnimation);
            }
        }
    }

    componentDidUpdate() {
        this.tryLoadAnimation();
    }

    render() {
        return (
            <div>
                <h1>Animation Preview</h1>
                <div ref={this.loadPixi}></div>
            </div>
        );
    }
}
