# AGENTS.md — Super Renewable Hero Game

> **Last updated:** 2026-11-13  
> **Status:** Active Development / Live on GitHub Pages  
> **Live Demo:** [https://pranay-code.github.io/SuperRenewableHeroGame/](https://pranay-code.github.io/SuperRenewableHeroGame/)  
> **Repository:** [https://github.com/pranay-code/SuperRenewableHeroGame](https://github.com/pranay-code/SuperRenewableHeroGame)

---

## 🎯 Project Goal

Build an **interactive browser-based renewable energy plant simulator** where the player acts as the head of a 140 MW hybrid solar+wind plant. The player physically controls energy generation using their **webcam** (smile → solar power) and **microphone** (blow → wind power), manages a battery energy storage system (BESS), and tries to maximize revenue over a simulated 24-hour day with dynamic market pricing.

The game is educational and experiential — it teaches renewable energy dispatch, grid constraints, energy storage strategy, and market dynamics through embodied interaction.

---

## 🏗️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React | 19.2.0 |
| **Bundler** | Vite | 7.3.1 |
| **Rendering** | PixiJS | 8.6.6 |
| **Face Detection** | MediaPipe Tasks Vision (FaceLandmarker) | 0.10.32 |
| **Audio Processing** | Web Audio API (AnalyserNode + FFT) | Native |
| **Language** | JavaScript (JSX) | ES Modules |
| **Styling** | Vanilla CSS (design tokens, glass-morphism) | — |
| **Linting** | ESLint 9 + react-hooks + react-refresh plugins | — |
| **CI/CD & Hosting** | GitHub Pages + GitHub Actions | — |
| **Platform** | Desktop browsers only (min 1024px) | — |

---

## 📁 Architecture Overview

```
.github/
└── workflows/
    └── deploy.yml             # GitHub Actions CI/CD to GitHub Pages
src/
├── App.jsx                    # State machine controller (6 states)
├── main.jsx                   # React entry point
├── index.css                  # Full design system (~1880 lines)
│
├── hooks/
│   ├── useGameState.js        # Centralized state + transitions
│   └── useGameLoops.js        # Triple-loop architecture (rAF + sim + market)
│
├── modules/
│   ├── constants.js           # All game constants, time architecture, ramp rates
│   ├── simulation.js          # Ramping + dispatch engine (charge/discharge/clip)
│   ├── market.js              # 96-block price array generator (bounded drift)
│   ├── sensorSolar.js         # MediaPipe smile → solar MW pipeline
│   ├── sensorWind.js          # Web Audio FFT → wind MW pipeline
│   └── deviceGate.js          # Mobile detection gate
│
├── screens/
│   ├── IntroScreen.jsx        # Welcome + plant specs
│   ├── BessSelectionScreen.jsx # Battery toggle + time scale picker
│   ├── PermissionScreen.jsx   # Camera + mic permission gate
│   ├── CalibrationScreen.jsx  # 3s sensor baseline + live preview
│   ├── PlayingScreen.jsx      # Main game HUD + PixiJS canvas
│   ├── EvaluationScreen.jsx   # End-game results + price history
│   └── MobileBlockScreen.jsx  # Desktop-only gate
│
└── visual/
    ├── VisualEngine.js        # PixiJS app orchestrator (1280×720 internal)
    ├── layers/                # 11 composited PixiJS layers
    │   ├── BackgroundLayer.js
    │   ├── SkyLayer.js        # Phase-based sky gradient with crossfade
    │   ├── CloudLayer.js
    │   ├── SunLayer.js
    │   ├── EnvironmentLayer.js
    │   ├── SolarLayer.js      # 3×4 perspective panel array
    │   ├── TurbineLayer.js    # Rotating blades + aviation light
    │   ├── BatteryLayer.js
    │   ├── EnergyFlowLayer.js # Bezier paths + animated pulse nodes
    │   ├── GridLayer.js
    │   └── ClippingLayer.js
    ├── pools/
    │   └── ParticlePool.js
    └── utils/
        ├── ColorUtils.js
        └── TextureCache.js
```

### State Machine Flow

```
INTRO → BESS_SELECTION → PERMISSION_GATE → CALIBRATION → PLAYING → EVALUATION
                                                                       ↓
                                                                  (restart → INTRO)
```

### Game Loop Architecture (Triple Loop)

| Loop | Interval | Purpose |
|------|----------|---------|
| **Render** | `requestAnimationFrame` | PixiJS visual updates (60fps) |
| **Simulation** | `setInterval(100ms)` | Sensor processing, ramping, dispatch |
| **Market** | `setInterval(1000ms)` | Block advancement, revenue calculation, sub-interval averaging |

### Sensor Pipelines

- **Solar (Smile):** Camera → MediaPipe FaceLandmarker → `mouthSmileLeft/Right` blendshapes → average → deadzone(5%) → normalize → power curve(0.6) → EMA(α=0.25) → × 80 MW
- **Wind (Blow):** Mic → Web Audio AnalyserNode → FFT (500–4000 Hz band) → RMS → subtract baseline → normalize vs `WIND_MAX_RMS` → deadzone(5%) → power curve(0.6) → EMA(α=0.2) → × 60 MW

### Simulation Model

- **Time:** 96 × 15-minute blocks = 24 simulated hours
- **Dispatch order:** (1) Total gen → (2) Battery charge absorbs → (3) Grid export capped at 100 MW → (4) Battery discharge supplements → (5) Clipped remainder
- **Market:** 5 price phases (Night Baseline, Morning Ramp, Solar Glut, Evening Peak, Night Drop) with bounded volatility drift

---

## 📊 Current Status

| Area | Status | Notes |
|------|--------|-------|
| State machine | ✅ Complete | 6-state flow with validated transitions |
| Sensor: Solar (smile) | ✅ Complete | MediaPipe blendshapes working |
| Sensor: Wind (blow) | ✅ Complete | FFT band RMS with baseline calibration |
| Simulation engine | ✅ Complete | Ramping + dispatch + BESS |
| Market engine | ✅ Complete | 96-block price generation |
| Calibration screen | ✅ Complete | 3s baseline + live preview |
| Playing screen HUD | ✅ Complete | Glass-panel cinematic HUD |
| Evaluation screen | ✅ Complete | Revenue + rating + price history |
| PixiJS visual engine | ✅ Complete | 11 layers, phase-based sky, energy flow |
| CSS design system | ✅ Complete | Light nature theme, ~1880 lines |
| Build | ✅ Passes | Vite build succeeds with zero CSS warnings |
| Linting | ✅ Clean | ESLint 9 passes with 0 errors and 0 warnings |
| CI/CD & Deployment | ✅ Live | Automated build & deploy to GitHub Pages on push to `main` |
| Mobile gate | ✅ Complete | Blocks mobile devices |
| Tests | ❌ None | No unit or integration tests exist |
| TypeScript | ❌ Not used | Plain JS/JSX throughout |
| Accessibility | ⚠️ Minimal | No ARIA labels, no keyboard nav during gameplay |
| Code splitting | ⚠️ None | Single 580 KB main chunk (Vite warns) |

---

## 🐛 Known Bugs & Issues

1. **No error recovery if MediaPipe CDN fails.** `initFaceLandmarker()` fetches WASM + model from `cdn.jsdelivr.net` and `storage.googleapis.com` — if either is down or blocked, calibration hangs on "Loading AI Model..." with no timeout or fallback.

2. **Potential memory leak in EnergyFlowLayer.** Particle nodes are created with `new PIXI.Graphics()` each spawn. Under high generation (sustained max solar + wind), many nodes may accumulate. The `ParticlePool` exists but isn't used by this layer.

3. **Solar hard-cut at hour boundaries.** Solar target drops to 0 instantly at block 72 (18:00) rather than ramping down, causing an abrupt cliff in generation even though ramp-down rates exist.

4. **Revenue calculation depends on `performance.now()` accuracy.** Sub-interval averaging uses wall-clock timestamps. If the browser throttles timers (e.g., background tab), revenue calculation could become inaccurate.

5. **No validation for game end on restart.** If the user clicks "Play Again" very rapidly, streams might not be fully stopped before re-initialization.

### 🛠️ Resolved Issues & Cleanups
- **`@import` CSS build warning:** Removed invalid `@import` in `index.css`; loaded fonts cleanly via `<link>` in `index.html`.
- **Dead code removal:** Deleted unreferenced `WindParticleLayer.js`, unused `createSoftShadowTexture` in `TextureCache.js`, unused `desaturate` in `ColorUtils.js`, and empty `src/assets` folder.
- **Stale closure & unused params:** Fixed `stopLoops` ordering and dependency array in `useGameLoops.js`, eliminated unused `canvasRef`, `isPlaying`, `fullStream`, and unneeded error bindings.
- **ESLint hygiene:** All rules pass with zero errors and zero warnings.
- **GitHub Pages deployment:** Configured Vite subpath routing (`base: '/SuperRenewableHeroGame/'`) and automated CI/CD pipeline via GitHub Actions.

---

## 🎨 Visual Design Rating

**Overall: 7.5 / 10**

### Strengths
- **Clean light theme** with nature-inspired design tokens (greens, solar yellows, wind teals)
- **Well-structured CSS** with a comprehensive design system: tokens, spacing scale, shadows, radii, transitions
- **Glass-morphism HUD** overlaying the PixiJS canvas creates a cinematic in-game feel
- **Smooth animations** — sky phase crossfades, turbine blade rotation with motion blur, pulsing energy flow nodes
- **Consistent typography** using Inter + JetBrains Mono

### Weaknesses
- **PixiJS scene vs. reference gap.** The reference image shows a richly detailed anime/illustration-style scene (lush grass, mountains, detailed turbines, realistic solar arrays, translucent battery). The current PixiJS implementation uses basic geometric primitives — flat colored rectangles, simple polygons, and circles. The visual fidelity is significantly below the reference.
- **Only 1 turbine rendered** vs. 3–4 in the reference image
- **Solar panels are small** (12 flat quads) vs. large detailed arrays in the reference
- **No terrain detail** — flat green ground without grass, hills, or mountains
- **No textured assets** — everything is procedural vector graphics, which limits visual richness
- **Battery visualization is basic** compared to the glowing translucent cylinder in the reference
- **Setup screens are solid** but the playing screen's PixiJS canvas is where the visual gap is most apparent

### Recommendations
- Add sprite-based or pre-rendered background assets for the landscape
- Increase turbine count and add perspective/depth variation
- Use texture atlases for solar panels to add grid-line detail and reflection
- Add parallax grass, distant mountains, and atmospheric haze
- Improve battery to a translucent cylinder with particle fill level

---

## ⚙️ Key Constants (Quick Reference)

| Constant | Value | Notes |
|----------|-------|-------|
| `MAX_SOLAR` | 80 MW | Smile-controlled |
| `MAX_WIND` | 60 MW | Blow-controlled |
| `GRID_CAP` | 100 MW | Max export to grid |
| `BESS_CAPACITY` | 200 MWh | Battery capacity |
| `BESS_RATE` | 50 MW/sim-hr | Charge/discharge rate |
| `BESS_COST` | ₹10,00,000 | Deducted from final revenue |
| `TARGET_PROFIT_RATIO` | 70% | Of theoretical maximum |
| `SIM_TICK_MS` | 100 ms | Simulation loop interval |
| `MARKET_TICK_MS` | 1000 ms | Market/block advancement |
| `TOTAL_BLOCKS` | 96 | 24h × 4 blocks/hr |

---

## 🏃 Running the Project

```bash
npm install
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

> **Requirements:** Desktop browser with webcam + microphone. Chrome/Edge recommended for best MediaPipe/WebGL2 support.

---

## 📜 Conventions

- **No TypeScript** — plain JS with JSX
- **Functional components** with hooks (no class components)
- **Module-scoped singletons** for sensors (`sensorSolar.js`, `sensorWind.js` use module-level `let` state)
- **Ref-synced state** — `stateRef.current` mirrors React state for use in `setInterval`/`rAF` callbacks
- **All time constants derived** from base values in `constants.js` — no hardcoded time values elsewhere
- **Section references** (§2, §3, §5.1, §7, §11, §13) appear in comments, referring to the original design document
