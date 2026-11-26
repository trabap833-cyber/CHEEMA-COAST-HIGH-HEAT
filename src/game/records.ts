import { GAME_MODES, GameModeId, HudSnapshot } from './types';

const STORAGE_KEY = 'cheema_coast_records_v1';

export interface ModeRecord {
  highScore: number;
  bestLapMs: number | null;
  bestRaceTimeMs: number | null;
  maxTakedowns: number;
  bestTopSpeedKmh: number;
  recordVehicleName: string;
  plays: number;
  wins: number;
}

export interface CareerStats {
  totalRaces: number;
  totalWins: number;
  totalTakedowns: number;
  highestTopSpeedKmh: number;
}

export interface RecordsStore {
  modes: Record<GameModeId, ModeRecord>;
  career: CareerStats;
}

export interface NewRecordFlags {
  highScore: boolean;
  bestLap: boolean;
  bestRaceTime: boolean;
  maxTakedowns: boolean;
  topSpeed: boolean;
}

function createEmptyModeRecord(): ModeRecord {
  return {
    highScore: 0,
    bestLapMs: null,
    bestRaceTimeMs: null,
    maxTakedowns: 0,
    bestTopSpeedKmh: 0,
    recordVehicleName: '',
    plays: 0,
    wins: 0,
  };
}

export function createEmptyRecordsStore(): RecordsStore {
  const modes = {} as Record<GameModeId, ModeRecord>;
  for (const m of GAME_MODES) {
    modes[m.id] = createEmptyModeRecord();
  }
  return {
    modes,
    career: {
      totalRaces: 0,
      totalWins: 0,
      totalTakedowns: 0,
      highestTopSpeedKmh: 0,
    },
  };
}

