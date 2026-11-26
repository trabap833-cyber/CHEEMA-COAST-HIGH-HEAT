import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Disc3,
  Eye,
  Gauge,
  Home,
  LayoutGrid,
  Lock,
  Music,
  Palette,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { NewRecordFlags, RecordsStore } from '../game/records';
import { LOCKED_SPONSOR_PHOTO } from '../game/textures';
import { getTrackThumbnail, getVehicleThumbnail } from '../game/thumbnails';
import {
  createFallbackVehiclePhoto,
  getVehiclePhotoSrc,
} from '../game/vehiclePhotos';
import {
  CAR_COLOR_PRESETS,
  CAR_NEON_PRESETS,
  CAR_WHEEL_PRESETS,
  CarColorPreset,
  CarWheelPreset,
  GAME_MODES,
  GameModeId,
  GraphicsQuality,
  HudSnapshot,
  MUSIC_TRACKS,
  MusicTrackSpec,
  TouchSteerMode,
  VEHICLES,
  VehicleCategory,
  VehicleSpec,
} from '../game/types';
import { PWAState } from '../hooks/usePWA';
import { formatRaceTime, formatShortSec } from './GameHUD';
import { OfflineStatusBadge, PWAInstallButton } from './PWAControls';

export type TitleScreenView = 'HOME' | 'GARAGE' | 'TRACKS' | 'MUSIC';

interface TitleOverlayProps {
  activeView: TitleScreenView;
  selectedVehicle: VehicleSpec;
  selectedPreset: CarColorPreset;
  selectedWheelPreset: CarWheelPreset;
  selectedNeonHex: number;
  selectedMode: GameModeId;
  truckArtEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  currentMusicTrack: MusicTrackSpec;
  musicPlaying: boolean;
  sfxMuted: boolean;
  sfxVolume: number;
  musicMuted: boolean;
  musicVolume: number;
  records: RecordsStore;
  pwa: PWAState;
  onChangeView: (view: TitleScreenView) => void;
  onSelectVehicle: (spec: VehicleSpec) => void;
  onSelectPreset: (preset: CarColorPreset) => void;
  onSelectWheelPreset: (preset: CarWheelPreset) => void;
  onSelectNeonHex: (hex: number) => void;
  onGarageViewPreset: (view: '34' | 'FRONT' | 'SIDE' | 'REAR' | 'TOP') => void;
  onGarageZoom: (delta: number) => void;
  onGarageResetCamera: () => void;
  onSelectMode: (mode: GameModeId) => void;
  onToggleTruckArt: () => void;
  onSelectGraphicsQuality: (q: GraphicsQuality) => void;
  onResetRecords: () => void;
  onSelectMusicTrack: (trackId: string) => void;
  onToggleMusicPlaying: () => void;
  onNextMusicTrack: () => void;
  onPrevMusicTrack: () => void;
  onToggleSfxMute: () => void;
  onSfxVolumeChange: (v: number) => void;
  onToggleMusicMute: () => void;
  onMusicVolumeChange: (v: number) => void;
  onStartRace: () => void;
}

type CategoryFilter = 'ALL' | VehicleCategory;

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'ALL', label: `All (${VEHICLES.length})` },
  { id: 'HYPERCAR', label: 'Hyper & F1' },
  { id: 'JDM', label: 'JDM Legends' },
  { id: 'SEDAN_RALLY', label: 'Sedans & Rally' },
  { id: 'MUSCLE_SUV', label: 'Muscle & Trucks' },
  { id: 'SUPERBIKE', label: 'Superbikes' },
];

