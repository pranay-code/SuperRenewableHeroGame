// ============================================
// CALIBRATION SCREEN — State: CALIBRATION
// §11: 3s baseline capture with live previews
// ============================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initFaceLandmarker, processSolarFrame, resetSolarEma } from '../modules/sensorSolar.js';
import {
    initWindSensor,
    captureWindRMS,
    setWindBaseline,
    processWindFrame,
    resetWindEma,
} from '../modules/sensorWind.js';

const CALIBRATION_DURATION = 3000; // 3 seconds

export default function CalibrationScreen({
    cameraStream,
    micStream,
    onCalibrationComplete,
}) {
    const videoRef = useRef(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'calibrating' | 'done'
    const [progress, setProgress] = useState(0);
    const [solarPreview, setSolarPreview] = useState(0);
    const [windPreview, setWindPreview] = useState(0);
    const [micLevel, setMicLevel] = useState(0);
    const previewIntervalRef = useRef(null);
    const calibrationRmsValues = useRef([]);
    const mountedRef = useRef(true);

    const startCalibration = useCallback(() => {
        const startTime = performance.now();
        calibrationRmsValues.current = [];

        // Reset EMAs
        resetSolarEma();
        resetWindEma();

        previewIntervalRef.current = setInterval(() => {
            if (!mountedRef.current) return;

            const elapsed = performance.now() - startTime;
            const pct = Math.min(100, (elapsed / CALIBRATION_DURATION) * 100);
            setProgress(pct);

            // Capture wind RMS for baseline
            const rms = captureWindRMS();
            calibrationRmsValues.current.push(rms);
            setMicLevel(Math.min(1, rms * 10));

            // Live sensor previews
            if (videoRef.current && videoRef.current.readyState >= 2) {
                const solarResult = processSolarFrame(videoRef.current, performance.now());
                setSolarPreview(solarResult.solarTarget);
            }

            const windResult = processWindFrame();
            setWindPreview(windResult.windTarget);

            // Calibration complete
            if (elapsed >= CALIBRATION_DURATION) {
                clearInterval(previewIntervalRef.current);
                previewIntervalRef.current = null;

                // Compute baseline as average RMS during calibration
                const values = calibrationRmsValues.current;
                const avgBaseline =
                    values.length > 0
                        ? values.reduce((sum, v) => sum + v, 0) / values.length
                        : 0;
                setWindBaseline(avgBaseline);

                // Reset EMAs for clean game start
                resetSolarEma();
                resetWindEma();

                setStatus('done');
                setTimeout(() => {
                    if (mountedRef.current) {
                        onCalibrationComplete();
                    }
                }, 600);
            }
        }, 100);
    }, [onCalibrationComplete]);

    // Initialize sensors
    useEffect(() => {
        mountedRef.current = true;
        let cancelled = false;

        async function init() {
            try {
                // Attach camera to video element
                if (videoRef.current && cameraStream) {
                    videoRef.current.srcObject = cameraStream;
                    await videoRef.current.play();
                }

                // Init MediaPipe Face Landmarker
                setStatus('loading');
                await initFaceLandmarker();

                // Init Wind Sensor
                if (micStream) {
                    initWindSensor(micStream);
                }

                if (!cancelled) {
                    setStatus('calibrating');
                    startCalibration();
                }
            } catch (err) {
                console.error('Calibration init error:', err);
            }
        }

        init();

        return () => {
            cancelled = true;
            mountedRef.current = false;
            if (previewIntervalRef.current) {
                clearInterval(previewIntervalRef.current);
            }
        };
    }, [cameraStream, micStream, startCalibration]);

    return (
        <div className="screen calibration-screen">
            <div className="screen-content">
                <h2 className="screen-title">
                    {status === 'loading' ? '🤖 Loading AI Model...' : '📡 Sensor Calibration'}
                </h2>
                <p className="screen-subtitle">
                    {status === 'loading' && 'Initializing MediaPipe face detection. This may take a moment...'}
                    {status === 'calibrating' && 'Keep a neutral face and remain silent for 3 seconds.'}
                    {status === 'done' && '✅ Calibration complete! Starting game...'}
                </p>

                <div className="calibration-layout">
                    {/* Live camera preview (§11) */}
                    <div className="calibration-camera">
                        <video
                            ref={videoRef}
                            className="calibration-video"
                            autoPlay
                            playsInline
                            muted
                        />
                        <div className="camera-label">Live Camera Feed</div>
                    </div>

                    {/* Live sensor previews (§11) */}
                    <div className="calibration-sensors">
                        {/* Progress bar */}
                        <div className="calibration-progress-container">
                            <div className="calibration-progress-label">
                                {status === 'loading' ? '⏳ Loading model...' : `Calibrating: ${Math.round(progress)}%`}
                            </div>
                            <div className="calibration-progress-bar">
                                <div
                                    className="calibration-progress-fill"
                                    style={{ width: status === 'loading' ? '0%' : `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Mic level bar (§11) */}
                        <div className="sensor-preview">
                            <div className="sensor-preview-label">🎤 Mic Level</div>
                            <div className="sensor-preview-bar">
                                <div
                                    className="sensor-preview-fill mic-fill"
                                    style={{ width: `${micLevel * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Solar MW preview (§11) */}
                        <div className="sensor-preview">
                            <div className="sensor-preview-label">☀️ Solar Preview</div>
                            <div className="sensor-preview-bar">
                                <div
                                    className="sensor-preview-fill solar-fill"
                                    style={{ width: `${(solarPreview / 80) * 100}%` }}
                                />
                            </div>
                            <div className="sensor-preview-value">{solarPreview.toFixed(1)} MW</div>
                        </div>

                        {/* Wind MW preview (§11) */}
                        <div className="sensor-preview">
                            <div className="sensor-preview-label">💨 Wind Preview</div>
                            <div className="sensor-preview-bar">
                                <div
                                    className="sensor-preview-fill wind-fill"
                                    style={{ width: `${(windPreview / 60) * 100}%` }}
                                />
                            </div>
                            <div className="sensor-preview-value">{windPreview.toFixed(1)} MW</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
