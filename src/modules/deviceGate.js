// ============================================
// DEVICE GATE — §2 Desktop Only
// Block mobile devices via UA + screen width + pointer
// ============================================

import { MIN_SCREEN_WIDTH } from './constants.js';

export function isMobileDevice() {
    // 1. User-agent check
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    // 2. Screen width threshold
    const narrowScreen = window.screen.width < MIN_SCREEN_WIDTH;

    // 3. Touch-primary detection (catches desktop-mode mobile browsers)
    const touchPrimary = window.matchMedia('(pointer: coarse)').matches;

    return uaMatch || narrowScreen || touchPrimary;
}
