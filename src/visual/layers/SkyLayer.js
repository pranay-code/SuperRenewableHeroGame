// ============================================
// SKY LAYER
// Gradient background with phase-based colors
// Smooth 1-second crossfade during phase transitions
// ============================================

import * as PIXI from 'pixi.js';
import { getPhaseColors, lerpColor } from '../utils/ColorUtils.js';

export class SkyLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Create gradient rectangle
        this.gradient = new PIXI.Graphics();
        this.container.addChild(this.gradient);

        // Transition state
        this.currentPhase = null;
        this.transitionProgress = 1; // 0 = start, 1 = complete
        this.transitionDuration = 1.0; // 1 second
        this.fromColors = null;
        this.toColors = null;

        // Initial render
        this.renderGradient(0x0a1128, 0x1e3a5f);
    }

    renderGradient(topColor, bottomColor) {
        this.gradient.clear();
        this.gradient.rect(0, 0, this.width, this.height);
        this.gradient.fill({
            color: topColor,
            alpha: 1,
        });

        // Create vertical gradient using multiple rectangles
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const color = lerpColor(topColor, bottomColor, t);
            const y = (this.height / steps) * i;
            const h = this.height / steps;

            this.gradient.rect(0, y, this.width, h);
            this.gradient.fill({ color, alpha: 1 });
        }
    }

    update(sceneState, deltaTime) {
        const { currentPhase } = sceneState;

        // Detect phase change
        if (currentPhase !== this.currentPhase) {
            // Start transition
            this.fromColors = this.currentPhase
                ? getPhaseColors(this.currentPhase)
                : getPhaseColors(currentPhase);
            this.toColors = getPhaseColors(currentPhase);
            this.currentPhase = currentPhase;
            this.transitionProgress = 0;
        }

        // Update transition
        if (this.transitionProgress < 1) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            this.transitionProgress = Math.min(1, this.transitionProgress);

            // Interpolate colors
            const t = this.transitionProgress;
            const topColor = lerpColor(this.fromColors.top, this.toColors.top, t);
            const bottomColor = lerpColor(this.fromColors.bottom, this.toColors.bottom, t);

            this.renderGradient(topColor, bottomColor);
        }
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
