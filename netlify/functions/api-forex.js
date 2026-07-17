/**
 * AfroTools Live Monitoring — Forex API Endpoint
 *
 * GET /api/forex?from=USD&to=NGN         — single pair
 * GET /api/forex?base=USD                 — all rates for base
 * GET /api/forex?pairs=USD-NGN,USD-KES    — multiple pairs
 * GET /api/forex?history=30d&pair=USD-NGN  — historical data
 *
 * Headers: x-api-key for authenticated access
 * Free tier: 100 requests/day and 3,000/month
 */

const { getData } = require('./_shared/data-store');
const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// Cache TTLs: CDN 10min, browser 5min, stale 15min
const CACHE_OPTS = { browserTTL: 300, cdnTTL: 600, staleTTL: 900 };

// Simple in-memory rate limiting (resets per function cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 100; // per day per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }

  record.count++;
  if (record.count > RATE_LIMIT) {
    return false;
  }
  return true;
}

// _reqCacheHdrs is set per-request after data fetch; success responses include cache headers
var _reqCacheHdrs = null;

function jsonResponse(statusCode, body, extraHeaders = {}) {
  var base = (statusCode === 200 && _reqCacheHdrs) ? _reqCacheHdrs : CORS_HEADERS;
  return {
    statusCode,
    headers: { ...base, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // Rate limiting (skip if API key provided)
  const apiKey = event.headers['x-api-key'];
  const hasValidKey = apiKey && apiKey.length > 10; // basic check

  if (!hasValidKey) {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return jsonResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.',
      });
    }
  }

  const params = event.queryStringParameters || {};

  // --- Historical data request ---
  if (params.history && params.pair) {
    return await handleHistorical(params.pair, params.history);
  }

  // --- Load latest rates (with in-memory + Blobs cache) ---
  const { data, fromCache } = await getOrFetch('forex-latest', 600000); // 10min memory TTL
  if (!data || !data.rates) {
    return jsonResponse(503, { error: 'Forex data unavailable. Please try again later.' });
  }

  // Set cache headers for all 200 responses
  _reqCacheHdrs = cacheHeaders(CACHE_OPTS, fromCache, CORS_HEADERS);

  // --- Single pair: ?from=USD&to=NGN ---
  if (params.from && params.to) {
    const from = params.from.toUpperCase();
    const to = params.to.toUpperCase();

    let rate = null;

    if (from === 'USD' && data.rates[to]) {
      rate = data.rates[to];
    } else if (to === 'USD' && data.rates[from] && data.rates[from] !== 0) {
      rate = 1 / data.rates[from];
    } else if (data.rates[from] && data.rates[to] && data.rates[from] !== 0) {
      // Cross rate via USD
      rate = data.rates[to] / data.rates[from];
    }

    if (rate === null) {
      return jsonResponse(404, { error: `Pair ${from}/${to} not found` });
    }

    return jsonResponse(200, {
      pair: `${from}/${to}`,
      rate: Math.round(rate * 1000000) / 1000000,
      timestamp: data.timestamp,
      source: data.source,
      served_from: data.served_from,
      as_of: data.as_of || data.timestamp || null,
    });
  }

  // --- Multiple pairs: ?pairs=USD-NGN,USD-KES ---
  if (params.pairs) {
    const pairList = params.pairs.split(',').map(p => p.trim().toUpperCase());
    const results = {};

    for (const pairStr of pairList) {
      const [from, to] = pairStr.split('-');
      if (!from || !to) continue;

      let rate = null;
      if (from === 'USD' && data.rates[to]) {
        rate = data.rates[to];
      } else if (to === 'USD' && data.rates[from] && data.rates[from] !== 0) {
        rate = 1 / data.rates[from];
      } else if (data.rates[from] && data.rates[to] && data.rates[from] !== 0) {
        rate = data.rates[to] / data.rates[from];
      }

      results[`${from}/${to}`] = rate ? Math.round(rate * 1000000) / 1000000 : null;
    }

    return jsonResponse(200, {
      pairs: results,
      timestamp: data.timestamp,
      source: data.source,
      served_from: data.served_from,
      as_of: data.as_of || data.timestamp || null,
    });
  }

  // --- All rates for base: ?base=USD (or default) ---
  const base = (params.base || 'USD').toUpperCase();

  if (base === 'USD') {
    return jsonResponse(200, {
      base: 'USD',
      rates: data.rates,
      crypto: data.crypto,
      timestamp: data.timestamp,
      source: data.source,
      next_update: data.next_update,
      served_from: data.served_from,
      as_of: data.as_of || data.timestamp || null,
    });
  }

  // Convert rates to requested base
  const baseRate = data.rates[base];
  if (!baseRate || baseRate === 0) {
    return jsonResponse(404, { error: `Base currency ${base} not found or has zero rate` });
  }

  const convertedRates = {};
  convertedRates['USD'] = Math.round((1 / baseRate) * 1000000) / 1000000;
  for (const [code, rate] of Object.entries(data.rates)) {
    if (code !== base) {
      convertedRates[code] = Math.round((rate / baseRate) * 1000000) / 1000000;
    }
  }

  return jsonResponse(200, {
    base,
    rates: convertedRates,
    timestamp: data.timestamp,
    source: data.source,
    served_from: data.served_from,
    as_of: data.as_of || data.timestamp || null,
  });
};

/**
 * Handle historical data requests
 */
async function handleHistorical(pairStr, period) {
  const [from, to] = pairStr.toUpperCase().split(/[-\/]/);
  if (!from || !to) {
    return jsonResponse(400, { error: 'Invalid pair format. Use USD-NGN or USD/NGN.' });
  }

  const key = `forex-history-${from.toLowerCase()}-${to.toLowerCase()}-${period}`;
  const data = await getData(key);

  if (!data) {
    return jsonResponse(404, {
      error: `Historical data not available for ${from}/${to} (${period})`,
      available_pairs: ['USD/NGN', 'USD/KES', 'USD/ZAR', 'USD/GHS', 'USD/EGP'],
      available_periods: ['30d'],
    });
  }

  return jsonResponse(200, Object.assign({}, data, {
    served_from: data.served_from,
    as_of: data.as_of || data.timestamp || null,
  }), { 'Cache-Control': 'public, max-age=3600, s-maxage=7200' });
}

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-forex' });
