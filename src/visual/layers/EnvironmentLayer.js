import * as PIXI from 'pixi.js';

export class EnvironmentLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Terrain with texture/gradient
        this.terrain = new PIXI.Graphics();
        this.terrain.rect(0, height * 0.65, width, height * 0.35);
        this.terrain.fill({
            color: 0x1a2e1a, // Muted earthy green
            alpha: 1
        });
        // Add subtle terrain variation (noise-like circles)
        for (let i = 0; i < 50; i++) {
            const tx = Math.random() * width;
            const ty = height * 0.65 + Math.random() * (height * 0.35);
            const size = 5 + Math.random() * 20;
            this.terrain.circle(tx, ty, size);
            this.terrain.fill({ color: 0x152515, alpha: 0.3 });
        }
        this.container.addChild(this.terrain);

        // Distant mountains
        this.mountains = new PIXI.Graphics();
        this.container.addChild(this.mountains);
        this.createMountains();

        // Distant transmission towers
        this.towers = new PIXI.Container();
        this.container.addChild(this.towers);
        this.createTowers();

        // Foreground grass (higher density, muted)
        this.grass = new PIXI.Graphics();
        this.container.addChild(this.grass);
        this.grassTime = 0;
    }

    createMountains() {
        this.mountains.clear();
        const y = this.height * 0.65;
        this.mountains.moveTo(0, y);

        // Create 2-3 layers of mountains
        for (let j = 0; j < 2; j++) {
            const alpha = 0.1 - j * 0.05;
            this.mountains.moveTo(0, y);
            for (let i = 0; i <= this.width; i += 100) {
                const h = Math.random() * 50 + (j * 20);
                this.mountains.lineTo(i, y - h);
            }
            this.mountains.lineTo(this.width, y);
            this.mountains.fill({ color: 0x1e3a5f, alpha });
        }
    }

    createTowers() {
        for (let i = 0; i < 4; i++) {
            const tower = new PIXI.Graphics();
            const x = this.width * (0.15 + i * 0.25);
            const y = this.height * 0.65;
            const scale = 0.3 - i * 0.04;

            tower.moveTo(0, 0);
            tower.lineTo(-15 * scale, 80 * scale);
            tower.lineTo(15 * scale, 80 * scale);
            tower.lineTo(0, 0);
            // Atmospheric fading (blur and alpha)
            tower.stroke({ color: 0x333333, width: 1, alpha: scale * 2 });

            tower.x = x;
            tower.y = y - 80 * scale;
            this.towers.addChild(tower);
        }
    }

    update(sceneState, deltaTime) {
        this.grassTime += deltaTime * 1.5;

        // Render dense swaying grass in foreground
        this.grass.clear();
        const grassY = this.height * 0.92;

        // Use a more muted green
        const grassColor = 0x243b22;

        for (let i = 0; i < this.width; i += 5) {
            const hOffset = Math.sin(i * 0.5) * 10;
            const sway = Math.sin(this.grassTime + i * 0.05) * 4;
            this.grass.moveTo(i, this.height);
            this.grass.lineTo(i + sway, grassY + hOffset);
            this.grass.stroke({ color: grassColor, width: 1.5, alpha: 0.8 });
        }
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
