// ============================================
// SOLAR LAYER
// Panel arrays in perspective with reflection
// Directional lighting from sun (top-right)
// ============================================

import * as PIXI from 'pixi.js';
import { MAX_SOLAR } from '../../modules/constants.js';

export class SolarLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Position midground left
        this.posX = width * 0.12;
        this.posY = height * 0.66;

        // Ground shadow for panels
        this.panelShadow = new PIXI.Graphics();
        this.panelShadow.ellipse(this.posX + 60, this.posY + 85, 80, 12);
        this.panelShadow.fill({ color: 0x000000, alpha: 0.15 });
        this.container.addChild(this.panelShadow);

        this.panels = new PIXI.Container();
        this.container.addChild(this.panels);
        this.createPanelArrays();

        // Reflection highlight overlay (sun-facing)
        this.reflectionOverlay = new PIXI.Container();
        this.container.addChild(this.reflectionOverlay);
    }

    createPanelArrays() {
        const rows = 3;
        const cols = 4;
        const spacingX = 38;
        const spacingY = 22;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const panel = new PIXI.Graphics();

                const w = 33;
                const h = 18;
                const skew = 4;

                // Panel body
                panel.moveTo(-w / 2, -h / 2);
                panel.lineTo(w / 2, -h / 2 + skew);
                panel.lineTo(w / 2, h / 2 + skew);
                panel.lineTo(-w / 2, h / 2);
                panel.closePath();
                panel.fill({ color: 0x1e3a6e }); // muted blue
                panel.stroke({ color: 0x60a5fa, width: 0.5, alpha: 0.2 });

                // Grid lines on panel
                const gridLine1 = new PIXI.Graphics();
                gridLine1.moveTo(-w / 2, 0);
                gridLine1.lineTo(w / 2, skew / 2);
                gridLine1.stroke({ color: 0x3b82f6, width: 0.5, alpha: 0.15 });
                panel.addChild(gridLine1);

                const gridLine2 = new PIXI.Graphics();
                gridLine2.moveTo(0, -h / 2 + skew / 2);
                gridLine2.lineTo(0, h / 2 + skew / 2);
                gridLine2.stroke({ color: 0x3b82f6, width: 0.5, alpha: 0.15 });
                panel.addChild(gridLine2);

                // Top-edge reflection gradient (sun reflection)
                const reflection = new PIXI.Graphics();
                reflection.moveTo(-w / 2, -h / 2);
                reflection.lineTo(w / 2, -h / 2 + skew);
                reflection.lineTo(w / 2, -h / 2 + skew + 5);
                reflection.lineTo(-w / 2, -h / 2 + 5);
                reflection.closePath();
                reflection.fill({ color: 0xffffff, alpha: 0.08 });
                panel.addChild(reflection);

                panel.x = this.posX + c * spacingX - (r * 8);
                panel.y = this.posY + r * spacingY;

                this.panels.addChild(panel);
            }
        }
    }

    update(sceneState) {
        const { solarOutput } = sceneState;
        const intensity = solarOutput / MAX_SOLAR;

        this.panels.children.forEach(panel => {
            panel.alpha = 0.75 + intensity * 0.25;
        });
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
