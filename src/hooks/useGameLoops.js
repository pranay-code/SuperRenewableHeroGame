// ============================================
// useGameLoops — Block-Based Dual-Loop Architecture
// 15-minute block time system with sub-interval sensor averaging
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import {
    SIM_TICK_MS,
    MARKET_TICK_MS,
    TOTAL_BLOCKS,
    HOURS_PER_BLOCK,
    computeSolarRampPerRealSec,
    computeWindRampPerRealSec,
    computeBessRatePerRealSec,
} from '../modules/constants.js';
import { simulationTick } from '../modules/simulation.js';
import { processSolarFrame } from '../modules/sensorSolar.js';
import { processWindFrame } from '../modules/sensorWind.js';

/**
 * Compute time-weighted average of gridExport for a sub-interval.
 * Samples are { time, gridExport } objects from the sim loop.
 */
function computeSubIntervalAverage(samples, startTime, endTime) {
    if (samples.length === 0) return 0;

    // Gather samples in [startTime, endTime)
    const relevant = [];
    let lastBeforeValue = 0;

    for (const s of samples) {
        if (s.time < startTime) {
            lastBeforeValue = s.gridExport;
        } else if (s.time < endTime) {
            relevant.push(s);
        }
    }

    if (relevant.length === 0) {
        return lastBeforeValue;
    }

    // Time-weighted average
    let weightedSum = 0;
    let totalWeight = 0;

    // Gap before first sample
    if (relevant[0].time > startTime) {
        const gapDuration = relevant[0].time - startTime;
        weightedSum += lastBeforeValue * gapDuration;
        totalWeight += gapDuration;
    }

    for (let i = 0; i < relevant.length; i++) {
        const current = relevant[i];
        const nextTime = (i + 1 < relevant.length)
            ? relevant[i + 1].time
            : endTime;
        const duration = nextTime - current.time;
        weightedSum += current.gridExport * duration;
        totalWeight += duration;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Hook that manages the three independent loops:
 * 1. requestAnimationFrame — render loop
 * 2. setInterval(100ms) — simulation loop (sensors, ramping, dispatch)
 * 3. setInterval(1000ms) — market tick (block-level revenue, advancement)
 */
export function useGameLoops({
    stateRef,
    updateState,
    videoRef,
    onGameEnd,
}) {
    const rafIdRef = useRef(null);
    const simIntervalRef = useRef(null);
    const marketIntervalRef = useRef(null);
    const lastSimTimeRef = useRef(0);
    const gameEndedRef = useRef(false);

    // Sensor accumulator: stores gridExport samples with timestamps
    const sensorAccumRef = useRef({ samples: [] });
    // Track when the last market tick started for sub-interval slicing
    const lastMarketTickTimeRef = useRef(0);

    // --- Stop all loops (declared before startLoops to avoid stale closure) ---
    const stopLoops = useCallback(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
        }
        if (marketIntervalRef.current) {
            clearInterval(marketIntervalRef.current);
            marketIntervalRef.current = null;
        }
    }, []);

    // --- Render Loop ---
    const renderLoop = useCallback(() => {
        const tick = () => {
            rafIdRef.current = requestAnimationFrame(tick);
        };
        rafIdRef.current = requestAnimationFrame(tick);
    }, []);

    // --- Start all loops ---
    const startLoops = useCallback(() => {
        const now = performance.now();
        lastSimTimeRef.current = now;
        lastMarketTickTimeRef.current = now;
        gameEndedRef.current = false;
        sensorAccumRef.current.samples = [];

        // 1. Render loop (rAF)
        rafIdRef.current = requestAnimationFrame(renderLoop);

        // 2. Simulation loop (100ms) — sensors, smooth ramping, dispatch, accumulate
        simIntervalRef.current = setInterval(() => {
            if (gameEndedRef.current) return;
            if (stateRef.current.isPaused) {
                lastSimTimeRef.current = performance.now(); // Sync time while paused
                return;
            }

            const now = performance.now();
            const deltaSec = (now - lastSimTimeRef.current) / 1000;
            lastSimTimeRef.current = now;

            // Process sensors
            const video = videoRef.current;
            let solarResult = { solarTarget: 0, rawSmile: 0, smoothedSmile: 0 };
            let windResult = { windTarget: 0, rawWind: 0, smoothedWind: 0 };

            if (video && video.readyState >= 2) {
                try {
                    solarResult = processSolarFrame(video, now);
                } catch { /* MediaPipe may throw */ }
            }

            try {
                windResult = processWindFrame();
            } catch { /* Audio may not be ready */ }

            // Update state with sensor data + run simulation
            updateState((prev) => {
                if (gameEndedRef.current || prev.isPaused) return prev;

                // Restriction: Solar generation only possible between 06:00 and 18:00
                const hour = prev.blockIndex / 4; // 15-min blocks
                const isSolarTime = hour >= 6 && hour < 18;
                const finalSolarTarget = isSolarTime ? solarResult.solarTarget : 0;

                // Compute rates for the current time scale (returns {up, down})
                const bps = prev.blocksPerSecond;
                const rates = {
                    solarRamp: computeSolarRampPerRealSec(bps),
                    windRamp: computeWindRampPerRealSec(bps),
                    bessRate: computeBessRatePerRealSec(bps),
                };

                const simState = {
                    ...prev,
                    solarTarget: finalSolarTarget,
                    windTarget: windResult.windTarget,
                    rawSmile: solarResult.rawSmile,
                    smoothedSmile: solarResult.smoothedSmile,
                    rawWind: windResult.rawWind,
                    smoothedWind: windResult.smoothedWind,
                };

                // Run simulation tick with normalized rates
                simulationTick(simState, deltaSec, rates);

                // Accumulate sample for sub-interval averaging
                sensorAccumRef.current.samples.push({
                    time: now,
                    gridExport: simState.gridExport,
                });

                return simState;
            });
        }, SIM_TICK_MS);

        // 3. Market tick (1000ms) — process blocksPerSecond blocks, revenue
        marketIntervalRef.current = setInterval(() => {
            if (gameEndedRef.current) return;
            if (stateRef.current.isPaused) {
                lastMarketTickTimeRef.current = performance.now(); // Sync time while paused
                return;
            }

            const tickEndTime = performance.now();
            const tickStartTime = lastMarketTickTimeRef.current;

            updateState((prev) => {
                if (gameEndedRef.current) return prev;

                const bps = prev.blocksPerSecond;
                let blockIndex = prev.blockIndex;
                let revenue = prev.revenue;
                const intervalMs = (tickEndTime - tickStartTime) / bps;
                const revenueHistory = [...prev.revenueHistory];
                const priceHistory = [...prev.priceHistory];

                // Process blocksPerSecond blocks
                for (let b = 0; b < bps; b++) {
                    if (blockIndex >= TOTAL_BLOCKS) break;

                    // Sub-interval time window for this block
                    const subStart = tickStartTime + b * intervalMs;
                    const subEnd = subStart + intervalMs;

                    // Time-weighted average gridExport for this sub-interval
                    const avgGridExport = computeSubIntervalAverage(
                        sensorAccumRef.current.samples,
                        subStart,
                        subEnd
                    );

                    // Revenue for this 15-minute block
                    const price = prev.prices[blockIndex];
                    const blockRevenue = avgGridExport * price * HOURS_PER_BLOCK;
                    revenue += blockRevenue;

                    blockIndex++;
                }

                // Clear accumulator after processing
                sensorAccumRef.current.samples = [];
                lastMarketTickTimeRef.current = tickEndTime;

                const elapsedSeconds = prev.elapsedSeconds + 1;
                const gameDurationSeconds = prev.gameDurationSeconds;

                // Game over check
                if (blockIndex >= TOTAL_BLOCKS) {
                    gameEndedRef.current = true;
                    stopLoops();
                    if (onGameEnd) {
                        setTimeout(() => onGameEnd(), 100);
                    }
                    return {
                        ...prev,
                        blockIndex,
                        elapsedSeconds,
                        timeRemaining: 0,
                        revenue,
                        currentPrice: prev.prices[TOTAL_BLOCKS - 1],
                        revenueHistory: [
                            ...revenueHistory,
                            { block: blockIndex, revenue },
                        ],
                    };
                }

                const newPrice = prev.prices[blockIndex] || prev.currentPrice;

                return {
                    ...prev,
                    blockIndex,
                    elapsedSeconds,
                    currentPrice: newPrice,
                    revenue,
                    timeRemaining: gameDurationSeconds - elapsedSeconds,
                    revenueHistory: [
                        ...revenueHistory,
                        { block: blockIndex, revenue },
                    ],
                    priceHistory: [
                        ...priceHistory,
                        { block: blockIndex, price: newPrice },
                    ],
                };
            });
        }, MARKET_TICK_MS);
    }, [renderLoop, updateState, stateRef, videoRef, onGameEnd, stopLoops]);

    // Clean unmount
    useEffect(() => {
        return () => {
            gameEndedRef.current = true;
            stopLoops();
        };
    }, [stopLoops]);

    return { startLoops, stopLoops };
}
