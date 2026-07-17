/**
 * AfroTools — Commodity Prices API Endpoint
 *
 * GET /api/commodity-prices                    — all commodities + benchmarks
 * GET /api/commodity-prices?commodity=maize    — filter by commodity name
 * GET /api/commodity-prices?id=gold            — filter by commodity ID (scraped data)
 * GET /api/commodity-prices?cat=metals         — filter by category (scraped data)
 * GET /api/commodity-prices?source=live        — only scraped live data
 *
 * Data sources (merged):
 *  1. Netlify Blobs — 'commodity-prices-latest' (scraped by scheduled function)
 *  2. Supabase — commodity_prices + commodity_benchmarks tables (community data)
 *
 * Headers: x-api-key for authenticated access (bypasses rate limiting)
 * Rate limit: 100 requests/day without API key
 */

const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');
const { getEnv } = require('./_shared/env');

var SUPABASE_URL = getEnv('SUPABASE_URL', { defaultValue: 'https://zpclagtgczsygrgztlts.supabase.co' });
var SUPABASE_KEY = getEnv('SUPABASE_SERVICE_KEY');

var CACHE_OPTS = { browserTTL: 1800, cdnTTL: 3600, staleTTL: 7200 };

var { checkRateLimit } = require('./_shared/rate-limit');

exports.handler = async function(event) {
  var origin = getAllowedOrigin(event);
  var CORS = {
    'Access-Control-Allow-Origin': origin,
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

  // Rate limit (skip if API key)
  var apiKey = event.headers['x-api-key'];
  var hasValidKey = apiKey && apiKey.length > 10;
  if (!hasValidKey) {
    var clientIp = event.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limit exceeded' }) };
    }
  }

  var params = event.queryStringParameters || {};

  // Fetch from both sources in parallel
  var blobPromise = getOrFetch('commodity-prices-latest', 5 * 60 * 1000);
  var supabasePromise = fetchFromSupabase(params.commodity);

  var [blobResult, supabaseResult] = await Promise.all([
    blobPromise.catch(function() { return { data: null, fromCache: false }; }),
    supabasePromise.catch(function() { return { prices: [], benchmarks: [] }; }),
  ]);

  var hdrs = cacheHeaders(CACHE_OPTS, blobResult.fromCache, CORS);

  // If requesting live-only scraped data
  if (params.source === 'live') {
    var blobData = blobResult.data;
    if (!blobData) {
      return { statusCode: 503, headers: hdrs, body: JSON.stringify({ error: 'Live commodity data temporarily unavailable' }) };
    }

    var liveCommodities = blobData.commodities || [];

    // Apply filters
    if (params.id) {
      liveCommodities = liveCommodities.filter(function(c) { return c.id === params.id; });
    }
    if (params.cat) {
      liveCommodities = liveCommodities.filter(function(c) { return c.category === params.cat; });
    }

    return {
      statusCode: 200,
      headers: hdrs,
      body: JSON.stringify({
        ok: true,
        source: 'scraped',
        lastUpdated: blobData.timestamp,
        commodities: liveCommodities,
        benchmarks: blobData.benchmarks || {},
        count: liveCommodities.length,
      }),
    };
  }

  // Default: merge both sources
  var blobData = blobResult.data;
  var response = {
    ok: true,
    lastUpdated: null,
    live: null,
    prices: supabaseResult.prices,
    benchmarks: supabaseResult.benchmarks,
  };

  // Add scraped live data
  if (blobData) {
    response.live = {
      timestamp: blobData.timestamp,
      commodities: blobData.commodities || [],
      benchmarks: blobData.benchmarks || {},
    };
    response.lastUpdated = blobData.timestamp;
  }

  // Use Supabase lastUpdated if no blob data
  if (!response.lastUpdated && supabaseResult.prices.length > 0) {
    response.lastUpdated = supabaseResult.prices.reduce(function(a, b) {
      return a.updated_at > b.updated_at ? a : b;
    }).updated_at;
  }

  return {
    statusCode: 200,
    headers: hdrs,
    body: JSON.stringify(response),
  };
};

/**
 * Fetch community-submitted commodity data from Supabase
 */
async function fetchFromSupabase(commodity) {
  if (!SUPABASE_KEY) return { prices: [], benchmarks: [] };

  var pricesUrl = SUPABASE_URL + '/rest/v1/commodity_prices?select=*&order=country_name.asc';
  if (commodity) pricesUrl += '&commodity=eq.' + encodeURIComponent(commodity);

  var benchUrl = SUPABASE_URL + '/rest/v1/commodity_benchmarks?select=*';

  var [pricesRes, benchRes] = await Promise.all([
    fetch(pricesUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    }),
    fetch(benchUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    }),
  ]);

  var prices = pricesRes.ok ? await pricesRes.json() : [];
  var benchmarks = benchRes.ok ? await benchRes.json() : [];

  return { prices: prices, benchmarks: benchmarks };
}

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-commodity-prices' });
