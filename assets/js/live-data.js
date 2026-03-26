/**
 * live-data.js — AfroTools Live Data Fetcher
 * ============================================
 * Fetches tool data from Supabase (via Netlify API functions) first,
 * falls back to static JS data files if the API is unavailable.
 * Results are cached in localStorage for 1 hour.
 *
 * Usage in any engine / HTML page:
 *   <script src="/assets/js/live-data.js"></script>
 *   <script>
 *     LiveData.getCommodityPrices('maize').then(function(prices) { ... });
 *     LiveData.getCocoaPrices().then(function(prices) { ... });
 *     LiveData.getCoffeePrices('ET').then(function(prices) { ... });
 *     LiveData.getInputPrices('NG', 'fertilizer').then(function(inputs) { ... });
 *     LiveData.getWages('NG').then(function(wage) { ... });
 *     LiveData.getRemittance('US', 'NG').then(function(providers) { ... });
 *   </script>
 */

var LiveData = (function() {
  'use strict';

  var CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

  // ─── Cache helpers ─────────────────────────────────────────────────────────
  function cacheGet(key) {
    try {
      var raw = localStorage.getItem('ld:' + key);
      if (!raw) return null;
      var item = JSON.parse(raw);
      if (Date.now() - item.ts > CACHE_TTL) { localStorage.removeItem('ld:' + key); return null; }
      return item.data;
    } catch(e) { return null; }
  }

  function cacheSet(key, data) {
    try { localStorage.setItem('ld:' + key, JSON.stringify({ ts: Date.now(), data: data })); }
    catch(e) { /* storage full — silently skip */ }
  }

  // ─── Generic fetch wrapper ─────────────────────────────────────────────────
  async function apiFetch(url, cacheKey) {
    var cached = cacheGet(cacheKey);
    if (cached) return cached;
    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (data.ok !== false) { cacheSet(cacheKey, data); return data; }
      throw new Error(data.error || 'API error');
    } catch(e) {
      console.warn('[LiveData] API unavailable (' + cacheKey + '):', e.message);
      return null;
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * getCommodityPrices(commodity?)
   * Returns { prices: [...], benchmarks: [...] }
   * Falls back to window.COMMODITY_PRICES static data
   */
  async function getCommodityPrices(commodity) {
    var url = '/api/commodity-prices' + (commodity ? '?commodity=' + encodeURIComponent(commodity) : '');
    var key = 'commodity:' + (commodity || 'all');
    var live = await apiFetch(url, key);
    if (live && live.prices && live.prices.length > 0) return live;

    // Static fallback
    if (typeof COMMODITY_PRICES !== 'undefined') {
      var prices = [];
      if (commodity && COMMODITY_PRICES.commodities && COMMODITY_PRICES.commodities[commodity]) {
        var c = COMMODITY_PRICES.commodities[commodity];
        Object.entries(c.countryPrices || {}).forEach(function(entry) {
          prices.push(Object.assign({ country_code: entry[0], commodity: commodity }, entry[1]));
        });
      }
      return { prices: prices, benchmarks: [], _source: 'static' };
    }
    return { prices: [], benchmarks: [] };
  }

  /**
   * getCocoaPrices()
   * Returns { prices: [...] } — one row per country
   * Falls back to window.COCOA_DATA
   */
  async function getCocoaPrices() {
    var live = await apiFetch('/api/cocoa-prices', 'cocoa:all');
    if (live && live.prices && live.prices.length > 0) return live;

    if (typeof COCOA_DATA !== 'undefined') {
      var prices = Object.entries(COCOA_DATA.countries || {}).map(function(entry) {
        var code = entry[0], c = entry[1];
        return {
          country_code: code,
          country_name: c.name,
          currency: c.currency,
          farm_gate_per_kg: c.farmGatePrice_per_kg,
          export_price_per_kg_usd: c.exportPrice_per_kg ? (c.exportPrice_per_kg / 1000) : null, // assume CFA → USD if needed
          avg_yield_kg_ha: c.avgYield_kg_ha,
          _source: 'static'
        };
      });
      return { prices: prices, _source: 'static' };
    }
    return { prices: [] };
  }

  /**
   * getCoffeePrices(country?)
   * Returns { prices: [...] } — one row per country+grade
   * Falls back to window.COFFEE_DATA
   */
  async function getCoffeePrices(country) {
    var url = '/api/coffee-prices' + (country ? '?country=' + encodeURIComponent(country) : '');
    var key = 'coffee:' + (country || 'all');
    var live = await apiFetch(url, key);
    if (live && live.prices && live.prices.length > 0) return live;

    if (typeof COFFEE_DATA !== 'undefined') {
      var prices = [];
      Object.entries(COFFEE_DATA.countries || {}).forEach(function(entry) {
        var code = entry[0], c = entry[1];
        if (country && code !== country.toUpperCase()) return;
        Object.entries(c.grades || {}).forEach(function(g) {
          prices.push({
            country_code: code, country_name: c.name,
            grade: g[0], export_price_per_kg_usd: g[1].exportPrice_usd,
            farm_gate_price: g[1].farmGatePrice, farm_gate_currency: c.currency,
            _source: 'static'
          });
        });
      });
      return { prices: prices, _source: 'static' };
    }
    return { prices: [] };
  }

  /**
   * getInputPrices(country, type?)
   * Returns { inputs: [...] }
   * Falls back to window.INPUT_PRICES_DATA
   */
  async function getInputPrices(country, type) {
    var qs = [];
    if (country) qs.push('country=' + encodeURIComponent(country));
    if (type)    qs.push('type='    + encodeURIComponent(type));
    var url = '/api/input-prices' + (qs.length ? '?' + qs.join('&') : '');
    var key = 'input:' + (country || 'all') + ':' + (type || 'all');
    var live = await apiFetch(url, key);
    if (live && live.inputs && live.inputs.length > 0) return live;

    if (typeof INPUT_PRICES_DATA !== 'undefined') {
      var countryData = country && INPUT_PRICES_DATA.countries ? INPUT_PRICES_DATA.countries[country] : null;
      var inputs = [];
      if (countryData) {
        var cats = type ? { [type]: countryData[type] } : countryData;
        Object.entries(cats || {}).forEach(function(cat) {
          (cat[1] || []).forEach(function(item) {
            inputs.push(Object.assign({ country_code: country, input_type: cat[0] }, item, { _source: 'static' }));
          });
        });
      }
      return { inputs: inputs, _source: 'static' };
    }
    return { inputs: [] };
  }

  /**
   * getWages(country?)
   * Returns single wage object (if country provided) or { wages: [...] }
   * Falls back to window.FARM_PAYROLL_DATA
   */
  async function getWages(country) {
    var url = '/api/wages' + (country ? '?country=' + encodeURIComponent(country) : '');
    var key = 'wages:' + (country || 'all');
    var live = await apiFetch(url, key);
    if (live && live.wages && live.wages.length > 0) {
      return country ? live.wages[0] : live;
    }

    if (typeof FARM_PAYROLL_DATA !== 'undefined') {
      if (country) {
        var c = FARM_PAYROLL_DATA.countries && FARM_PAYROLL_DATA.countries[country];
        return c ? Object.assign({ country_code: country, _source: 'static' }, c) : null;
      }
      var wages = Object.entries(FARM_PAYROLL_DATA.countries || {}).map(function(e) {
        return Object.assign({ country_code: e[0], _source: 'static' }, e[1]);
      });
      return { wages: wages, _source: 'static' };
    }
    return country ? null : { wages: [] };
  }

  /**
   * getRemittance(sendCountry?, receiveCountry?, provider?)
   * Returns { providers: [...] }
   * Falls back gracefully (no static fallback for remittance — data is fully dynamic)
   */
  async function getRemittance(sendCountry, receiveCountry, provider) {
    var qs = [];
    if (sendCountry)    qs.push('send='     + encodeURIComponent(sendCountry));
    if (receiveCountry) qs.push('receive='  + encodeURIComponent(receiveCountry));
    if (provider)       qs.push('provider=' + encodeURIComponent(provider));
    var url = '/api/remittance' + (qs.length ? '?' + qs.join('&') : '');
    var key = 'remittance:' + (sendCountry || '') + ':' + (receiveCountry || '') + ':' + (provider || '');
    var live = await apiFetch(url, key);
    return live || { providers: [] };
  }

  /**
   * invalidate(prefix?)
   * Clear all LiveData cache entries, optionally scoped by prefix
   * E.g. LiveData.invalidate('cocoa') clears only cocoa cache
   */
  function invalidate(prefix) {
    var prefixKey = 'ld:' + (prefix || '');
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith(prefixKey)) localStorage.removeItem(k);
    });
  }

  return {
    getCommodityPrices: getCommodityPrices,
    getCocoaPrices:     getCocoaPrices,
    getCoffeePrices:    getCoffeePrices,
    getInputPrices:     getInputPrices,
    getWages:           getWages,
    getRemittance:      getRemittance,
    invalidate:         invalidate,
  };
})();
