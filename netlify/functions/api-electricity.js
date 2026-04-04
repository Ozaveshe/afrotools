/**
 * AfroTools — Electricity Tariffs API Endpoint
 *
 * GET /api/electricity               — all countries
 * GET /api/electricity?country=NG    — single country
 * GET /api/electricity?region=west   — filter by region
 * GET /api/electricity?sort=cheapest — sorted results
 *
 * Headers: x-api-key for authenticated access
 * Rate limit: 100 requests/day without API key
 */

const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');

var CACHE_OPTS = { browserTTL: 3600, cdnTTL: 7200, staleTTL: 14400 };

var { checkRateLimit } = require('./_shared/rate-limit');

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var apiKey = event.headers['x-api-key'];
  var hasValidKey = apiKey && apiKey.length > 10;
  if (!hasValidKey) {
    var clientIp = event.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limit exceeded' }) };
    }
  }

  var { data, fromCache } = await getOrFetch('electricity-latest', 10 * 60 * 1000);
  var hdrs = cacheHeaders(CACHE_OPTS, fromCache, CORS);

  if (!data) {
    return { statusCode: 503, headers: hdrs, body: JSON.stringify({ error: 'Electricity data temporarily unavailable' }) };
  }

  var params = event.queryStringParameters || {};
  var countries = data.countries || [];

  // Filter by country code
  if (params.country) {
    countries = countries.filter(function(c) { return c.code === params.country.toUpperCase(); });
    if (countries.length === 0) {
      return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: 'Country not found' }) };
    }
  }

  // Filter by region
  if (params.region) {
    countries = countries.filter(function(c) { return c.region === params.region.toLowerCase(); });
  }

  // Sort
  if (params.sort === 'cheapest') {
    countries.sort(function(a, b) {
      var pa = a.residential ? a.residential.price_kwh_usd : 999;
      var pb = b.residential ? b.residential.price_kwh_usd : 999;
      return pa - pb;
    });
  } else if (params.sort === 'expensive') {
    countries.sort(function(a, b) {
      var pa = a.residential ? a.residential.price_kwh_usd : 0;
      var pb = b.residential ? b.residential.price_kwh_usd : 0;
      return pb - pa;
    });
  }

  return {
    statusCode: 200,
    headers: hdrs,
    body: JSON.stringify({
      timestamp: data.timestamp,
      countries: countries,
      count: countries.length,
    }),
  };
};
