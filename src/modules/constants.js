// ============================================
// RENEWABLE PLANT HEAD SIMULATOR — CONSTANTS
// Time System Architecture v2 (15-minute block base)
// ============================================

// --- Generation Limits ---
export const MAX_SOLAR = 80;    // MW
export const MAX_WIND = 60;     // MW
export const GRID_CAP = 100;    // MW

// ============================================
// TIME ARCHITECTURE
// The fundamental simulation unit is a 15-minute block.
// One full day = 96 blocks (24h × 4 blocks/hr).
// ============================================

export const TOTAL_BLOCKS = 96;
export const BLOCKS_PER_HOUR = 4;
export const HOURS_PER_BLOCK = 0.25;
export const BASE_BLOCK_DURATION_MIN = 15;

// --- User-Selectable Time Scale ---
export const TIME_SCALE_OPTIONS = [
  { label: '1s = 15 min', minutes: 15, blocksPerSecond: 1, difficulty: 'Easy', emoji: '🟢', durationSec: 96 },
  { label: '1s = 30 min', minutes: 30, blocksPerSecond: 2, difficulty: 'Medium', emoji: '🟡', durationSec: 48 },
  { label: '1s = 45 min', minutes: 45, blocksPerSecond: 3, difficulty: 'Hard', emoji: '🟠', durationSec: 32 },
  { label: '1s = 60 min', minutes: 60, blocksPerSecond: 4, difficulty: 'Expert', emoji: '🔴', durationSec: 24 },
];

export const DEFAULT_BLOCKS_PER_SECOND = 1;

// --- Ramp Rates (per SIMULATED HOUR, not per real-world second) ---
export const SOLAR_RAMP_UP_PER_HOUR = 60;   // MW/sim-hour (Increased)
export const SOLAR_RAMP_DOWN_PER_HOUR = 8;    // MW/sim-hour (Lower for inertia)
export const WIND_RAMP_UP_PER_HOUR = 80;    // MW/sim-hour (Increased)
export const WIND_RAMP_DOWN_PER_HOUR = 12;   // MW/sim-hour (Lower for inertia)

// --- Ramp Rates (per 15-minute block) ---
export const SOLAR_RAMP_UP_PER_BLOCK = SOLAR_RAMP_UP_PER_HOUR / BLOCKS_PER_HOUR;
export const SOLAR_RAMP_DOWN_PER_BLOCK = SOLAR_RAMP_DOWN_PER_HOUR / BLOCKS_PER_HOUR;
export const WIND_RAMP_UP_PER_BLOCK = WIND_RAMP_UP_PER_HOUR / BLOCKS_PER_HOUR;
export const WIND_RAMP_DOWN_PER_BLOCK = WIND_RAMP_DOWN_PER_HOUR / BLOCKS_PER_HOUR;

// --- Battery (BESS) ---
export const BESS_CAPACITY = 200;
export const BESS_RATE_PER_HOUR = 50;       // MW/sim-hour
export const BESS_RATE_PER_BLOCK = BESS_RATE_PER_HOUR / BLOCKS_PER_HOUR; // 12.5 MW
export const BESS_INITIAL_SOC = 0;
export const BESS_EFFICIENCY = 1.0;
export const BESS_COST = 1_000_000;

// --- Target Profit (dynamic) ---
export const TARGET_PROFIT_RATIO = 0.70;

// --- Sensor Processing ---
export const DEADZONE = 0.05;
export const CURVE_EXPONENT = 0.6;
export const SOLAR_EMA_ALPHA = 0.25;
export const WIND_EMA_ALPHA = 0.2;
export const WIND_MAX_RMS = 0.005; // 10x more sensitive than 0.05

// --- FFT ---
export const FFT_SIZE = 512;
export const WIND_FREQ_LOW = 500;
export const WIND_FREQ_HIGH = 4000;

// --- Simulation Timing ---
export const SIM_TICK_MS = 100;
export const MARKET_TICK_MS = 1000;

// --- Market Price Phases (hour-based boundaries) ---
export const MARKET_PHASES = [
  { start: 0, end: 6, min: 3000, max: 4000, label: 'Night Baseline' },
  { start: 6, end: 12, min: 4000, max: 5500, label: 'Morning Ramp' },
  { start: 12, end: 16, min: 1500, max: 2500, label: 'Solar Glut' },
  { start: 16, end: 21, min: 9000, max: 11000, label: 'Evening Peak' },
  { start: 21, end: 24, min: 4000, max: 5000, label: 'Night Drop' },
];

// --- Game States ---
export const GAME_STATES = {
  INTRO: 'INTRO',
  BESS_SELECTION: 'BESS_SELECTION',
  PERMISSION_GATE: 'PERMISSION_GATE',
  CALIBRATION: 'CALIBRATION',
  PLAYING: 'PLAYING',
  EVALUATION: 'EVALUATION',
};

// --- State Transition Map ---
export const STATE_TRANSITIONS = {
  [GAME_STATES.INTRO]: GAME_STATES.BESS_SELECTION,
  [GAME_STATES.BESS_SELECTION]: GAME_STATES.PERMISSION_GATE,
  [GAME_STATES.PERMISSION_GATE]: GAME_STATES.CALIBRATION,
  [GAME_STATES.CALIBRATION]: GAME_STATES.PLAYING,
  [GAME_STATES.PLAYING]: GAME_STATES.EVALUATION,
  [GAME_STATES.EVALUATION]: null,
};

// --- Mobile Detection ---
export const MIN_SCREEN_WIDTH = 1024;

// ============================================
// COMPUTED HELPERS (no hardcoding)
// ============================================

export function computeGameDuration(blocksPerSecond) {
  return TOTAL_BLOCKS / blocksPerSecond;
}

export function computeSolarRampPerRealSec(blocksPerSecond) {
  return {
    up: SOLAR_RAMP_UP_PER_BLOCK * blocksPerSecond,
    down: SOLAR_RAMP_DOWN_PER_BLOCK * blocksPerSecond
  };
}

export function computeWindRampPerRealSec(blocksPerSecond) {
  return {
    up: WIND_RAMP_UP_PER_BLOCK * blocksPerSecond,
    down: WIND_RAMP_DOWN_PER_BLOCK * blocksPerSecond
  };
}

export function computeBessRatePerRealSec(blocksPerSecond) {
  return BESS_RATE_PER_BLOCK * blocksPerSecond;
}

export function computeTargetProfit(prices) {
  const theoreticalMax = prices.reduce(
    (sum, price) => sum + GRID_CAP * price * HOURS_PER_BLOCK, 0
  );
  return Math.round(theoreticalMax * TARGET_PROFIT_RATIO);
}

export function blockToTime(blockIndex) {
  const totalMinutes = blockIndex * BASE_BLOCK_DURATION_MIN;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function blockToHour(blockIndex) {
  return blockIndex / BLOCKS_PER_HOUR;
}
