// ============================================
// SENSOR SOLAR — §5.1 Smile Detection
// MediaPipe Face Landmarker + blendshapes
// ============================================

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import {
    DEADZONE,
    CURVE_EXPONENT,
    SOLAR_EMA_ALPHA,
    MAX_SOLAR,
} from './constants.js';

let faceLandmarker = null;
let lastSmileEma = 0;

/**
 * Initialize MediaPipe Face Landmarker with blendshapes enabled.
 * Returns the FaceLandmarker instance.
 */
export async function initFaceLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
    });

    lastSmileEma = 0;
    return faceLandmarker;
}

/**
 * Process a video frame and return solar target MW.
 * Pipeline: blendshapes → average → deadzone → normalize → curve → EMA → scale
 *
 * @param {HTMLVideoElement} videoEl
 * @param {number} timestampMs — performance.now() timestamp
 * @returns {{ solarTarget: number, rawSmile: number, smoothedSmile: number }}
 */
export function processSolarFrame(videoEl, timestampMs) {
    if (!faceLandmarker) {
        return { solarTarget: 0, rawSmile: 0, smoothedSmile: 0 };
    }

    const result = faceLandmarker.detectForVideo(videoEl, timestampMs);

    if (
        !result.faceBlendshapes ||
        result.faceBlendshapes.length === 0 ||
        !result.faceBlendshapes[0].categories
    ) {
        return { solarTarget: 0, rawSmile: 0, smoothedSmile: lastSmileEma };
    }

    const blendshapes = result.faceBlendshapes[0].categories;

    // Step 1: Extract smileLeft and smileRight
    const smileLeft = blendshapes.find(b => b.categoryName === 'mouthSmileLeft');
    const smileRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight');

    const left = smileLeft ? smileLeft.score : 0;
    const right = smileRight ? smileRight.score : 0;

    // Step 2: Average intensity
    const smileIntensity = (left + right) / 2;

    // Step 3: Apply deadzone (5%)
    let intensity = smileIntensity;
    if (intensity < DEADZONE) {
        intensity = 0;
    }

    // Step 4: Normalize remaining range
    let normalized = 0;
    if (intensity > 0) {
        normalized = (intensity - DEADZONE) / (1 - DEADZONE);
        normalized = Math.min(1, Math.max(0, normalized));
    }

    // Step 5: Apply nonlinear curve
    const curved = Math.pow(normalized, CURVE_EXPONENT);

    // Step 6: Apply EMA smoothing (alpha = 0.25)
    lastSmileEma = SOLAR_EMA_ALPHA * curved + (1 - SOLAR_EMA_ALPHA) * lastSmileEma;

    // Step 7: Multiply to get solar target
    const solarTarget = lastSmileEma * MAX_SOLAR;

    return {
        solarTarget,
        rawSmile: smileIntensity,
        smoothedSmile: lastSmileEma,
    };
}

/**
 * Reset EMA state (for calibration reset)
 */
export function resetSolarEma() {
    lastSmileEma = 0;
}

/**
 * Destroy Face Landmarker to avoid memory leaks.
 */
export function destroyFaceLandmarker() {
    if (faceLandmarker) {
        faceLandmarker.close();
        faceLandmarker = null;
    }
    lastSmileEma = 0;
}
