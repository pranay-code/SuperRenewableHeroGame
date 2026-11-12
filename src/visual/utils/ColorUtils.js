// ============================================
// COLOR UTILITIES
// Phase-based color interpolation and helpers
// Muted, professional palette
// ============================================

/**
 * Linear interpolation between two values
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return { r, g, b };
}

/**
 * Convert RGB object to hex color
 */
function rgbToHex(r, g, b) {
    return (r << 16) | (g << 8) | b;
}

/**
 * Interpolate between two hex colors
 */
export function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(lerp(c1.r, c2.r, t));
    const g = Math.round(lerp(c1.g, c2.g, t));
    const b = Math.round(lerp(c1.b, c2.b, t));

    return rgbToHex(r, g, b);
}

/**
 * Phase color schemes — muted, cohesive tones
 * Reduced saturation from previous neon values
 */
const PHASE_COLORS = {
    'Night Baseline': { top: 0x0c1426, bottom: 0x1a2d4d },
    'Morning Ramp': { top: 0xc45a2a, bottom: 0xd4873a },   // muted warm orange
    'Solar Glut': { top: 0x6ba3c7, bottom: 0x3d6f94 },   // muted sky blue
    'Evening Peak': { top: 0xb84030, bottom: 0x6b2020 },   // muted sunset
    'Night Drop': { top: 0x141a3a, bottom: 0x0a0e2e },   // deep navy
};

/**
 * Get colors for a phase
 */
export function getPhaseColors(phaseName) {
    return PHASE_COLORS[phaseName] || PHASE_COLORS['Night Baseline'];
}
