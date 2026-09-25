/* ShikshaSetu service worker.
 *
 * - App shell: index.html plus the hashed JS/CSS it references are precached on install,
 *   so the app opens with no network.
 * - Navigations: network first, falling back to the cached shell (SPA routing).
 * - /assets/*: cache first (file names are content-hashed, so they never go stale).
 * - Fonts & icons: stale-while-revalidate.
 * - /api/*: never cached here — the app stores lessons, quizzes and the sync queue in IndexedDB.
 */
const VERSION = 'v1';
const SHELL_CACHE = `shikshasetu-shell-${VERSION}`;
const RUNTIME_CACHE = `shikshasetu-runtime-${VERSION}`;
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_URLS);
    // Precache the build's hashed bundles referenced by index.html.
    const html = await (await cache.match('/index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    for (const key of await caches.keys()) {
      if (key.startsWith('shikshasetu-') && !keep.has(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/index.html', res.clone());
        return res;
      } catch {
        return (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok) (await caches.open(SHELL_CACHE)).put(request, res.clone());
      return res;
    })());
    return;
  }

  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isStatic = url.origin === self.location.origin && /\.(png|svg|webmanifest|ico)$/.test(url.pathname);
  if (isFont || isStatic) event.respondWith(staleWhileRevalidate(request));
});
