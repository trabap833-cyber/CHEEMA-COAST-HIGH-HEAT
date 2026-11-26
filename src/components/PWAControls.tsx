import React, { useState } from 'react';
import { CheckCircle2, Download, Share, WifiOff, X } from 'lucide-react';
import { PWAState } from '../hooks/usePWA';

export const OfflineStatusBadge: React.FC<{
  isOnline: boolean;
  isOfflineReady: boolean;
}> = ({ isOnline, isOfflineReady }) => {
  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/18 border border-amber-400/50 text-amber-200 text-[10px] font-black tracking-wider uppercase whitespace-nowrap"
        title="Playing offline using cached local assets and storage"
      >
        <WifiOff className="w-3 h-3 text-amber-300 shrink-0" />
        <span>OFFLINE MODE</span>
      </div>
    );
  }

  if (isOfflineReady) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-[10px] font-black tracking-wider uppercase whitespace-nowrap"
        title="All assets cached locally — ready to play without internet"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
        <span>OFFLINE READY</span>
      </div>
    );
  }

  return null;
};

export const PWAInstallButton: React.FC<{ pwa: PWAState }> = ({ pwa }) => {
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (pwa.isInstalled) {
    return null;
  }

  if (pwa.isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          void pwa.install();
        }}
        className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-100 text-xs font-black tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        title="Install Cheema Coast for offline play"
      >
        <Download className="w-4 h-4 text-cyan-300 shrink-0" />
        <span className="hidden sm:inline">INSTALL APP</span>
      </button>
    );
  }

  if (pwa.isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 text-xs font-black tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-4 h-4 text-cyan-300 shrink-0" />
          <span className="hidden sm:inline">INSTALL</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-[#050811]/88 pointer-events-auto flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0b1020] border border-cyan-400/40 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black font-display italic tracking-wide text-white">
                  INSTALL CHEEMA COAST
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install guide"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Install on iPhone or iPad to launch full-screen and race offline anytime:
              </p>
              <ol className="text-xs text-slate-200 flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-cyan-400/20 text-cyan-300 font-black flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <Share className="w-3.5 h-3.5 inline text-cyan-300 mx-0.5" />{' '}
                    <strong>Share</strong> button in Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-300 font-black flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs tracking-wider cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
