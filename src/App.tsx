import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import {
  PauseModal,
  ResultsModal,
  TitleOverlay,
  TitleScreenView,
} from './components/Overlays';
import { TouchControls } from './components/TouchControls';
import {
  loadPlayerPreferences,
  savePlayerPreferences,
} from './game/preferences';
import { RaceEngine } from './game/raceEngine';
import {
  NewRecordFlags,
  RecordsStore,
  loadRecords,
  recordRaceResult,
  resetRecords,
} from './game/records';
import { usePWA } from './hooks/usePWA';
import {
  CAR_COLOR_PRESETS,
  CAR_WHEEL_PRESETS,
  CarColorPreset,
  CarWheelPreset,
  GameModeId,
  GraphicsQuality,
  HudSnapshot,
  InputState,
  MUSIC_TRACKS,
  MirrorViewportRect,
  MusicTrackSpec,
  TouchSteerMode,
  VEHICLES,
  VehicleSpec,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  phase: 'TITLE',
  mode: 'CIRCUIT_RACE',
  cameraMode: 'CHASE',
  vehicleId: VEHICLES[0].id,
  vehicleName: VEHICLES[0].name,
  isBike: VEHICLES[0].isBike,
  truckArtEnabled: true,
  speedKmh: 0,
  topSpeedKmh: 0,
  score: 0,
  driftScore: 0,
  comboMultiplier: 1,
  nearMisses: 0,
  rpmRatio: 0,
  gear: 1,
  nitro: 100,
  hullIntegrity: 100,
  impactFlash: 0,
  slowMoActive: false,
  mirrorEnabled: true,
  isHardwareMirror: true,
  graphicsQuality: 'HIGH',
  isBoosting: false,
  isDrifting: false,
  driftIntensity: 0,
  lap: 1,
  totalLaps: 3,
  position: 1,
  totalRacers: 4,
  raceTimeMs: 0,
  currentLapMs: 0,
  bestLapMs: null,
  modeTimerMs: 90_000,
  knockoutNextMs: 25_000,
  checkpointsCleared: 0,
  checkpointsTarget: 10,
  dragProgress: 0,
  suspectsRemaining: 4,
  suspectsTotal: 4,
  policeHeat: 20,
  wantedStars: 1,
  pursuitAlert: 'NONE',
  policeCloseWarning: false,
  bustProgress: 0,
  busted: false,
  victory: true,
  resultHeadline: '',
  resultSubline: '',
  takedowns: 0,
  countdownValue: 3,
  bannerText: null,
  weatherCondition: 'SUNNY',
  trackGripPercent: 100,
  playerHeadingRad: 0,
  sharpTurnAhead: null,
  minimapPath: [],
  minimapDots: [],
  rearBlips: [],
  standings: [],
  lapMetrics: [],
  speedSplits: [],
};

