// ============================================
// CLIPPING LAYER
// Red spark particles when clipping occurs
// Brief red flash on grid node
// Uses object pooling (max 20 particles)
// ============================================

import * as PIXI from 'pixi.js';
import { ParticlePool } from '../pools/ParticlePool.js';

export class ClippingLayer {
    constructor(stage, width, height) {
        this.container = new PIXI.Container();
        stage.addChild(this.container);

        this.width = width;
        this.height = height;

        // Create particle pool
        this.pool = new ParticlePool(20, () => this.createSparkParticle());
        this.pool.available.forEach(p => this.container.addChild(p));

        this.spawnTimer = 0;
        this.gridPos = { x: width * 0.7, y: height * 0.5 };

        // Flash overlay
        this.flash = new PIXI.Graphics();
        this.flash.circle(this.gridPos.x, this.gridPos.y, 30);
        this.flash.fill({ color: 0xff0000, alpha: 0 });
        this.container.addChild(this.flash);

        this.flashTimer = 0;
        this.flashDuration = 0.3; // 300ms
    }

    createSparkParticle() {
        const graphics = new PIXI.Graphics();
        graphics.circle(0, 0, 3);
        graphics.fill({ color: 0xff0000, alpha: 0.9 });

        // Custom properties
        graphics.velocityX = 0;
        graphics.velocityY = 0;
        graphics.lifetime = 0;

        return graphics;
    }

    update(sceneState, deltaTime) {
        const { clipped } = sceneState;

        // Trigger flash on clipping
        if (clipped > 0 && this.flashTimer === 0) {
            this.flashTimer = this.flashDuration;
        }

        // Update flash
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            this.flashTimer = Math.max(0, this.flashTimer);

            // Fade out
            this.flash.alpha = (this.flashTimer / this.flashDuration) * 0.5;
        }

        // Spawn sparks
        if (clipped > 0) {
            const spawnRate = Math.min((clipped / 10) * 10, 10); // 0-10 particles/sec
            this.spawnTimer += deltaTime;
            const spawnInterval = spawnRate > 0 ? 1 / spawnRate : Infinity;

            while (this.spawnTimer >= spawnInterval && spawnRate > 0) {
                this.spawnTimer -= spawnInterval;

                const particle = this.pool.acquire();
                if (particle) {
                    // Spawn near grid node
                    const angle = Math.random() * Math.PI * 2;

                    particle.x = this.gridPos.x + Math.cos(angle) * 10;
                    particle.y = this.gridPos.y + Math.sin(angle) * 10;

                    // Random velocity outward
                    particle.velocityX = Math.cos(angle) * (50 + Math.random() * 100);
                    particle.velocityY = Math.sin(angle) * (50 + Math.random() * 100);
                    particle.lifetime = 0;
                }
            }
        }

        // Update all active particles
        this.pool.updateAll((particle) => {
            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            particle.lifetime += deltaTime;

            // Fade out
            particle.alpha = Math.max(0, 1 - particle.lifetime / 0.5);

            // Release after 0.5 seconds
            return particle.lifetime >= 0.5;
        });
    }

    destroy() {
        this.pool.destroy();
        this.container.destroy({ children: true });
    }
}
