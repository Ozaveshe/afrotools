/**
 * AfroTools Service Worker — Offline Support
 * ============================================
 * Caches core tool pages so calculators work offline.
 * Strategy: Network-first for HTML/API, Cache-first for static assets.
 */

const CACHE_NAME = "afrotools-v1";
const STATIC_CACHE = "afrotools-static-v1";
const DATA_CACHE = "afrotools-data-v1";

// Core assets to precache on install
const PRECACHE_ASSETS = [
  "/",
  "/all-tools/",
  "/assets/css/global.css",
  "/assets/js/afrotools-reporter.js",
  "/manifest.json",
];

// Patterns for different cache strategies
const CACHE_STRATEGIES = {
  // Static assets: cache-first (fonts, images, CSS, JS)
  cacheFirst: [
    /\.css$/,
    /\.js$/,
    /\.woff2?$/,
    /\.webp$/,
    /\.png$/,
    /\.jpg$/,
    /\.svg$/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
  ],
  // API data: network-first with cache fallback
  networkFirst: [
    /\/api\//,
    /open\.er-api\.com/,
    /\.json$/,
  ],
  // HTML pages: stale-while-revalidate
  staleWhileRevalidate: [
    /\/(nigeria|ghana|kenya|south-africa|egypt|tanzania|togo)\//,
    /\/tools\//,
    /\/blog\//,
  ],
};

// ==================== INSTALL ====================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ==================== ACTIVATE ====================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== CACHE_NAME &&
              key !== STATIC_CACHE &&
              key !== DATA_CACHE
          )
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ==================== FETCH ====================

function matchesAny(url, patterns) {
  return patterns.some((p) => p.test(url));
}

// Cache-first: serve from cache, fall back to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline response for images
    if (/\.(png|jpg|webp|svg)$/.test(request.url)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="#999">Offline</text></svg>',
        { headers: { "Content-Type": "image/svg+xml" } }
      );
    }
    throw new Error("Network and cache both failed");
  }
}

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Add header to indicate stale data
      const headers = new Headers(cached.headers);
      headers.set("X-AfroTools-Cache", "stale");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({ error: "offline", cached: false }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Stale-while-revalidate: serve cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || offlineFallback();
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Offline — AfroTools</title>
    <style>
      body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;color:#333}
      .container{text-align:center;padding:40px}
      h1{color:#008751;font-size:32px}
      p{color:#666;max-width:400px;margin:16px auto}
      .retry{display:inline-block;margin-top:20px;padding:12px 24px;background:#008751;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}
    </style></head>
    <body><div class="container">
      <h1>You're Offline</h1>
      <p>The page you're looking for hasn't been cached yet. Connect to the internet and try again.</p>
      <p>Tip: Visit any AfroTools calculator once while online, and it'll work offline next time.</p>
      <a href="/" class="retry" onclick="location.reload();return false">Try Again</a>
    </div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin analytics and tracking
  if (
    url.includes("google-analytics") ||
    url.includes("googletagmanager") ||
    url.includes("analytics")
  ) {
    return;
  }

  if (matchesAny(url, CACHE_STRATEGIES.cacheFirst)) {
    event.respondWith(cacheFirst(event.request));
  } else if (matchesAny(url, CACHE_STRATEGIES.networkFirst)) {
    event.respondWith(networkFirst(event.request));
  } else if (matchesAny(url, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
  // Default: let browser handle normally
});
