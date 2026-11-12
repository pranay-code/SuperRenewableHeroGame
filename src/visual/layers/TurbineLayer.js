// ============================================
// TURBINE LAYER
// Wind turbine with directional shading
// Aviation light, motion blur at high wind
// ============================================

import * as PIXI from 'pixi.js';
import { MAX_WIND } from '../../modules/constants.js';

export class TurbineLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Position turbine in lower left
        this.turbineX = width * 0.2;
        this.turbineY = height * 0.7;

        // Ground shadow
        const shadow = new PIXI.Graphics();
        shadow.ellipse(0, 0, 30, 8);
        shadow.fill({ color: 0x000000, alpha: 0.2 });
        shadow.x = this.turbineX + 5;
        shadow.y = this.turbineY + 5;
        this.container.addChild(shadow);

        // Tower body — muted grey
        this.tower = new PIXI.Graphics();
        this.tower.moveTo(-10, 0);
        this.tower.lineTo(-4, -165);
        this.tower.lineTo(4, -165);
        this.tower.lineTo(10, 0);
        this.tower.fill({ color: 0xc8ccd0 }); // muted grey instead of bright white

        // Left shading (away from sun)
        const shading = new PIXI.Graphics();
        shading.moveTo(-10, 0);
        shading.lineTo(-4, -165);
        shading.lineTo(0, -165);
        shading.lineTo(0, 0);
        shading.fill({ color: 0x000000, alpha: 0.12 });
        this.tower.addChild(shading);

        // Right highlight (facing sun)
        const highlight = new PIXI.Graphics();
        highlight.moveTo(10, 0);
        highlight.lineTo(4, -165);
        highlight.stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 });
        this.tower.addChild(highlight);

        this.tower.x = this.turbineX;
        this.tower.y = this.turbineY;
        this.container.addChild(this.tower);

        // Aviation light
        this.aviationLight = new PIXI.Graphics();
        this.aviationLight.circle(0, 0, 2.5);
        this.aviationLight.fill({ color: 0xff3333 });

        // Aviation light glow
        this.aviationGlow = new PIXI.Graphics();
        this.aviationGlow.circle(0, 0, 6);
        this.aviationGlow.fill({ color: 0xff3333, alpha: 0.15 });
        this.aviationGlow.x = this.turbineX;
        this.aviationGlow.y = this.turbineY - 170;
        this.container.addChild(this.aviationGlow);

        this.aviationLight.x = this.turbineX;
        this.aviationLight.y = this.turbineY - 170;
        this.container.addChild(this.aviationLight);
        this.lightTimer = 0;

        // Blades
        this.blades = new PIXI.Graphics();
        this.createBlades();
        this.blades.x = this.turbineX;
        this.blades.y = this.turbineY - 165;
        this.container.addChild(this.blades);

        this.baseRotationSpeed = 0.2;
    }

    createBlades() {
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const bladeLen = 68;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const normX = -sin;
            const normY = cos;

            // Blade fill — muted white
            this.blades.moveTo(0, 0);
            this.blades.lineTo(cos * bladeLen - normX * 3.5, sin * bladeLen - normY * 3.5);
            this.blades.lineTo(cos * bladeLen + normX * 3.5, sin * bladeLen + normY * 3.5);
            this.blades.fill({ color: 0xe2e8f0 }); // muted white-grey

            // Blade center line shading
            this.blades.moveTo(0, 0);
            this.blades.lineTo(cos * bladeLen, sin * bladeLen);
            this.blades.stroke({ color: 0x000000, width: 1, alpha: 0.1 });
        }

        // Center hub
        this.blades.circle(0, 0, 10);
        this.blades.fill({ color: 0xd4d8dc });
        this.blades.circle(0, 0, 10);
        this.blades.stroke({ color: 0xffffff, width: 1, alpha: 0.15 });
    }

    update(sceneState, deltaTime) {
        const { windOutput, currentPhase } = sceneState;

        const normalized = windOutput / MAX_WIND;
        const rotationSpeed = this.baseRotationSpeed + normalized * 4;
        this.blades.rotation += rotationSpeed * deltaTime;

        // Aviation light blink
        this.lightTimer += deltaTime;
        const isNight = currentPhase.includes('Night') || currentPhase.includes('Peak');
        if (isNight) {
            const blink = Math.sin(this.lightTimer * 5) > 0.3;
            this.aviationLight.alpha = blink ? 1 : 0.15;
            this.aviationGlow.alpha = blink ? 0.25 : 0;
        } else {
            this.aviationLight.alpha = 0;
            this.aviationGlow.alpha = 0;
        }

        // Motion blur at high wind
        this.blades.alpha = 1 - (normalized * 0.15);
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