const EqualizerBars: React.FC<{
  active: boolean;
  bpm: number;
  accentCss: string;
  barCount?: number;
  heightClass?: string;
}> = ({ active, bpm, accentCss, barCount = 16, heightClass = 'h-10' }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const ms = Math.max(90, Math.round((60 / bpm / 2) * 1000));
    const timer = window.setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, ms);
    return () => window.clearInterval(timer);
  }, [active, bpm]);

  return (
    <div className={`flex items-end gap-1 ${heightClass}`} aria-hidden="true">
      {Array.from({ length: barCount }).map((_, idx) => {
        const wave = active
          ? 24 +
            Math.round(
              Math.abs(Math.sin(tick * 0.65 + idx * 0.72)) * 52 +
                Math.abs(Math.cos(tick * 0.38 - idx * 0.41)) * 24,
            )
          : 14;
        return (
          <span
            key={idx}
            className="w-1.5 rounded-t-sm transition-transform duration-150 origin-bottom"
            style={{
              height: `${Math.min(100, wave)}%`,
              backgroundColor: idx % 3 === 0 ? '#ffffff' : accentCss,
              opacity: active ? 0.92 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
};

const VehicleCardPhoto: React.FC<{
  vehicle: VehicleSpec;
  paintCss: string;
  accentCss: string;
  truckArtEnabled: boolean;
}> = ({ vehicle, paintCss, accentCss, truckArtEnabled }) => {
  const realPhoto = getVehiclePhotoSrc(vehicle.id);
  const [fallbackLevel, setFallbackLevel] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    setFallbackLevel(0);
  }, [vehicle.id, realPhoto]);

  const src =
    fallbackLevel === 0
      ? realPhoto
      : fallbackLevel === 1
        ? getVehicleThumbnail(vehicle, paintCss, accentCss, truckArtEnabled) ||
          createFallbackVehiclePhoto(vehicle)
        : createFallbackVehiclePhoto(vehicle);

  return (
    <img
      src={src}
      alt={vehicle.name}
      referrerPolicy="no-referrer"
      onError={() => setFallbackLevel((lvl) => (lvl < 2 ? ((lvl + 1) as 1 | 2) : 2))}
      className="w-full h-full object-cover"
    />
  );
};

const LockedSponsorBadge: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div
      className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#080c19]/92 border border-amber-400/40 px-2.5 py-1.5 shadow-lg"
      title="Official Track Billboard & Team Photo (Locked)"
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-amber-400/50 shrink-0 flex items-center justify-center">
        {!imgFailed ? (
          <img
            src={LOCKED_SPONSOR_PHOTO}
            alt="Abdullah Cheema"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] font-black text-amber-300">AC</span>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1 text-[10px] font-black tracking-wider text-amber-300 uppercase">
          <Lock className="w-2.5 h-2.5 shrink-0" />
          <span>TEAM SPONSOR</span>
        </div>
        <div className="text-xs font-black font-display text-white truncate">
          ABDULLAH CHEEMA
        </div>
      </div>
    </div>
  );
};

const VocalLyricsTicker: React.FC<{
  lines: string[];
  bpm: number;
  active: boolean;
  accentCss: string;
}> = ({ lines, bpm, active, accentCss }) => {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    setLineIdx(0);
  }, [lines]);

  useEffect(() => {
    if (!active || lines.length === 0) return;
    const barMs = Math.max(2000, Math.round((60 / bpm) * 4 * 1000));
    const timer = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % lines.length);
    }, barMs);
    return () => window.clearInterval(timer);
  }, [active, bpm, lines]);

  if (!lines.length) return null;

  return (
    <div className="bg-[#060914] border border-white/10 rounded-xl px-3.5 py-2.5 flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-slate-400">
        <span>VOCAL CHORUS</span>
        <span style={{ color: accentCss }}>{active ? 'SINGING LIVE' : 'PAUSED'}</span>
      </div>
      <p className="text-xs sm:text-sm font-semibold italic text-white leading-snug min-h-[2.4em]">
        &ldquo;{lines[lineIdx % lines.length]}&rdquo;
      </p>
    </div>
  );
};

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  activeView,
  selectedVehicle,
  selectedPreset,
  selectedWheelPreset,
  selectedNeonHex,
  selectedMode,
  truckArtEnabled,
  graphicsQuality,
  currentMusicTrack,
  musicPlaying,
  sfxMuted,
  sfxVolume,
  musicMuted,
  musicVolume,
  records,
  pwa,
  onChangeView,
  onSelectVehicle,
  onSelectPreset,
  onSelectWheelPreset,
  onSelectNeonHex,
  onGarageViewPreset,
  onGarageZoom,
  onGarageResetCamera,
  onSelectMode,
  onToggleTruckArt,
  onSelectGraphicsQuality,
  onResetRecords,
  onSelectMusicTrack,
  onToggleMusicPlaying,
  onNextMusicTrack,
  onPrevMusicTrack,
  onToggleSfxMute,
  onSfxVolumeChange,
  onToggleMusicMute,
  onMusicVolumeChange,
  onStartRace,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [showRecordsDrawer, setShowRecordsDrawer] = useState(false);
  const [confirmResetRecords, setConfirmResetRecords] = useState(false);
  const [mobileGarageSheetOpen, setMobileGarageSheetOpen] = useState(false);

  const cycleGraphicsQuality = () => {
    const order: GraphicsQuality[] = ['LOW', 'MEDIUM', 'HIGH'];
    const next = order[(order.indexOf(graphicsQuality) + 1) % order.length];
    onSelectGraphicsQuality(next);
  };

  const activeModeCfg = GAME_MODES.find((m) => m.id === selectedMode) ?? GAME_MODES[0];
  const filteredVehicles =
    categoryFilter === 'ALL'
      ? VEHICLES
      : VEHICLES.filter((v) => v.category === categoryFilter);

  const accentCss = `#${selectedNeonHex.toString(16).padStart(6, '0')}`;

  // ------------------------------------------------------------------
  // 1. LIVE INTERACTIVE 3D GARAGE STUDIO (360° Drag + Zoom + Real Photos)
  // ------------------------------------------------------------------
  if (activeView === 'GARAGE') {
    const selectedStats = [
      { label: 'Top Speed', val: selectedVehicle.stats.topSpeed, col: '#00f0ff' },
      { label: 'Acceleration', val: selectedVehicle.stats.accel, col: '#10b981' },
      { label: 'Handling', val: selectedVehicle.stats.handling, col: '#f5a623' },
      { label: 'Nitro Power', val: selectedVehicle.stats.nitro, col: '#ec4899' },
    ];

    return (
      <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between">
        {/* Top Studio Bar */}
        <header className="pointer-events-auto shrink-0 px-3 sm:px-6 py-2 bg-[#060914]/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeView('HOME')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-bold tracking-wider text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">SHOWROOM</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-xl font-black font-display italic tracking-wide text-white leading-none">
                3D GARAGE
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                {VEHICLES.length} Real Cars & Superbikes · 360° Live Inspect
              </p>
            </div>
          </div>

          {/* Interactive 3D Camera Angle & Zoom Bar */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-cyan-300 uppercase mr-1">
              <Camera className="w-3.5 h-3.5" />
              ANGLE
            </span>
            {(
              [
                { id: '34', label: '3/4' },
                { id: 'FRONT', label: 'Front' },
                { id: 'SIDE', label: 'Side' },
                { id: 'REAR', label: 'Rear' },
              ] as const
            ).map((ang) => (
              <button
                key={ang.id}
                type="button"
                onClick={() => onGarageViewPreset(ang.id)}
                className="min-h-[38px] sm:min-h-[34px] px-2.5 py-1 rounded-lg bg-white/7 hover:bg-cyan-400/20 border border-white/12 hover:border-cyan-400/50 text-[11px] font-bold text-white cursor-pointer"
              >
                {ang.label}
              </button>
            ))}

            <div className="h-5 w-px bg-white/12 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={() => onGarageZoom(-0.14)}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-9 h-9 rounded-lg bg-white/7 hover:bg-white/15 border border-white/12 text-white flex items-center justify-center cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onGarageZoom(0.14)}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-9 h-9 rounded-lg bg-white/7 hover:bg-white/15 border border-white/12 text-white flex items-center justify-center cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onGarageResetCamera}
              title="Reset 3D Camera"
              aria-label="Reset 3D Camera"
              className="w-9 h-9 rounded-lg bg-white/7 hover:bg-white/15 border border-white/12 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block">
              <LockedSponsorBadge />
            </div>
            <button
              type="button"
              onClick={onStartRace}
              className="min-h-[44px] px-4 sm:px-5 py-2 rounded-xl font-black font-display italic tracking-wider text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              RACE NOW
            </button>
          </div>
        </header>

        {/* Center Row: Open Live 3D Viewport on Left/Top + Collapsible Customizer Panel */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row items-stretch md:items-center justify-end md:justify-between p-2.5 sm:p-5 gap-2 sm:gap-4 pointer-events-none">
          {/* Bottom-Left 360° Drag & Zoom Hint over open WebGL Canvas */}
          <div className="hidden md:flex flex-col gap-2 self-end pb-1">
            <div className="px-3.5 py-2 rounded-xl bg-[#060914]/82 border border-white/15 text-[11px] font-semibold text-slate-200 flex items-center gap-2">
              <span className="text-cyan-300 font-black">360° LIVE VIEW</span>
              <span className="text-slate-500">·</span>
              <span>Drag to rotate · Scroll to zoom</span>
            </div>
          </div>

          {/* Mobile Drawer Toggle Button (keeps 3D car open for finger rotation) */}
          <div className="md:hidden pointer-events-auto flex items-center justify-between gap-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-[#060914]/80 border border-white/12 text-[10px] font-bold text-slate-200 truncate">
              <span className="text-cyan-300">{selectedVehicle.name}</span> ·{' '}
              {Math.round(selectedVehicle.physics.maxSpeedMs * 3.6)} KM/H
            </div>
            <button
              type="button"
              onClick={() => setMobileGarageSheetOpen((v) => !v)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#080c19]/92 border border-cyan-400/50 text-[11px] font-black tracking-wider text-cyan-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              {mobileGarageSheetOpen ? 'HIDE SPECS' : 'CUSTOMIZE & SPECS'}
              {mobileGarageSheetOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Floating Real Photo, Specs & Customizer Panel */}
          <aside
            className={`pointer-events-auto w-full md:w-[340px] max-h-[40dvh] md:max-h-full overflow-y-auto garage-scroll bg-[#080c19]/92 border border-white/15 rounded-2xl p-3.5 flex-col gap-3 shadow-2xl ${
              mobileGarageSheetOpen ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Real Vehicle Photo + Speed Badge */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#050811] border border-white/10 shrink-0">
              <VehicleCardPhoto
                key={selectedVehicle.id}
                vehicle={selectedVehicle}
                paintCss={selectedPreset.css}
                accentCss={accentCss}
                truckArtEnabled={truckArtEnabled}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#060914]/90 border border-cyan-400/40 text-[10px] font-black tracking-wider text-cyan-300 tabular-nums">
                {Math.round(selectedVehicle.physics.maxSpeedMs * 3.6)} KM/H
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#060914]/85 border border-white/10 text-[10px] font-bold text-amber-300 uppercase">
                {selectedVehicle.categoryLabel}
              </div>
            </div>

            {/* Real Name, Make/Year & Real-World 3D Specs */}
            <div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider uppercase text-cyan-300">
                <span>
                  {selectedVehicle.make} · {selectedVehicle.year}
                </span>
                <span className="text-amber-300">
                  {selectedVehicle.threeD.lengthM.toFixed(2)}m × {selectedVehicle.threeD.widthM.toFixed(2)}m ×{' '}
                  {selectedVehicle.threeD.heightM.toFixed(2)}m
                </span>
              </div>
              <h3 className="text-lg font-black font-display text-white leading-tight mt-0.5">
                {selectedVehicle.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedVehicle.subtitle}</p>
            </div>

            {/* 4 Performance Bars */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-2 border-y border-white/10">
              {selectedStats.map((st) => (
                <div key={st.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span>{st.label}</span>
                    <span className="tabular-nums text-white">{st.val}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${st.val}%`, backgroundColor: st.col }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Paint Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-300" />
                  BODY PAINT
                </span>
                <span className="text-white">{selectedPreset.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {CAR_COLOR_PRESETS.map((preset) => {
                  const active = preset.id === selectedPreset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset)}
                      title={preset.name}
                      aria-label={preset.name}
                      className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        active
                          ? 'scale-110 border-amber-300 ring-2 ring-amber-400/40'
                          : 'border-white/25 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.css }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Neon Accent / Underglow Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>NEON UNDERGLOW & CALIPERS</span>
                <span className="text-cyan-300">
                  {CAR_NEON_PRESETS.find((n) => n.hex === selectedNeonHex)?.name ?? 'Custom'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {CAR_NEON_PRESETS.map((neon) => {
                  const active = neon.hex === selectedNeonHex;
                  return (
                    <button
                      key={neon.id}
                      type="button"
                      onClick={() => onSelectNeonHex(neon.hex)}
                      title={neon.name}
                      aria-label={`Neon ${neon.name}`}
                      className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        active
                          ? 'scale-110 border-white ring-2 ring-cyan-400/50'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: neon.css }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Wheel / Rim Finish Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-300">WHEEL RIM FINISH</span>
              <div className="grid grid-cols-5 gap-1">
                {CAR_WHEEL_PRESETS.map((wheel) => {
                  const active = wheel.id === selectedWheelPreset.id;
                  return (
                    <button
                      key={wheel.id}
                      type="button"
                      onClick={() => onSelectWheelPreset(wheel)}
                      className={`min-h-[44px] px-1 py-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        active
                          ? 'bg-cyan-400/20 border-cyan-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: wheel.css }}
                      />
                      <span className="truncate w-full text-center">{wheel.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Truck Art Decal Toggle */}
            <button
              type="button"
              onClick={onToggleTruckArt}
              className={`w-full min-h-[44px] py-2 px-3 rounded-xl border text-xs font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                truckArtEnabled
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              TRUCK ART DECALS: {truckArtEnabled ? 'ON' : 'OFF'}
            </button>
          </aside>
        </div>

        {/* Bottom Dock: Category Tabs + Horizontal Real-Photo Vehicle Carousel */}
        <div className="pointer-events-auto shrink-0 bg-[#060914]/94 border-t border-white/12 px-3 sm:px-6 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto garage-scroll">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 garage-scroll snap-x">
            {filteredVehicles.map((v) => {
              const active = v.id === selectedVehicle.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVehicle(v)}
                  className={`w-36 sm:w-44 shrink-0 snap-start text-left rounded-xl overflow-hidden border transition-all flex flex-col cursor-pointer ${
                    active
                      ? 'bg-[#0f172e] border-cyan-400 ring-1 ring-cyan-400/60'
                      : 'bg-[#0b1021] border-white/12 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-[16/9] w-full bg-[#070a14] overflow-hidden">
                    <VehicleCardPhoto
                      vehicle={v}
                      paintCss={selectedPreset.css}
                      accentCss={accentCss}
                      truckArtEnabled={truckArtEnabled}
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#060914]/90 border border-white/15 text-[9px] font-black text-cyan-300 tabular-nums">
                      {Math.round(v.physics.maxSpeedMs * 3.6)} KM/H
                    </div>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-1.5">
                    <div className="text-xs font-black font-display text-white truncate">
                      {v.name}
                    </div>
                    <div className="text-[10px] text-amber-300/90 truncate">{v.categoryLabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. DEDICATED TRACKS & MODES SCREEN (10 Illustrated Track Cards)
  // ------------------------------------------------------------------
  if (activeView === 'TRACKS') {
    return (
      <div className="fixed inset-0 z-30 bg-[#060914]/95 flex flex-col">
        <header className="shrink-0 px-4 sm:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeView('HOME')}
              className="px-3.5 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-bold tracking-wider text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              SHOWROOM
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display italic tracking-wide text-white leading-none">
                TRACKS & GAME MODES
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {GAME_MODES.length} Distinct Environments · Dynamic Lighting, Surfaces & Weather
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartRace}
            className="px-6 py-2.5 rounded-xl font-black font-display italic tracking-wider text-sm bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            RACE NOW
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 garage-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {GAME_MODES.map((m, idx) => {
              const active = m.id === selectedMode;
              const thumbUrl = getTrackThumbnail(m);
              const rec = records.modes[m.id];
              const bestTimeMs = rec?.bestLapMs ?? rec?.bestRaceTimeMs ?? null;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  className={`text-left rounded-xl overflow-hidden border transition-all flex flex-col cursor-pointer ${
                    active
                      ? 'bg-[#0f172e] border-amber-400 ring-1 ring-amber-400/60'
                      : 'bg-[#0b1021] border-white/12 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-[16/9] w-full bg-[#070a14] overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={m.environmentName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: m.previewGradient }}
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#070a14] to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white">
                      <span>{String(idx + 1).padStart(2, '0')}. {m.environmentName}</span>
                    </div>
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                    <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                      <span>{m.weatherLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300">{m.difficulty}</span>
                    </div>
                    <h3 className="text-base font-black font-display text-white leading-snug">
                      {m.name}
                    </h3>
                    <p className="text-xs text-slate-300/90 leading-relaxed flex-1">
                      {m.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-3 gap-1.5 text-[10px] tabular-nums">
                      <div>
                        <span className="text-slate-400 block uppercase">BEST PTS</span>
                        <span className="font-black text-amber-300">
                          {rec && rec.highScore > 0 ? rec.highScore.toLocaleString() : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">BEST TIME</span>
                        <span className="font-black text-cyan-300">
                          {bestTimeMs !== null ? formatRaceTime(bestTimeMs) : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">TAKEDOWNS</span>
                        <span className="font-black text-white">
                          {rec && rec.maxTakedowns > 0 ? rec.maxTakedowns : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 3. DEDICATED MUSIC PLAYLIST & ALAN WALKER-STYLE JUKEBOX SCREEN
  // ------------------------------------------------------------------
  if (activeView === 'MUSIC') {
    const isActuallyPlaying = musicPlaying && !musicMuted;

    return (
      <div className="fixed inset-0 z-30 bg-[#060914]/95 flex flex-col">
        <header className="shrink-0 px-4 sm:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeView('HOME')}
              className="px-3.5 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-bold tracking-wider text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              SHOWROOM
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display italic tracking-wide text-white leading-none">
                ALAN WALKER JUKEBOX
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {MUSIC_TRACKS.length} Alan Walker Vocal-Synth EDM Songs · Live Chorus & Piano Leads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartRace}
            className="px-6 py-2.5 rounded-xl font-black font-display italic tracking-wider text-sm bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            RACE NOW
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 garage-scroll">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Deck: Active Player + Equalizer + Vocal Lyrics + Volume Sliders */}
            <div className="lg:col-span-5 bg-[#0b1021] border border-white/15 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-amber-300">
                    {isActuallyPlaying ? 'NOW PLAYING' : 'PAUSED'} · {currentMusicTrack.artist.toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-black font-display italic text-white mt-1">
                    {currentMusicTrack.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{currentMusicTrack.subtitle}</p>
                </div>
                <Disc3
                  className={`w-9 h-9 shrink-0 ${
                    isActuallyPlaying ? 'text-cyan-300 animate-spin' : 'text-slate-600'
                  }`}
                  style={{ animationDuration: '4s' }}
                />
              </div>

              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2 tabular-nums">
                <span>{currentMusicTrack.bpm} BPM</span>
                <span aria-hidden="true">·</span>
                <span>{currentMusicTrack.musicalKey}</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300">{currentMusicTrack.vibe}</span>
              </div>

              <VocalLyricsTicker
                lines={currentMusicTrack.vocalLines}
                bpm={currentMusicTrack.bpm}
                active={isActuallyPlaying}
                accentCss={currentMusicTrack.accentCss}
              />

              {/* Active Equalizer */}
              <div className="bg-[#060914] border border-white/10 rounded-xl p-4 flex items-end justify-center">
                <EqualizerBars
                  active={isActuallyPlaying}
                  bpm={currentMusicTrack.bpm}
                  accentCss={currentMusicTrack.accentCss}
                  barCount={18}
                  heightClass="h-12"
                />
              </div>

              {/* Transport Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onPrevMusicTrack}
                  aria-label="Previous track"
                  className="w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white cursor-pointer"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleMusicPlaying}
                  aria-label={isActuallyPlaying ? 'Pause music' : 'Play music'}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 text-slate-950 flex items-center justify-center shadow-[0_0_24px_rgba(0,240,255,0.3)] cursor-pointer"
                >
                  {isActuallyPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onNextMusicTrack}
                  aria-label="Next track"
                  className="w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Independent Music & SFX Volume Sliders */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-300" />
                      MUSIC VOLUME
                    </span>
                    <button
                      type="button"
                      onClick={onToggleMusicMute}
                      className="text-amber-300 tabular-nums cursor-pointer"
                    >
                      {musicMuted ? 'MUTED' : `${Math.round(musicVolume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicMuted ? 0 : Math.round(musicVolume * 100)}
                    onChange={(e) => onMusicVolumeChange(Number(e.target.value) / 100)}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      {sfxMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                      )}
                      ENGINE & SFX VOLUME
                    </span>
                    <button
                      type="button"
                      onClick={onToggleSfxMute}
                      className="text-cyan-300 tabular-nums cursor-pointer"
                    >
                      {sfxMuted ? 'MUTED' : `${Math.round(sfxVolume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sfxMuted ? 0 : Math.round(sfxVolume * 100)}
                    onChange={(e) => onSfxVolumeChange(Number(e.target.value) / 100)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: 6 Click-to-Play Songs */}
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              {MUSIC_TRACKS.map((track) => {
                const selected = track.id === currentMusicTrack.id;
                const playingRow = selected && isActuallyPlaying;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelectMusicTrack(track.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      selected
                        ? 'bg-[#101936] border-cyan-400'
                        : 'bg-[#0b1021] border-white/12 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-black font-display text-sm shrink-0"
                        style={{
                          backgroundColor: `${track.accentCss}22`,
                          color: track.accentCss,
                        }}
                      >
                        {track.number}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-black font-display text-white truncate">
                          {track.artist} — {track.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {track.subtitle} · {track.bpm} BPM · {track.musicalKey}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {playingRow ? (
                        <EqualizerBars
                          active={true}
                          bpm={track.bpm}
                          accentCss={track.accentCss}
                          barCount={5}
                          heightClass="h-6"
                        />
                      ) : (
                        <Play className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 4. CLEAN AAA MAIN HOME SCREEN (Unobstructed 3D Showroom + 4 Nav Buttons)
  // ------------------------------------------------------------------
  const isActuallyPlaying = musicPlaying && !musicMuted;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-7 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      {/* Top Bar: Game Title + Compact Now Playing Jukebox & Quality Controls */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-col items-start gap-1.5 sm:gap-2">
          <div>
            <h1 className="text-2xl sm:text-5xl font-black font-display italic tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] leading-none">
              CHEEMA COAST
            </h1>
            <p className="text-[10px] sm:text-sm font-bold tracking-[0.22em] sm:tracking-[0.28em] text-amber-300 uppercase mt-1 drop-shadow">
              HIGH HEAT · STREET & PURSUIT
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="hidden xs:block sm:block">
              <LockedSponsorBadge />
            </div>
            <OfflineStatusBadge isOnline={pwa.isOnline} isOfflineReady={pwa.isOfflineReady} />
          </div>
        </div>

        {/* Top-Right: Install App, Graphics Quality, Records Drawer, Music & SFX Mute */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto">
          <PWAInstallButton pwa={pwa} />
          <button
            type="button"
            onClick={cycleGraphicsQuality}
            title="Cycle Graphics Quality (Low / Medium / High)"
            aria-label={`Graphics Quality ${graphicsQuality}`}
            className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-[#080c19]/90 border border-white/15 hover:border-cyan-400/60 flex items-center gap-1.5 text-white text-[11px] font-bold whitespace-nowrap cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-cyan-300 shrink-0" />
            <span className="hidden sm:inline text-slate-400">GFX</span>
            <span
              className={
                graphicsQuality === 'HIGH'
                  ? 'text-emerald-300'
                  : graphicsQuality === 'MEDIUM'
                    ? 'text-amber-300'
                    : 'text-cyan-300'
              }
            >
              {graphicsQuality === 'MEDIUM' ? 'MED' : graphicsQuality}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowRecordsDrawer(true)}
            className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-[#080c19]/90 border border-white/15 hover:border-amber-400/60 flex items-center gap-1.5 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">RECORDS</span>
            {records.career.totalRaces > 0 && (
              <span className="text-cyan-300 tabular-nums">
                {records.career.totalWins}W/{records.career.totalRaces}R
              </span>
            )}
          </button>

          <div className="min-h-[44px] bg-[#080c19]/90 border border-white/15 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMusicPlaying}
              aria-label={isActuallyPlaying ? 'Pause music' : 'Play music'}
              className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 flex items-center justify-center cursor-pointer"
            >
              {isActuallyPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onChangeView('MUSIC')}
              className="hidden sm:block text-left max-w-[155px] cursor-pointer"
            >
              <div className="text-[10px] font-bold tracking-widest text-amber-300/90 uppercase leading-none">
                {currentMusicTrack.artist}
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                {currentMusicTrack.title}
              </div>
            </button>
            <button
              type="button"
              onClick={onNextMusicTrack}
              aria-label="Next song"
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleSfxMute}
            aria-label={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#080c19]/90 border border-white/15 hover:border-cyan-400/60 flex items-center justify-center text-white cursor-pointer"
          >
            {sfxMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-300" />
            )}
          </button>
        </div>
      </div>

      {/* Center: 100% Open 3D Showroom Viewport */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom: Selected Setup Summary + 4 Clean AAA Navigation Buttons */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 pointer-events-auto">
        {/* Selected Vehicle & Track Summary Pill */}
        <div className="max-w-full bg-[#080c19]/90 border border-white/15 rounded-2xl sm:rounded-full px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-200 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
          <span className="text-cyan-300 font-bold truncate max-w-[160px] sm:max-w-none">
            {selectedVehicle.name}
          </span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-300 hidden sm:inline">{selectedPreset.name}</span>
          <span className="text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="text-amber-300 font-bold truncate max-w-[200px] sm:max-w-none">
            {activeModeCfg.name}
          </span>
        </div>

        {/* 4 Clean AAA Navigation Buttons */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onStartRace}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black font-display italic tracking-wider text-xs sm:text-base flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(251,191,36,0.35)] whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
            RACE NOW
          </button>

          <button
            type="button"
            onClick={() => onChangeView('GARAGE')}
            className="min-h-[48px] px-3 py-3 rounded-xl bg-[#080c19]/92 hover:bg-[#101832] border border-white/20 hover:border-cyan-400/70 text-white font-black font-display tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-cyan-300 shrink-0" />
            GARAGE ({VEHICLES.length})
          </button>

          <button
            type="button"
            onClick={() => onChangeView('TRACKS')}
            className="min-h-[48px] px-3 py-3 rounded-xl bg-[#080c19]/92 hover:bg-[#101832] border border-white/20 hover:border-amber-400/70 text-white font-black font-display tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-300 shrink-0" />
            TRACKS ({GAME_MODES.length})
          </button>

          <button
            type="button"
            onClick={() => onChangeView('MUSIC')}
            className="min-h-[48px] px-3 py-3 rounded-xl bg-[#080c19]/92 hover:bg-[#101832] border border-white/20 hover:border-purple-400/70 text-white font-black font-display tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer"
          >
            <Music className="w-4 h-4 text-purple-300 shrink-0" />
            WALKER SONGS ({MUSIC_TRACKS.length})
          </button>
        </div>

        <p className="hidden sm:block text-[11px] font-medium tracking-wider text-slate-300/75 text-center">
          Drag car to rotate · WASD / Arrows Drive · Space Drift · Shift Nitro · C Camera
        </p>
        <p className="sm:hidden text-[10px] font-medium tracking-wider text-slate-300/75 text-center">
          Drag car to rotate · Pinch to zoom · Multi-touch pedals enabled
        </p>
      </div>

      {/* Persistent Career Stats & Mode Records Drawer Modal */}
      {showRecordsDrawer && (
        <div className="fixed inset-0 z-40 bg-[#050811]/88 pointer-events-auto flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] bg-[#0b1020] border border-amber-400/40 rounded-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-lg font-black font-display italic tracking-wide text-white leading-none">
                    CAREER STATS & MODE RECORDS
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved locally across all {GAME_MODES.length} Cheema Coast circuits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecordsDrawer(false);
                  setConfirmResetRecords(false);
                }}
                aria-label="Close records"
                className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 garage-scroll flex flex-col gap-5">
              {/* Career Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    TOTAL RACES
                  </div>
                  <div className="text-2xl font-black font-display text-white mt-0.5">
                    {records.career.totalRaces}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    TOTAL WINS
                  </div>
                  <div className="text-2xl font-black font-display text-emerald-400 mt-0.5">
                    {records.career.totalWins}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    TOP SPEED
                  </div>
                  <div className="text-2xl font-black font-display text-cyan-300 mt-0.5">
                    {records.career.highestTopSpeedKmh > 0
                      ? `${records.career.highestTopSpeedKmh} KM/H`
                      : '--'}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    TAKEDOWNS
                  </div>
                  <div className="text-2xl font-black font-display text-amber-300 mt-0.5">
                    {records.career.totalTakedowns}
                  </div>
                </div>
              </div>

              {/* Per-Mode Table */}
              <div className="flex flex-col gap-2">
                {GAME_MODES.map((m) => {
                  const r = records.modes[m.id];
                  const bestTime = r?.bestLapMs ?? r?.bestRaceTimeMs ?? null;
                  return (
                    <div
                      key={m.id}
                      className="bg-[#080c19] border border-white/10 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums"
                    >
                      <div className="min-w-[170px]">
                        <div className="font-black text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {m.environmentName} · {r?.wins ?? 0}W / {r?.plays ?? 0}P
                          {r?.recordVehicleName ? ` · ${r.recordVehicleName}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">SCORE</span>
                          <span className="font-black text-amber-300">
                            {r && r.highScore > 0 ? r.highScore.toLocaleString() : '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">TIME</span>
                          <span className="font-black text-cyan-300">
                            {bestTime !== null ? formatRaceTime(bestTime) : '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">TAKEDOWNS</span>
                          <span className="font-black text-white">
                            {r && r.maxTakedowns > 0 ? r.maxTakedowns : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between gap-3 bg-[#080c19]">
              {confirmResetRecords ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300">
                    Clear all saved records?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetRecords();
                      setConfirmResetRecords(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-black cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetRecords(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmResetRecords(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Records
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRecordsDrawer(false);
                  setConfirmResetRecords(false);
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PauseModalProps {
  currentMusicTrack: MusicTrackSpec;
  musicPlaying: boolean;
  sfxMuted: boolean;
  sfxVolume: number;
  musicMuted: boolean;
  musicVolume: number;
  showTouchControls: boolean;
  touchSteerMode: TouchSteerMode;
  graphicsQuality: GraphicsQuality;
  mirrorEnabled: boolean;
  isOnline?: boolean;
  isOfflineReady?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMusicPlaying: () => void;
  onNextMusicTrack: () => void;
  onPrevMusicTrack: () => void;
  onToggleSfxMute: () => void;
  onSfxVolumeChange: (v: number) => void;
  onToggleMusicMute: () => void;
  onMusicVolumeChange: (v: number) => void;
  onToggleTouch: () => void;
  onToggleTouchSteerMode: () => void;
  onSelectGraphicsQuality: (q: GraphicsQuality) => void;
  onToggleMirror: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  currentMusicTrack,
  musicPlaying,
  sfxMuted,
  sfxVolume,
  musicMuted,
  musicVolume,
  showTouchControls,
  touchSteerMode,
  graphicsQuality,
  mirrorEnabled,
  isOnline = true,
  isOfflineReady = false,
  onResume,
  onRestart,
  onToggleMusicPlaying,
  onNextMusicTrack,
  onPrevMusicTrack,
  onToggleSfxMute,
  onSfxVolumeChange,
  onToggleMusicMute,
  onMusicVolumeChange,
  onToggleTouch,
  onToggleTouchSteerMode,
  onSelectGraphicsQuality,
  onToggleMirror,
  onReturnToTitle,
}) => {
  const isPlaying = musicPlaying && !musicMuted;

  return (
    <div className="fixed inset-0 z-30 bg-[#050811]/84 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto garage-scroll bg-[#0b1020] border border-amber-400/35 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-black font-display italic tracking-wider text-white text-center">
            RACE PAUSED
          </h2>
          <OfflineStatusBadge isOnline={isOnline} isOfflineReady={isOfflineReady} />
        </div>

        <button
          type="button"
          onClick={onResume}
          className="w-full min-h-[46px] py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          RESUME
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          RESTART
        </button>

        {/* Graphics Quality Preset Selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-300" />
              GRAPHICS QUALITY
            </span>
            <span className="text-[11px] font-black text-cyan-300">{graphicsQuality}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((tier) => {
              const active = graphicsQuality === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onSelectGraphicsQuality(tier)}
                  className={`min-h-[38px] py-1.5 rounded-lg border text-[11px] font-black tracking-wider cursor-pointer transition-colors ${
                    active
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tier === 'MEDIUM' ? 'MED' : tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Track Switcher & Separate Music / SFX Sliders */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-amber-300/90 uppercase">
                {currentMusicTrack.artist} · {currentMusicTrack.number}
              </div>
              <div className="text-xs font-black text-white truncate">
                {currentMusicTrack.title}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onPrevMusicTrack}
                aria-label="Previous track"
                className="w-9 h-9 rounded-md bg-white/8 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggleMusicPlaying}
                aria-label={isPlaying ? 'Pause music' : 'Play music'}
                className="w-9 h-9 rounded-md bg-amber-400/20 hover:bg-amber-400/30 flex items-center justify-center text-amber-300 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={onNextMusicTrack}
                aria-label="Next track"
                className="w-9 h-9 rounded-md bg-white/8 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-300" />
              MUSIC
            </span>
            <button
              type="button"
              onClick={onToggleMusicMute}
              className="text-[11px] font-black text-amber-300 hover:underline cursor-pointer"
            >
              {musicMuted ? 'MUTED' : `${Math.round(musicVolume * 100)}%`}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={musicMuted ? 0 : Math.round(musicVolume * 100)}
            onChange={(e) => onMusicVolumeChange(Number(e.target.value) / 100)}
            className="w-full accent-amber-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs font-bold text-slate-200 pt-1">
            <span className="flex items-center gap-1.5">
              {sfxMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
              )}
              ENGINE & SFX
            </span>
            <button
              type="button"
              onClick={onToggleSfxMute}
              className="text-[11px] font-black text-cyan-300 hover:underline cursor-pointer"
            >
              {sfxMuted ? 'MUTED' : `${Math.round(sfxVolume * 100)}%`}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sfxMuted ? 0 : Math.round(sfxVolume * 100)}
            onChange={(e) => onSfxVolumeChange(Number(e.target.value) / 100)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleTouch}
            className="min-h-[44px] py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            TOUCH: {showTouchControls ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={onToggleTouchSteerMode}
            className="min-h-[44px] py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            STEER: {touchSteerMode === 'BUTTONS' ? 'PADS' : 'WHEEL'}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleMirror}
          className="w-full min-h-[44px] py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          REAR-VIEW MIRROR: {mirrorEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={onReturnToTitle}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-transparent hover:bg-white/10 border border-white/15 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          MAIN SHOWROOM
        </button>
      </div>
    </div>
  );
};

interface ResultsModalProps {
  hud: HudSnapshot;
  newRecords?: NewRecordFlags | null;
  onRestart: () => void;
  onReturnToTitle: () => void;
}

type SummaryChartMetric = 'LAP_TIME' | 'TOP_SPEED' | 'AVG_SPEED';

interface ChartBarDatum {
  label: string;
  value: number;
  displayValue: string;
  subLabel: string;
  isHighlight: boolean;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  hud,
  newRecords,
  onRestart,
  onReturnToTitle,
}) => {
  const [showSummaryScreen, setShowSummaryScreen] = useState(false);
  const hasLapData = hud.lapMetrics.length > 0;
  const [chartMetric, setChartMetric] = useState<SummaryChartMetric>(
    hasLapData ? 'LAP_TIME' : 'TOP_SPEED',
  );
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  const modeCfg = GAME_MODES.find((m) => m.id === hud.mode) ?? GAME_MODES[0];
  const showStandings =
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
    hud.mode === 'EMERALD_VALLEY_LOOP' ||
    hud.mode === 'KNOCKOUT' ||
    hud.mode === 'DRAG_STRIP';

  const thirdLabel =
    hud.mode === 'DRIFT_TOUGE'
      ? 'DRIFT PTS'
      : hud.mode === 'CHECKPOINT_BLITZ'
        ? 'GATES'
        : hud.mode === 'COP_TAKEDOWN'
          ? 'WRECKED'
          : hud.mode === 'TIME_TRIAL'
            ? 'BEST LAP'
            : 'NEAR MISS';

  const thirdValue =
    hud.mode === 'DRIFT_TOUGE'
      ? hud.driftScore.toLocaleString()
      : hud.mode === 'CHECKPOINT_BLITZ'
        ? `${hud.checkpointsCleared}/${hud.checkpointsTarget}`
        : hud.mode === 'COP_TAKEDOWN'
          ? `${hud.takedowns}/${hud.suspectsTotal}`
          : hud.mode === 'TIME_TRIAL'
            ? hud.bestLapMs !== null
              ? formatRaceTime(hud.bestLapMs)
              : formatRaceTime(hud.raceTimeMs)
            : String(hud.nearMisses);

  // Build bar chart dataset from recorded lapMetrics / speedSplits / standings
  const sourceSegments =
    hud.speedSplits.length >= 2 || !hasLapData ? hud.speedSplits : hud.lapMetrics;

  let chartTitle = 'TOP SPEEDS ACROSS RACE';
  let chartSubtitle = 'Peak velocity reached during each race segment';
  let unitSuffix = 'KM/H';
  let bars: ChartBarDatum[] = [];

  if (chartMetric === 'LAP_TIME') {
    if (hasLapData) {
      chartTitle = 'TIME PER LAP';
      chartSubtitle = 'Lower bar indicates a faster lap · Best lap highlighted';
      unitSuffix = 's';
      const minLap = Math.min(...hud.lapMetrics.map((l) => l.timeMs));
      bars = hud.lapMetrics.map((l) => ({
        label: l.label,
        value: Number((l.timeMs / 1000).toFixed(2)),
        displayValue: formatRaceTime(l.timeMs),
        subLabel: `Peak ${l.topSpeedKmh} KM/H`,
        isHighlight: l.timeMs === minLap,
      }));
    } else if (hud.standings.filter((s) => s.finished).length > 1) {
      chartTitle = 'FINISH TIME COMPARISON';
      chartSubtitle = 'Player finish time compared against active rivals';
      unitSuffix = 's';
      const finishedRacers = hud.standings.filter((s) => s.finished);
      const minTime = Math.min(...finishedRacers.map((r) => r.totalTimeMs));
      bars = finishedRacers.map((r) => ({
        label: r.isPlayer ? 'YOU' : r.name.split(' ')[0],
        value: Number((r.totalTimeMs / 1000).toFixed(2)),
        displayValue: formatRaceTime(r.totalTimeMs),
        subLabel: `#${r.position} Finish`,
        isHighlight: r.isPlayer || r.totalTimeMs === minTime,
      }));
    } else {
      chartTitle = 'SEGMENT DURATION';
      chartSubtitle = 'Time spent per recorded race sector';
      unitSuffix = 's';
      bars = sourceSegments.map((s) => ({
        label: s.label,
        value: Number((s.timeMs / 1000).toFixed(1)),
        displayValue: `${(s.timeMs / 1000).toFixed(1)}s`,
        subLabel: `Peak ${s.topSpeedKmh} KM/H`,
        isHighlight: s.topSpeedKmh === Math.max(...sourceSegments.map((x) => x.topSpeedKmh)),
      }));
    }
  } else if (chartMetric === 'TOP_SPEED') {
    const segs =
      hasLapData && hud.lapMetrics.length >= 2 && hud.speedSplits.length <= hud.lapMetrics.length
        ? hud.lapMetrics
        : sourceSegments.length > 0
          ? sourceSegments
          : [
              {
                label: 'FULL RUN',
                timeMs: hud.raceTimeMs,
                topSpeedKmh: hud.topSpeedKmh,
                avgSpeedKmh: Math.round(hud.topSpeedKmh * 0.78),
                driftPts: hud.driftScore,
              },
            ];
    chartTitle = hasLapData && segs === hud.lapMetrics ? 'TOP SPEED PER LAP' : 'TOP SPEEDS ACROSS RACE';
    chartSubtitle = 'Highest KM/H recorded in each interval · 300+ KM/H target zone';
    unitSuffix = 'KM/H';
    const maxSpd = Math.max(...segs.map((s) => s.topSpeedKmh));
    bars = segs.map((s) => ({
      label: s.label,
      value: s.topSpeedKmh,
      displayValue: `${s.topSpeedKmh} KM/H`,
      subLabel: `Avg ${s.avgSpeedKmh} KM/H`,
      isHighlight: s.topSpeedKmh === maxSpd,
    }));
  } else {
    const segs =
      hasLapData && hud.lapMetrics.length >= 2 && hud.speedSplits.length <= hud.lapMetrics.length
        ? hud.lapMetrics
        : sourceSegments.length > 0
          ? sourceSegments
          : [
              {
                label: 'FULL RUN',
                timeMs: hud.raceTimeMs,
                topSpeedKmh: hud.topSpeedKmh,
                avgSpeedKmh: Math.round(hud.topSpeedKmh * 0.78),
                driftPts: hud.driftScore,
              },
            ];
    chartTitle = 'AVERAGE PACE ACROSS RACE';
    chartSubtitle = 'Sustained average speed (KM/H) per lap or race split';
    unitSuffix = 'KM/H';
    const maxAvg = Math.max(...segs.map((s) => s.avgSpeedKmh));
    bars = segs.map((s) => ({
      label: s.label,
      value: s.avgSpeedKmh,
      displayValue: `${s.avgSpeedKmh} KM/H`,
      subLabel: `${s.driftPts.toLocaleString()} Drift Pts`,
      isHighlight: s.avgSpeedKmh === maxAvg,
    }));
  }

  const maxBarValue = Math.max(1, ...bars.map((b) => b.value));
  const avgAcrossBars =
    bars.length > 0
      ? bars.reduce((acc, b) => acc + b.value, 0) / bars.length
      : 0;

  if (showSummaryScreen) {
    const activeBar =
      hoveredBarIdx !== null && bars[hoveredBarIdx] ? bars[hoveredBarIdx] : null;

    return (
      <div className="fixed inset-0 z-30 bg-[#050811]/92 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[92vh] bg-[#0b1020] border border-cyan-400/40 rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#080c19]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowSummaryScreen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                RESULTS
              </button>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-black font-display italic tracking-wide text-white truncate leading-none">
                  POST-RACE PERFORMANCE SUMMARY
                </h2>
                <p className="text-xs text-slate-400 truncate mt-1">
                  {hud.vehicleName} · {modeCfg.name} ({modeCfg.environmentName})
                </p>
              </div>
            </div>
            <BarChart3 className="w-5 h-5 text-cyan-300 shrink-0" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 garage-scroll flex flex-col gap-4">
            {/* Metric Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setChartMetric('LAP_TIME');
                    setHoveredBarIdx(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 border cursor-pointer transition-colors ${
                    chartMetric === 'LAP_TIME'
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  {hasLapData ? 'TIME PER LAP' : 'PACE / SPLITS'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMetric('TOP_SPEED');
                    setHoveredBarIdx(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 border cursor-pointer transition-colors ${
                    chartMetric === 'TOP_SPEED'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  TOP SPEEDS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMetric('AVG_SPEED');
                    setHoveredBarIdx(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 border cursor-pointer transition-colors ${
                    chartMetric === 'AVG_SPEED'
                      ? 'bg-emerald-400/20 border-emerald-400 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  AVG SPEED
                </button>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 tabular-nums">
                {activeBar
                  ? `${activeBar.label}: ${activeBar.displayValue} (${activeBar.subLabel})`
                  : `Mean: ${avgAcrossBars.toFixed(chartMetric === 'LAP_TIME' ? 2 : 0)} ${unitSuffix}`}
              </div>
            </div>

            {/* Interactive Bar Chart Card */}
            <div className="bg-[#060914] border border-white/12 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black font-display tracking-wider text-white">
                    {chartTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{chartSubtitle}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/8 text-[10px] font-bold text-cyan-300 uppercase shrink-0">
                  {bars.length} {bars.length === 1 ? 'ENTRY' : 'ENTRIES'}
                </span>
              </div>

              {/* Bar Plot Area */}
              <div className="relative pt-6 pb-2">
                {/* Horizontal Reference Gridlines */}
                <div className="relative h-48 flex items-end gap-2 sm:gap-3 border-b border-white/15 px-1">
                  <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/8 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/8 pointer-events-none" />

                  {bars.map((bar, idx) => {
                    const pct = Math.max(10, Math.round((bar.value / maxBarValue) * 100));
                    const barColor = bar.isHighlight
                      ? chartMetric === 'TOP_SPEED'
                        ? 'from-amber-400 to-cyan-300'
                        : chartMetric === 'AVG_SPEED'
                          ? 'from-emerald-400 to-cyan-400'
                          : 'from-cyan-400 to-emerald-400'
                      : 'from-slate-600 to-slate-400';

                    return (
                      <button
                        key={`${bar.label}-${idx}`}
                        type="button"
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                        onClick={() => setHoveredBarIdx(idx)}
                        className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer focus:outline-none min-w-0"
                      >
                        <span
                          className={`text-[10px] sm:text-[11px] font-black tabular-nums mb-1.5 truncate max-w-full ${
                            bar.isHighlight ? 'text-amber-300' : 'text-slate-300'
                          }`}
                        >
                          {bar.displayValue}
                        </span>
                        <div
                          className={`w-full max-w-[54px] rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-300 ${
                            hoveredBarIdx === idx ? 'brightness-125 ring-2 ring-white/50' : ''
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-start gap-2 sm:gap-3 px-1 pt-2">
                  {bars.map((bar, idx) => (
                    <div key={`${bar.label}-lbl-${idx}`} className="flex-1 text-center min-w-0">
                      <div className="text-[11px] font-black text-white truncate">
                        {bar.label}
                      </div>
                      <div className="text-[9px] font-medium text-slate-400 truncate">
                        {bar.subLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Telemetry Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  PEAK SPEED
                </div>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {hud.topSpeedKmh} KM/H
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {hud.bestLapMs !== null ? 'BEST LAP' : 'TOTAL TIME'}
                </div>
                <div className="text-lg font-black text-cyan-300 mt-0.5">
                  {hud.bestLapMs !== null
                    ? formatRaceTime(hud.bestLapMs)
                    : formatRaceTime(hud.raceTimeMs)}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  DRIFT / NEAR MISS
                </div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  {hud.driftScore.toLocaleString()} · {hud.nearMisses}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  HULL LEFT
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {hud.hullIntegrity}%
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-white/10 bg-[#080c19] grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setShowSummaryScreen(false)}
              className="py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              SHOWROOM
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black italic tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              PLAY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-[#050811]/86 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto garage-scroll bg-[#0b1020] border border-amber-400/35 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 sm:gap-4">
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-full border mb-2 ${
              !hud.victory
                ? 'bg-rose-500/20 border-rose-400/50'
                : 'bg-amber-400/15 border-amber-400/40'
            }`}
          >
            {!hud.victory ? (
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            ) : (
              <Trophy className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display italic tracking-wide text-white">
            {hud.resultHeadline || 'RUN COMPLETE'}
          </h2>
          <p className="text-xs font-semibold tracking-widest text-slate-400 mt-1">
            {hud.resultSubline || `${modeCfg.name.toUpperCase()} · ${hud.vehicleName.toUpperCase()}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 tabular-nums">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-400">TIME</span>
              {newRecords?.bestRaceTime && (
                <span className="px-1 py-0.5 rounded bg-amber-400/25 text-[8px] font-black text-amber-300">
                  NEW RECORD!
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">
              {formatRaceTime(hud.raceTimeMs)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-400">SCORE</span>
              {newRecords?.highScore && (
                <span className="px-1 py-0.5 rounded bg-amber-400/25 text-[8px] font-black text-amber-300">
                  NEW RECORD!
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-400">
                {thirdLabel}
              </span>
              {((hud.mode === 'TIME_TRIAL' && newRecords?.bestLap) ||
                (hud.mode === 'COP_TAKEDOWN' && newRecords?.maxTakedowns)) && (
                <span className="px-1 py-0.5 rounded bg-amber-400/25 text-[8px] font-black text-amber-300">
                  NEW RECORD!
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">
              {thirdValue}
            </div>
          </div>
        </div>

        {showStandings ? (
          <div className="flex flex-col gap-1.5">
            {hud.standings.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm tabular-nums ${
                  r.isPlayer
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-white font-bold'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 font-black text-amber-300">#{r.position}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span>{r.name}</span>
                </div>
                <span className="text-xs font-semibold">
                  {r.eliminated
                    ? 'ELIMINATED'
                    : r.finished
                      ? formatRaceTime(r.totalTimeMs)
                      : 'RACING'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 tabular-nums">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400">
                  TOP SPEED
                </span>
                {newRecords?.topSpeed && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/25 text-[8px] font-black text-amber-300">
                    NEW RECORD!
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {hud.topSpeedKmh} KM/H
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400">
                  {hud.mode === 'POLICE_ESCAPE' ? 'UNITS SHAKEN' : 'VEHICLE'}
                </span>
                {hud.mode === 'POLICE_ESCAPE' && newRecords?.maxTakedowns && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/25 text-[8px] font-black text-amber-300">
                    NEW RECORD!
                  </span>
                )}
              </div>
              <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5 truncate">
                {hud.mode === 'POLICE_ESCAPE'
                  ? `${hud.takedowns} · ${formatShortSec(hud.modeTimerMs)} LEFT`
                  : hud.vehicleName}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSummaryScreen(true)}
          className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/45 text-cyan-200 font-black tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-cyan-300" />
          PERFORMANCE SUMMARY & CHARTS
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onReturnToTitle}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            SHOWROOM
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="py-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black italic tracking-wider text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};
