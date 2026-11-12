// ============================================
// GRID LAYER
// Grid node with connection lines
// Blue pulse when near export capacity
// Static connection lines to solar, wind, battery
// ============================================

import * as PIXI from 'pixi.js';
import { GRID_CAP } from '../../modules/constants.js';

export class GridLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Positions
        this.gridPos = { x: width * 0.7, y: height * 0.5 };
        this.batteryPos = { x: width * 0.3, y: height * 0.5 };
        this.solarPos = { x: width * 0.8, y: height * 0.2 };
        this.windPos = { x: width * 0.2, y: height * 0.7 };

        // Create connection lines
        this.lines = new PIXI.Graphics();
        this.drawConnectionLines();
        this.container.addChild(this.lines);

        // Create grid node
        this.gridNode = new PIXI.Graphics();
        this.gridNode.circle(0, 0, 15);
        this.gridNode.fill({ color: 0x4444ff });
        this.gridNode.x = this.gridPos.x;
        this.gridNode.y = this.gridPos.y;
        this.container.addChild(this.gridNode);

        // Glow circle for pulse effect
        this.glow = new PIXI.Graphics();
        this.glow.circle(0, 0, 25);
        this.glow.fill({ color: 0x4444ff, alpha: 0 });
        this.glow.x = this.gridPos.x;
        this.glow.y = this.gridPos.y;
        this.container.addChild(this.glow);

        this.pulseTime = 0;
    }

    drawConnectionLines() {
        this.lines.clear();

        // Solar → Grid
        this.lines.moveTo(this.solarPos.x, this.solarPos.y);
        this.lines.lineTo(this.gridPos.x, this.gridPos.y);
        this.lines.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });

        // Wind → Grid
        this.lines.moveTo(this.windPos.x, this.windPos.y);
        this.lines.lineTo(this.gridPos.x, this.gridPos.y);
        this.lines.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });

        // Grid ↔ Battery
        this.lines.moveTo(this.gridPos.x, this.gridPos.y);
        this.lines.lineTo(this.batteryPos.x, this.batteryPos.y);
        this.lines.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
    }

    update(sceneState, deltaTime) {
        const { gridExport } = sceneState;

        // Pulse when near capacity (≥95%)
        const normalized = gridExport / GRID_CAP;

        if (normalized >= 0.95) {
            this.pulseTime += deltaTime * 3;
            const pulse = (Math.sin(this.pulseTime) + 1) / 2; // 0 to 1
            this.glow.alpha = pulse * 0.6;
            this.glow.scale.set(1 + pulse * 0.3);
        } else {
            this.glow.alpha = 0;
            this.pulseTime = 0;
        }
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
