// ============================================
// PERMISSION SCREEN — State: PERMISSION_GATE
// §2: Camera + Microphone access, no fallbacks
// ============================================

import React, { useState, useCallback } from 'react';

export default function PermissionScreen({ onPermissionsGranted }) {
    const [error, setError] = useState(null);
    const [requesting, setRequesting] = useState(false);

    const requestPermissions = useCallback(async () => {
        setRequesting(true);
        setError(null);

        try {
            // Request both camera and mic (§2)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: true,
            });

            // Extract individual streams
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();

            // Create separate streams for camera and mic
            const cameraStream = new MediaStream(videoTracks);
            const micStream = new MediaStream(audioTracks);

            onPermissionsGranted(cameraStream, micStream, stream);
        } catch (err) {
            let message = 'Permission denied. ';
            if (err.name === 'NotAllowedError') {
                message += 'Please allow camera and microphone access in your browser settings, then try again.';
            } else if (err.name === 'NotFoundError') {
                message += 'No camera or microphone found on your device.';
            } else if (err.name === 'NotReadableError') {
                message += 'Camera or microphone is already in use by another application.';
            } else {
                message += err.message || 'An unknown error occurred.';
            }
            setError(message);
        } finally {
            setRequesting(false);
        }
    }, [onPermissionsGranted]);

    return (
        <div className="screen permission-screen">
            <div className="screen-content">
                <div className="permission-icons">
                    <span className="perm-icon">📷</span>
                    <span className="perm-plus">+</span>
                    <span className="perm-icon">🎤</span>
                </div>

                <h2 className="screen-title">Sensor Access Required</h2>
                <p className="screen-subtitle">
                    This game uses your <strong>camera</strong> to detect smiles (solar power) and your{' '}
                    <strong>microphone</strong> to detect breath (wind power).
                </p>

                <div className="permission-notice">
                    <p>
                        ⚠️ Both camera and microphone access are <strong>mandatory</strong>.
                        <br />
                        No fallback controls are available. No keyboard alternative exists.
                    </p>
                </div>

                {error && (
                    <div className="permission-error">
                        <span className="error-icon">✕</span>
                        <p>{error}</p>
                    </div>
                )}

                <button
                    className="btn btn-primary btn-large"
                    id="grant-permission-btn"
                    onClick={requestPermissions}
                    disabled={requesting}
                >
                    {requesting ? 'Requesting Access...' : 'Grant Camera & Mic Access'}
                </button>

                <p className="permission-hint">
                    Your camera feed stays local — nothing is recorded or transmitted.
                </p>
            </div>
        </div>
    );
}
