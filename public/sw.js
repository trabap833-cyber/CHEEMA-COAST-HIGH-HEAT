/* Cheema Coast: High Heat — Offline-First Service Worker */
const CACHE_VERSION = /*__CACHE_VERSION__*/ 'cheema-coast-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const FONT_CACHE = 'cheema-coast-fonts-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

const BUILD_MANIFEST_URLS = /*__PRECACHE_MANIFEST__*/ [];

const PRECACHE_URLS = Array.from(new Set([...APP_SHELL_URLS, ...BUILD_MANIFEST_URLS]));

const OFFLINE_IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#0b1020"/>' +
  '<rect x="28" y="28" width="744" height="394" rx="18" fill="none" stroke="#22d3ee" stroke-opacity="0.45" stroke-width="2"/>' +
  '<text x="400" y="218" text-anchor="middle" fill="#f8fafc" font-family="system-ui,sans-serif" font-size="28" font-weight="700">CHEEMA COAST: HIGH HEAT</text>' +
  '<text x="400" y="258" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="16">Offline Cached Asset</text>' +
  '</svg>';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (res && res.ok) {
              await cache.put(url, res);
            }
          } catch {
            // Skip any individual asset fetch error without aborting install
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          const isCurrent = key === STATIC_CACHE || key === RUNTIME_CACHE || key === FONT_CACHE;
          return isCurrent ? Promise.resolve(false) : caches.delete(key);
        }),
      );
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'SW_OFFLINE_READY' });
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isFontRequest(url) {
  return (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  );
}

function isStaticAssetRequest(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    return true;
  }
  return /\.(?:js|mjs|css|png|jpg|jpeg|webp|svg|ico|woff2?|webmanifest|json)$/i.test(
    url.pathname,
  );
}

async function handleNavigationRequest(request) {
  // Offline-first for app shell navigation with background refresh when online
  const staticCache = await caches.open(STATIC_CACHE);
  const cachedIndex =
    (await staticCache.match('/index.html')) || (await staticCache.match('/'));

  const networkPromise = fetch(request)
    .then(async (res) => {
      if (res && res.ok && res.type === 'basic') {
        await staticCache.put('/index.html', res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cachedIndex) {
    // Refresh in background without blocking offline boot
    void networkPromise;
    return cachedIndex;
  }

  const networkRes = await networkPromise;
  if (networkRes) return networkRes;

  const fallback = await caches.match('/index.html');
  if (fallback) return fallback;

  return new Response(
    '<!doctype html><html><body style="background:#070913;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div><h2>Cheema Coast: High Heat</h2><p>Offline cache initializing. Reload once online.</p></div></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function handleStaticAssetRequest(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;

  try {
    const networkRes = await fetch(request);
    if (networkRes && networkRes.ok) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      await runtimeCache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    if (request.destination === 'image') {
      return new Response(OFFLINE_IMAGE_SVG, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
      });
    }
    return Response.error();
  }
}

async function handleFontRequest(request) {
  const fontCache = await caches.open(FONT_CACHE);
  const cached = await fontCache.match(request);
  if (cached) return cached;

  try {
    const networkRes = await fetch(request);
    if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
      await fontCache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    // Gracefully return empty CSS or 504 so offline console stays clean
    if (request.url.includes('fonts.googleapis.com')) {
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/css; charset=utf-8' },
      });
    }
    return new Response('', { status: 204 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (isFontRequest(url)) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});
