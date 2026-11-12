# ⚡ Super Renewable Hero Game — Renewable Plant Head Simulator

[![Deploy to GitHub Pages](https://github.com/pranay-code/SuperRenewableHeroGame/actions/workflows/deploy.yml/badge.svg)](https://github.com/pranay-code/SuperRenewableHeroGame/actions/workflows/deploy.yml)

> **🎮 Live Demo:** [https://pranay-code.github.io/SuperRenewableHeroGame/](https://pranay-code.github.io/SuperRenewableHeroGame/)  
> **📦 Repository:** [https://github.com/pranay-code/SuperRenewableHeroGame](https://github.com/pranay-code/SuperRenewableHeroGame)

An interactive, browser-based renewable energy plant simulator where you take command as the head of a **140 MW hybrid solar + wind plant**.

Control energy generation through physical interaction:
- ☀️ **Smile** at your camera to generate solar power (via MediaPipe Face Landmarker blendshapes)
- 💨 **Blow** into your microphone to generate wind power (via Web Audio FFT bandpass analysis)
- 🔋 **Battery Storage (BESS):** Charge during solar glut hours (cheap energy) and discharge during evening peak pricing (high value)
- ⚡ **Grid Management:** Respect the strict 100 MW grid export limit and manage curtailment/clipping across 96 fifteen-minute blocks (24-hour simulated day)

---

## 🕹️ Gameplay & Controls

| Action | Control / Sensor | Capacity | In-Game Effect |
|---|---|---|---|
| **Solar Power** | Smile at camera (Webcam) | 0–80 MW | MediaPipe blendshapes (`mouthSmileLeft` & `mouthSmileRight`) map smile intensity to solar generation. Active only 06:00–18:00. |
| **Wind Power** | Blow into microphone (Mic) | 0–60 MW | Web Audio AnalyserNode processes 500–4000 Hz breath noise RMS above baseline to spin turbines. |
| **Battery Storage** | `CHARGE` / `DISCHARGE` / `IDLE` | 200 MWh (50 MW/hr) | Optional 200 MWh BESS (₹10L capex fee). Store surplus to avoid clipping or sell during peak hours. |
| **Time Scales** | 15 / 30 / 45 / 60 min per real sec | — | Easy (96s), Medium (48s), Hard (32s), Expert (24s). |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Desktop or laptop browser (Chrome or Edge strongly recommended for WebGPU/WebGL2 and MediaPipe support)
- Working webcam and microphone

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/pranay-code/SuperRenewableHeroGame.git
cd SuperRenewableHeroGame

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run ESLint check (0 errors, 0 warnings)
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment

This project is deployed to **GitHub Pages** using GitHub Actions:
- **Production URL:** [https://pranay-code.github.io/SuperRenewableHeroGame/](https://pranay-code.github.io/SuperRenewableHeroGame/)
- **Workflow:** Defined in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — automatically triggers on every push to the `main` branch, builds with Vite, and publishes the `dist` directory.

---

## 🏗️ Technical Architecture

- **Rendering Engine:** PixiJS v8 canvas with 11 composited layers (dynamic sky gradients, parallax clouds, directional lighting, animated Bezier energy flow lines, and particle emitters).
- **Computer Vision:** MediaPipe Vision Tasks (`FaceLandmarker`) running GPU-accelerated facial blendshape analysis.
- **Audio DSP:** Native Web Audio API with real-time FFT spectrum analysis over a calibrated 500–4000 Hz band with noise floor subtraction.
- **Timing & Dispatch Engine:** Triple-loop architecture with 60 FPS visual rendering (`requestAnimationFrame`), 100ms ramping & dispatch simulation, and 1-second market block advancement.

For architecture specifications, state machine flows, and development logs, see [AGENTS.md](./AGENTS.md).
