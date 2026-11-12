// ============================================
// CLOUD LAYER
// Parallax clouds affected by wind
// Horizontal movement with looping
// ============================================

import * as PIXI from 'pixi.js';

export class CloudLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Create cloud sprites (simple graphics for now)
        this.clouds = [];
        this.createClouds();

        this.baseSpeed = 20; // Base pixels per second
    }

    createClouds() {
        const cloudCount = 5;

        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloudGraphic();
            cloud.x = Math.random() * this.width;
            cloud.y = 50 + Math.random() * 150;
            cloud.alpha = 0.6 + Math.random() * 0.3;
            cloud.scale.set(0.8 + Math.random() * 0.4);

            this.container.addChild(cloud);
            this.clouds.push(cloud);
        }
    }

    createCloudGraphic() {
        const graphics = new PIXI.Graphics();

        // Simple cloud shape (3 overlapping circles)
        const baseRadius = 30;
        graphics.circle(0, 0, baseRadius);
        graphics.circle(baseRadius * 0.8, -baseRadius * 0.3, baseRadius * 0.8);
        graphics.circle(-baseRadius * 0.8, -baseRadius * 0.3, baseRadius * 0.8);
        graphics.fill({ color: 0xffffff, alpha: 0.8 });

        return graphics;
    }

    update(sceneState, deltaTime) {
        const { windOutput } = sceneState;

        // Movement speed proportional to wind
        const speed = this.baseSpeed + (windOutput / 60) * 30; // 20-50 px/sec

        // Parallax offset (subtle)
        const parallaxOffset = (windOutput / 60) * 2; // 0-2 px

        this.clouds.forEach((cloud, index) => {
            // Move cloud
            cloud.x += speed * deltaTime;

            // Apply subtle parallax (different layers move at different speeds)
            const layerFactor = 1 + (index / this.clouds.length) * 0.2;
            cloud.x += parallaxOffset * layerFactor * deltaTime;

            // Loop around
            if (cloud.x > this.width + 100) {
                cloud.x = -100;
                cloud.y = 50 + Math.random() * 150;
            }
        });
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
