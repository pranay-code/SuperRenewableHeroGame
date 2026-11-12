// ============================================
// MARKET PRICE ENGINE
// Generates 96-element price array (one per 15-minute block)
// ============================================

import { MARKET_PHASES, TOTAL_BLOCKS, BLOCKS_PER_HOUR } from './constants.js';

/**
 * Find the market phase for a given block index.
 */
function getPhaseForBlock(blockIndex) {
    const hour = blockIndex / BLOCKS_PER_HOUR;
    return MARKET_PHASES.find(p => hour >= p.start && hour < p.end) || null;
}

/**
 * Generate a deterministic 96-element price array at game start.
 * One price per 15-minute block.
 * Uses bounded volatility drift within each phase's min/max range.
 * Prices are integers (₹/MWh).
 */
export function generatePriceArray() {
    const prices = new Array(TOTAL_BLOCKS);

    for (let block = 0; block < TOTAL_BLOCKS; block++) {
        const phase = getPhaseForBlock(block);
        if (!phase) {
            prices[block] = 4000;
            continue;
        }

        // Check if this is the first block of the phase
        const prevPhase = block > 0 ? getPhaseForBlock(block - 1) : null;
        const isPhaseStart = !prevPhase || prevPhase.label !== phase.label;

        if (isPhaseStart) {
            // First block of phase: start at midpoint with small random offset
            const mid = (phase.min + phase.max) / 2;
            const range = phase.max - phase.min;
            const offset = (Math.random() - 0.5) * range * 0.3;
            prices[block] = Math.round(
                Math.max(phase.min, Math.min(phase.max, mid + offset))
            );
        } else {
            // Bounded volatility drift from previous price
            const prev = prices[block - 1];
            const range = phase.max - phase.min;
            const maxDrift = range * 0.08; // Smaller drift per block (was 0.15 per hour)
            const drift = (Math.random() - 0.5) * 2 * maxDrift;
            const newPrice = prev + drift;
            prices[block] = Math.round(
                Math.max(phase.min, Math.min(phase.max, newPrice))
            );
        }
    }

    return prices;
}
