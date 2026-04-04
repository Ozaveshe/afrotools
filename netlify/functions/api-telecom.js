/**
 * AfroTools — Telecom Plans API Endpoint
 *
 * GET /api/telecom                    — all countries
 * GET /api/telecom?country=NG         — single country
 * GET /api/telecom?region=west        — filter by region
 * GET /api/telecom?sort=cheapest_1gb  — sorted by cheapest 1GB price
 * GET /api/telecom?provider=MTN       — filter by provider name
 *
 * Headers: x-api-key for authenticated access
 * Rate limit: 100 requests/day without API key
 */

const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');

var CACHE_OPTS = { browserTTL: 1800, cdnTTL: 3600, staleTTL: 7200 };

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

  var { data, fromCache } = await getOrFetch('telecom-latest', 5 * 60 * 1000);
  var hdrs = cacheHeaders(CACHE_OPTS, fromCache, CORS);

  if (!data) {
    return { statusCode: 503, headers: hdrs, body: JSON.stringify({ error: 'Telecom data temporarily unavailable' }) };
  }

  var params = event.queryStringParameters || {};
  var countries = data.countries || [];

  // Filter by country
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

  // Filter by provider
  if (params.provider) {
    var provName = params.provider.toLowerCase();
    countries = countries.filter(function(c) {
      return (c.providers || []).some(function(p) {
        return p.name.toLowerCase().includes(provName);
      });
    });
  }

  // Sort
  if (params.sort === 'cheapest_1gb') {
    countries.sort(function(a, b) {
      return (a.cheapest_1gb_usd || 999) - (b.cheapest_1gb_usd || 999);
    });
  } else if (params.sort === 'expensive_1gb') {
    countries.sort(function(a, b) {
      return (b.avg_1gb_usd || 0) - (a.avg_1gb_usd || 0);
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
