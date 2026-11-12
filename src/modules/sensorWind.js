// ============================================
// SENSOR WIND — §5.2 Breath Detection
// Web Audio API + FFT bandpass filtering
// ============================================

import {
    FFT_SIZE,
    WIND_FREQ_LOW,
    WIND_FREQ_HIGH,
    DEADZONE,
    CURVE_EXPONENT,
    WIND_EMA_ALPHA,
    MAX_WIND,
    WIND_MAX_RMS,
} from './constants.js';

let audioContext = null;
let analyser = null;
let sourceNode = null;
let frequencyData = null;
let windBaseline = 0;
let lastWindEma = 0;

// Cached bin indices (computed once from sample rate)
let lowBin = 0;
let highBin = 0;

/**
 * Initialize Web Audio API with AnalyserNode for wind detection.
 * @param {MediaStream} micStream — getUserMedia audio stream
 * @returns {{ audioContext, analyser }}
 */
export function initWindSensor(micStream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.3;

    sourceNode = audioContext.createMediaStreamSource(micStream);
    sourceNode.connect(analyser);

    frequencyData = new Float32Array(analyser.frequencyBinCount);

    // Calculate bin indices for 500–4000 Hz band
    const sampleRate = audioContext.sampleRate;
    const binWidth = sampleRate / FFT_SIZE; // Hz per bin
    lowBin = Math.floor(WIND_FREQ_LOW / binWidth);
    highBin = Math.ceil(WIND_FREQ_HIGH / binWidth);
    highBin = Math.min(highBin, analyser.frequencyBinCount - 1);

    lastWindEma = 0;
    windBaseline = 0;

    return { audioContext, analyser };
}

/**
 * Compute RMS in the 500–4000 Hz band.
 * @returns {number} RMS value in dB-relative scale
 */
function computeBandRMS() {
    if (!analyser || !frequencyData) return 0;

    analyser.getFloatFrequencyData(frequencyData);

    let sumSquares = 0;
    let count = 0;

    for (let i = lowBin; i <= highBin; i++) {
        // Convert from dB to linear power
        const linearPower = Math.pow(10, frequencyData[i] / 20);
        sumSquares += linearPower * linearPower;
        count++;
    }

    if (count === 0) return 0;
    return Math.sqrt(sumSquares / count);
}

/**
 * Set the wind baseline from calibration.
 * Call this after 3 seconds of silence.
 */
export function setWindBaseline(baseline) {
    windBaseline = baseline;
}

/**
 * Capture current RMS for calibration purposes.
 * @returns {number} Current band RMS
 */
export function captureWindRMS() {
    return computeBandRMS();
}

/**
 * Process current audio and return wind target MW.
 * Pipeline: RMS → subtract baseline → deadzone → normalize → curve → EMA → scale
 *
 * @returns {{ windTarget: number, rawWind: number, smoothedWind: number }}
 */
export function processWindFrame() {
    const rms = computeBandRMS();

    // Step 4: Subtract calibration baseline
    let adjusted = rms - windBaseline;
    if (adjusted < 0) adjusted = 0;

    // We need a max reference for normalization.
    // Use a reference max breath RMS from constants
    let normInput = adjusted / WIND_MAX_RMS;
    normInput = Math.min(1, Math.max(0, normInput));

    // Step 5: Apply 5% deadzone
    let intensity = normInput;
    if (intensity < DEADZONE) {
        intensity = 0;
    }

    // Step 6: Normalize remaining range
    let normalized = 0;
    if (intensity > 0) {
        normalized = (intensity - DEADZONE) / (1 - DEADZONE);
        normalized = Math.min(1, Math.max(0, normalized));
    }

    // Step 7: Apply nonlinear curve exponent 0.6
    const curved = Math.pow(normalized, CURVE_EXPONENT);

    // Step 8: EMA smoothing alpha = 0.2
    lastWindEma = WIND_EMA_ALPHA * curved + (1 - WIND_EMA_ALPHA) * lastWindEma;

    // Step 9: Multiply to get wind target
    const windTarget = lastWindEma * MAX_WIND;

    return {
        windTarget,
        rawWind: normInput,
        smoothedWind: lastWindEma,
    };
}

/**
 * Reset EMA state
 */
export function resetWindEma() {
    lastWindEma = 0;
}

/**
 * Destroy audio resources to avoid memory leaks.
 */
export function destroyWindSensor() {
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }
    analyser = null;
    frequencyData = null;
    lastWindEma = 0;
    windBaseline = 0;
}
