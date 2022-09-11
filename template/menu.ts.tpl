import { Container, Graphics, Text } from "pixi.js";
import { BaseMenu } from "./base";

export class <%= camelCasetemplateName %>Menu extends BaseMenu {
    sprite!: Container | null;

    init() {
        this.initSprite();
    }

}