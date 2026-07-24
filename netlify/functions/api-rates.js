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
const ratesEvidence = require('../../assets/js/engines/afrorates-verified');

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

  const evidenceCoverage = ratesEvidence.coverage(data, { maxAgeDays: 45 });
  let countries = ratesEvidence.selectVerified(data, { maxAgeDays: 45 });
  if (!countries.length) {
    return jsonResponse(503, {
      error: 'No policy-rate rows currently pass the official-source evidence gate.',
      coverage: evidenceCoverage,
      data_policy: 'fail_closed_official_policy_rows',
    }, rlHeaders);
  }

  // --- Single country: ?country=NG ---
  if (params.country) {
    const code = params.country.toUpperCase();
    const country = countries.find(c => c.code === code);
    if (!country) {
      const candidateExists = data.countries.some(c => c.code === code);
      return jsonResponse(404, {
        error: candidateExists ? `Country ${code} is withheld because its policy-rate evidence is incomplete or stale.` : `Country ${code} not found`,
        coverage: evidenceCoverage,
        data_policy: 'fail_closed_official_policy_rows',
      });
    }
    return jsonResponse(200, {
      timestamp: data.timestamp,
      country,
      coverage: evidenceCoverage,
      data_policy: 'fail_closed_official_policy_rows',
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
      const inflationData = countries.filter(c => c.annual_inflation).map(c => ({
        code: c.code,
        name: c.name,
        currency: c.currency,
        region: c.region,
        annual_inflation: c.annual_inflation,
      }));

      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'inflation',
        series: 'World Bank annual consumer-price inflation from the committed rates snapshot',
        comparability_note: 'Annual CPI is lagging context and is not period-matched to the point-in-time policy rate.',
        coverage: evidenceCoverage,
        countries: inflationData,
      }, rlHeaders);
    }

    if (metric === 'policy_rate') {
      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'policy_rate',
        data_policy: 'fail_closed_official_policy_rows',
        coverage: evidenceCoverage,
        countries,
      }, rlHeaders);
    }

    if (metric === 'tbills') {
      return jsonResponse(200, {
        timestamp: data.timestamp,
        metric: 'tbills',
        available: false,
        message: 'No T-bill or bond rows in the committed snapshot pass an owned evidence contract.',
        countries: [],
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
        countries = [...countries].sort((a, b) => (b.annual_inflation?.value || 0) - (a.annual_inflation?.value || 0));
        break;
      case 'inflation_asc':
        countries = [...countries].sort((a, b) => (a.annual_inflation?.value || 999) - (b.annual_inflation?.value || 999));
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
  const inflationRates = countries.map(c => c.annual_inflation?.value).filter(r => r !== null && r !== undefined);

  const summary = {
    total_countries: countries.length,
    avg_policy_rate: policyRates.length ? Math.round((policyRates.reduce((a, b) => a + b, 0) / policyRates.length) * 100) / 100 : null,
    max_policy_rate: policyRates.length ? Math.max(...policyRates) : null,
    min_policy_rate: policyRates.length ? Math.min(...policyRates) : null,
    avg_inflation: inflationRates.length ? Math.round((inflationRates.reduce((a, b) => a + b, 0) / inflationRates.length) * 100) / 100 : null,
    max_inflation: inflationRates.length ? Math.max(...inflationRates) : null,
    min_inflation: inflationRates.length ? Math.min(...inflationRates) : null,
  };

  return jsonResponse(200, {
    timestamp: data.timestamp,
    data_policy: 'fail_closed_official_policy_rows',
    coverage: evidenceCoverage,
    summary,
    countries,
  }, rlHeaders);
};

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-rates' });
