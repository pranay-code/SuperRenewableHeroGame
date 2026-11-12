// ============================================
// MOBILE BLOCK SCREEN — No mobile devices (§2)
// ============================================

import React from 'react';

export default function MobileBlockScreen() {
    return (
        <div className="screen mobile-block-screen">
            <div className="screen-content">
                <div className="mobile-block-icon">🖥️</div>

                <h2 className="screen-title">Desktop Only</h2>
                <p className="screen-subtitle">
                    This simulator requires a desktop or laptop computer
                    with a camera and microphone.
                </p>

                <div className="mobile-block-reasons">
                    <div className="block-reason">
                        <span>📷</span>
                        <span>Camera needed for smile detection (solar power)</span>
                    </div>
                    <div className="block-reason">
                        <span>🎤</span>
                        <span>Microphone needed for breath detection (wind power)</span>
                    </div>
                    <div className="block-reason">
                        <span>🖥️</span>
                        <span>Full dashboard requires a larger screen</span>
                    </div>
                </div>

                <p className="mobile-block-hint">
                    Please open this page on a desktop computer with Chrome or Firefox.
                </p>
            </div>
        </div>
    );
}
