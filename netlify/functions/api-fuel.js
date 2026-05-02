/**
 * AfroTools Live Monitoring — Fuel Prices API Endpoint
 *
 * GET /api/fuel                 — all countries
 * GET /api/fuel?country=NG      — single country
 * GET /api/fuel?region=west     — region filter
 * GET /api/fuel?sort=petrol_asc — sorted results
 * GET /api/fuel?history=12m&country=NG — historical data
 *
 * Headers: x-api-key for authenticated access
 * Free tier: 100 requests/day and 3,000/month
 */

const { getData } = require('./_shared/data-store');
const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');
const { validateApiKey, rateLimitHeaders } = require('./utils/api-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// Cache TTLs: CDN 2hr, browser 1hr, stale 3hr
const CACHE_OPTS = { browserTTL: 3600, cdnTTL: 7200, staleTTL: 10800 };

const rateLimitMap = new Map();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= RATE_LIMIT;
}

var _reqCacheHdrs = null;

function jsonResponse(statusCode, body, extraHeaders = {}) {
  var base = (statusCode === 200 && _reqCacheHdrs) ? _reqCacheHdrs : CORS_HEADERS;
  return {
    statusCode,
    headers: { ...base, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function sandboxFuelResponse(params) {
  params = params || {};
  const country = {
    code: 'NG',
    name: 'Nigeria Sandbox',
    region: 'west',
    currency: 'NGN',
    petrol: { local: 850, usd: 0.57 },
    diesel: { local: 1050, usd: 0.7 },
    lpg: { local: 1200, usd: 0.8 },
    source: 'AfroTools sandbox data'
  };
  if (params.country) {
    return {
      timestamp: '2026-01-01T00:00:00.000Z',
      country,
      sandbox: true,
      data_policy: 'deterministic sandbox data'
    };
  }
  return {
    timestamp: '2026-01-01T00:00:00.000Z',
    summary: {
      total_countries: 1,
      petrol_avg_usd: 0.57,
      petrol_min_usd: 0.57,
      petrol_max_usd: 0.57,
      diesel_avg_usd: 0.7
    },
    countries: [country],
    sandbox: true,
    data_policy: 'deterministic sandbox data'
  };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};

  // Rate limiting and sandbox handling
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || params.api_key;
  var rlHeaders = {};
  if (apiKey) {
    var auth = await validateApiKey(event);
    if (!auth.valid) return jsonResponse(auth.status || 401, { error: auth.error });
    rlHeaders = rateLimitHeaders(auth);
    if (auth.sandbox) return jsonResponse(200, sandboxFuelResponse(params), rlHeaders);
  } else {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return jsonResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.',
      });
    }
  }

  // --- Historical data ---
  if (params.history && params.country) {
    const key = `fuel-history-${params.country.toLowerCase()}-${params.history}`;
    const historyData = await getData(key);
    if (!historyData) {
      return jsonResponse(404, {
        error: `Historical fuel data not available for ${params.country.toUpperCase()} (${params.history})`,
        available: ['NG/12m'],
      });
    }
    return jsonResponse(200, historyData, Object.assign({ 'Cache-Control': 'public, max-age=3600, s-maxage=7200' }, rlHeaders));
  }

  // --- Load latest fuel data (with in-memory + Blobs cache) ---
  const { data, fromCache } = await getOrFetch('fuel-latest', 7200000); // 2hr memory TTL
  if (!data || !data.countries) {
    return jsonResponse(503, { error: 'Fuel data unavailable. Please try again later.' });
  }
  _reqCacheHdrs = cacheHeaders(CACHE_OPTS, fromCache, CORS_HEADERS);

  let countries = data.countries;

  // --- Single country: ?country=NG ---
  if (params.country) {
    const code = params.country.toUpperCase();
    const country = countries.find(c => c.code === code);
    if (!country) {
      return jsonResponse(404, { error: `Country ${code} not found` });
    }
    return jsonResponse(200, {
      timestamp: data.timestamp,
      country,
    }, rlHeaders);
  }

  // --- Region filter: ?region=west ---
  if (params.region) {
    const region = params.region.toLowerCase();
    const validRegions = ['west', 'east', 'south', 'north', 'central'];
    if (!validRegions.includes(region)) {
      return jsonResponse(400, {
        error: `Invalid region. Valid regions: ${validRegions.join(', ')}`,
      });
    }
    countries = countries.filter(c => c.region === region);
  }

  // --- Sort: ?sort=petrol_asc, petrol_desc, diesel_asc, diesel_desc, name ---
  if (params.sort) {
    const sortKey = params.sort.toLowerCase();
    switch (sortKey) {
      case 'petrol_asc':
        countries = [...countries].sort((a, b) => (a.petrol?.usd || 999) - (b.petrol?.usd || 999));
        break;
      case 'petrol_desc':
        countries = [...countries].sort((a, b) => (b.petrol?.usd || 0) - (a.petrol?.usd || 0));
        break;
      case 'diesel_asc':
        countries = [...countries].sort((a, b) => (a.diesel?.usd || 999) - (b.diesel?.usd || 999));
        break;
      case 'diesel_desc':
        countries = [...countries].sort((a, b) => (b.diesel?.usd || 0) - (a.diesel?.usd || 0));
        break;
      case 'name':
        countries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
  }

  // --- Summary stats ---
  const petrolPricesUSD = countries.map(c => c.petrol?.usd).filter(Boolean);
  const dieselPricesUSD = countries.map(c => c.diesel?.usd).filter(Boolean);

  const summary = {
    total_countries: countries.length,
    petrol_avg_usd: petrolPricesUSD.length ? Math.round((petrolPricesUSD.reduce((a, b) => a + b, 0) / petrolPricesUSD.length) * 100) / 100 : null,
    petrol_min_usd: petrolPricesUSD.length ? Math.min(...petrolPricesUSD) : null,
    petrol_max_usd: petrolPricesUSD.length ? Math.max(...petrolPricesUSD) : null,
    diesel_avg_usd: dieselPricesUSD.length ? Math.round((dieselPricesUSD.reduce((a, b) => a + b, 0) / dieselPricesUSD.length) * 100) / 100 : null,
  };

  return jsonResponse(200, {
    timestamp: data.timestamp,
    summary,
    countries,
  }, rlHeaders);
};
