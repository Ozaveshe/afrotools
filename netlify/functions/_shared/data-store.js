/**
 * AfroTools Live Monitoring — Shared Data Store
 * Reads/writes live data from Netlify Blobs with fallback to static JSON files.
 */

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'live-data';

// Key-to-static-file mapping for fallback
const STATIC_PATHS = {
  'forex-latest': '/data/forex/latest.json',
  'fuel-latest': '/data/fuel/latest.json',
  'rates-latest': '/data/rates/latest.json',
  'meta': '/data/_meta.json',
  // History files
  'forex-history-usd-ngn-30d': '/data/forex/history/usd-ngn-30d.json',
  'forex-history-usd-kes-30d': '/data/forex/history/usd-kes-30d.json',
  'forex-history-usd-zar-30d': '/data/forex/history/usd-zar-30d.json',
  'forex-history-usd-ghs-30d': '/data/forex/history/usd-ghs-30d.json',
  'forex-history-usd-egp-30d': '/data/forex/history/usd-egp-30d.json',
  'fuel-history-ng-12m': '/data/fuel/history/ng-12m.json',
  // Education
  'scholarships-latest': null, // No static fallback — API-only
};

/**
 * Get data by key. Tries Netlify Blobs first, falls back to static JSON.
 * @param {string} key - The data key (e.g., 'forex-latest', 'fuel-latest')
 * @param {string} [siteUrl] - The site URL for static file fallback
 * @returns {object|null} Parsed JSON data or null
 */
async function getData(key, siteUrl) {
  // Try Netlify Blobs first
  try {
    const store = getStore(STORE_NAME);
    const blob = await store.get(key, { type: 'json' });
    if (blob) {
      console.log(`[data-store] Blob hit for key: ${key}`);
      return blob;
    }
  } catch (err) {
    console.log(`[data-store] Blob miss for key: ${key} — ${err.message}`);
  }

  // Fallback: fetch from static /data/ files
  const staticPath = STATIC_PATHS[key];
  if (!staticPath) {
    console.log(`[data-store] No static fallback for key: ${key}`);
    return null;
  }

  try {
    const baseUrl = siteUrl || process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://afrotools.co.za';
    const url = `${baseUrl}${staticPath}`;
    console.log(`[data-store] Fetching static fallback: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[data-store] Static fallback loaded for key: ${key}`);
    return data;
  } catch (err) {
    console.error(`[data-store] Static fallback failed for key: ${key} — ${err.message}`);
    return null;
  }
}

/**
 * Write data to Netlify Blobs.
 * @param {string} key - The data key
 * @param {object} data - The data to store
 * @returns {boolean} Success status
 */
async function setData(key, data) {
  try {
    const store = getStore(STORE_NAME);
    await store.setJSON(key, data);
    console.log(`[data-store] Blob written for key: ${key}`);
    return true;
  } catch (err) {
    console.error(`[data-store] Blob write failed for key: ${key} — ${err.message}`);
    return false;
  }
}

/**
 * Update the _meta.json tracking file in Blobs.
 * @param {string} category - 'forex', 'fuel', or 'rates'
 * @param {object} metaUpdate - Fields to update (e.g., { last_fetch, source, status })
 */
async function updateMeta(category, metaUpdate) {
  try {
    const meta = (await getData('meta')) || {};
    meta[category] = { ...meta[category], ...metaUpdate };
    await setData('meta', meta);
  } catch (err) {
    console.error(`[data-store] Meta update failed for ${category} — ${err.message}`);
  }
}

module.exports = { getData, setData, updateMeta, STORE_NAME, STATIC_PATHS };
