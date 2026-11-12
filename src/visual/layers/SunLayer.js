// ============================================
// SUN LAYER
// Sun core + glow that scales with solarOutput
// Subtle pulse at high output (>90%)
// ============================================

import * as PIXI from 'pixi.js';
import { createSunGlowTexture } from '../utils/TextureCache.js';
import { MAX_SOLAR } from '../../modules/constants.js';

export class SunLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Position sun in upper right
        this.sunX = width * 0.8;
        this.sunY = height * 0.2;

        // Create glow (background)
        this.glowTexture = createSunGlowTexture(150);
        this.glow = new PIXI.Sprite(this.glowTexture);
        this.glow.anchor.set(0.5);
        this.glow.x = this.sunX;
        this.glow.y = this.sunY;
        this.container.addChild(this.glow);

        // Create sun core (foreground)
        this.core = new PIXI.Graphics();
        this.core.circle(0, 0, 42);
        this.core.fill({ color: 0xfff9c4 }); // Brighter core

        // Subtle inner ring
        this.core.circle(0, 0, 30);
        this.core.fill({ color: 0xffdd44, alpha: 0.5 });

        this.core.x = this.sunX;
        this.core.y = this.sunY;
        this.container.addChild(this.core);

        // Pulse animation time
        this.pulseTime = 0;
    }

    update(sceneState, deltaTime) {
        const { solarOutput } = sceneState;

        // Normalize solar output (0-1)
        const normalized = solarOutput / MAX_SOLAR;

        // Scale sun core
        const coreScale = 1 + normalized * 0.8; // 1.0 to 1.8
        this.core.scale.set(coreScale);

        // Scale and fade glow
        const glowScale = 1 + normalized * 1.2; // 1.0 to 2.2
        const glowAlpha = 0.3 + normalized * 0.7; // 0.3 to 1.0

        this.glow.scale.set(glowScale);
        this.glow.alpha = glowAlpha;

        // High output pulse (>90%)
        if (normalized > 0.9) {
            this.pulseTime += deltaTime * 2;
            const pulse = Math.sin(this.pulseTime) * 0.05;
            this.core.scale.set(coreScale + pulse);
            this.glow.scale.set(glowScale + pulse * 2);
        } else {
            this.pulseTime = 0;
        }
    }

    destroy() {
        this.glowTexture.destroy(true);
        this.container.destroy({ children: true });
    }
}
