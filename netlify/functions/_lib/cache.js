/**
 * AfroTools API Cache Utility
 * Wraps getData() with cache-aware headers and hit/miss tracking.
 *
 * Usage:
 *   const { cachedResponse } = require('./_lib/cache');
 *   return cachedResponse(key, { browserTTL, cdnTTL, staleTTL }, fetchFn, extraHeaders);
 */

const { getData } = require('../_shared/data-store');

// In-memory TTL cache for function-level caching (survives warm invocations)
const memCache = new Map();

/**
 * Get data with in-memory caching layer on top of Blobs.
 * @param {string} key - Data store key
 * @param {number} ttlMs - In-memory TTL in milliseconds
 * @returns {{ data: object|null, fromCache: boolean }}
 */
async function getOrFetch(key, ttlMs) {
  // Check in-memory cache first (fastest)
  var cached = memCache.get(key);
  if (cached && Date.now() - cached.time < ttlMs) {
    return { data: cached.data, fromCache: true };
  }

  // Fall through to Blobs + static fallback via data-store
  var data = await getData(key);
  if (data) {
    memCache.set(key, { data: data, time: Date.now() });
  }

  return { data: data, fromCache: false };
}

/**
 * Build cache-aware HTTP headers.
 * @param {object} opts - { browserTTL, cdnTTL, staleTTL } in seconds
 * @param {boolean} fromCache - Whether data came from cache
 * @param {object} [baseHeaders] - Existing headers to merge with
 * @returns {object} Headers object
 */
function cacheHeaders(opts, fromCache, baseHeaders) {
  var browserTTL = opts.browserTTL || 300;
  var cdnTTL = opts.cdnTTL || 900;
  var staleTTL = opts.staleTTL || cdnTTL;

  return Object.assign({}, baseHeaders || {}, {
    'Cache-Control': 'public, max-age=' + browserTTL + ', s-maxage=' + cdnTTL + ', stale-while-revalidate=' + staleTTL,
    'CDN-Cache-Control': 'public, max-age=' + cdnTTL,
    'X-Cache': fromCache ? 'HIT' : 'MISS',
    'Vary': 'Accept-Encoding',
  });
}

module.exports = { getOrFetch, cacheHeaders };
