import { Container, Graphics, Text } from "pixi.js";

export class LevelMenu {
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

    }

    init () {
        if (this.sprite) {
            return;
        }

        if (!this.sprite) {
            this.sprite = this.container.addChild(new Container());
        }
        const main = this.sprite!;
        main.addChild(new Graphics())
            .beginFill(0x111111, 0.1)
            .drawRect(0, 0,
                this.width,
                this.height,
            )
            .endFill();
        const containerLeft = this.paddingHorizontal - this.containerRadius;
        const containerTop = this.paddingVertical - 2 * this.containerRadius;

        console.log('containerLeft', containerLeft, 'containerTop', containerTop);
        
        main.addChild(new Graphics())
            .beginFill(0xeeeeee)
            .drawRoundedRect(containerLeft, this.paddingVertical - 2 * this.containerRadius,
                this.width - 2 * this.paddingHorizontal - 2 * this.containerRadius,
                this.height - 2 * this.paddingVertical - 2 * this.containerRadius,
                this.containerRadius
            )
            .endFill()
        for (let index = 0; index < this.buttons.length; index++) {
            const element = this.buttons[index];
            this.addButton(element.label, element.handle);
        }

        const cancel = main.addChild(new Container)
        cancel.position.x = this.width - this.paddingHorizontal - 2 * this.containerRadius - 24 - 20;
        cancel.position.y = containerTop + 20;

        console.log('cancel', cancel.position);

        cancel.interactive = true;
        cancel.on('click', () => {
            this.dispose();
            this.onCancel();
        });
        cancel.addChild(new Graphics())
            .beginFill(0xdddddd)
            .drawRoundedRect(-2, -2, 20, 20, 2)
            .endFill()
            .lineStyle({
                color: 0x000000,
                width: 4
            })
            .moveTo(0, 0).lineTo(20, 20)
            .moveTo(0, 20).lineTo(20, 0)
    }

    addButton( text: string, handler: () => void) {
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

    update() {

    }

    dispose() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        this.buttonCount = 0;
    }
}