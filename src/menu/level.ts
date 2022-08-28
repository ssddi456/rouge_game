import { Container, Graphics, Text } from "pixi.js";
import { BaseMenu } from "./base";

export class LevelMenu extends BaseMenu {
    sprite!: Container | null;
    
    paddingHorizontal = 500;
    paddingVertical = 100;
    containerRadius = 10;
    containerPadding = 50;

    buttonHeight = 40;
    buttonRadius = 5;
    buttonMargin = 20;

    buttonCount = 0;
    constructor(
        public container: Container,
        public width: number,
        public height: number,
        public buttons: { label: string, handle: () => void}[],
        public onOk: () => void,
        public onCancel: () => void,

    ) {
        super(container, width, height);
    }

    init () {
        if (this.sprite) {
            return;
        }

        if (!this.sprite) {
            this.sprite = this.container.addChild(new Container());
        }
        this.addBg();

        const containerLeft = this.paddingHorizontal - this.containerRadius;
        const containerTop = this.paddingVertical - 2 * this.containerRadius;

        console.log('containerLeft', containerLeft, 'containerTop', containerTop);
        
        this.sprite.addChild(new Graphics())
            .beginFill(0xeeeeee)
            .drawRoundedRect(containerLeft, this.paddingVertical - 2 * this.containerRadius,
                this.width - 2 * this.paddingHorizontal - 2 * this.containerRadius,
                this.height - 2 * this.paddingVertical - 2 * this.containerRadius,
                this.containerRadius
            )
            .endFill()
        for (let index = 0; index < this.buttons.length; index++) {
            const element = this.buttons[index];
            this.addLevelButton(element.label, element.handle);
        }

        this.addCancel();

    }

    addLevelButton( text: string, handler: () => void) {
        const main = this.sprite!;
        const containerTop = this.paddingVertical - 2 * this.containerRadius;
        const buttonTop = containerTop + this.containerPadding + this.buttonCount * (this.buttonMargin + this.buttonHeight);

        const button = main.addChild(new Graphics())
            .beginFill(0x999999)
            .drawRoundedRect(
                this.paddingHorizontal + this.containerPadding - 2 * this.containerRadius,
                buttonTop,
                this.width - 2 * this.paddingHorizontal - 2 * this.containerPadding,
                this.buttonHeight,
                this.buttonRadius
            )
            .endFill()
        const buttonText = main.addChild(new Text(text, {
            fill: 0xffffff,
            fontSize: 14,
        }))
        buttonText.position.x = (this.width - buttonText.width) / 2;
        buttonText.position.y = buttonTop + (this.buttonHeight - buttonText.height) / 2;
        this.buttonCount ++;
        button.interactive = true;
        button.on('click', () => {
            handler();
            this.dispose();
            this.onOk();
        });
    }

}