// ============================================
// INTRO SCREEN — State: INTRO
// ============================================

import React from 'react';
import {
    MAX_SOLAR,
    MAX_WIND,
    GRID_CAP,
    TOTAL_BLOCKS,
    HOURS_PER_BLOCK,
} from '../modules/constants.js';

export default function IntroScreen({ onNext }) {
    const totalSimHours = TOTAL_BLOCKS * HOURS_PER_BLOCK; // 24

    return (
        <div className="screen intro-screen">
            <div className="screen-content">
                <div className="intro-badge">Renewable Energy Simulator</div>

                <h1 className="intro-title">
                    Renewable Plant Head{' '}
                    <span className="intro-title-accent">Simulator</span>
                </h1>

                <p className="intro-subtitle">
                    You are the head of a {MAX_SOLAR + MAX_WIND} MW renewable energy plant.
                    <br />
                    Maximize revenue by managing solar, wind, and battery storage
                    over {totalSimHours} simulated hours.
                </p>

                {/* Spec cards */}
                <div className="intro-specs">
                    <div className="spec-card" id="spec-solar">
                        <div className="spec-icon">☀️</div>
                        <div className="spec-label">Solar Capacity</div>
                        <div className="spec-value">{MAX_SOLAR} MW</div>
                        <div className="spec-hint">Smile to generate</div>
                    </div>

                    <div className="spec-card" id="spec-wind">
                        <div className="spec-icon">💨</div>
                        <div className="spec-label">Wind Capacity</div>
                        <div className="spec-value">{MAX_WIND} MW</div>
                        <div className="spec-hint">Blow to generate</div>
                    </div>

                    <div className="spec-card" id="spec-grid">
                        <div className="spec-icon">⚡</div>
                        <div className="spec-label">Grid Cap</div>
                        <div className="spec-value">{GRID_CAP} MW</div>
                        <div className="spec-hint">Max export limit</div>
                    </div>

                    <div className="spec-card" id="spec-sim">
                        <div className="spec-icon">🕐</div>
                        <div className="spec-label">Simulation</div>
                        <div className="spec-value">{totalSimHours}h Day</div>
                        <div className="spec-hint">{TOTAL_BLOCKS} time blocks</div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="intro-how">
                    <h3>🌿 How It Works</h3>
                    <div className="how-steps">
                        <div className="how-step">
                            <span className="step-num">1</span>
                            <span>
                                <strong>Smile</strong> at your camera to generate solar power
                            </span>
                        </div>
                        <div className="how-step">
                            <span className="step-num">2</span>
                            <span>
                                <strong>Blow</strong> into your microphone to generate wind power
                            </span>
                        </div>
                        <div className="how-step">
                            <span className="step-num">3</span>
                            <span>
                                <strong>Manage</strong> the battery to store cheap energy and sell at peak prices
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-large"
                    id="intro-start-btn"
                    onClick={onNext}
                >
                    Begin Setup →
                </button>

                <p className="intro-footer">
                    Requires camera & microphone access • Desktop only
                </p>
            </div>
        </div>
    );
}
