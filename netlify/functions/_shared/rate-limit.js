/**
 * AfroTools — Shared Rate Limiter
 * In-memory rate limiting with automatic eviction to prevent memory leaks.
 *
 * Usage:
 *   const { checkRateLimit } = require('./_shared/rate-limit');
 *   if (!checkRateLimit(clientIp)) return 429;
 */

var MAX_ENTRIES = 10000; // Hard cap — evict oldest when exceeded
var DAY_MS = 24 * 60 * 60 * 1000;
var DEFAULT_LIMIT = 100;

// Shared map across all endpoints in the same warm invocation
var store = new Map();
var lastCleanup = Date.now();
var CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Check and increment rate limit for an IP.
 * @param {string} ip
 * @param {number} [limit] - Requests per day (default 100)
 * @returns {boolean} true if allowed, false if exceeded
 */
function checkRateLimit(ip, limit) {
  limit = limit || DEFAULT_LIMIT;
  var now = Date.now();

  // Periodic cleanup: evict expired entries
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanup(now);
    lastCleanup = now;
  }

  var record = store.get(ip);
  if (!record || now - record.start > DAY_MS) {
    // Hard cap: if map is too large, evict 20% oldest
    if (store.size >= MAX_ENTRIES) {
      evictOldest(Math.floor(MAX_ENTRIES * 0.2));
    }
    store.set(ip, { start: now, count: 1 });
    return true;
  }

  record.count++;
  return record.count <= limit;
}

/**
 * Get remaining requests for an IP.
 */
function getRemaining(ip, limit) {
  limit = limit || DEFAULT_LIMIT;
  var record = store.get(ip);
  if (!record || Date.now() - record.start > DAY_MS) return limit;
  return Math.max(0, limit - record.count);
}

function cleanup(now) {
  var expired = [];
  store.forEach(function(record, ip) {
    if (now - record.start > DAY_MS) expired.push(ip);
  });
  expired.forEach(function(ip) { store.delete(ip); });
  if (expired.length > 0) {
    console.log('[rate-limit] Cleaned up ' + expired.length + ' expired entries');
  }
}

function evictOldest(count) {
  var entries = [];
  store.forEach(function(record, ip) {
    entries.push({ ip: ip, start: record.start });
  });
  entries.sort(function(a, b) { return a.start - b.start; });
  for (var i = 0; i < Math.min(count, entries.length); i++) {
    store.delete(entries[i].ip);
  }
  console.log('[rate-limit] Evicted ' + count + ' oldest entries (map size was ' + (store.size + count) + ')');
}

module.exports = { checkRateLimit, getRemaining };
