// ============================================
// EVALUATION SCREEN — State: EVALUATION
// Final results, ratings, and price history
// ============================================

import React from 'react';
import { BESS_COST, TOTAL_BLOCKS, blockToTime } from '../modules/constants.js';

function getRating(revenue, targetProfit) {
    const ratio = revenue / targetProfit;
    if (ratio >= 1.2) return { emoji: '🏆', label: 'Legendary Plant Head', color: '#2e7d32' };
    if (ratio >= 1.0) return { emoji: '⭐', label: 'Target Achieved!', color: '#43a047' };
    if (ratio >= 0.75) return { emoji: '👍', label: 'Good Effort', color: '#f9a825' };
    if (ratio >= 0.5) return { emoji: '📈', label: 'Room to Grow', color: '#ff9800' };
    return { emoji: '💪', label: 'Keep Practicing', color: '#c62828' };
}

export default function EvaluationScreen({ state, onRestart }) {
    const targetProfit = state.targetProfit || 1;
    const bessFee = state.isBessEnabled ? BESS_COST : 0;
    const finalRevenue = state.revenue - bessFee;
    const rating = getRating(finalRevenue, targetProfit);
    const targetPct = Math.min(150, (finalRevenue / targetProfit) * 100);
    const hitTarget = finalRevenue >= targetProfit;

    return (
        <div className="screen evaluation-screen">
            <div className="screen-content">
                <div className="eval-emoji">{rating.emoji}</div>
                <h2 className="eval-title" style={{ color: rating.color }}>
                    {rating.label}
                </h2>
                <p className="eval-subtitle">
                    {hitTarget
                        ? `You exceeded the target by ₹${Math.round(finalRevenue - targetProfit).toLocaleString('en-IN')}!`
                        : `You were ₹${Math.round(targetProfit - finalRevenue).toLocaleString('en-IN')} short of the target.`}
                </p>

                {/* Stats grid */}
                <div className="eval-stats-grid">
                    <div className="eval-stat-card">
                        <div className="eval-stat-label">Net Profit</div>
                        <div className="eval-stat-value" style={{ color: rating.color }}>
                            ₹{Math.round(finalRevenue).toLocaleString('en-IN')}
                        </div>
                        {state.isBessEnabled && (
                            <div className="eval-stat-sub">
                                (After ₹{BESS_COST.toLocaleString('en-IN')} BESS Fee)
                            </div>
                        )}
                    </div>
                    <div className="eval-stat-card">
                        <div className="eval-stat-label">Target</div>
                        <div className="eval-stat-value">
                            ₹{targetProfit.toLocaleString('en-IN')}
                        </div>
                    </div>
                    <div className="eval-stat-card">
                        <div className="eval-stat-label">Achievement</div>
                        <div className="eval-stat-value" style={{ color: rating.color }}>
                            {targetPct.toFixed(1)}%
                        </div>
                    </div>
                    <div className="eval-stat-card">
                        <div className="eval-stat-label">Game Duration</div>
                        <div className="eval-stat-value">{state.gameDurationSeconds}s</div>
                        <div className="eval-stat-sub">
                            ({state.timeScaleMinutes} min/sec • 24 simulated hours)
                        </div>
                    </div>
                </div>

                {/* Revenue progress bar */}
                <div className="eval-progress-container">
                    <div className="eval-progress-bar">
                        <div
                            className="eval-progress-fill"
                            style={{
                                width: `${Math.min(100, targetPct)}%`,
                                background: hitTarget
                                    ? 'linear-gradient(90deg, #2e7d32, #66bb6a)'
                                    : 'linear-gradient(90deg, #f9a825, #ffd54f)',
                            }}
                        />
                        <div className="eval-target-marker" style={{ left: '100%' }}>
                            Target
                        </div>
                    </div>
                </div>

                {/* Price history chart — 96 bars */}
                <div className="eval-price-history">
                    <h3>📊 Market Price Timeline</h3>
                    <div className="price-timeline">
                        {state.prices.map((price, i) => {
                            const maxP = 11000;
                            const heightPct = Math.max(5, (price / maxP) * 100);
                            let bgColor;
                            if (price >= 9000) bgColor = '#2e7d32';
                            else if (price >= 4000) bgColor = '#f9a825';
                            else bgColor = '#ef5350';
                            return (
                                <div
                                    key={i}
                                    className="price-tick"
                                    style={{
                                        height: `${heightPct}%`,
                                        backgroundColor: bgColor,
                                    }}
                                    title={`${blockToTime(i)}: ₹${price}/MWh`}
                                />
                            );
                        })}
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-large"
                    id="restart-btn"
                    onClick={onRestart}
                >
                    🔄 Play Again
                </button>
            </div>
        </div>
    );
}