export function loadRecords(): RecordsStore {
  const base = createEmptyRecordsStore();
  try {
    if (typeof window === 'undefined' || !window.localStorage) return base;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<RecordsStore>;
    if (parsed.modes && typeof parsed.modes === 'object') {
      for (const m of GAME_MODES) {
        const rec = parsed.modes[m.id];
        if (rec && typeof rec === 'object') {
          base.modes[m.id] = {
            highScore: typeof rec.highScore === 'number' && Number.isFinite(rec.highScore) ? rec.highScore : 0,
            bestLapMs: typeof rec.bestLapMs === 'number' && Number.isFinite(rec.bestLapMs) ? rec.bestLapMs : null,
            bestRaceTimeMs:
              typeof rec.bestRaceTimeMs === 'number' && Number.isFinite(rec.bestRaceTimeMs)
                ? rec.bestRaceTimeMs
                : null,
            maxTakedowns:
              typeof rec.maxTakedowns === 'number' && Number.isFinite(rec.maxTakedowns)
                ? rec.maxTakedowns
                : 0,
            bestTopSpeedKmh:
              typeof rec.bestTopSpeedKmh === 'number' && Number.isFinite(rec.bestTopSpeedKmh)
                ? rec.bestTopSpeedKmh
                : 0,
            recordVehicleName: typeof rec.recordVehicleName === 'string' ? rec.recordVehicleName : '',
            plays: typeof rec.plays === 'number' && Number.isFinite(rec.plays) ? rec.plays : 0,
            wins: typeof rec.wins === 'number' && Number.isFinite(rec.wins) ? rec.wins : 0,
          };
        }
      }
    }
    if (parsed.career && typeof parsed.career === 'object') {
      base.career = {
        totalRaces:
          typeof parsed.career.totalRaces === 'number' ? parsed.career.totalRaces : 0,
        totalWins:
          typeof parsed.career.totalWins === 'number' ? parsed.career.totalWins : 0,
        totalTakedowns:
          typeof parsed.career.totalTakedowns === 'number' ? parsed.career.totalTakedowns : 0,
        highestTopSpeedKmh:
          typeof parsed.career.highestTopSpeedKmh === 'number'
            ? parsed.career.highestTopSpeedKmh
            : 0,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return base;
}

function saveRecords(store: RecordsStore): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota / privacy mode write errors
  }
}

export function resetRecords(): RecordsStore {
  const empty = createEmptyRecordsStore();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
  return empty;
}

export function recordRaceResult(
  current: RecordsStore,
  hud: HudSnapshot,
): { store: RecordsStore; newRecords: NewRecordFlags } {
  const prev = current.modes[hud.mode] ?? createEmptyModeRecord();
  const nextModes: Record<GameModeId, ModeRecord> = { ...current.modes };

  const isTimeRace =
    hud.mode === 'CIRCUIT_RACE' ||
    hud.mode === 'DRAG_STRIP' ||
    hud.mode === 'TIME_TRIAL' ||
    hud.mode === 'MIDNIGHT_RUN' ||
    hud.mode === 'CHECKPOINT_BLITZ' ||
    hud.mode === 'ZIGZAG_SERPENTINE' ||
    hud.mode === 'WAVY_COASTER' ||
    hud.mode === 'MOUNTAIN_HAIRPIN_PASS' ||
    hud.mode === 'DESERT_CANYON_HIGHWAY' ||
    hud.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
    hud.mode === 'KARAKORUM_SKY_PASS' ||
    hud.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
    hud.mode === 'LAHORE_MIDNIGHT_GP' ||
    hud.mode === 'GWADAR_PORT_DOCKS' ||
    hud.mode === 'EMERALD_VALLEY_LOOP';

  const newHighScore = hud.score > 0 && hud.score > prev.highScore;
  const candidateLap = hud.bestLapMs;
  const newBestLap =
    candidateLap !== null &&
    candidateLap > 1000 &&
    (prev.bestLapMs === null || candidateLap < prev.bestLapMs);

  const validFinishTime = isTimeRace && hud.victory && hud.raceTimeMs > 1000;
  const newBestRaceTime =
    validFinishTime && (prev.bestRaceTimeMs === null || hud.raceTimeMs < prev.bestRaceTimeMs);

  const newMaxTakedowns = hud.takedowns > 0 && hud.takedowns > prev.maxTakedowns;
  const newTopSpeed =
    hud.topSpeedKmh > 0 && hud.topSpeedKmh > current.career.highestTopSpeedKmh;

  const updatedMode: ModeRecord = {
    highScore: newHighScore ? hud.score : prev.highScore,
    bestLapMs: newBestLap ? candidateLap : prev.bestLapMs,
    bestRaceTimeMs: newBestRaceTime ? hud.raceTimeMs : prev.bestRaceTimeMs,
    maxTakedowns: newMaxTakedowns ? hud.takedowns : prev.maxTakedowns,
    bestTopSpeedKmh: Math.max(prev.bestTopSpeedKmh, hud.topSpeedKmh),
    recordVehicleName:
      newHighScore || newBestLap || newBestRaceTime || !prev.recordVehicleName
        ? hud.vehicleName
        : prev.recordVehicleName,
    plays: prev.plays + 1,
    wins: prev.wins + (hud.victory ? 1 : 0),
  };

  nextModes[hud.mode] = updatedMode;

  const updatedStore: RecordsStore = {
    modes: nextModes,
    career: {
      totalRaces: current.career.totalRaces + 1,
      totalWins: current.career.totalWins + (hud.victory ? 1 : 0),
      totalTakedowns: current.career.totalTakedowns + hud.takedowns,
      highestTopSpeedKmh: Math.max(current.career.highestTopSpeedKmh, hud.topSpeedKmh),
    },
  };

  saveRecords(updatedStore);

  return {
    store: updatedStore,
    newRecords: {
      highScore: newHighScore,
      bestLap: newBestLap,
      bestRaceTime: newBestRaceTime,
      maxTakedowns: newMaxTakedowns,
      topSpeed: newTopSpeed,
    },
  };
}
