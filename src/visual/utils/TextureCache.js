import * as PIXI from 'pixi.js';

export function createSunGlowTexture(radius) {
    const canvas = document.createElement('canvas');
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, 'rgba(255, 221, 68, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 221, 68, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 221, 68, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, radius * 2, radius * 2);

    return PIXI.Texture.from(canvas);
}
