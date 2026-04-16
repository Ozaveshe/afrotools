/**
 * AfroTools — Data Freshness API
 * Returns the freshness status for all live data categories.
 *
 * GET /api/data-freshness          — all categories
 * GET /api/data-freshness?cat=fuel — single category
 *
 * Response:
 *   {
 *     categories: {
 *       forex:       { updatedAt, status, source, age_minutes },
 *       fuel:        { updatedAt, status, source, age_minutes },
 *       commodities: { updatedAt, status, source, age_minutes },
 *       electricity: { updatedAt, status, source, age_minutes },
 *       telecom:     { updatedAt, status, source, age_minutes },
 *     },
 *     overall_health: 'healthy' | 'degraded' | 'stale'
 *   }
 *
 * This endpoint is called by the data-freshness badge on every tool page.
 */

const { getData } = require('./_shared/data-store');
const { getAllowedOrigin } = require('./utils/cors');

// Freshness thresholds per category (in minutes)
var THRESHOLDS = {
  // ExchangeRate-API publishes daily source files, so a same-day read is still live.
  forex:       { live: 1440, ok: 2880, stale: 10080 },
  fuel:        { live: 720, ok: 4320, stale: 10080 },
  commodities: { live: 1440, ok: 4320, stale: 10080 },
  electricity: { live: 1440, ok: 10080, stale: 43200 },
  telecom:     { live: 720, ok: 4320, stale: 10080 },
  rates:       { live: 1440, ok: 4320, stale: 10080 },
};

// Blob key mapping per category
var BLOB_KEYS = {
  forex: 'forex-latest',
  fuel: 'fuel-latest',
  commodities: 'commodity-prices-latest',
  electricity: 'electricity-latest',
  telecom: 'telecom-latest',
  rates: 'rates-latest',
};

function getStatus(ageMinutes, thresholds) {
  if (ageMinutes <= thresholds.live) return 'live';
  if (ageMinutes <= thresholds.ok) return 'ok';
  if (ageMinutes <= thresholds.stale) return 'stale';
  return 'offline';
}

exports.handler = async function(event) {
  var origin = getAllowedOrigin(event);
  var CORS = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=120',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  var params = event.queryStringParameters || {};
  var requestedCat = params.cat || null;

  // Get meta blob (contains last_fetch, source, status per category)
  var meta = await getData('meta');
  if (!meta) meta = {};

  var now = Date.now();
  var categories = {};
  var healthyCount = 0;
  var totalCount = 0;

  var cats = requestedCat ? [requestedCat] : Object.keys(BLOB_KEYS);

  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var threshold = THRESHOLDS[cat];
    if (!threshold) continue;

    totalCount++;
    var catMeta = meta[cat] || {};
    var lastFetch = catMeta.last_fetch ? new Date(catMeta.last_fetch).getTime() : 0;
    var ageMinutes = lastFetch ? Math.round((now - lastFetch) / 60000) : 999999;

    var status = catMeta.status === 'ok'
      ? getStatus(ageMinutes, threshold)
      : (catMeta.status || 'offline');

    if (status === 'live' || status === 'ok') healthyCount++;

    categories[cat] = {
      updatedAt: catMeta.last_fetch || null,
      status: status,
      source: catMeta.source || null,
      age_minutes: ageMinutes,
      records_count: catMeta.records_count || null,
    };
  }

  var overallHealth = 'healthy';
  if (healthyCount < totalCount * 0.5) overallHealth = 'stale';
  else if (healthyCount < totalCount) overallHealth = 'degraded';

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      categories: categories,
      overall_health: overallHealth,
      checked_at: new Date().toISOString(),
    }),
  };
};
