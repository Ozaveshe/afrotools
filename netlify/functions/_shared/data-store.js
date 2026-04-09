/**
 * AfroTools Live Monitoring — Shared Data Store
 *
 * Write path:  Supabase live_data_store (primary) → Netlify Blobs (cache, best-effort)
 * Read path:   Supabase live_data_store (primary) → Netlify Blobs (cache) → static JSON (fallback)
 *
 * Netlify Blobs writes fail from scheduled functions (missing deploy context),
 * so Supabase is the reliable write target. Blobs still work as a fast read cache
 * for request-triggered functions that have deploy context.
 */

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'live-data';

const SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                     process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                     process.env.SUPABASE_SERVICE_KEY;

// Key-to-static-file mapping for fallback
const STATIC_PATHS = {
  'forex-latest': '/data/forex/latest.json',
  'fuel-latest': '/data/fuel/latest.json',
  'rates-latest': '/data/rates/latest.json',
  'meta': '/data/_meta.json',
  'forex-history-usd-ngn-30d': '/data/forex/history/usd-ngn-30d.json',
  'forex-history-usd-kes-30d': '/data/forex/history/usd-kes-30d.json',
  'forex-history-usd-zar-30d': '/data/forex/history/usd-zar-30d.json',
  'forex-history-usd-ghs-30d': '/data/forex/history/usd-ghs-30d.json',
  'forex-history-usd-egp-30d': '/data/forex/history/usd-egp-30d.json',
  'fuel-history-ng-12m': '/data/fuel/history/ng-12m.json',
  'scholarships-latest': null,
  'commodity-prices-latest': null,
  'electricity-latest': null,
  'telecom-latest': null,
  'insurance-rates-latest': null,
  'property-prices-latest': null,
  'salary-benchmarks-latest': null,
  'stock-indices-latest': null,
  'shipping-rates-latest': null,
  'prev-fuel': null,
  'prev-electricity': null,
  'prev-commodities': null,
  'agri-inputs-latest': null,
  'crypto-latest': null,
  'gazette-last-ilo': null,
  'gazette-last-wb-tax': null,
};

// ── Read ────────────────────────────────────────────────────────────

/**
 * Get data by key.
 * Read order: Supabase → Netlify Blobs → static JSON files.
 */
async function getData(key, siteUrl) {
  // 1. Try Supabase (primary — always available)
  if (SUPABASE_KEY) {
    try {
      var res = await fetch(
        SUPABASE_URL + '/rest/v1/live_data_store?key=eq.' + encodeURIComponent(key) + '&select=data',
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
      );
      if (res.ok) {
        var rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data) {
          console.log('[data-store] Supabase hit for key: ' + key);
          return rows[0].data;
        }
      }
    } catch (err) {
      console.log('[data-store] Supabase read failed for ' + key + ': ' + err.message);
    }
  }

  // 2. Try Netlify Blobs (fast cache — works in request context)
  try {
    var store = getStore(STORE_NAME);
    var blob = await store.get(key, { type: 'json' });
    if (blob) {
      console.log('[data-store] Blob hit for key: ' + key);
      return blob;
    }
  } catch (err) {
    console.log('[data-store] Blob miss for key: ' + key + ' — ' + err.message);
  }

  // 3. Fallback: static JSON files
  var staticPath = STATIC_PATHS[key];
  if (!staticPath) {
    console.log('[data-store] No static fallback for key: ' + key);
    return null;
  }

  try {
    var baseUrl = siteUrl || process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://afrotools.com';
    var url = baseUrl + staticPath;
    console.log('[data-store] Fetching static fallback: ' + url);
    var response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var data = await response.json();
    console.log('[data-store] Static fallback loaded for key: ' + key);
    return data;
  } catch (err) {
    console.error('[data-store] Static fallback failed for key: ' + key + ' — ' + err.message);
    return null;
  }
}

// ── Write ───────────────────────────────────────────────────────────

/**
 * Write data by key.
 * Write order: Supabase (primary, must succeed) → Netlify Blobs (best-effort cache).
 */
async function setData(key, data) {
  var supabaseOk = false;
  var blobOk = false;

  // 1. Write to Supabase (primary — upsert)
  if (SUPABASE_KEY) {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/live_data_store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          key: key,
          data: data,
          updated_at: new Date().toISOString(),
        }),
      });
      supabaseOk = res.ok;
      if (supabaseOk) {
        console.log('[data-store] Supabase written for key: ' + key);
      } else {
        var errText = await res.text();
        console.error('[data-store] Supabase write failed for ' + key + ': ' + res.status + ' ' + errText);
      }
    } catch (err) {
      console.error('[data-store] Supabase write error for ' + key + ': ' + err.message);
    }
  }

  // 2. Best-effort write to Netlify Blobs (may fail from scheduled functions)
  try {
    var store = getStore(STORE_NAME);
    await store.setJSON(key, data);
    console.log('[data-store] Blob written for key: ' + key);
    blobOk = true;
  } catch (err) {
    // Expected to fail from scheduled functions — not critical
    console.log('[data-store] Blob write skipped for ' + key + ' (scheduled context)');
  }

  return supabaseOk || blobOk;
}

// ── Meta ────────────────────────────────────────────────────────────

/**
 * Update the meta tracking object.
 */
async function updateMeta(category, metaUpdate) {
  try {
    var meta = (await getData('meta')) || {};
    meta[category] = Object.assign({}, meta[category] || {}, metaUpdate);
    await setData('meta', meta);
  } catch (err) {
    console.error('[data-store] Meta update failed for ' + category + ' — ' + err.message);
  }
}

module.exports = { getData, setData, updateMeta, STORE_NAME, STATIC_PATHS };
