/**
 * AfroFX — Client-side helper for FX rate data
 * Fetches from /api/fx-rates with sessionStorage caching (1 hour TTL)
 */
(function () {
  var CACHE_TTL = 3600000; // 1 hour in ms
  var API = '/api/fx-rates';

  function cacheKey(params) {
    return 'afro_fx_' + JSON.stringify(params);
  }

  function getCached(key) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch (e) { return null; }
  }

  function setCache(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) { /* quota exceeded — ignore */ }
  }

  async function apiFetch(params) {
    var key = cacheKey(params);
    var cached = getCached(key);
    if (cached) return cached;

    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');

    var res = await fetch(API + '?' + qs);
    if (!res.ok) throw new Error('FX API returned ' + res.status);
    var data = await res.json();
    setCache(key, data);
    return data;
  }

  // Decimal places per currency for display
  var DECIMALS = {
    ZAR: 4, BWP: 4, MUR: 4, NAD: 4, SZL: 4, TND: 4, MAD: 4
  };

  window.AfroFX = {
    /** Get latest rate for a single pair */
    async getRate(base, target) {
      return apiFetch({ base: base, target: target });
    },

    /** Get all rates for a base currency */
    async getAllRates(base) {
      return apiFetch({ base: base || 'USD' });
    },

    /** Get rate history for charting */
    async getHistory(base, target, days) {
      return apiFetch({ base: base, target: target, days: days || 30 });
    },

    /** Format rate for display */
    formatRate(rate, targetCurrency) {
      var decimals = DECIMALS[targetCurrency] || 2;
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(rate);
    }
  };
})();
