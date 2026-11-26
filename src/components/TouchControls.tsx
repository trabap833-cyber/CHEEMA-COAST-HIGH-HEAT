import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Disc, Flame, Sparkles } from 'lucide-react';
import { InputState, TouchSteerMode } from '../game/types';

interface TouchControlsProps {
  visible: boolean;
  steerMode: TouchSteerMode;
  onToggleSteerMode: () => void;
  onInputChange: (patch: Partial<InputState>) => void;
}

type PedalKey = 'throttle' | 'brake' | 'drift' | 'nitro';

export const TouchControls: React.FC<TouchControlsProps> = ({
  visible,
  steerMode,
  onToggleSteerMode,
  onInputChange,
}) => {
  const [activePedals, setActivePedals] = useState<Record<PedalKey, boolean>>({
    throttle: false,
    brake: false,
    drift: false,
    nitro: false,
  });
  const [steerSide, setSteerSide] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [wheelAxis, setWheelAxis] = useState(0); // +1 left, -1 right

  const pedalPointersRef = useRef<Map<number, PedalKey>>(new Map());
  const steerPointerIdRef = useRef<number | null>(null);
  const steerPadRef = useRef<HTMLDivElement | null>(null);
  const wheelPadRef = useRef<HTMLDivElement | null>(null);

  const resetAllInputs = useCallback(() => {
    pedalPointersRef.current.clear();
    steerPointerIdRef.current = null;
    setActivePedals({
      throttle: false,
      brake: false,
      drift: false,
      nitro: false,
    });
    setSteerSide(null);
    setWheelAxis(0);
    onInputChange({
      throttle: false,
      brake: false,
      left: false,
      right: false,
      drift: false,
      nitro: false,
      steerAxis: 0,
    });
  }, [onInputChange]);

  useEffect(() => {
    if (!visible) {
      resetAllInputs();
    }
  }, [visible, resetAllInputs]);

  useEffect(() => {
    const onBlurOrHide = () => {
      if (document.hidden) {
        resetAllInputs();
      }
    };
    window.addEventListener('blur', resetAllInputs);
    document.addEventListener('visibilitychange', onBlurOrHide);
    return () => {
      window.removeEventListener('blur', resetAllInputs);
      document.removeEventListener('visibilitychange', onBlurOrHide);
      resetAllInputs();
    };
  }, [resetAllInputs]);

  // Reset steering when switching between BUTTONS and WHEEL
  useEffect(() => {
    steerPointerIdRef.current = null;
    setSteerSide(null);
    setWheelAxis(0);
    onInputChange({ left: false, right: false, steerAxis: 0 });
  }, [steerMode, onInputChange]);

  const syncPedalsFromMap = useCallback(() => {
    const next: Record<PedalKey, boolean> = {
      throttle: false,
      brake: false,
      drift: false,
      nitro: false,
    };
    pedalPointersRef.current.forEach((key) => {
      next[key] = true;
    });
    setActivePedals(next);
    onInputChange(next);
  }, [onInputChange]);

  const bindPedal = (key: PedalKey) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture failure on unsupported browsers
      }
      pedalPointersRef.current.set(e.pointerId, key);
      syncPedalsFromMap();
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      pedalPointersRef.current.delete(e.pointerId);
      syncPedalsFromMap();
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      pedalPointersRef.current.delete(e.pointerId);
      syncPedalsFromMap();
    },
    onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pedalPointersRef.current.has(e.pointerId)) {
        pedalPointersRef.current.delete(e.pointerId);
        syncPedalsFromMap();
      }
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Left/Right dual-zone steering pad (supports thumb sliding smoothly Left <-> Right)
  const updateButtonSteerFromClientX = useCallback(
    (clientX: number) => {
      const el = steerPadRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = rect.left + rect.width * 0.5;
      if (clientX <= mid) {
        setSteerSide('LEFT');
        onInputChange({ left: true, right: false, steerAxis: 0 });
      } else {
        setSteerSide('RIGHT');
        onInputChange({ left: false, right: true, steerAxis: 0 });
      }
    },
    [onInputChange],
  );

  const handleButtonsSteerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    steerPointerIdRef.current = e.pointerId;
    updateButtonSteerFromClientX(e.clientX);
  };

  const handleButtonsSteerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (steerPointerIdRef.current !== e.pointerId) return;
    updateButtonSteerFromClientX(e.clientX);
  };

  const handleButtonsSteerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (steerPointerIdRef.current !== e.pointerId) return;
    steerPointerIdRef.current = null;
    setSteerSide(null);
    onInputChange({ left: false, right: false, steerAxis: 0 });
  };

  // Virtual Analog Steering Wheel / Slider pad
  const updateWheelFromClientX = useCallback(
    (clientX: number) => {
      const el = wheelPadRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width * 0.5;
      const maxRadius = Math.max(24, rect.width * 0.42);
      // Dragging left (clientX < center) -> positive axis (+1 = steer left)
      const raw = (center - clientX) / maxRadius;
      const clamped = Math.max(-1, Math.min(1, raw));
      const deadzoned = Math.abs(clamped) < 0.06 ? 0 : Number(clamped.toFixed(3));
      setWheelAxis(deadzoned);
      onInputChange({
        steerAxis: deadzoned,
        left: deadzoned > 0.14,
        right: deadzoned < -0.14,
      });
    },
    [onInputChange],
  );

  const handleWheelDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    steerPointerIdRef.current = e.pointerId;
    updateWheelFromClientX(e.clientX);
  };

  const handleWheelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (steerPointerIdRef.current !== e.pointerId) return;
    updateWheelFromClientX(e.clientX);
  };

  const handleWheelEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (steerPointerIdRef.current !== e.pointerId) return;
    steerPointerIdRef.current = null;
    setWheelAxis(0);
    onInputChange({ steerAxis: 0, left: false, right: false });
  };

  if (!visible) return null;

  const wheelDeg = -wheelAxis * 68;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 pointer-events-none flex items-end justify-between px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Bottom-Left: Steering Controls + Quick Mode Switcher */}
      <div className="flex flex-col items-start gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleSteerMode}
          className="touch-btn min-h-[34px] px-2.5 py-1 rounded-lg bg-[#080c19]/80 border border-white/15 text-[10px] font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1 cursor-pointer"
        >
          <Disc className="w-3 h-3 shrink-0" />
          {steerMode === 'BUTTONS' ? 'SWITCH TO WHEEL' : 'SWITCH TO PADS'}
        </button>

        {steerMode === 'BUTTONS' ? (
          <div
            ref={steerPadRef}
            onPointerDown={handleButtonsSteerDown}
            onPointerMove={handleButtonsSteerMove}
            onPointerUp={handleButtonsSteerEnd}
            onPointerCancel={handleButtonsSteerEnd}
            onLostPointerCapture={handleButtonsSteerEnd}
            onContextMenu={(e) => e.preventDefault()}
            className="touch-btn flex items-center gap-2.5 sm:gap-3"
          >
            <div
              role="button"
              aria-label="Steer Left"
              className={`w-[68px] h-[68px] sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-transform ${
                steerSide === 'LEFT'
                  ? 'scale-95 bg-cyan-500/35 border-cyan-300 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                  : 'bg-[#080c19]/78 border-white/25 text-white/90'
              }`}
            >
              <ChevronLeft className="w-9 h-9 sm:w-10 sm:h-10" />
            </div>
            <div
              role="button"
              aria-label="Steer Right"
              className={`w-[68px] h-[68px] sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-transform ${
                steerSide === 'RIGHT'
                  ? 'scale-95 bg-cyan-500/35 border-cyan-300 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                  : 'bg-[#080c19]/78 border-white/25 text-white/90'
              }`}
            >
              <ChevronRight className="w-9 h-9 sm:w-10 sm:h-10" />
            </div>
          </div>
        ) : (
          <div
            ref={wheelPadRef}
            role="slider"
            aria-label="Virtual Steering Wheel"
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round(-wheelAxis * 100)}
            onPointerDown={handleWheelDown}
            onPointerMove={handleWheelMove}
            onPointerUp={handleWheelEnd}
            onPointerCancel={handleWheelEnd}
            onLostPointerCapture={handleWheelEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`touch-btn w-[148px] h-[84px] sm:w-[176px] sm:h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
              Math.abs(wheelAxis) > 0.05
                ? 'bg-[#0b1730]/85 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                : 'bg-[#080c19]/78 border-white/25'
            }`}
          >
            {/* Horizontal Guide Track */}
            <div className="w-[82%] h-1.5 rounded-full bg-white/12 relative mb-1.5">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]"
                style={{ left: `calc(${(0.5 - wheelAxis * 0.46) * 100}% - 7px)` }}
              />
            </div>

            {/* Rotating Wheel Visual */}
            <div
              className="w-11 h-11 rounded-full border-[3px] border-cyan-300/80 flex items-center justify-center relative"
              style={{ transform: `rotate(${wheelDeg}deg)` }}
            >
              <div className="absolute top-0.5 w-2 h-1.5 rounded-sm bg-amber-400" />
              <div className="w-full h-[2px] bg-white/45" />
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-cyan-300" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Right: Multi-Touch Pedals (Drift + Nitro above Brake + Gas) */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Secondary Action Row: Drift + Nitro */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Drift"
            {...bindPedal('drift')}
            className={`touch-btn min-w-[60px] min-h-[50px] sm:w-16 sm:h-14 rounded-xl border-2 flex flex-col items-center justify-center font-black text-[10px] tracking-wider transition-transform ${
              activePedals.drift
                ? 'scale-95 bg-amber-500/40 border-amber-300 text-white shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                : 'bg-[#080c19]/80 border-amber-400/55 text-amber-300'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>DRIFT</span>
          </button>

          <button
            type="button"
            aria-label="Nitro Boost"
            {...bindPedal('nitro')}
            className={`touch-btn min-w-[60px] min-h-[50px] sm:w-16 sm:h-14 rounded-xl border-2 flex flex-col items-center justify-center font-black text-[10px] tracking-wider transition-transform ${
              activePedals.nitro
                ? 'scale-95 bg-cyan-500/45 border-cyan-300 text-white shadow-[0_0_18px_rgba(0,229,255,0.5)]'
                : 'bg-[#080c19]/80 border-cyan-400/60 text-cyan-300'
            }`}
          >
            <Flame className="w-4 h-4 mb-0.5" />
            <span>NITRO</span>
          </button>
        </div>

        {/* Primary Pedals: Brake/Reverse & Gas */}
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="Brake and Reverse"
            {...bindPedal('brake')}
            className={`touch-btn w-[64px] h-[64px] sm:w-[74px] sm:h-[74px] rounded-2xl border-2 flex flex-col items-center justify-center font-black text-[11px] tracking-wider transition-transform ${
              activePedals.brake
                ? 'scale-95 bg-rose-500/45 border-rose-300 text-white shadow-[0_0_18px_rgba(244,63,94,0.45)]'
                : 'bg-[#080c19]/80 border-rose-400/60 text-rose-300'
            }`}
          >
            <span>BRAKE</span>
            <span className="text-[8px] opacity-75">REV</span>
          </button>

          <button
            type="button"
            aria-label="Accelerate Gas"
            {...bindPedal('throttle')}
            className={`touch-btn w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] rounded-2xl border-2 flex items-center justify-center font-black text-sm tracking-widest transition-transform ${
              activePedals.throttle
                ? 'scale-95 bg-emerald-500/50 border-emerald-300 text-white shadow-[0_0_22px_rgba(16,185,129,0.55)]'
                : 'bg-emerald-500/22 border-emerald-400/75 text-emerald-200'
            }`}
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
