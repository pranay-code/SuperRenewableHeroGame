// ============================================
// useGameState — Centralized Game State Hook
// 15-minute block time architecture
// ============================================

import { useState, useCallback, useRef } from 'react';
import {
    GAME_STATES,
    STATE_TRANSITIONS,
    BESS_INITIAL_SOC,
    BESS_CAPACITY,
    TOTAL_BLOCKS,
    DEFAULT_BLOCKS_PER_SECOND,
    TIME_SCALE_OPTIONS,
    computeGameDuration,
    computeTargetProfit,
} from '../modules/constants.js';
import { generatePriceArray } from '../modules/market.js';

/**
 * Creates the initial game state.
 */
function createInitialGameState() {
    const defaultOption = TIME_SCALE_OPTIONS[0];
    return {
        // State machine
        currentState: GAME_STATES.INTRO,
        isPaused: false,

        // Sensor targets (from sensor pipelines)
        solarTarget: 0,
        windTarget: 0,

        // Current outputs (after ramping)
        solarOutput: 0,
        windOutput: 0,

        // Dispatch results
        totalGen: 0,
        gridExport: 0,
        clipped: 0,
        chargeAmount: 0,
        dischargeAmount: 0,

        // Battery
        soc: BESS_INITIAL_SOC,
        batteryMode: 'idle',
        isBessEnabled: true,

        // Market
        prices: [],
        blockIndex: 0,
        currentPrice: 0,
        revenue: 0,
        targetProfit: 0,

        // Time architecture
        blocksPerSecond: defaultOption.blocksPerSecond,
        timeScaleMinutes: defaultOption.minutes,
        gameDurationSeconds: computeGameDuration(defaultOption.blocksPerSecond),
        elapsedSeconds: 0,
        timeRemaining: computeGameDuration(defaultOption.blocksPerSecond),

        // Sensor diagnostics
        rawSmile: 0,
        smoothedSmile: 0,
        rawWind: 0,
        smoothedWind: 0,

        // Media streams
        cameraStream: null,
        micStream: null,

        // History for charts
        revenueHistory: [],
        priceHistory: [],
    };
}

export function useGameState() {
    const [state, setState] = useState(createInitialGameState);
    const stateRef = useRef(state);

    // Keep ref in sync for use in intervals/loops
    const updateState = useCallback((updater) => {
        setState((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            stateRef.current = next;
            return next;
        });
    }, []);

    // Explicit state transition (centralized)
    const transitionTo = useCallback((targetState) => {
        setState((prev) => {
            const expected = STATE_TRANSITIONS[prev.currentState];
            if (expected !== targetState) {
                console.warn(
                    `Invalid state transition: ${prev.currentState} → ${targetState}. Expected: ${expected}`
                );
            }
            const next = { ...prev, currentState: targetState };
            stateRef.current = next;
            return next;
        });
    }, []);

    // Set battery mode with mutual exclusion
    const setBatteryMode = useCallback((mode) => {
        setState((prev) => {
            let newMode = mode;
            if (prev.batteryMode === mode) newMode = 'idle';
            if (newMode === 'discharge' && prev.soc <= 0) newMode = 'idle';
            if (newMode === 'charge' && prev.soc >= BESS_CAPACITY) newMode = 'idle';
            const next = { ...prev, batteryMode: newMode };
            stateRef.current = next;
            return next;
        });
    }, []);

    // Set time scale (called from setup screen)
    const setTimeScale = useCallback((minutes) => {
        const option = TIME_SCALE_OPTIONS.find(o => o.minutes === minutes);
        if (!option) return;
        setState((prev) => {
            const gameDurationSeconds = computeGameDuration(option.blocksPerSecond);
            const next = {
                ...prev,
                timeScaleMinutes: minutes,
                blocksPerSecond: option.blocksPerSecond,
                gameDurationSeconds,
                timeRemaining: gameDurationSeconds,
            };
            stateRef.current = next;
            return next;
        });
    }, []);

    // Generate prices and initialize game at start
    const initializeGame = useCallback(() => {
        const prices = generatePriceArray();
        const targetProfit = computeTargetProfit(prices);
        const blocksPerSecond = stateRef.current.blocksPerSecond;
        const gameDurationSeconds = computeGameDuration(blocksPerSecond);

        setState((prev) => {
            const next = {
                ...prev,
                prices,
                targetProfit,
                blockIndex: 0,
                currentPrice: prices[0],
                revenue: 0,
                elapsedSeconds: 0,
                timeRemaining: gameDurationSeconds,
                gameDurationSeconds,
                gameStartTime: performance.now(),
                solarOutput: 0,
                windOutput: 0,
                solarTarget: 0,
                windTarget: 0,
                gridExport: 0,
                clipped: 0,
                soc: BESS_INITIAL_SOC,
                batteryMode: 'idle',
                revenueHistory: [],
                priceHistory: [{ block: 0, price: prices[0] }],
            };
            stateRef.current = next;
            return next;
        });
    }, []);

    // Reset to initial state
    const resetGame = useCallback(() => {
        const initial = createInitialGameState();
        stateRef.current = initial;
        setState(initial);
    }, []);

    return {
        state,
        stateRef,
        updateState,
        transitionTo,
        setBatteryMode,
        setBessEnabled: (enabled) => {
            setState(prev => {
                const next = { ...prev, isBessEnabled: enabled };
                stateRef.current = next;
                return next;
            });
        },
        setTimeScale,
        setPaused: (paused) => {
            setState(prev => {
                const next = { ...prev, isPaused: paused };
                stateRef.current = next;
                return next;
            });
        },
        initializeGame,
        resetGame,
    };
}
