/**
 * AfroTools — Salary Benchmarks API
 * GET /api/salary-benchmarks?country=NG&period=monthly
 *
 * Returns pre-aggregated benchmark data from the salary_benchmarks table.
 * Fast (<200ms) — queries a single pre-computed row.
 */

var { validateApiKey, rateLimitHeaders } = require('./utils/api-auth');
var { getAllowedOrigin } = require('./utils/cors');

const SUPABASE_DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json',
};

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  /* ---- API key auth (optional — allows unauthenticated for backwards compat) ---- */
  var apiKey = (event.headers || {})['x-api-key'] || ((event.queryStringParameters || {}).api_key);
  var rlHeaders = {};
  if (apiKey) {
    var auth = await validateApiKey(event);
    if (!auth.valid) {
      return { statusCode: auth.status || 401, headers: Object.assign({}, CORS_HEADERS, rlHeaders), body: JSON.stringify({ error: auth.error }) };
    }
    rlHeaders = rateLimitHeaders(auth);
  }

  const params = event.queryStringParameters || {};
  const country = (params.country || '').toUpperCase();
  const period = params.period || 'monthly';

  if (!country || country.length !== 2) {
    return {
      statusCode: 400,
      headers: Object.assign({}, CORS_HEADERS, rlHeaders),
      body: JSON.stringify({ error: 'Missing or invalid country parameter (2-letter code)' }),
    };
  }

  try {
    const key = process.env.SUPABASE_DATA_ANON_KEY;
    if (!key) throw new Error('Missing SUPABASE_DATA_ANON_KEY');

    // Query the pre-aggregated table (role_category & experience_level are null for overall benchmarks)
    const url = `${SUPABASE_DATA_URL}/rest/v1/salary_benchmarks?country_code=eq.${country}&period=eq.${period}&role_category=is.null&experience_level=is.null&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) throw new Error(`Supabase: ${res.status}`);

    const rows = await res.json();

    if (!rows || rows.length === 0) {
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' },
        body: JSON.stringify({
          country,
          insufficient_data: true,
          sample_size: 0,
        }),
      };
    }

    const row = rows[0];

    // If sample size is below threshold, return insufficient_data
    if (row.sample_size < 10) {
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' },
        body: JSON.stringify({
          country,
          insufficient_data: true,
          sample_size: row.sample_size,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=1800' },
      body: JSON.stringify({
        country,
        currency: row.currency,
        period: row.period,
        sample_size: row.sample_size,
        gross: {
          median: parseFloat(row.median_gross),
          p25: parseFloat(row.p25_gross),
          p75: parseFloat(row.p75_gross),
        },
        net: {
          median: parseFloat(row.median_net),
          p25: parseFloat(row.p25_net),
          p75: parseFloat(row.p75_net),
        },
        effective_tax_rate: parseFloat(row.avg_effective_tax_rate),
        updated_at: row.updated_at,
      }),
    };
  } catch (err) {
    console.error('[salary-benchmarks-api]', err.message);
    return {
      statusCode: 500,
      headers: Object.assign({}, CORS_HEADERS, rlHeaders),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
