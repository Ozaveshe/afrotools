/**
 * AFROTOOLS — Storage Library
 * ===================================================================
 * localStorage wrapper with TTL (time-to-live) expiry, JSON
 * serialization, and namespace support.
 *
 * Usage:
 *   AfroTools.store.set('last-calc-ng', data, { ttl: '24h' })
 *   AfroTools.store.get('last-calc-ng')         // data or null
 *   AfroTools.store.remove('last-calc-ng')
 *   AfroTools.store.has('last-calc-ng')          // boolean
 *   AfroTools.store.keys()                       // all AfroTools keys
 *   AfroTools.store.clear()                      // clear all AfroTools data
 *
 * TTL formats: '30m', '24h', '7d', '30d', or milliseconds (number)
 * ===================================================================
 */

(function (window) {
  'use strict';

  const PREFIX = 'aft_';

  /**
   * Parse a TTL string to milliseconds
   * @param {string|number} ttl - '30m', '24h', '7d', '30d', or ms number
   * @returns {number} Milliseconds
   */
  function parseTTL(ttl) {
    if (typeof ttl === 'number') return ttl;
    if (!ttl || typeof ttl !== 'string') return 0;

    const match = ttl.match(/^(\d+)\s*(m|h|d|w)$/i);
    if (!match) return parseInt(ttl, 10) || 0;

    const val = parseInt(match[1], 10);
    switch (match[2].toLowerCase()) {
      case 'm': return val * 60 * 1000;
      case 'h': return val * 60 * 60 * 1000;
      case 'd': return val * 24 * 60 * 60 * 1000;
      case 'w': return val * 7 * 24 * 60 * 60 * 1000;
      default:  return 0;
    }
  }

  /**
   * Check if localStorage is available
   */
  function isAvailable() {
    try {
      const test = '__aft_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  const available = isAvailable();

  const store = {
    /**
     * Store a value with optional TTL
     * @param {string} key
     * @param {*} value - Will be JSON-serialized
     * @param {Object} [opts]
     * @param {string|number} [opts.ttl] - Time-to-live: '30m', '24h', '7d', or ms
     * @returns {boolean} Success
     */
    set(key, value, opts = {}) {
      if (!available) return false;
      try {
        const entry = {
          v: value,
          t: Date.now(),
        };
        if (opts.ttl) {
          entry.e = Date.now() + parseTTL(opts.ttl);
        }
        localStorage.setItem(PREFIX + key, JSON.stringify(entry));
        return true;
      } catch (e) {
        // Storage quota exceeded — try to clean up old entries
        if (e.name === 'QuotaExceededError') {
          this._cleanup();
          try {
            const entry = { v: value, t: Date.now() };
            if (opts.ttl) entry.e = Date.now() + parseTTL(opts.ttl);
            localStorage.setItem(PREFIX + key, JSON.stringify(entry));
            return true;
          } catch {
            return false;
          }
        }
        return false;
      }
    },

    /**
     * Retrieve a value (returns null if expired or missing)
     * @param {string} key
     * @param {*} [defaultValue=null]
     * @returns {*}
     */
    get(key, defaultValue = null) {
      if (!available) return defaultValue;
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return defaultValue;

        const entry = JSON.parse(raw);

        // Check expiry
        if (entry.e && Date.now() > entry.e) {
          localStorage.removeItem(PREFIX + key);
          return defaultValue;
        }

        return entry.v !== undefined ? entry.v : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Remove a key
     * @param {string} key
     */
    remove(key) {
      if (!available) return;
      localStorage.removeItem(PREFIX + key);
    },

    /**
     * Check if a key exists and is not expired
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
      return this.get(key) !== null;
    },

    /**
     * Get all AfroTools storage keys (without prefix)
     * @returns {string[]}
     */
    keys() {
      if (!available) return [];
      const result = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          result.push(k.slice(PREFIX.length));
        }
      }
      return result;
    },

    /**
     * Clear all AfroTools storage entries
     */
    clear() {
      if (!available) return;
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    },

    /**
     * Get storage usage info
     * @returns {{ used: number, count: number }}
     */
    usage() {
      if (!available) return { used: 0, count: 0 };
      let used = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          used += (localStorage.getItem(k) || '').length * 2; // UTF-16
          count++;
        }
      }
      return { used, count };
    },

    /**
     * Push to an array stored at key (creates if missing)
     * @param {string} key
     * @param {*} item
     * @param {Object} [opts] - { maxLength, ttl }
     */
    push(key, item, opts = {}) {
      const arr = this.get(key, []);
      if (!Array.isArray(arr)) return;
      arr.push(item);
      if (opts.maxLength && arr.length > opts.maxLength) {
        arr.splice(0, arr.length - opts.maxLength);
      }
      this.set(key, arr, { ttl: opts.ttl });
    },

    /**
     * Increment a numeric value
     * @param {string} key
     * @param {number} [by=1]
     * @param {Object} [opts] - { ttl }
     * @returns {number} New value
     */
    increment(key, by = 1, opts = {}) {
      const current = this.get(key, 0);
      const newVal = (typeof current === 'number' ? current : 0) + by;
      this.set(key, newVal, opts);
      return newVal;
    },

    /**
     * Remove expired entries (garbage collection)
     * @private
     */
    _cleanup() {
      if (!available) return;
      const now = Date.now();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          try {
            const entry = JSON.parse(localStorage.getItem(k));
            if (entry.e && now > entry.e) {
              localStorage.removeItem(k);
            }
          } catch {
            // Corrupt entry, remove it
            localStorage.removeItem(k);
          }
        }
      }
    },

    /** Whether localStorage is available */
    available,
  };

  // Run cleanup on load (non-blocking)
  if (available) {
    setTimeout(() => store._cleanup(), 5000);
  }

  // ── EXPOSE ─────────────────────────────────────
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.store = store;

})(window);
