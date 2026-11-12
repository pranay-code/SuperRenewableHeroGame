// ============================================
// BATTERY LAYER — Hero Element
// Volumetric industrial battery unit
// Glass core, directional lighting, ground shadow
// ============================================

import * as PIXI from 'pixi.js';
import { BESS_CAPACITY } from '../../modules/constants.js';

export class BatteryLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Central position — slightly larger scale
        this.posX = width * 0.5;
        this.posY = height * 0.6;

        // Ground shadow (anchoring)
        this.shadow = new PIXI.Graphics();
        this.shadow.ellipse(0, 0, 75, 22);
        this.shadow.fill({ color: 0x000000, alpha: 0.35 });
        this.shadow.x = this.posX + 5; // offset slightly for directional feel
        this.shadow.y = this.posY + 100;
        this.container.addChild(this.shadow);

        // Volumetric Body
        this.body = new PIXI.Container();
        this.body.x = this.posX;
        this.body.y = this.posY;
        this.body.scale.set(1.15); // scale increase for dominance
        this.container.addChild(this.body);

        this.drawBody();
        this.createGlassCore();
    }

    drawBody() {
        // Main metallic frame
        const frame = new PIXI.Graphics();
        frame.roundRect(-55, -90, 110, 180, 8);
        frame.fill({ color: 0x2d3748 }); // darker slate
        frame.stroke({ color: 0x4a5568, width: 2 });
        this.body.addChild(frame);

        // Left shadow (sun from top-right)
        const leftShade = new PIXI.Graphics();
        leftShade.roundRect(-55, -90, 40, 180, 8);
        leftShade.fill({ color: 0x000000, alpha: 0.12 });
        this.body.addChild(leftShade);

        // Right highlight (sun-facing edge)
        const rightHighlight = new PIXI.Graphics();
        rightHighlight.moveTo(55, -82);
        rightHighlight.lineTo(55, 82);
        rightHighlight.stroke({ color: 0xffffff, width: 2, alpha: 0.2 });
        this.body.addChild(rightHighlight);

        // Top highlight
        const topHighlight = new PIXI.Graphics();
        topHighlight.moveTo(-47, -90);
        topHighlight.lineTo(47, -90);
        topHighlight.stroke({ color: 0xffffff, width: 1, alpha: 0.12 });
        this.body.addChild(topHighlight);

        // Top inset/vent
        const vent = new PIXI.Graphics();
        vent.rect(-42, -80, 84, 18);
        vent.fill({ color: 0x1a202c });
        vent.stroke({ color: 0x4a5568, width: 1, alpha: 0.3 });
        this.body.addChild(vent);

        // Bottom inset/vent
        const ventBottom = new PIXI.Graphics();
        ventBottom.rect(-42, 62, 84, 18);
        ventBottom.fill({ color: 0x1a202c });
        ventBottom.stroke({ color: 0x4a5568, width: 1, alpha: 0.3 });
        this.body.addChild(ventBottom);
    }

    createGlassCore() {
        // Internal depth gradient (darker at bottom, lighter at top)
        const depthBg = new PIXI.Graphics();
        depthBg.rect(-35, -55, 70, 110);
        depthBg.fill({ color: 0x0d1117, alpha: 0.9 });
        this.body.addChild(depthBg);

        // Lighter band near top for depth illusion
        const depthHighlight = new PIXI.Graphics();
        depthHighlight.rect(-35, -55, 70, 25);
        depthHighlight.fill({ color: 0x1a2332, alpha: 0.6 });
        this.body.addChild(depthHighlight);

        // Glass chamber border
        const glass = new PIXI.Graphics();
        glass.rect(-35, -55, 70, 110);
        glass.stroke({ color: 0x94a3b8, width: 1.5, alpha: 0.4 });
        this.body.addChild(glass);

        // Stronger glass highlight (left edge reflection)
        const glassHighlight = new PIXI.Graphics();
        glassHighlight.moveTo(-32, -50);
        glassHighlight.lineTo(-32, 50);
        glassHighlight.stroke({ color: 0xffffff, width: 3, alpha: 0.15 });
        this.body.addChild(glassHighlight);

        // Secondary reflection (diagonal)
        const diagReflect = new PIXI.Graphics();
        diagReflect.moveTo(20, -50);
        diagReflect.lineTo(30, -30);
        diagReflect.stroke({ color: 0xffffff, width: 2, alpha: 0.08 });
        this.body.addChild(diagReflect);

        // Inner glow (SOC fill)
        this.glow = new PIXI.Graphics();
        this.body.addChild(this.glow);

        // Charge / Discharge indicator ring
        this.stateRing = new PIXI.Graphics();
        this.body.addChild(this.stateRing);

        // Sparkle particles
        this.sparkles = new PIXI.Container();
        this.body.addChild(this.sparkles);
        for (let i = 0; i < 12; i++) {
            const p = new PIXI.Graphics();
            p.circle(0, 0, 1 + Math.random() * 1.5);
            p.fill({ color: 0x58D68D });
            p.x = (Math.random() - 0.5) * 60;
            p.y = -55 + Math.random() * 110;
            p.alpha = Math.random() * 0.5;
            this.sparkles.addChild(p);
        }
    }

    update(sceneState, deltaTime) {
        const { soc, dischargeAmount, chargeAmount } = sceneState;
        const normalized = soc / BESS_CAPACITY;

        // --- SOC fill with charge/discharge color differentiation ---
        this.glow.clear();
        const fillHeight = 110 * normalized;

        let fillColor = 0x58D68D; // idle green
        let fillAlpha = 0.3;

        if (chargeAmount > 0) {
            fillColor = 0x3B82F6; // blue for charging
            fillAlpha = 0.45;
        } else if (dischargeAmount > 0) {
            fillColor = 0xF59E0B; // amber for discharging
            fillAlpha = 0.45;
        }

        this.glow.rect(-35, 55 - fillHeight, 70, fillHeight);
        this.glow.fill({ color: fillColor, alpha: fillAlpha });

        // Pulse
        const pulse = Math.sin(Date.now() * 0.004) * 0.08;
        this.glow.alpha = 0.8 + pulse;

        // --- State ring (thin border glow) ---
        this.stateRing.clear();
        if (chargeAmount > 0 || dischargeAmount > 0) {
            this.stateRing.rect(-36, -56, 72, 112);
            this.stateRing.stroke({ color: fillColor, width: 1.5, alpha: 0.3 + pulse });
        }

        // --- Sparkle particles ---
        const activity = (chargeAmount + dischargeAmount) > 0 ? 2.5 : 0.8;
        this.sparkles.children.forEach(p => {
            p.alpha = 0.2 + Math.sin(Date.now() * 0.003 + p.x * 2) * 0.5;
            p.y -= deltaTime * 12 * activity;
            if (p.y < -55) p.y = 55;
        });
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
