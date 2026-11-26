import {
  CAR_COLOR_PRESETS,
  CAR_WHEEL_PRESETS,
  GAME_MODES,
  GameModeId,
  MUSIC_TRACKS,
  TouchSteerMode,
  VEHICLES,
} from './types';

const PREFS_STORAGE_KEY = 'cheema_coast_prefs_v1';

export interface PlayerPreferences {
  vehicleId: string;
  paintId: string;
  wheelId: string;
  neonHex: number;
  modeId: GameModeId;
  truckArtEnabled: boolean;
  musicTrackId: string;
  musicVolume: number;
  musicMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
  touchSteerMode: TouchSteerMode;
  showTouchControls: boolean | null;
}

const DEFAULT_PREFERENCES: PlayerPreferences = {
  vehicleId: VEHICLES[0].id,
  paintId: CAR_COLOR_PRESETS[0].id,
  wheelId: CAR_WHEEL_PRESETS[0].id,
  neonHex: CAR_COLOR_PRESETS[0].accentHex,
  modeId: 'CIRCUIT_RACE',
  truckArtEnabled: true,
  musicTrackId: MUSIC_TRACKS[0].id,
  musicVolume: 0.72,
  musicMuted: false,
  sfxVolume: 0.85,
  sfxMuted: false,
  touchSteerMode: 'BUTTONS',
  showTouchControls: null,
};

function clampUnit(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

export function loadPlayerPreferences(): PlayerPreferences {
  const base: PlayerPreferences = { ...DEFAULT_PREFERENCES };
  try {
    if (typeof window === 'undefined' || !window.localStorage) return base;
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PlayerPreferences>;
    if (!parsed || typeof parsed !== 'object') return base;

    if (typeof parsed.vehicleId === 'string' && VEHICLES.some((v) => v.id === parsed.vehicleId)) {
      base.vehicleId = parsed.vehicleId;
    }
    if (
      typeof parsed.paintId === 'string' &&
      CAR_COLOR_PRESETS.some((p) => p.id === parsed.paintId)
    ) {
      base.paintId = parsed.paintId;
    }
    if (
      typeof parsed.wheelId === 'string' &&
      CAR_WHEEL_PRESETS.some((w) => w.id === parsed.wheelId)
    ) {
      base.wheelId = parsed.wheelId;
    }
    if (typeof parsed.neonHex === 'number' && Number.isFinite(parsed.neonHex)) {
      base.neonHex = parsed.neonHex;
    }
    if (typeof parsed.modeId === 'string' && GAME_MODES.some((m) => m.id === parsed.modeId)) {
      base.modeId = parsed.modeId as GameModeId;
    }
    if (typeof parsed.truckArtEnabled === 'boolean') {
      base.truckArtEnabled = parsed.truckArtEnabled;
    }
    if (
      typeof parsed.musicTrackId === 'string' &&
      MUSIC_TRACKS.some((t) => t.id === parsed.musicTrackId)
    ) {
      base.musicTrackId = parsed.musicTrackId;
    }
    base.musicVolume = clampUnit(parsed.musicVolume, base.musicVolume);
    if (typeof parsed.musicMuted === 'boolean') {
      base.musicMuted = parsed.musicMuted;
    }
    base.sfxVolume = clampUnit(parsed.sfxVolume, base.sfxVolume);
    if (typeof parsed.sfxMuted === 'boolean') {
      base.sfxMuted = parsed.sfxMuted;
    }
    if (parsed.touchSteerMode === 'BUTTONS' || parsed.touchSteerMode === 'WHEEL') {
      base.touchSteerMode = parsed.touchSteerMode;
    }
    if (typeof parsed.showTouchControls === 'boolean' || parsed.showTouchControls === null) {
      base.showTouchControls = parsed.showTouchControls;
    }
  } catch {
    // Ignore storage read errors in restricted offline modes
  }
  return base;
}

export function savePlayerPreferences(patch: Partial<PlayerPreferences>): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = loadPlayerPreferences();
    const merged: PlayerPreferences = { ...current, ...patch };
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota or private browsing write errors
  }
}