function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    Boolean(window.matchMedia?.('(pointer: coarse)')?.matches)
  );
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const canvasPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);

  const [initialPrefs] = useState(() => loadPlayerPreferences());
  const pwa = usePWA();

  const [titleView, setTitleView] = useState<TitleScreenView>('HOME');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSpec>(
    () => VEHICLES.find((v) => v.id === initialPrefs.vehicleId) ?? VEHICLES[0],
  );
  const [selectedPreset, setSelectedPreset] = useState<CarColorPreset>(
    () => CAR_COLOR_PRESETS.find((p) => p.id === initialPrefs.paintId) ?? CAR_COLOR_PRESETS[0],
  );
  const [selectedWheelPreset, setSelectedWheelPreset] = useState<CarWheelPreset>(
    () => CAR_WHEEL_PRESETS.find((w) => w.id === initialPrefs.wheelId) ?? CAR_WHEEL_PRESETS[0],
  );
  const [selectedNeonHex, setSelectedNeonHex] = useState<number>(initialPrefs.neonHex);
  const [selectedMode, setSelectedMode] = useState<GameModeId>(initialPrefs.modeId);
  const [truckArtEnabled, setTruckArtEnabled] = useState(initialPrefs.truckArtEnabled);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  const [records, setRecords] = useState<RecordsStore>(() => loadRecords());
  const [newRecords, setNewRecords] = useState<NewRecordFlags | null>(null);

  const [currentMusicTrack, setCurrentMusicTrack] = useState<MusicTrackSpec>(
    () => MUSIC_TRACKS.find((t) => t.id === initialPrefs.musicTrackId) ?? MUSIC_TRACKS[0],
  );
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [sfxMuted, setSfxMuted] = useState(initialPrefs.sfxMuted);
  const [sfxVolume, setSfxVolume] = useState(initialPrefs.sfxVolume);
  const [musicMuted, setMusicMuted] = useState(initialPrefs.musicMuted);
  const [musicVolume, setMusicVolume] = useState(initialPrefs.musicVolume);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() =>
    initialPrefs.showTouchControls !== null
      ? initialPrefs.showTouchControls
      : detectTouchDevice(),
  );
  const [touchSteerMode, setTouchSteerMode] = useState<TouchSteerMode>(
    initialPrefs.touchSteerMode,
  );

  const phaseRef = useRef(hud.phase);
  phaseRef.current = hud.phase;
  const prevPhaseRef = useRef(hud.phase);
  const modeRef = useRef(selectedMode);
  modeRef.current = selectedMode;
  const titleViewRef = useRef(titleView);
  titleViewRef.current = titleView;
  const initialPrefsRef = useRef(initialPrefs);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      window.localStorage?.removeItem('cheema_coast_billboard_v1');
    } catch {
      // Ignore storage access errors
    }

    const prefs = initialPrefsRef.current;
    const startVehicle = VEHICLES.find((v) => v.id === prefs.vehicleId) ?? VEHICLES[0];
    const startPreset =
      CAR_COLOR_PRESETS.find((p) => p.id === prefs.paintId) ?? CAR_COLOR_PRESETS[0];
    const startWheels =
      CAR_WHEEL_PRESETS.find((w) => w.id === prefs.wheelId) ?? CAR_WHEEL_PRESETS[0];

    const engine = new RaceEngine(mount, startVehicle, startPreset, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;

    if (startWheels.id !== CAR_WHEEL_PRESETS[0].id) {
      engine.setWheelPreset(startWheels);
    }
    if (prefs.neonHex !== startPreset.accentHex) {
      engine.setNeonColor(prefs.neonHex);
    }
    if (prefs.modeId !== 'CIRCUIT_RACE') {
      engine.setMode(prefs.modeId);
    }
    if (!prefs.truckArtEnabled) {
      engine.setTruckArtEnabled(false);
    }
    engine.audio.selectMusicTrack(prefs.musicTrackId);
    engine.audio.setMusicVolume(prefs.musicVolume);
    engine.audio.setMusicMuted(prefs.musicMuted);
    engine.audio.setSfxVolume(prefs.sfxVolume);
    engine.audio.setSfxMuted(prefs.sfxMuted);

    const clearHeldInputs = () => {
      engine.setInput({
        throttle: false,
        brake: false,
        left: false,
        right: false,
        drift: false,
        nitro: false,
        steerAxis: 0,
      });
    };

    const unlockOnGesture = () => {
      engine.unlockAudio();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearHeldInputs();
      } else {
        engine.audio.resumeIfNeeded();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.unlockAudio();
      const code = e.code;

      if (phaseRef.current === 'TITLE') {
        if (code === 'Escape' && titleViewRef.current !== 'HOME') {
          e.preventDefault();
          setTitleView('HOME');
          return;
        }
        if (code === 'Enter' && titleViewRef.current === 'HOME') {
          e.preventDefault();
          setTitleView('HOME');
          setNewRecords(null);
          engine.startRace(modeRef.current);
        }
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        if (phaseRef.current === 'RACING' || phaseRef.current === 'COUNTDOWN') {
          engine.pauseRace();
        } else if (phaseRef.current === 'PAUSED') {
          engine.resumeRace();
        }
        return;
      }

      if (
        code === 'KeyC' &&
        (phaseRef.current === 'RACING' || phaseRef.current === 'COUNTDOWN')
      ) {
        e.preventDefault();
        engine.cycleCameraMode();
        return;
      }

      if (code === 'KeyM') {
        const nextMuted = engine.audio.toggleSfxMute();
        setSfxMuted(nextMuted);
        return;
      }

      if (code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault();
        engine.setInput({ throttle: true });
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault();
        engine.setInput({ brake: true });
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        e.preventDefault();
        engine.setInput({ left: true });
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        e.preventDefault();
        engine.setInput({ right: true });
      } else if (code === 'Space') {
        e.preventDefault();
        engine.setInput({ drift: true });
      } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
        e.preventDefault();
        engine.setInput({ nitro: true });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') {
        engine.setInput({ throttle: false });
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        engine.setInput({ brake: false });
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        engine.setInput({ left: false });
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        engine.setInput({ right: false });
      } else if (code === 'Space') {
        engine.setInput({ drift: false });
      } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
        engine.setInput({ nitro: false });
      }
    };

    const handleFirstTouch = () => {
      engine.unlockAudio();
      setShowTouchControls(true);
    };

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('touchend', unlockOnGesture, { passive: true });
    window.addEventListener('click', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('touchend', unlockOnGesture);
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldInputs);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchstart', handleFirstTouch);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.audio.setJukeboxFocus(hud.phase === 'TITLE' && titleView === 'MUSIC');
    engineRef.current?.setGarageFocusMode(hud.phase === 'TITLE' && titleView === 'GARAGE');
  }, [hud.phase, titleView]);

  useEffect(() => {
    if (prevPhaseRef.current !== 'FINISHED' && hud.phase === 'FINISHED') {
      const res = recordRaceResult(records, hud);
      setRecords(res.store);
      setNewRecords(res.newRecords);
    }
    prevPhaseRef.current = hud.phase;
  }, [hud, records]);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const canDrag = titleViewRef.current === 'HOME' || titleViewRef.current === 'GARAGE';
    if (phaseRef.current !== 'TITLE' || !canDrag) return;
    engineRef.current?.unlockAudio();
    canvasPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (canvasPointersRef.current.size === 2) {
      const pts = Array.from(canvasPointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    } else if (canvasPointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture rejection
    }
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const canDrag = titleViewRef.current === 'HOME' || titleViewRef.current === 'GARAGE';
    if (phaseRef.current !== 'TITLE' || !canDrag) return;
    const prev = canvasPointersRef.current.get(e.pointerId);
    if (!prev) return;

    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    canvasPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (canvasPointersRef.current.size >= 2) {
      const pts = Array.from(canvasPointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (lastPinchDistRef.current !== null) {
        const delta = dist - lastPinchDistRef.current;
        if (Math.abs(delta) > 0.5) {
          engineRef.current?.zoomGaragePreview(-delta * 0.004);
        }
      }
      lastPinchDistRef.current = dist;
    } else {
      engineRef.current?.rotateGaragePreview(dx, dy);
    }
  }, []);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    canvasPointersRef.current.delete(e.pointerId);
    if (canvasPointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore synthetic pointer release rejection
    }
  }, []);

  const handleCanvasWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const canZoom = titleViewRef.current === 'HOME' || titleViewRef.current === 'GARAGE';
    if (phaseRef.current !== 'TITLE' || !canZoom) return;
    engineRef.current?.zoomGaragePreview(e.deltaY > 0 ? 0.08 : -0.08);
  }, []);

  const handleSelectVehicle = useCallback((spec: VehicleSpec) => {
    engineRef.current?.unlockAudio();
    setSelectedVehicle(spec);
    engineRef.current?.setVehicle(spec);
    const defaultPreset = CAR_COLOR_PRESETS.find((p) => p.id === spec.defaultPaintId);
    if (defaultPreset) {
      setSelectedPreset(defaultPreset);
      setSelectedNeonHex(defaultPreset.accentHex);
      engineRef.current?.setPlayerColor(defaultPreset);
      savePlayerPreferences({
        vehicleId: spec.id,
        paintId: defaultPreset.id,
        neonHex: defaultPreset.accentHex,
      });
    } else {
      savePlayerPreferences({ vehicleId: spec.id });
    }
  }, []);

  const handleSelectPreset = useCallback((preset: CarColorPreset) => {
    engineRef.current?.unlockAudio();
    setSelectedPreset(preset);
    setSelectedNeonHex(preset.accentHex);
    engineRef.current?.setPlayerColor(preset);
    savePlayerPreferences({ paintId: preset.id, neonHex: preset.accentHex });
  }, []);

  const handleSelectWheelPreset = useCallback((preset: CarWheelPreset) => {
    engineRef.current?.unlockAudio();
    setSelectedWheelPreset(preset);
    engineRef.current?.setWheelPreset(preset);
    savePlayerPreferences({ wheelId: preset.id });
  }, []);

  const handleSelectNeonHex = useCallback((hex: number) => {
    engineRef.current?.unlockAudio();
    setSelectedNeonHex(hex);
    engineRef.current?.setNeonColor(hex);
    savePlayerPreferences({ neonHex: hex });
  }, []);

  const handleGarageViewPreset = useCallback(
    (view: '34' | 'FRONT' | 'SIDE' | 'REAR' | 'TOP') => {
      engineRef.current?.unlockAudio();
      engineRef.current?.setGarageViewPreset(view);
    },
    [],
  );

  const handleGarageZoom = useCallback((delta: number) => {
    engineRef.current?.unlockAudio();
    engineRef.current?.zoomGaragePreview(delta);
  }, []);

  const handleGarageResetCamera = useCallback(() => {
    engineRef.current?.unlockAudio();
    engineRef.current?.resetGaragePreview();
  }, []);

  const handleSelectMode = useCallback((mode: GameModeId) => {
    engineRef.current?.unlockAudio();
    setSelectedMode(mode);
    engineRef.current?.setMode(mode);
    savePlayerPreferences({ modeId: mode });
  }, []);

  const handleToggleTruckArt = useCallback(() => {
    engineRef.current?.unlockAudio();
    setTruckArtEnabled((prev) => {
      const next = !prev;
      engineRef.current?.setTruckArtEnabled(next);
      savePlayerPreferences({ truckArtEnabled: next });
      return next;
    });
  }, []);

  const handleSelectGraphicsQuality = useCallback((quality: GraphicsQuality) => {
    engineRef.current?.unlockAudio();
    engineRef.current?.setGraphicsQuality(quality, true);
  }, []);

  const handleToggleTouchSteerMode = useCallback(() => {
    engineRef.current?.unlockAudio();
    setTouchSteerMode((prev) => {
      const next: TouchSteerMode = prev === 'BUTTONS' ? 'WHEEL' : 'BUTTONS';
      savePlayerPreferences({ touchSteerMode: next });
      return next;
    });
  }, []);

  const handleResetRecords = useCallback(() => {
    setRecords(resetRecords());
    setNewRecords(null);
  }, []);

  const handleStartRace = useCallback(() => {
    setTitleView('HOME');
    setNewRecords(null);
    engineRef.current?.startRace(modeRef.current);
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseRace();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeRace();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setTitleView('HOME');
    setNewRecords(null);
    engineRef.current?.returnToTitle();
  }, []);

  const handleCycleCamera = useCallback(() => {
    engineRef.current?.unlockAudio();
    engineRef.current?.cycleCameraMode();
  }, []);

  const handleToggleMirror = useCallback(() => {
    engineRef.current?.toggleMirror();
  }, []);

  const handleMirrorRectChange = useCallback((rect: MirrorViewportRect | null) => {
    engineRef.current?.setMirrorViewportRect(rect);
  }, []);

  const handleToggleSfxMute = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const muted = engineRef.current.audio.toggleSfxMute();
    setSfxMuted(muted);
    savePlayerPreferences({ sfxMuted: muted });
  }, []);

  const handleSfxVolumeChange = useCallback((nextVol: number) => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    engineRef.current.audio.setSfxVolume(nextVol);
    setSfxVolume(nextVol);
    let mutedState = engineRef.current.audio.isSfxMuted();
    if (nextVol > 0 && mutedState) {
      engineRef.current.audio.setSfxMuted(false);
      setSfxMuted(false);
      mutedState = false;
    } else if (nextVol === 0) {
      engineRef.current.audio.setSfxMuted(true);
      setSfxMuted(true);
      mutedState = true;
    }
    savePlayerPreferences({ sfxVolume: nextVol, sfxMuted: mutedState });
  }, []);

  const handleToggleMusicMute = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const muted = engineRef.current.audio.toggleMusicMute();
    setMusicMuted(muted);
    setMusicPlaying(engineRef.current.audio.isMusicPlaying());
    savePlayerPreferences({ musicMuted: muted });
  }, []);

  const handleMusicVolumeChange = useCallback((nextVol: number) => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    engineRef.current.audio.setMusicVolume(nextVol);
    setMusicVolume(nextVol);
    let mutedState = engineRef.current.audio.isMusicMuted();
    if (nextVol > 0 && mutedState) {
      engineRef.current.audio.setMusicMuted(false);
      setMusicMuted(false);
      mutedState = false;
    } else if (nextVol === 0) {
      engineRef.current.audio.setMusicMuted(true);
      setMusicMuted(true);
      mutedState = true;
    }
    setMusicPlaying(engineRef.current.audio.isMusicPlaying());
    savePlayerPreferences({ musicVolume: nextVol, musicMuted: mutedState });
  }, []);

  const handleSelectMusicTrack = useCallback((trackId: string) => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const track = engineRef.current.audio.selectMusicTrack(trackId);
    const muted = engineRef.current.audio.isMusicMuted();
    setCurrentMusicTrack(track);
    setMusicMuted(muted);
    setMusicPlaying(engineRef.current.audio.isMusicPlaying());
    savePlayerPreferences({ musicTrackId: track.id, musicMuted: muted });
  }, []);

  const handleToggleMusicPlaying = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const playing = engineRef.current.audio.toggleMusicPlaying();
    const muted = engineRef.current.audio.isMusicMuted();
    setMusicPlaying(playing);
    setMusicMuted(muted);
    savePlayerPreferences({ musicMuted: muted });
  }, []);

  const handleNextMusicTrack = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const track = engineRef.current.audio.nextMusicTrack();
    const muted = engineRef.current.audio.isMusicMuted();
    setCurrentMusicTrack(track);
    setMusicMuted(muted);
    setMusicPlaying(engineRef.current.audio.isMusicPlaying());
    savePlayerPreferences({ musicTrackId: track.id, musicMuted: muted });
  }, []);

  const handlePrevMusicTrack = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    const track = engineRef.current.audio.prevMusicTrack();
    const muted = engineRef.current.audio.isMusicMuted();
    setCurrentMusicTrack(track);
    setMusicMuted(muted);
    setMusicPlaying(engineRef.current.audio.isMusicPlaying());
    savePlayerPreferences({ musicTrackId: track.id, musicMuted: muted });
  }, []);

  const handleTouchInput = useCallback((patch: Partial<InputState>) => {
    engineRef.current?.unlockAudio();
    engineRef.current?.setInput(patch);
  }, []);

  const touchVisible =
    showTouchControls && (hud.phase === 'RACING' || hud.phase === 'COUNTDOWN');

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070913]">
      {/* Isolated WebGL Canvas Mount (supports 3D Garage 1-finger orbit & 2-finger pinch zoom) */}
      <div
        ref={canvasMountRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onWheel={handleCanvasWheel}
        className={`absolute inset-0 w-full h-full touch-canvas ${
          hud.phase === 'TITLE' && (titleView === 'HOME' || titleView === 'GARAGE')
            ? 'cursor-grab active:cursor-grabbing'
            : ''
        }`}
      />

      {/* Interactive AAA Showroom, 3D Garage, Tracks & Modes, & Music Playlist */}
      {hud.phase === 'TITLE' && (
        <TitleOverlay
          activeView={titleView}
          selectedVehicle={selectedVehicle}
          selectedPreset={selectedPreset}
          selectedWheelPreset={selectedWheelPreset}
          selectedNeonHex={selectedNeonHex}
          selectedMode={selectedMode}
          truckArtEnabled={truckArtEnabled}
          graphicsQuality={hud.graphicsQuality}
          currentMusicTrack={currentMusicTrack}
          musicPlaying={musicPlaying}
          sfxMuted={sfxMuted}
          sfxVolume={sfxVolume}
          musicMuted={musicMuted}
          musicVolume={musicVolume}
          records={records}
          pwa={pwa}
          onChangeView={setTitleView}
          onSelectVehicle={handleSelectVehicle}
          onSelectPreset={handleSelectPreset}
          onSelectWheelPreset={handleSelectWheelPreset}
          onSelectNeonHex={handleSelectNeonHex}
          onGarageViewPreset={handleGarageViewPreset}
          onGarageZoom={handleGarageZoom}
          onGarageResetCamera={handleGarageResetCamera}
          onSelectMode={handleSelectMode}
          onToggleTruckArt={handleToggleTruckArt}
          onSelectGraphicsQuality={handleSelectGraphicsQuality}
          onResetRecords={handleResetRecords}
          onSelectMusicTrack={handleSelectMusicTrack}
          onToggleMusicPlaying={handleToggleMusicPlaying}
          onNextMusicTrack={handleNextMusicTrack}
          onPrevMusicTrack={handlePrevMusicTrack}
          onToggleSfxMute={handleToggleSfxMute}
          onSfxVolumeChange={handleSfxVolumeChange}
          onToggleMusicMute={handleToggleMusicMute}
          onMusicVolumeChange={handleMusicVolumeChange}
          onStartRace={handleStartRace}
        />
      )}

      {/* Racing HUD */}
      <GameHUD
        hud={hud}
        sfxMuted={sfxMuted}
        musicMuted={musicMuted}
        currentTrackTitle={`${currentMusicTrack.number} · ${currentMusicTrack.title}`}
        showTouchControls={touchVisible}
        isHardwareMirror={hud.isHardwareMirror}
        onToggleSfxMute={handleToggleSfxMute}
        onToggleMusicMute={handleToggleMusicMute}
        onNextMusicTrack={handleNextMusicTrack}
        onCycleCamera={handleCycleCamera}
        onMirrorRectChange={handleMirrorRectChange}
        onPause={handlePause}
      />

      {/* Responsive Mobile Touch Controls */}
      <TouchControls
        visible={touchVisible}
        steerMode={touchSteerMode}
        onToggleSteerMode={handleToggleTouchSteerMode}
        onInputChange={handleTouchInput}
      />

      {/* Pause Modal */}
      {hud.phase === 'PAUSED' && (
        <PauseModal
          currentMusicTrack={currentMusicTrack}
          musicPlaying={musicPlaying}
          sfxMuted={sfxMuted}
          sfxVolume={sfxVolume}
          musicMuted={musicMuted}
          musicVolume={musicVolume}
          showTouchControls={showTouchControls}
          touchSteerMode={touchSteerMode}
          graphicsQuality={hud.graphicsQuality}
          mirrorEnabled={hud.mirrorEnabled}
          isOnline={pwa.isOnline}
          isOfflineReady={pwa.isOfflineReady}
          onResume={handleResume}
          onRestart={handleStartRace}
          onToggleMusicPlaying={handleToggleMusicPlaying}
          onNextMusicTrack={handleNextMusicTrack}
          onPrevMusicTrack={handlePrevMusicTrack}
          onToggleSfxMute={handleToggleSfxMute}
          onSfxVolumeChange={handleSfxVolumeChange}
          onToggleMusicMute={handleToggleMusicMute}
          onMusicVolumeChange={handleMusicVolumeChange}
          onToggleTouch={() =>
            setShowTouchControls((v) => {
              const next = !v;
              savePlayerPreferences({ showTouchControls: next });
              return next;
            })
          }
          onToggleTouchSteerMode={handleToggleTouchSteerMode}
          onSelectGraphicsQuality={handleSelectGraphicsQuality}
          onToggleMirror={handleToggleMirror}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* Race Results / Restart Modal */}
      {hud.phase === 'FINISHED' && (
        <ResultsModal
          hud={hud}
          newRecords={newRecords}
          onRestart={handleStartRace}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
