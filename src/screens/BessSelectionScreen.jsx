// ============================================
// STRATEGY SELECTION SCREEN — State: BESS_SELECTION
// Time Scale + BESS selection (Option A: combined)
// ============================================

import React from 'react';
import {
    BESS_CAPACITY,
    BESS_RATE_PER_HOUR,
    BESS_COST,
    TIME_SCALE_OPTIONS,
    computeGameDuration,
} from '../modules/constants.js';

export default function BessSelectionScreen({ state, setBessEnabled, setTimeScale, onNext }) {
    const selectedOption = TIME_SCALE_OPTIONS.find(
        o => o.minutes === state.timeScaleMinutes
    ) || TIME_SCALE_OPTIONS[0];

    return (
        <div className="screen bess-screen">
            <div className="screen-content">
                <h2 className="screen-title">Strategy Configuration</h2>
                <p className="screen-subtitle">
                    Configure simulation speed and energy storage before starting.
                </p>

                {/* === TIME SCALE SELECTION === */}
                <div className="config-section">
                    <div className="config-section-header">
                        <span className="config-section-icon">⏱️</span>
                        <h3 className="config-section-title">Simulation Speed</h3>
                    </div>
                    <p className="config-section-desc">
                        Choose what 1 real-world second represents. Faster = harder.
                    </p>

                    <div className="time-scale-options">
                        {TIME_SCALE_OPTIONS.map((option) => {
                            const isSelected = option.minutes === state.timeScaleMinutes;
                            const duration = computeGameDuration(option.blocksPerSecond);
                            return (
                                <div
                                    key={option.minutes}
                                    className={`time-scale-card ${isSelected ? 'active' : ''}`}
                                    onClick={() => setTimeScale(option.minutes)}
                                >
                                    <div className="time-scale-emoji">{option.emoji}</div>
                                    <div className="time-scale-label">{option.label}</div>
                                    <div className="time-scale-difficulty">{option.difficulty}</div>
                                    <div className="time-scale-duration">{duration}s game</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="time-scale-summary">
                        Selected: <strong>{selectedOption.emoji} {selectedOption.difficulty}</strong>
                        {' — '}Game lasts <strong>{computeGameDuration(selectedOption.blocksPerSecond)} seconds</strong>
                        {' '}({selectedOption.label})
                    </div>
                </div>

                {/* === BESS SELECTION === */}
                <div className="config-section">
                    <div className="config-section-header">
                        <span className="config-section-icon">🔋</span>
                        <h3 className="config-section-title">Battery Storage</h3>
                    </div>
                    <p className="config-section-desc">
                        Choose whether to integrate a Battery Energy Storage System (BESS).
                        <br />
                        <span className="bess-note">
                            💡 <strong>Tip:</strong> If you are playing for the first time, first try without battery.
                        </span>
                    </p>

                    <div className="bess-options">
                        <div
                            className={`bess-option-card ${!state.isBessEnabled ? 'active' : ''}`}
                            onClick={() => setBessEnabled(false)}
                        >
                            <div className="option-header">
                                <span className="option-icon">🌾</span>
                                <h3 className="option-name">Basic Solution</h3>
                            </div>
                            <div className="option-cost">Cost: ₹0</div>
                            <ul className="option-details">
                                <li>Export power directly to grid</li>
                                <li>No arbitrage capability</li>
                                <li>High risk of clipping</li>
                                <li>Simpler management</li>
                            </ul>
                        </div>

                        <div
                            className={`bess-option-card ${state.isBessEnabled ? 'active' : ''}`}
                            onClick={() => setBessEnabled(true)}
                        >
                            <div className="option-header">
                                <span className="option-icon">⚡</span>
                                <h3 className="option-name">BESS Advanced</h3>
                            </div>
                            <div className="option-cost">Cost: ₹{BESS_COST.toLocaleString('en-IN')} (Fixed)</div>
                            <ul className="option-details">
                                <li>{BESS_CAPACITY} MWh Storage Capacity</li>
                                <li>{BESS_RATE_PER_HOUR} MW/hr Charge/Discharge</li>
                                <li>Store low-price energy</li>
                                <li>Sell during peak hours</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {state.isBessEnabled && (
                    <div className="bess-strategy">
                        <h3>💡 Strategy Tips</h3>
                        <ul>
                            <li>
                                <strong style={{ color: 'var(--grid)' }}>Charge</strong> when prices are low (Solar Glut: ₹1,500–2,500)
                            </li>
                            <li>
                                <strong style={{ color: 'var(--danger)' }}>Discharge</strong> when prices are high (Evening Peak: ₹9,000–11,000)
                            </li>
                            <li>Battery absorbs power <strong>before</strong> grid export</li>
                            <li>Battery supplements grid export <strong>after</strong> generation cap</li>
                        </ul>
                    </div>
                )}

                <button
                    className="btn btn-primary btn-large"
                    id="bess-continue-btn"
                    onClick={onNext}
                >
                    {state.isBessEnabled ? 'Select BESS & Continue →' : 'Select Basic & Continue →'}
                </button>
            </div>
        </div>
    );
}
