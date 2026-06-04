/**
 * AFROTOOLS SERVICE WORKER
 * Stale-while-revalidate for assets, network-first for pages, network-only for API.
 *
 * CACHE_VERSION is stamped by `npm run build`; changing it purges old caches.
 */
const CACHE_VERSION = 'e292e9e4';
const CACHE_NAME = `afrotools-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  '/',
  '/offline.html',
  '/assets/css/design-system.min.css',
  '/assets/css/tokens.min.css',
  '/assets/css/skeleton.css',
  '/assets/js/components/tool-registry.js',
  '/assets/js/components/navbar.min.js?v=43e4d9b2',
  '/assets/js/components/footer.min.js',
  '/assets/js/utils.js',
  '/assets/js/lib/error-boundary.js',
  '/assets/img/logo-mark.svg',
  '/assets/img/icon-192.svg',
  '/assets/img/icon-512.svg',  '/assets/js/bundles/core.009aa1e7.min.js',
  '/assets/js/bundles/tool-page.3b1f7518.min.js',
  '/assets/js/bundles/chat.e5a3e11c.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/supabase-proxy/')) {
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (/^\/(assets)\//i.test(url.pathname) || /\.(css|js|woff2?|svg|png|jpg|webp|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

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

  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
