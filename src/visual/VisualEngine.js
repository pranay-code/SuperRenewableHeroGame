import * as PIXI from 'pixi.js';
import { BackgroundLayer } from './layers/BackgroundLayer.js';
import { SkyLayer } from './layers/SkyLayer.js';
import { CloudLayer } from './layers/CloudLayer.js';
import { SunLayer } from './layers/SunLayer.js';
import { EnvironmentLayer } from './layers/EnvironmentLayer.js';
import { SolarLayer } from './layers/SolarLayer.js';
import { TurbineLayer } from './layers/TurbineLayer.js';
import { BatteryLayer } from './layers/BatteryLayer.js';
import { EnergyFlowLayer } from './layers/EnergyFlowLayer.js';
import { GridLayer } from './layers/GridLayer.js';
import { ClippingLayer } from './layers/ClippingLayer.js';

export class VisualEngine {
    constructor(containerElement) {
        // Fixed internal resolution
        this.INTERNAL_WIDTH = 1280;
        this.INTERNAL_HEIGHT = 720;

        this.containerElement = containerElement;
        this.app = null;
        this.isInitialized = false;
        this.isDestroyed = false;
        this.layers = {};
        this.initPromise = null;

        // Scene state
        this.sceneState = {
            solarOutput: 0, windOutput: 0, soc: 0, chargeAmount: 0,
            dischargeAmount: 0, gridExport: 0, clipped: 0,
            currentPhase: 'Night Baseline', currentPrice: 0,
            simulationEnded: false, elapsedBlocks: 0, isBessEnabled: false,
        };
        this.prevState = { ...this.sceneState };
        this.rafId = null;
        this.lastTime = performance.now();

        // Bind resize for removal
        this.resizeCanvas = this.resizeCanvas.bind(this);

        // Initialize asynchronously
        this.initPromise = this.init().catch(err => {
            console.error('VisualEngine initialization failed:', err);
        });
    }

    async init() {
        if (this.isDestroyed) return;

        try {
            // Create App instance
            this.app = new PIXI.Application();

            // Initialize Pixi app with WebGL2
            await this.app.init({
                width: this.INTERNAL_WIDTH,
                height: this.INTERNAL_HEIGHT,
                backgroundColor: 0x000000,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                preference: 'webgl2',
            });

            // Abort if destroyed during async init
            if (this.isDestroyed) {
                if (this.app.renderer) {
                    this.app.destroy(true, { children: true, texture: true });
                }
                return;
            }

            // Ensure stage exists
            if (!this.app.stage) {
                this.app.stage = new PIXI.Container();
            }

            // Attach canvas to DOM
            if (this.containerElement && this.app.canvas) {
                this.containerElement.appendChild(this.app.canvas);
            }

            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas);

            // Create all layers
            this.createLayers();

            this.isInitialized = true;
            this.start();
            console.log('VisualEngine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize VisualEngine:', error);
            this.isInitialized = false;
        }
    }

    createLayers() {
        if (!this.app || !this.app.stage) return;
        const stage = this.app.stage;

        try {
            // Refined Hierarchy
            this.layers.background = new BackgroundLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.sky = new SkyLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.clouds = new CloudLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.sun = new SunLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.environment = new EnvironmentLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.solar = new SolarLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.turbine = new TurbineLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.battery = new BatteryLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.energyFlow = new EnergyFlowLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.grid = new GridLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
            this.layers.clipping = new ClippingLayer(stage, this.INTERNAL_WIDTH, this.INTERNAL_HEIGHT);
        } catch (err) {
            console.error('Error creating visual layers:', err);
        }
    }

    resizeCanvas() {
        if (!this.containerElement || !this.app.canvas) return;

        const containerWidth = this.containerElement.clientWidth;
        const containerHeight = this.containerElement.clientHeight;

        const scaleX = containerWidth / this.INTERNAL_WIDTH;
        const scaleY = containerHeight / this.INTERNAL_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        this.app.canvas.style.width = `${this.INTERNAL_WIDTH * scale}px`;
        this.app.canvas.style.height = `${this.INTERNAL_HEIGHT * scale}px`;
    }

    start() {
        if (this.rafId !== null) return;

        const tick = () => {
            if (!this.isInitialized || this.isDestroyed) {
                this.rafId = requestAnimationFrame(tick);
                return;
            }

            const now = performance.now();
            const deltaTime = (now - this.lastTime) / 1000;
            this.lastTime = now;

            this.update(deltaTime);
            this.rafId = requestAnimationFrame(tick);
        };

        this.rafId = requestAnimationFrame(tick);
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    updateState(newSceneState) {
        this.sceneState = { ...newSceneState };
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        this.layers.background.update(this.sceneState, deltaTime);
        this.layers.sky.update(this.sceneState, deltaTime, this.prevState);
        this.layers.clouds.update(this.sceneState, deltaTime);
        this.layers.sun.update(this.sceneState, deltaTime);
        this.layers.environment.update(this.sceneState, deltaTime);
        this.layers.solar.update(this.sceneState, deltaTime);
        this.layers.turbine.update(this.sceneState, deltaTime);
        this.layers.battery.update(this.sceneState, deltaTime);
        this.layers.energyFlow.update(this.sceneState, deltaTime);
        this.layers.grid.update(this.sceneState, deltaTime);
        this.layers.clipping.update(this.sceneState, deltaTime);

        this.prevState = { ...this.sceneState };
    }

    destroy() {
        this.isDestroyed = true;
        this.isInitialized = false;
        this.stop();
        window.removeEventListener('resize', this.resizeCanvas);

        if (this.layers) {
            Object.values(this.layers).forEach(layer => {
                if (layer && typeof layer.destroy === 'function') {
                    layer.destroy();
                }
            });
        }

        if (this.app) {
            try {
                if (this.app.canvas && this.app.canvas.parentNode) {
                    this.app.canvas.parentNode.removeChild(this.app.canvas);
                }
                if (this.app.renderer) {
                    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
                }
            } catch (err) {
                console.warn('Silent error during destruction:', err);
            }
            this.app = null;
        }
    }
}
