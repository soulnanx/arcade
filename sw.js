/**
 * SERVICE WORKER - Bottle Color PWA
 * Estratégia: Cache-first para assets estáticos, Network-first para HTML
 * Precache de próxima fase em background
 */

const CACHE_NAME = 'bottle-color-v2';
const STATIC_CACHE = 'bottle-color-static-v2';
const DYNAMIC_CACHE = 'bottle-color-dynamic-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './storage.js',
  './performance.js',
  './sound.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// Install: Precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes('bottle-color'))
          .concat(
            cacheNames.filter((name) =>
              name.includes('bottle-color') &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE
            )
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Smart strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // HTML: Network-first with cache fallback
  if (event.request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      // For SVG icons and other static files
      return fetch(event.request).then((response) => {
        // Don't cache if not valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => {
        // Fallback for icons
        if (url.pathname.includes('icon')) {
          return caches.match('./icon-192.svg');
        }
      });
    })
  );
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Precache next level
  if (event.data && event.data.type === 'PRECACHE_LEVEL') {
    const levelUrl = `./level-${event.data.level}.json`;
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.add(levelUrl).catch(() => {});
    });
  }
});

// Background sync for progress (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Placeholder for cloud sync
  // Could sync with a backend here
  return Promise.resolve();
}
