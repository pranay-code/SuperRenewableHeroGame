// ============================================
// ENERGY FLOW LAYER
// Bezier paths with thick glow strokes
// Animated pulse nodes with size variation
// Brightness bump near battery
// ============================================

import * as PIXI from 'pixi.js';
import { BESS_RATE_PER_BLOCK, MAX_SOLAR, MAX_WIND } from '../../modules/constants.js';

export class EnergyFlowLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Define positions
        this.solarPos = { x: width * 0.15, y: height * 0.65 };
        this.windPos = { x: width * 0.2, y: height * 0.4 };
        this.batteryPos = { x: width * 0.5, y: height * 0.6 };
        this.gridPos = { x: width * 0.85, y: height * 0.5 };

        // Paths container
        this.paths = new PIXI.Container();
        this.container.addChild(this.paths);

        // Nodes container
        this.nodes = new PIXI.Container();
        this.container.addChild(this.nodes);

        this.activeNodes = [];
        this.nodeSpawnTimers = {
            solar: 0,
            wind: 0,
            charge: 0,
            discharge: 0
        };

        this.setupPaths();
    }

    setupPaths() {
        const graphics = new PIXI.Graphics();
        this.paths.addChild(graphics);

        // Outer glow layer (wider, more transparent)
        this.drawBezierPath(graphics, this.solarPos, this.batteryPos, 0xF4D03F, 14, 0.06);
        this.drawBezierPath(graphics, this.windPos, this.batteryPos, 0x48C9B0, 14, 0.06);
        this.drawBezierPath(graphics, this.batteryPos, this.gridPos, 0x58D68D, 14, 0.06);

        // Mid glow layer
        this.drawBezierPath(graphics, this.solarPos, this.batteryPos, 0xF4D03F, 8, 0.12);
        this.drawBezierPath(graphics, this.windPos, this.batteryPos, 0x48C9B0, 8, 0.12);
        this.drawBezierPath(graphics, this.batteryPos, this.gridPos, 0x58D68D, 8, 0.12);

        // Core stroke (thicker)
        this.drawBezierPath(graphics, this.solarPos, this.batteryPos, 0xF4D03F, 5, 0.25);
        this.drawBezierPath(graphics, this.windPos, this.batteryPos, 0x48C9B0, 5, 0.25);
        this.drawBezierPath(graphics, this.batteryPos, this.gridPos, 0x58D68D, 5, 0.25);
    }

    drawBezierPath(graphics, start, end, color, width, alpha) {
        const cp1x = start.x + (end.x - start.x) * 0.5;
        const cp1y = start.y;
        const cp2x = start.x + (end.x - start.x) * 0.5;
        const cp2y = end.y;

        graphics.moveTo(start.x, start.y);
        graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);
        graphics.stroke({ color, width, alpha });
    }

    spawnNode(start, end, color) {
        const node = new PIXI.Container();

        // Variable radius for size variation
        const baseRadius = 4 + Math.random() * 4;

        // Outer glow
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, baseRadius * 3);
        glow.fill({ color, alpha: 0.1 });
        node.addChild(glow);

        // Mid glow
        const midGlow = new PIXI.Graphics();
        midGlow.circle(0, 0, baseRadius * 1.8);
        midGlow.fill({ color, alpha: 0.2 });
        node.addChild(midGlow);

        // Core
        const core = new PIXI.Graphics();
        core.circle(0, 0, baseRadius);
        core.fill({ color });
        node.addChild(core);

        node.progress = 0;
        node.start = start;
        node.end = end;
        node.color = color;
        node.baseRadius = baseRadius;
        node.speed = 0.35 + Math.random() * 0.25;

        this.nodes.addChild(node);
        this.activeNodes.push(node);
    }

    update(sceneState, deltaTime) {
        const { solarOutput, windOutput, dischargeAmount } = sceneState;

        // Solar -> Battery
        this.updateSpawner('solar', this.solarPos, this.batteryPos, solarOutput / MAX_SOLAR, 0xF4D03F, deltaTime);

        // Wind -> Battery
        this.updateSpawner('wind', this.windPos, this.batteryPos, windOutput / MAX_WIND, 0x48C9B0, deltaTime);

        // Discharge (Battery -> Grid)
        this.updateSpawner('discharge', this.batteryPos, this.gridPos, dischargeAmount / BESS_RATE_PER_BLOCK, 0x58D68D, deltaTime);

        // Update all nodes
        for (let i = this.activeNodes.length - 1; i >= 0; i--) {
            const node = this.activeNodes[i];
            node.progress += deltaTime * node.speed;

            const t = node.progress;
            const cx1 = node.start.x + (node.end.x - node.start.x) * 0.5;
            const cy1 = node.start.y;
            const cx2 = node.start.x + (node.end.x - node.start.x) * 0.5;
            const cy2 = node.end.y;

            const x = Math.pow(1 - t, 3) * node.start.x + 3 * Math.pow(1 - t, 2) * t * cx1 + 3 * (1 - t) * Math.pow(t, 2) * cx2 + Math.pow(t, 3) * node.end.x;
            const y = Math.pow(1 - t, 3) * node.start.y + 3 * Math.pow(1 - t, 2) * t * cy1 + 3 * (1 - t) * Math.pow(t, 2) * cy2 + Math.pow(t, 3) * node.end.y;

            node.x = x;
            node.y = y;

            // Pulsing scale with size variation
            const pulse = 1 + Math.sin(Date.now() * 0.008 + node.baseRadius) * 0.15;
            node.scale.set(pulse);

            // Brightness bump when approaching battery (last 20% of path)
            if (t > 0.8) {
                const bump = (t - 0.8) / 0.2; // 0 to 1
                node.alpha = 1 + bump * 0.4;
            } else {
                node.alpha = 1;
            }

            if (node.progress >= 1) {
                this.nodes.removeChild(node);
                this.activeNodes.splice(i, 1);
                node.destroy();
            }
        }
    }

    updateSpawner(key, start, end, intensity, color, deltaTime) {
        if (intensity <= 0) return;

        this.nodeSpawnTimers[key] += deltaTime;
        const spawnInterval = 1 / (intensity * 4 + 0.5);

        if (this.nodeSpawnTimers[key] >= spawnInterval) {
            this.nodeSpawnTimers[key] = 0;
            this.spawnNode(start, end, color);
        }
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
