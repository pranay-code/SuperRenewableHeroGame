import * as PIXI from 'pixi.js';

export class BackgroundLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Vignette effect
        this.vignette = new PIXI.Graphics();
        this.vignette.rect(0, 0, width, height);
        this.vignette.fill({ color: 0x000000, alpha: 0.2 });
        this.container.addChild(this.vignette);

        // Haze effect for depth
        this.haze = new PIXI.Graphics();
        this.haze.rect(0, height * 0.5, width, height * 0.5);
        this.haze.fill({ color: 0x1e3a5f, alpha: 0.2 });
        this.container.addChild(this.haze);
    }

    update() {
        // Subtle changes based on phase could be added here
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
