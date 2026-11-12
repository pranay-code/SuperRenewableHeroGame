// ============================================
// APP — Main Orchestrator
// State machine controller (§3)
// ============================================

import React, { useCallback, useRef, useEffect } from 'react';
import { useGameState } from './hooks/useGameState.js';
import { GAME_STATES } from './modules/constants.js';
import { isMobileDevice } from './modules/deviceGate.js';
import { destroyFaceLandmarker } from './modules/sensorSolar.js';
import { destroyWindSensor } from './modules/sensorWind.js';

// Screens
import MobileBlockScreen from './screens/MobileBlockScreen.jsx';
import IntroScreen from './screens/IntroScreen.jsx';
import BessSelectionScreen from './screens/BessSelectionScreen.jsx';
import PermissionScreen from './screens/PermissionScreen.jsx';
import CalibrationScreen from './screens/CalibrationScreen.jsx';
import PlayingScreen from './screens/PlayingScreen.jsx';
import EvaluationScreen from './screens/EvaluationScreen.jsx';

export default function App() {
  const {
    state,
    stateRef,
    updateState,
    transitionTo,
    setBatteryMode,
    setBessEnabled,
    setTimeScale,
    setPaused,
    initializeGame,
    resetGame,
  } = useGameState();

  // This ref holds the video element used for MediaPipe processing
  const videoRef = useRef(null);
  const isMobile = isMobileDevice();

  // Clean up sensors on unmount (§13)
  useEffect(() => {
    return () => {
      destroyFaceLandmarker();
      destroyWindSensor();
      // Stop media streams
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const s = stateRef.current;
      if (s.cameraStream) {
        s.cameraStream.getTracks().forEach((t) => t.stop());
      }
      if (s.micStream) {
        s.micStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stateRef]);

  // --- State Transition Handlers ---

  // INTRO → BESS_SELECTION
  const handleIntroNext = useCallback(() => {
    transitionTo(GAME_STATES.BESS_SELECTION);
  }, [transitionTo]);

  // BESS_SELECTION → PERMISSION_GATE
  const handleBessNext = useCallback(() => {
    transitionTo(GAME_STATES.PERMISSION_GATE);
  }, [transitionTo]);

  // PERMISSION_GATE → CALIBRATION (on permissions granted)
  const handlePermissionsGranted = useCallback(
    (cameraStream, micStream) => {
      updateState((prev) => ({
        ...prev,
        cameraStream,
        micStream,
      }));
      transitionTo(GAME_STATES.CALIBRATION);
    },
    [updateState, transitionTo]
  );

  // CALIBRATION → PLAYING
  const handleCalibrationComplete = useCallback(() => {
    initializeGame();
    transitionTo(GAME_STATES.PLAYING);
  }, [initializeGame, transitionTo]);

  // PLAYING → EVALUATION
  const handleGameEnd = useCallback(() => {
    transitionTo(GAME_STATES.EVALUATION);
  }, [transitionTo]);

  // EVALUATION → restart
  const handleRestart = useCallback(() => {
    // Destroy sensors
    destroyFaceLandmarker();
    destroyWindSensor();

    // Stop streams
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (state.micStream) {
      state.micStream.getTracks().forEach((t) => t.stop());
    }

    resetGame();
  }, [resetGame, state.cameraStream, state.micStream]);

  // --- Mobile Block (§2) ---
  if (isMobile) {
    return <MobileBlockScreen />;
  }

  // --- State Machine Router (§3) ---
  const renderScreen = () => {
    switch (state.currentState) {
      case GAME_STATES.INTRO:
        return <IntroScreen onNext={handleIntroNext} />;

      case GAME_STATES.BESS_SELECTION:
        return <BessSelectionScreen state={state} setBessEnabled={setBessEnabled} setTimeScale={setTimeScale} onNext={handleBessNext} />;

      case GAME_STATES.PERMISSION_GATE:
        return (
          <PermissionScreen onPermissionsGranted={handlePermissionsGranted} />
        );

      case GAME_STATES.CALIBRATION:
        return (
          <CalibrationScreen
            cameraStream={state.cameraStream}
            micStream={state.micStream}
            onCalibrationComplete={handleCalibrationComplete}
          />
        );

      case GAME_STATES.PLAYING:
        return (
          <PlayingScreen
            stateRef={stateRef}
            updateState={updateState}
            state={state}
            setBatteryMode={setBatteryMode}
            videoRef={videoRef}
            cameraStream={state.cameraStream}
            setPaused={setPaused}
            onGameEnd={handleGameEnd}
          />
        );

      case GAME_STATES.EVALUATION:
        return <EvaluationScreen state={state} onRestart={handleRestart} />;

      default:
        return <IntroScreen onNext={handleIntroNext} />;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}
