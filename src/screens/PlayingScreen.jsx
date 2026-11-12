// ============================================
// PLAYING SCREEN — State: PLAYING
// Premium DOM-based dashboard
// 15-minute block time architecture
// ============================================

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameLoops } from '../hooks/useGameLoops.js';
import {
    BESS_CAPACITY,
    MAX_SOLAR,
    MAX_WIND,
    GRID_CAP,
    MARKET_PHASES,
    TOTAL_BLOCKS,
    BLOCKS_PER_HOUR,
    blockToTime,
    blockToHour,
} from '../modules/constants.js';
import { VisualEngine } from '../visual/VisualEngine.js';

export default function PlayingScreen({
    stateRef,
    updateState,
    state,
    setBatteryMode,
    videoRef,
    cameraStream,
    setPaused,
    onGameEnd,
}) {
    const visualCanvasRef = useRef(null);
    const visualEngineRef = useRef(null);

    const { startLoops, stopLoops } = useGameLoops({
        stateRef,
        updateState,
        videoRef,
        onGameEnd,
    });

    // Ref callback: attach stream as soon as hidden video element mounts
    const hiddenVideoRefCallback = useCallback(
        (el) => {
            videoRef.current = el;
            if (el && cameraStream) {
                el.srcObject = cameraStream;
                el.play().catch(() => { });
            }
        },
        [cameraStream, videoRef]
    );

    // --- Computed Values (Move to top to avoid TDZ) ---
    const targetProfit = state.targetProfit || 0;
    const progressPct = targetProfit > 0
        ? Math.min(100, (state.revenue / targetProfit) * 100)
        : 0;

    // Convert blockIndex to display time
    const timeDisplay = blockToTime(state.blockIndex);
    const currentHour = blockToHour(state.blockIndex);

    // Get current phase label
    const currentPhase = MARKET_PHASES.find(
        (p) => currentHour >= p.start && currentHour < p.end
    );
    const phaseLabel = currentPhase ? currentPhase.label : 'Night';

    // Initialize VisualEngine
    useEffect(() => {
        if (visualCanvasRef.current && !visualEngineRef.current) {
            try {
                visualEngineRef.current = new VisualEngine(visualCanvasRef.current);
            } catch (err) {
                console.error('Failed to create VisualEngine:', err);
            }
        }

        return () => {
            if (visualEngineRef.current) {
                visualEngineRef.current.destroy();
                visualEngineRef.current = null;
            }
        };
    }, []);

    // Update VisualEngine with scene state
    useEffect(() => {
        if (visualEngineRef.current?.isInitialized) {
            try {
                const sceneState = {
                    solarOutput: state.solarOutput || 0,
                    windOutput: state.windOutput || 0,
                    soc: state.soc || 0,
                    chargeAmount: state.chargeAmount || 0,
                    dischargeAmount: state.dischargeAmount || 0,
                    gridExport: state.gridExport || 0,
                    clipped: state.clipped || 0,
                    currentPhase: phaseLabel,
                    currentPrice: state.currentPrice || 0,
                    simulationEnded: false,
                    elapsedBlocks: state.blockIndex || 0,
                    isBessEnabled: state.isBessEnabled,
                };
                visualEngineRef.current.updateState(sceneState);
            } catch (err) {
                console.error('Failed to update VisualEngine state:', err);
            }
        }
    });

    useEffect(() => {
        startLoops();
        return () => {
            stopLoops();
        };
    }, [startLoops, stopLoops]);

    return (
        <div className="playing-screen">
            {/* === VISUAL CANVAS (PixiJS) === */}
            <div
                ref={visualCanvasRef}
                className="visual-canvas-container"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    backgroundColor: '#000',
                }}
            />


            {/* === TOP CINEMATIC HUD === */}
            <div className="cinematic-hud-top glass-panel">
                <div className="hud-section">
                    <div className="hud-label">Sim Time</div>
                    <div className="hud-value">{timeDisplay}</div>
                    <div className="hud-label" style={{ marginTop: '4px' }}>{state.timeRemaining}s rem</div>
                </div>

                <div className="hud-section">
                    <div className="hud-label">Market Phase</div>
                    <div className="hud-value">{phaseLabel}</div>
                </div>

                <div className="hud-section hud-revenue-center">
                    <div className="hud-label">Accumulated Revenue</div>
                    <div className="hud-value">
                        ₹{Math.round(state.revenue).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="hud-section" style={{ width: '150px' }}>
                    <div className="hud-label">Target Progress</div>
                    <div className="soc-track" style={{ marginTop: '8px' }}>
                        <div
                            className="soc-fill"
                            style={{
                                width: `${progressPct}%`,
                                backgroundColor: progressPct >= 100 ? 'var(--color-storage)' : 'var(--color-solar)'
                            }}
                        />
                    </div>
                    <div className="hud-label" style={{ textAlign: 'right', marginTop: '4px' }}>{progressPct.toFixed(1)}%</div>
                </div>

                <div className="hud-section">
                    <button
                        className={`pill-button ${state.isPaused ? 'active' : ''}`}
                        onClick={() => setPaused(!state.isPaused)}
                    >
                        {state.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
                    </button>
                </div>
            </div>

            {/* === CAMERA PREVIEW (CINEMATIC WIDGET) === */}
            <div className="camera-preview-mini cinematic-widget glass-panel">
                <video
                    ref={(el) => {
                        if (el && cameraStream) {
                            el.srcObject = cameraStream;
                            el.play().catch(() => { });
                        }
                    }}
                    autoPlay
                    playsInline
                    muted
                />
                {state.isPaused && (
                    <div className="camera-paused-overlay" style={{ fontSize: '10px' }}>PAUSED</div>
                )}
            </div>

            {/* === INTENSITY WIDGETS (CINEMATIC) === */}
            <div className="intensity-widgets cinematic-widget">
                <div className="intensity-bar glass-panel">
                    <div className="intensity-fill" style={{ height: `${(state.solarOutput / MAX_SOLAR) * 100}%`, background: 'var(--color-solar)' }} />
                </div>
                <div className="intensity-bar glass-panel">
                    <div className="intensity-fill" style={{ height: `${(state.windOutput / MAX_WIND) * 100}%`, background: 'var(--color-wind)' }} />
                </div>
                <div className="intensity-bar glass-panel">
                    <div className="intensity-fill" style={{ height: `${(state.gridExport / GRID_CAP) * 100}%`, background: 'var(--color-grid)' }} />
                </div>
            </div>

            {/* === RIGHT COMPACT GRID PANEL === */}
            <div className="compact-grid-panel glass-panel">
                <div className="grid-stat">
                    <div className="hud-label">Grid Export</div>
                    <div className={`grid-stat-value ${state.gridExport > GRID_CAP * 0.9 ? 'high-power' : ''}`}>
                        {state.gridExport.toFixed(1)} <span style={{ fontSize: '14px' }}>MW</span>
                    </div>
                </div>
                <div className="grid-stat">
                    <div className="hud-label">Capacity Limit</div>
                    <div className="hud-value" style={{ opacity: 0.5 }}>{GRID_CAP} MW</div>
                </div>
                {state.clipped > 0.1 && (
                    <div className="grid-stat">
                        <div className="hud-label" style={{ color: 'var(--color-alert)' }}>⚠️ Clipping</div>
                        <div className="grid-stat-value clipping">
                            -{state.clipped.toFixed(1)} <span style={{ fontSize: '14px' }}>MW</span>
                        </div>
                    </div>
                )}
            </div>

            {/* === MARKET PRICE WIDGET === */}
            <div className="market-price-widget glass-panel cinematic-widget">
                <div className="hud-label">Market Price</div>
                <div className="hud-value" style={{ color: 'var(--color-solar)' }}>
                    ₹{state.currentPrice.toLocaleString('en-IN')}
                </div>
                <div className="price-mini-bars">
                    {state.prices.map((p, i) => (
                        <div
                            key={i}
                            className={`mini-bar ${i === state.blockIndex ? 'active' : ''}`}
                            style={{
                                height: `${(p / 11000) * 100}%`,
                                opacity: i <= state.blockIndex ? 1 : 0.2
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* === BOTTOM BATTERY BAR === */}
            {state.isBessEnabled && (
                <div className="cinematic-battery-bar glass-panel">
                    <button
                        className={`pill-button ${state.batteryMode === 'charge' ? 'active' : ''}`}
                        onClick={() => setBatteryMode('charge')}
                        disabled={state.soc >= BESS_CAPACITY}
                    >
                        CHARGE
                    </button>

                    <div className="soc-progress-container">
                        <div className="hud-label">Battery SOC: {state.soc.toFixed(1)} MWh</div>
                        <div className="soc-track">
                            <div
                                className="soc-fill"
                                style={{ width: `${(state.soc / BESS_CAPACITY) * 100}%` }}
                            />
                        </div>
                    </div>

                    <button
                        className={`pill-button ${state.batteryMode === 'discharge' ? 'active' : ''}`}
                        onClick={() => setBatteryMode('discharge')}
                        disabled={state.soc <= 0}
                    >
                        DISCHARGE
                    </button>

                    <button
                        className={`pill-button ${state.batteryMode === 'idle' ? 'active' : ''}`}
                        onClick={() => setBatteryMode('idle')}
                    >
                        IDLE
                    </button>
                </div>
            )}

            {/* Hidden video for sensor processing */}
            <video
                ref={hiddenVideoRefCallback}
                className="hidden-video"
                autoPlay
                playsInline
                muted
            />
        </div>
    );
}
