// ============================================
// SIMULATION ENGINE
// Ramping, dispatch, and clipping logic.
// All rates accepted as parameters — no hardcoded time assumptions.
// ============================================

import { BESS_CAPACITY, GRID_CAP } from './constants.js';

/**
 * Apply ramping toward target for a given source.
 * Generic: works with any rate × deltaTime product.
 *
 * @param {number} current — current output MW
 * @param {number} target — sensor-derived target MW
 * @param {number} rampRate — max MW per time-unit
 * @param {number} deltaTime — elapsed time in the same unit as rampRate
 * @returns {number} new output value
 */
export function applyRamp(current, target, rampObj, deltaTime) {
    const diff = target - current;
    const isUp = diff > 0;
    const rampRate = isUp ? rampObj.up : rampObj.down;
    const maxDelta = rampRate * deltaTime;

    if (Math.abs(diff) <= maxDelta) {
        return target;
    }

    return current + Math.sign(diff) * maxDelta;
}

/**
 * Run one simulation tick.
 * Dispatch algorithm (§7):
 *   1. totalGen = solarOutput + windOutput
 *   2. Charge: min(bessRate*dt, totalGen, CAP-SOC)
 *   3. gridExport = min(totalGen, GRID_CAP)
 *   4. Discharge: min(bessRate*dt, SOC, GRID_CAP-gridExport)
 *   5. clipped = totalGen - gridExport
 *
 * @param {Object} state — mutable game state
 * @param {number} deltaSec — real-world seconds elapsed
 * @param {Object} rates — { solarRamp, windRamp, bessRate } per real-world second
 * @returns {Object} updated state
 */
export function simulationTick(state, deltaSec, rates) {
    const { solarRamp, windRamp, bessRate } = rates;

    // --- Apply ramping ---
    state.solarOutput = applyRamp(
        state.solarOutput,
        state.solarTarget,
        solarRamp,
        deltaSec
    );

    state.windOutput = applyRamp(
        state.windOutput,
        state.windTarget,
        windRamp,
        deltaSec
    );

    // --- Dispatch Algorithm (exact order) ---

    // Step 1: Total generation
    let totalGen = state.solarOutput + state.windOutput;

    // Step 2: Charge — battery absorbs power FIRST
    let chargeAmount = 0;
    if (state.isBessEnabled && state.batteryMode === 'charge') {
        chargeAmount = Math.min(
            bessRate * deltaSec,
            totalGen,
            BESS_CAPACITY - state.soc
        );
        chargeAmount = Math.max(0, chargeAmount);
        state.soc += chargeAmount;
        totalGen -= chargeAmount;
    }

    // Step 3: Grid export (capped)
    let gridExport = Math.min(totalGen, GRID_CAP);

    // Step 4: Discharge — battery supplements grid export
    let dischargeAmount = 0;
    if (state.isBessEnabled && state.batteryMode === 'discharge') {
        dischargeAmount = Math.min(
            bessRate * deltaSec,
            state.soc,
            GRID_CAP - gridExport
        );
        dischargeAmount = Math.max(0, dischargeAmount);
        gridExport += dischargeAmount;
        state.soc -= dischargeAmount;
    }

    // Step 5: Clipped energy
    const clipped = Math.max(0, totalGen - gridExport);

    // Update state
    state.gridExport = gridExport;
    state.clipped = clipped;
    state.chargeAmount = chargeAmount;
    state.dischargeAmount = dischargeAmount;
    state.totalGen = state.solarOutput + state.windOutput;

    return state;
}
