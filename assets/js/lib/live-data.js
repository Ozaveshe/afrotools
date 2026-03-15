/**
 * AFROTOOLS — LiveData Utility
 * =====================================================================
 * Handles fetching, caching, and auto-refreshing live data from JSON endpoints.
 *
 * Usage:
 *   const forex = new AfroTools.LiveData('/data/forex/latest.json', {
 *     refreshInterval: 5 * 60 * 1000,
 *     onUpdate: (data) => renderForex(data),
 *     onError: (err) => showStaleWarning(),
 *     cacheKey: 'afro-forex-latest',
 *     cacheTTL: 5 * 60 * 1000
 *   });
 *   forex.start();
 *   forex.getData();   // returns cached data synchronously
 *   forex.stop();
 *   forex.getAge();    // ms since last successful fetch
 * =====================================================================
 */
(function (window) {
  'use strict';

  const DEFAULT_REFRESH = 5 * 60 * 1000;   // 5 minutes
  const DEFAULT_TTL     = 5 * 60 * 1000;   // 5 minutes

  class LiveData {
    /**
     * @param {string} url                  - JSON endpoint URL
     * @param {Object} opts
     * @param {number} [opts.refreshInterval] - ms between auto-refreshes (default 5 min)
     * @param {Function} [opts.onUpdate]      - called with parsed data on success
     * @param {Function} [opts.onError]       - called with Error on fetch failure
     * @param {string} [opts.cacheKey]        - localStorage key for caching
     * @param {number} [opts.cacheTTL]        - ms before cache is considered stale
     */
    constructor(url, opts = {}) {
      this._url = url;
      this._refreshInterval = opts.refreshInterval || DEFAULT_REFRESH;
      this._onUpdate = opts.onUpdate || null;
      this._onError = opts.onError || null;
      this._cacheKey = opts.cacheKey || 'aft_ld_' + this._hashKey(url);
      this._cacheTTL = opts.cacheTTL || DEFAULT_TTL;

      this._data = null;
      this._lastFetch = 0;
      this._timer = null;
      this._paused = false;

      // Visibility-based pause/resume
      this._onVisibility = this._handleVisibility.bind(this);
    }

    /* ── Public API ──────────────────────────────────────── */

    /** Start fetching and auto-refresh cycle */
    start() {
      document.addEventListener('visibilitychange', this._onVisibility);
      this._loadCache();
      this._fetch();
      this._scheduleNext();
    }

    /** Stop auto-refresh */
    stop() {
      document.removeEventListener('visibilitychange', this._onVisibility);
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    }

    /** Get cached data synchronously */
    getData() {
      if (this._data) return this._data;
      this._loadCache();
      return this._data;
    }

    /** Ms since last successful fetch (Infinity if never fetched) */
    getAge() {
      return this._lastFetch ? Date.now() - this._lastFetch : Infinity;
    }

    /** Force an immediate refresh */
    refresh() {
      return this._fetch();
    }

    /* ── Internals ───────────────────────────────────────── */

    _hashKey(url) {
      let h = 0;
      for (let i = 0; i < url.length; i++) {
        h = ((h << 5) - h + url.charCodeAt(i)) | 0;
      }
      return Math.abs(h).toString(36);
    }

    _handleVisibility() {
      if (document.hidden) {
        this._paused = true;
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      } else {
        this._paused = false;
        // If stale, fetch immediately on focus
        if (this.getAge() > this._refreshInterval) {
          this._fetch();
        }
        this._scheduleNext();
      }
    }

    _scheduleNext() {
      if (this._timer) clearTimeout(this._timer);
      if (this._paused) return;
      this._timer = setTimeout(() => {
        this._fetch();
        this._scheduleNext();
      }, this._refreshInterval);
    }

    async _fetch() {
      try {
        const resp = await fetch(this._url, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        this._data = data;
        this._lastFetch = Date.now();
        this._saveCache(data);
        if (this._onUpdate) this._onUpdate(data);
      } catch (err) {
        // Attempt to use stale cache
        if (!this._data) this._loadCache();
        if (this._onError) this._onError(err);
      }
    }

    _saveCache(data) {
      try {
        localStorage.setItem(this._cacheKey, JSON.stringify({
          ts: Date.now(),
          data: data
        }));
      } catch (e) { /* localStorage full or disabled */ }
    }

    _loadCache() {
      try {
        const raw = localStorage.getItem(this._cacheKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          // Use cache even if stale for graceful degradation
          this._data = parsed.data;
          if (parsed.ts) this._lastFetch = parsed.ts;
        }
      } catch (e) { /* corrupt cache */ }
    }
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.LiveData = LiveData;

})(window);
