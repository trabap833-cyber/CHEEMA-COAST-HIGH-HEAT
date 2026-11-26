import React, { useEffect, useRef } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudFog,
  CloudRain,
  Music,
  Pause,
  ShieldAlert,
  SkipForward,
  Star,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GAME_MODES, HudSnapshot, MirrorViewportRect, RearMirrorBlip } from '../game/types';

export function formatRaceTime(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((totalSeconds * 100) % 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

export function formatShortSec(ms: number): string {
  const s = Math.max(0, ms / 1000);
  return `${s.toFixed(1)}s`;
}

function formatOrdinal(n: number): string {
  if (n === 1) return '1ST';
  if (n === 2) return '2ND';
  if (n === 3) return '3RD';
  return `${n}TH`;
}

interface GameHUDProps {
  hud: HudSnapshot;
  sfxMuted: boolean;
  musicMuted: boolean;
  currentTrackTitle?: string;
  showTouchControls: boolean;
  isHardwareMirror: boolean;
  onToggleSfxMute: () => void;
  onToggleMusicMute: () => void;
  onNextMusicTrack?: () => void;
  onCycleCamera: () => void;
  onMirrorRectChange?: (rect: MirrorViewportRect | null) => void;
  onPause: () => void;
}

const MirrorFallbackCanvas: React.FC<{
  blips: RearMirrorBlip[];
  speedKmh: number;
}> = ({ blips, speedKmh }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Horizon sky & receding dark asphalt road
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    sky.addColorStop(0, '#091126');
    sky.addColorStop(1, '#1e2948');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.42);

    ctx.fillStyle = '#151924';
    ctx.fillRect(0, h * 0.42, w, h * 0.58);

    // Perspective road trapezoid
    ctx.fillStyle = '#1d2230';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.42);
    ctx.lineTo(w * 0.64, h * 0.42);
    ctx.lineTo(w * 0.96, h);
    ctx.lineTo(w * 0.04, h);
    ctx.closePath();
    ctx.fill();

    // Dashed center line
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.42);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rear blips rendered as approaching vehicle silhouettes + headlights
    for (const b of blips) {
      const depth = Math.max(0.05, Math.min(1, 1 - b.distM / 88));
      const y = h * (0.43 + depth * 0.5);
      // Mirror flips left/right relative to driver view
      const x = w * 0.5 - (b.lateralOffset / 12) * w * (0.28 + depth * 0.35);
      const carW = 6 + depth * 22;
      const carH = 3 + depth * 10;

      ctx.fillStyle = b.isPolice ? '#0f172a' : b.color;
      ctx.fillRect(x - carW * 0.5, y - carH, carW, carH);

      // Headlights
      ctx.fillStyle = b.isPolice ? '#f8fafc' : '#fde68a';
      ctx.fillRect(x - carW * 0.42, y - carH * 0.5, Math.max(2, carW * 0.2), 2);
      ctx.fillRect(x + carW * 0.22, y - carH * 0.5, Math.max(2, carW * 0.2), 2);

      if (b.isPolice) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - carW * 0.3, y - carH - 2, carW * 0.28, 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + carW * 0.02, y - carH - 2, carW * 0.28, 2);
      }
    }

    if (speedKmh > 120) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.fillRect(0, 0, w, h);
    }
  }, [blips, speedKmh]);

  return (
    <canvas
      ref={canvasRef}
      width={270}
      height={68}
      className="w-full h-full block"
    />
  );
};

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  sfxMuted,
  musicMuted,
  currentTrackTitle,
  showTouchControls,
  isHardwareMirror,
  onToggleSfxMute,
  onToggleMusicMute,
  onNextMusicTrack,
  onCycleCamera,
  onMirrorRectChange,
  onPause,
}) => {
  const mirrorGlassRef = useRef<HTMLDivElement | null>(null);
  const showMirror =
    hud.mirrorEnabled && (hud.phase === 'RACING' || hud.phase === 'COUNTDOWN');

  useEffect(() => {
    if (!onMirrorRectChange) return;
    if (!showMirror || !isHardwareMirror) {
      onMirrorRectChange(null);
      return;
    }

    const reportRect = () => {
      const el = mirrorGlassRef.current;
      if (!el) {
        onMirrorRectChange(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4) {
        onMirrorRectChange({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        });
      } else {
        onMirrorRectChange(null);
      }
    };

    reportRect();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reportRect) : null;
    if (ro && mirrorGlassRef.current) {
      ro.observe(mirrorGlassRef.current);
    }
    window.addEventListener('resize', reportRect);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', reportRect);
      onMirrorRectChange(null);
    };
  }, [showMirror, isHardwareMirror, onMirrorRectChange]);

  if (hud.phase === 'TITLE') return null;

  const modeCfg = GAME_MODES.find((m) => m.id === hud.mode) ?? GAME_MODES[0];

  const isOpenLoop = hud.mode === 'DRAG_STRIP';
  const polyPoints = hud.minimapPath
    .map((p) => `${(p.x * 82 + 9).toFixed(1)},${(p.z * 82 + 9).toFixed(1)}`)
    .join(' ');
  const startPt = hud.minimapPath[0];

  const isCircuitHudMode =
    hud.mode === 'CIRCUIT_RACE' ||
    hud.mode === 'MIDNIGHT_RUN' ||
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

  const hasPolicePursuit =
    isCircuitHudMode || hud.mode === 'POLICE_ESCAPE';

  const alertText =
    hud.pursuitAlert === 'TAKEDOWN'
      ? 'TAKEDOWN ATTEMPT!'
      : hud.pursuitAlert === 'LOCK_ON'
        ? 'POLICE LOCK-ON'
        : 'PURSUIT HEAT';

  const playerHeadingDeg = (-hud.playerHeadingRad * 180) / Math.PI;
  const cameraShortLabel =
    hud.cameraMode === 'HOOD'
      ? 'HOOD'
      : hud.cameraMode === 'COCKPIT'
        ? 'COCKPIT'
        : 'CHASE';

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-5">
      {/* Screen-Edge Impact Flash Vignette */}
      {hud.impactFlash > 0.02 && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            boxShadow: `inset 0 0 110px rgba(239, 68, 68, ${(hud.impactFlash * 0.72).toFixed(3)})`,
          }}
        />
      )}

      {/* Brief Slow-Mo Takedown Indicator (non-blocking) */}
      {hud.slowMoActive && (
        <div className="fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/70 text-[10px] font-black tracking-[0.22em] text-amber-300 uppercase whitespace-nowrap">
            TAKEDOWN SLOW-MO
          </span>
        </div>
      )}

      {/* Top Bar */}
      <div className="relative flex items-start justify-between gap-2 sm:gap-3 z-10">
        {/* Top-Left: Mode-Specific Telemetry + Pursuit */}
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
          {isCircuitHudMode && (
            <div className="flex items-stretch gap-1.5 sm:gap-2">
              <div className="bg-[#080c19]/90 border border-cyan-400/35 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 flex flex-col justify-center min-w-[62px] sm:min-w-[74px]">
                <span className="text-[10px] font-bold tracking-widest text-cyan-300/80 uppercase">
                  POS
                </span>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-none">
                    {formatOrdinal(hud.position)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/{hud.totalRacers}</span>
                </div>
              </div>

              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                    LAP
                  </span>
                  <span className="text-lg sm:text-xl font-black font-display text-white tabular-nums leading-none">
                    {hud.lap}
                    <span className="text-slate-400 text-sm">/{hud.totalLaps}</span>
                  </span>
                </div>
                <div className="h-7 w-px bg-white/15" />
                <div className="tabular-nums">
                  <div className="text-[11px] font-bold text-cyan-300 leading-tight">
                    {formatRaceTime(hud.raceTimeMs)}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-300 leading-tight">
                    PTS {hud.score.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {hud.mode === 'POLICE_ESCAPE' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-rose-400/50 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-rose-300 uppercase">
                  ESCAPE IN
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white tabular-nums leading-none">
                  {formatRaceTime(hud.modeTimerMs)}
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                  SCORE {hud.score.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm font-black text-cyan-300 mt-0.5">
                  EVADED: {hud.takedowns} · NEAR: {hud.nearMisses}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'DRAG_STRIP' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-amber-400/45 rounded-lg px-3 py-2 flex flex-col justify-center min-w-[90px]">
                <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                  DRAG FINISH
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white tabular-nums leading-none">
                  {hud.dragProgress}%
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  POS {formatOrdinal(hud.position)} / 2
                </span>
                <span className="text-sm font-black text-cyan-300 mt-0.5">
                  {formatRaceTime(hud.raceTimeMs)}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'DRIFT_TOUGE' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-emerald-400/45 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                  DRIFT SCORE
                </span>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-black font-display text-white leading-none">
                    {hud.driftScore.toLocaleString()}
                  </span>
                  {hud.comboMultiplier > 1 && (
                    <span className="text-sm font-black text-amber-300">
                      x{hud.comboMultiplier}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  TIME LEFT
                </span>
                <span className="text-lg font-black font-display text-cyan-300 leading-none mt-0.5">
                  {formatShortSec(hud.modeTimerMs)}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'TIME_TRIAL' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-sky-400/45 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-sky-300 uppercase">
                  LAP {hud.lap}/{hud.totalLaps}
                </span>
                <span className="text-xl sm:text-2xl font-black font-display text-white tabular-nums leading-none">
                  {formatRaceTime(hud.currentLapMs)}
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  BEST LAP
                </span>
                <span className="text-sm font-black text-amber-300 mt-0.5">
                  {hud.bestLapMs !== null ? formatRaceTime(hud.bestLapMs) : '--:--.--'}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'KNOCKOUT' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-orange-400/50 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-orange-300 uppercase">
                  NEXT ELIM
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white tabular-nums leading-none">
                  {formatShortSec(hud.knockoutNextMs)}
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  POS {formatOrdinal(hud.position)}
                </span>
                <span className="text-sm font-black text-amber-300 mt-0.5">
                  {hud.totalRacers} ALIVE
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'TRAFFIC_RUSH' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-yellow-400/50 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-yellow-300 uppercase">
                  RUSH SCORE
                </span>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-black font-display text-white leading-none">
                    {hud.score.toLocaleString()}
                  </span>
                  {hud.comboMultiplier > 1 && (
                    <span className="text-sm font-black text-amber-300">
                      x{hud.comboMultiplier}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {formatShortSec(hud.modeTimerMs)} LEFT
                </span>
                <span className="text-sm font-black text-cyan-300 mt-0.5">
                  NEAR MISSES: {hud.nearMisses}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'CHECKPOINT_BLITZ' && (
            <div className="flex items-stretch gap-2">
              <div
                className={`bg-[#080c19]/90 border rounded-lg px-3 py-2 flex flex-col justify-center ${
                  hud.modeTimerMs < 7000 ? 'border-rose-500' : 'border-orange-400/50'
                }`}
              >
                <span className="text-[10px] font-bold tracking-widest text-orange-300 uppercase">
                  BLITZ CLOCK
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white tabular-nums leading-none">
                  {formatShortSec(hud.modeTimerMs)}
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  GATES
                </span>
                <span className="text-lg font-black font-display text-cyan-300 leading-none mt-0.5">
                  {hud.checkpointsCleared}/{hud.checkpointsTarget}
                </span>
              </div>
            </div>
          )}

          {hud.mode === 'COP_TAKEDOWN' && (
            <div className="flex items-stretch gap-2">
              <div className="bg-[#080c19]/90 border border-blue-400/55 rounded-lg px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">
                  SUSPECTS LEFT
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white tabular-nums leading-none">
                  {hud.suspectsRemaining}/{hud.suspectsTotal}
                </span>
              </div>
              <div className="bg-[#080c19]/90 border border-white/15 rounded-lg px-3 py-2 flex flex-col justify-center tabular-nums">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  PATROL CLOCK
                </span>
                <span className="text-lg font-black font-display text-rose-300 leading-none mt-0.5">
                  {formatShortSec(hud.modeTimerMs)}
                </span>
              </div>
            </div>
          )}

          {/* Police Pursuit Heat Bar */}
          {hasPolicePursuit && (
            <div
              className={`bg-[#080c19]/90 rounded-lg px-3 py-1.5 border ${
                hud.pursuitAlert === 'TAKEDOWN'
                  ? 'border-rose-500'
                  : hud.pursuitAlert === 'LOCK_ON'
                    ? 'border-amber-400/80'
                    : 'border-white/15'
              } max-w-[260px]`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-black tracking-widest">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldAlert
                    className={`w-3.5 h-3.5 ${
                      hud.pursuitAlert === 'TAKEDOWN'
                        ? 'text-rose-400'
                        : hud.pursuitAlert === 'LOCK_ON'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                    }`}
                  />
                  {alertText}
                </span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= hud.wantedStars
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </span>
              </div>

              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${hud.policeHeat}%`,
                    background:
                      hud.pursuitAlert === 'TAKEDOWN'
                        ? 'linear-gradient(90deg, #ef4444, #3b82f6)'
                        : 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                  }}
                />
              </div>

              {hud.mode === 'POLICE_ESCAPE' && hud.bustProgress > 0 && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-rose-400">
                    <span>BUST RISK</span>
                    <span className="tabular-nums">{hud.bustProgress}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-75"
                      style={{ width: `${hud.bustProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 px-0.5">
            <span className="hidden sm:inline text-[10px] font-bold tracking-widest text-slate-300/80 uppercase">
              {modeCfg.shortName} · {modeCfg.environmentName}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#080c19]/90 border text-[9px] sm:text-[10px] font-black tracking-wider uppercase tabular-nums ${
                hud.weatherCondition === 'RAIN'
                  ? 'border-cyan-400/50 text-cyan-300'
                  : hud.weatherCondition === 'FOGGY'
                    ? 'border-slate-400/50 text-slate-200'
                    : 'border-amber-400/50 text-amber-300'
              }`}
            >
              {hud.weatherCondition === 'RAIN' ? (
                <CloudRain className="w-3 h-3 text-cyan-300" />
              ) : hud.weatherCondition === 'FOGGY' ? (
                <CloudFog className="w-3 h-3 text-slate-300" />
              ) : (
                <Sun className="w-3 h-3 text-amber-300" />
              )}
              {hud.weatherCondition} · {hud.trackGripPercent}%
            </span>
          </div>
        </div>

        {/* Top-Center: Live Functional Rear-View Mirror */}
        {showMirror && (
          <div className="hidden md:flex flex-col items-center">
            <div
              className={`rounded-xl p-[3px] border-2 bg-[#070b17]/95 shadow-[0_8px_28px_rgba(0,0,0,0.65)] ${
                hud.policeCloseWarning
                  ? 'border-rose-500'
                  : 'border-slate-500/70'
              }`}
            >
              <div className="flex items-center justify-between px-2 py-0.5 text-[9px] font-black tracking-[0.2em] uppercase">
                <span className={hud.policeCloseWarning ? 'text-rose-400' : 'text-slate-400'}>
                  {hud.policeCloseWarning ? 'POLICE CLOSING IN!' : 'REAR-VIEW MIRROR'}
                </span>
                <span className="text-cyan-400/80">
                  {hud.rearBlips.length > 0 ? `${hud.rearBlips[hud.rearBlips.length - 1].distM}M` : 'CLEAR'}
                </span>
              </div>
              <div
                ref={mirrorGlassRef}
                className={`w-[220px] lg:w-[270px] h-[56px] lg:h-[68px] rounded-lg overflow-hidden border border-white/15 ${
                  isHardwareMirror ? 'bg-transparent' : 'bg-[#090d18]'
                }`}
              >
                {!isHardwareMirror && (
                  <MirrorFallbackCanvas
                    blips={hud.rearBlips}
                    speedKmh={hud.speedKmh}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top-Right: Upgraded Track Radar + Camera, Music, SFX & Pause Controls */}
        <div className="flex items-start gap-2 sm:gap-2.5 shrink-0">
          <div className="hidden sm:flex flex-col items-center gap-1">
            <div className="bg-[#080c19]/90 border border-white/15 rounded-lg p-1.5">
              <svg viewBox="0 0 100 100" className="block w-[76px] h-[76px] md:w-[98px] md:h-[98px]">
                {polyPoints &&
                  (isOpenLoop ? (
                    <polyline
                      points={polyPoints}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.55)"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                    />
                  ) : (
                    <polygon
                      points={polyPoints}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.45)"
                      strokeWidth="4.8"
                      strokeLinejoin="round"
                    />
                  ))}
                {startPt && (
                  <circle
                    cx={startPt.x * 82 + 9}
                    cy={startPt.z * 82 + 9}
                    r="2.8"
                    fill="#fbbf24"
                    stroke="#050811"
                    strokeWidth="1"
                  />
                )}
                {hud.minimapDots.map((dot) => {
                  if (dot.isPlayer) {
                    const cx = dot.x * 82 + 9;
                    const cy = dot.z * 82 + 9;
                    return (
                      <g
                        key={dot.id}
                        transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${playerHeadingDeg.toFixed(1)})`}
                      >
                        <polygon
                          points="0,-6.8 4.8,5.2 0,2.6 -4.8,5.2"
                          fill="#00f0ff"
                          stroke="#050811"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  }
                  if (dot.isPolice) {
                    return (
                      <rect
                        key={dot.id}
                        x={dot.x * 82 + 9 - 3.6}
                        y={dot.z * 82 + 9 - 3.6}
                        width="7.2"
                        height="7.2"
                        rx="1.8"
                        fill={dot.color}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    );
                  }
                  return (
                    <circle
                      key={dot.id}
                      cx={dot.x * 82 + 9}
                      cy={dot.z * 82 + 9}
                      r="3.4"
                      fill={dot.color}
                      stroke="#050811"
                      strokeWidth="1.2"
                    />
                  );
                })}
              </svg>
            </div>
            {hud.sharpTurnAhead && (
              <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/70 text-[10px] font-black tracking-wider text-amber-300 flex items-center gap-0.5 whitespace-nowrap">
                {hud.sharpTurnAhead === 'LEFT' ? (
                  <>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    TURN LEFT
                  </>
                ) : (
                  <>
                    TURN RIGHT
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-row gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onCycleCamera}
              title={`Switch Camera View (${cameraShortLabel} · Press C)`}
              aria-label={`Switch Camera View (${cameraShortLabel})`}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#080c19]/90 border border-white/20 hover:border-cyan-400/60 flex items-center justify-center gap-1.5 text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="hidden lg:inline text-[10px] font-black tracking-wider">
                {cameraShortLabel}
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleMusicMute}
              title={
                musicMuted
                  ? 'Unmute Music'
                  : currentTrackTitle
                    ? `Mute Music (${currentTrackTitle})`
                    : 'Mute Music'
              }
              aria-label={musicMuted ? 'Unmute Music' : 'Mute Music'}
              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#080c19]/90 border border-white/20 hover:border-cyan-400/60 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Music
                className={`w-4 h-4 ${musicMuted ? 'text-rose-400 opacity-60' : 'text-amber-300'}`}
              />
            </button>
            {onNextMusicTrack && (
              <button
                type="button"
                onClick={onNextMusicTrack}
                title={currentTrackTitle ? `Next Track (${currentTrackTitle})` : 'Next Track'}
                aria-label="Next Music Track"
                className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-lg bg-[#080c19]/90 border border-white/20 hover:border-amber-400/60 items-center justify-center text-white transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-amber-300" />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleSfxMute}
              title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
              aria-label={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
              className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-lg bg-[#080c19]/90 border border-white/20 hover:border-cyan-400/60 items-center justify-center text-white transition-colors cursor-pointer"
            >
              {sfxMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-300" />
              )}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause race"
              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#080c19]/90 border border-white/20 hover:border-cyan-400/60 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Non-blocking Upper-Top Toast & Countdown (keeps center road/car 100% clear) */}
      {hud.phase === 'COUNTDOWN' && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
          <div className="text-5xl sm:text-7xl font-black font-display italic tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,229,255,0.65)] tabular-nums">
            {hud.countdownValue > 0 ? hud.countdownValue : 'GO!'}
          </div>
          {hud.mode === 'DRAG_STRIP' && (
            <p className="text-[11px] font-bold tracking-widest text-amber-300 uppercase mt-1 whitespace-nowrap">
              HOLD THROTTLE AT GREEN FOR LAUNCH BOOST
            </p>
          )}
        </div>
      )}

      {hud.phase === 'RACING' && hud.bannerText && (
        <div className="fixed top-[88px] md:top-[104px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-3.5 py-1 rounded-full bg-[#080c19]/88 border border-amber-400/75 text-xs sm:text-sm font-black font-display italic tracking-wider text-amber-300 uppercase whitespace-nowrap shadow-lg">
            {hud.bannerText}
          </div>
        </div>
      )}

      {/* Open Center Spacer */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom Speedometer, Nitro & Hull Integrity Cluster */}
      {showTouchControls ? (
        <div className="relative z-10 flex items-end justify-center pb-[154px] sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <div className="bg-[#080c19]/88 border border-white/15 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 sm:gap-4 shadow-lg">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-2xl sm:text-3xl font-black font-display italic tracking-tight text-white leading-none">
                {hud.speedKmh}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-400">KM/H</span>
            </div>

            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-black text-cyan-300 tabular-nums">
              G{hud.gear}
            </span>

            <div className="w-20 sm:w-28 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] font-bold tracking-wider">
                <span className={hud.isBoosting ? 'text-cyan-300' : 'text-slate-400'}>
                  {hud.isDrifting ? 'DRIFT' : 'NITRO'}
                </span>
                <span className="text-cyan-300 tabular-nums">{hud.nitro}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${hud.nitro}%`,
                    background: hud.isBoosting
                      ? 'linear-gradient(90deg, #00f0ff, #ff2e93)'
                      : 'linear-gradient(90deg, #0ea5e9, #00f0ff)',
                  }}
                />
              </div>
            </div>

            <div className="hidden xs:flex flex-col gap-1 w-14">
              <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-slate-400">
                <span>HULL</span>
                <span
                  className={`tabular-nums ${
                    hud.hullIntegrity < 35
                      ? 'text-rose-400'
                      : hud.hullIntegrity < 65
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                  }`}
                >
                  {hud.hullIntegrity}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${hud.hullIntegrity}%`,
                    background:
                      hud.hullIntegrity < 35
                        ? '#ef4444'
                        : hud.hullIntegrity < 65
                          ? '#f59e0b'
                          : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-end justify-end">
          <div className="bg-[#080c19]/92 border border-white/15 rounded-xl px-4 py-3 min-w-[220px] sm:min-w-[250px]">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-4xl sm:text-5xl font-black font-display italic tracking-tight text-white leading-none">
                  {hud.speedKmh}
                </span>
                <span className="text-xs font-bold tracking-widest text-slate-400">KM/H</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hud.isDrifting && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-[10px] font-black tracking-wider text-amber-300">
                    DRIFT
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-black text-cyan-300 tabular-nums">
                  G{hud.gear}
                </span>
              </div>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${Math.round(hud.rpmRatio * 100)}%`,
                  background:
                    hud.rpmRatio > 0.85
                      ? '#ff3b5c'
                      : hud.rpmRatio > 0.6
                        ? '#f5a623'
                        : '#00e5ff',
                }}
              />
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest mb-1">
                <span className={hud.isBoosting ? 'text-cyan-300' : 'text-slate-400'}>
                  {hud.isBoosting ? 'NITRO ACTIVE' : 'NITRO'}
                </span>
                <span className="text-cyan-300 tabular-nums">{hud.nitro}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${hud.nitro}%`,
                    background: hud.isBoosting
                      ? 'linear-gradient(90deg, #00f0ff, #ff2e93)'
                      : 'linear-gradient(90deg, #0ea5e9, #00f0ff)',
                  }}
                />
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest mb-1">
                <span
                  className={
                    hud.hullIntegrity < 35
                      ? 'text-rose-400'
                      : hud.hullIntegrity < 65
                        ? 'text-amber-300'
                        : 'text-slate-400'
                  }
                >
                  HULL INTEGRITY
                </span>
                <span
                  className={`tabular-nums ${
                    hud.hullIntegrity < 35
                      ? 'text-rose-400'
                      : hud.hullIntegrity < 65
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                  }`}
                >
                  {hud.hullIntegrity}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${hud.hullIntegrity}%`,
                    background:
                      hud.hullIntegrity < 35
                        ? '#ef4444'
                        : hud.hullIntegrity < 65
                          ? '#f59e0b'
                          : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
