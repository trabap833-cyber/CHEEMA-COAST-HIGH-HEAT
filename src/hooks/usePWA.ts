import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAState {
  isOnline: boolean;
  isOfflineReady: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<boolean>;
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(() =>
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? Boolean(navigator.serviceWorker.controller)
      : false,
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    let swCleanup: (() => void) | undefined;

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SW_OFFLINE_READY') {
          setIsOfflineReady(true);
        }
      };

      const handleControllerChange = () => {
        setIsOfflineReady(true);
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (reg.active) {
            setIsOfflineReady(true);
          }
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'activated' || worker.state === 'installed') {
                setIsOfflineReady(true);
              }
            });
          });
        })
        .catch(() => {
          // Ignore service worker registration errors in unsupported contexts
        });

      swCleanup = () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      swCleanup?.();
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch {
      // Ignore user prompt dismissal errors
    }
    return false;
  }, [deferredPrompt]);

  return {
    isOnline,
    isOfflineReady,
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
