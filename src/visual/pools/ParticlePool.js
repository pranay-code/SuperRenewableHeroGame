// ============================================
// PARTICLE POOL
// Generic object pool for particle systems
// Pre-allocates particles to avoid runtime allocations
// ============================================

export class ParticlePool {
    constructor(maxSize, createParticleFn) {
        this.maxSize = maxSize;
        this.createParticleFn = createParticleFn;

        this.available = []; // Inactive particles
        this.active = [];    // Active particles

        // Pre-allocate all particles at initialization
        for (let i = 0; i < maxSize; i++) {
            const particle = createParticleFn();
            particle.visible = false;
            this.available.push(particle);
        }
    }

    /**
     * Acquire a particle from the pool
     * @returns {PIXI.Graphics|null} Particle or null if pool exhausted
     */
    acquire() {
        if (this.available.length === 0) {
            return null; // Pool exhausted, skip spawn
        }

        const particle = this.available.pop();
        this.active.push(particle);
        particle.visible = true;
        return particle;
    }

    /**
     * Release a particle back to the pool
     * @param {PIXI.Graphics} particle
     */
    release(particle) {
        const index = this.active.indexOf(particle);
        if (index === -1) return; // Already released

        this.active.splice(index, 1);
        this.available.push(particle);
        particle.visible = false;
    }

    /**
     * Update all active particles
     * @param {Function} updateFn - Function that returns true if particle should be released
     */
    updateAll(updateFn) {
        // Iterate backwards to safely remove during iteration
        for (let i = this.active.length - 1; i >= 0; i--) {
            const particle = this.active[i];
            const shouldRelease = updateFn(particle);
            if (shouldRelease) {
                this.release(particle);
            }
        }
    }

    /**
     * Destroy all particles and clear pools
     */
    destroy() {
        // Destroy all particle sprites
        [...this.available, ...this.active].forEach(p => p.destroy());
        this.available = [];
        this.active = [];
    }
}
