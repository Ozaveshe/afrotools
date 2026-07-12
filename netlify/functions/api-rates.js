/**
 * AfroTools Live Monitoring — Central Bank Rates API Endpoint
 *
 * GET /api/rates                    — all countries
 * GET /api/rates?country=NG         — single country
 * GET /api/rates?region=west        — region filter
 * GET /api/rates?metric=inflation   — just inflation data
 * GET /api/rates?metric=policy_rate — just policy rates
 * GET /api/rates?sort=inflation_desc — sorted results
 *
 * Headers: x-api-key for authenticated access
 * Free tier: 100 requests/day and 3,000/month
 */

const { getData } = require('./_shared/data-store');
const { getOrFetch, cacheHeaders } = require('./_lib/cache');
const { getAllowedOrigin } = require('./utils/cors');
const { validateApiKey, rateLimitHeaders, authErrorBody } = require('./utils/api-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// Cache TTLs: CDN 6hr, browser 3hr, stale 9hr
const CACHE_OPTS = { browserTTL: 10800, cdnTTL: 21600, staleTTL: 32400 };

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

function sandboxRatesResponse(params) {
  params = params || {};
  const country = {
    code: 'NG',
    name: 'Nigeria Sandbox',
    central_bank: 'AfroTools Sandbox Bank',
    currency: 'NGN',
    region: 'west',
    policy_rate: 18.75,
    policy_rate_name: 'Sandbox policy rate',
    inflation: { headline: 12.5 },
    next_mpc: '2026-02-01'
  };
  if (params.country) {
    return { timestamp: '2026-01-01T00:00:00.000Z', country, sandbox: true, data_policy: 'deterministic sandbox data' };
  }
  return {
    timestamp: '2026-01-01T00:00:00.000Z',
    summary: { total_countries: 1, avg_policy_rate: 18.75, max_policy_rate: 18.75, min_policy_rate: 18.75, avg_inflation: 12.5 },
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
    if (!auth.valid) return jsonResponse(auth.status || 401, authErrorBody(auth));
    rlHeaders = rateLimitHeaders(auth);
    if (auth.sandbox) return jsonResponse(200, sandboxRatesResponse(params), rlHeaders);
  } else {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return jsonResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.',
      });
    }
  }

  // --- Load latest rates data (with in-memory + Blobs cache) ---
  const { data, fromCache } = await getOrFetch('rates-latest', 21600000); // 6hr memory TTL
  if (!data || !data.countries) {
    return jsonResponse(503, { error: 'Rates data unavailable. Please try again later.' });
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

  // --- Metric filter: ?metric=inflation or ?metric=policy_rate ---
  if (params.metric) {
    const metric = params.metric.toLowerCase();

    if (metric === 'inflation') {
      const inflationData = countries.map(c => ({
        code: c.code,
        name: c.name,
        currency: c.currency,
        region: c.region,
        inflation: c.inflation,
      }));

      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'inflation',
        countries: inflationData,
      }, rlHeaders);
    }

    if (metric === 'policy_rate') {
      const rateData = countries.map(c => ({
        code: c.code,
        name: c.name,
        central_bank: c.central_bank,
        currency: c.currency,
        region: c.region,
        policy_rate: c.policy_rate,
        policy_rate_name: c.policy_rate_name,
        last_rate_change: c.last_rate_change,
        next_mpc: c.next_mpc,
      }));

      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'policy_rate',
        countries: rateData,
      }, rlHeaders);
    }

    if (metric === 'tbills') {
      const tbillData = countries
        .filter(c => c.tbill_91d || c.tbill_182d || c.tbill_364d)
        .map(c => ({
          code: c.code,
          name: c.name,
          currency: c.currency,
          region: c.region,
          tbill_91d: c.tbill_91d,
          tbill_182d: c.tbill_182d,
          tbill_364d: c.tbill_364d,
          bond_10y: c.bond_10y,
        }));

      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'tbills',
        countries: tbillData,
      }, rlHeaders);
    }

    return jsonResponse(400, {
      error: `Invalid metric. Valid metrics: inflation, policy_rate, tbills`,
    });
  }

  // --- Sort ---
  if (params.sort) {
    const sortKey = params.sort.toLowerCase();
    switch (sortKey) {
      case 'inflation_desc':
        countries = [...countries].sort((a, b) => (b.inflation?.headline || 0) - (a.inflation?.headline || 0));
        break;
      case 'inflation_asc':
        countries = [...countries].sort((a, b) => (a.inflation?.headline || 999) - (b.inflation?.headline || 999));
        break;
      case 'rate_desc':
        countries = [...countries].sort((a, b) => (b.policy_rate || 0) - (a.policy_rate || 0));
        break;
      case 'rate_asc':
        countries = [...countries].sort((a, b) => (a.policy_rate || 999) - (b.policy_rate || 999));
        break;
      case 'name':
        countries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
  }

  // --- Summary stats ---
  const policyRates = countries.map(c => c.policy_rate).filter(r => r !== null && r !== undefined);
  const inflationRates = countries.map(c => c.inflation?.headline).filter(r => r !== null && r !== undefined);

  const summary = {
    total_countries: countries.length,
    avg_policy_rate: policyRates.length ? Math.round((policyRates.reduce((a, b) => a + b, 0) / policyRates.length) * 100) / 100 : null,
    max_policy_rate: policyRates.length ? Math.max(...policyRates) : null,
    min_policy_rate: policyRates.length ? Math.min(...policyRates) : null,
    avg_inflation: inflationRates.length ? Math.round((inflationRates.reduce((a, b) => a + b, 0) / inflationRates.length) * 100) / 100 : null,
    max_inflation: inflationRates.length ? Math.max(...inflationRates) : null,
    min_inflation: inflationRates.length ? Math.min(...inflationRates) : null,
    upcoming_mpc: countries
      .filter(c => c.next_mpc)
      .map(c => ({ code: c.code, name: c.name, date: c.next_mpc }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };

  return jsonResponse(200, {
    timestamp: data.timestamp,
    summary,
    countries,
  }, rlHeaders);
};
