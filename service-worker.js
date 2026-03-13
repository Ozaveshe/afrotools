/**
 * AFROTOOLS SERVICE WORKER
 * Cache-first for static assets, network-first for pages, network-only for API
 */
const CACHE_NAME = 'afrotools-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  '/',
  '/offline.html',
  '/assets/css/tokens.min.css',
  '/assets/css/global.min.css',
  '/assets/js/components/navbar.min.js',
  '/assets/js/components/footer.min.js',
  '/assets/img/logo-mark.svg',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png'
];

/* ── Install ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate — clean old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch strategy ── */
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Network-only: API calls & serverless functions
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) {
    return; // let browser handle normally
  }

  // Cache-first: static assets (CSS, JS, images, fonts)
  if (/^\/(assets)\//i.test(url.pathname) || /\.(css|js|woff2?|svg|png|jpg|webp|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first: HTML pages & navigations
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Default: cache-first with network fallback
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
