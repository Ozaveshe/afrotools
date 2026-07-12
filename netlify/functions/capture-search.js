// netlify/functions/capture-search.js
// POST /api/capture-search
// Lightweight endpoint to capture search queries for product intelligence.
// Fire-and-forget from client via navigator.sendBeacon().

const { getAllowedOrigin } = require('./utils/cors');

function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = cleanEnvValue(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL) || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = cleanEnvValue(
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function cleanStr(val, maxLen) {
  if (val == null) return null;
  var s = String(val).trim().slice(0, maxLen);
  return s || null;
}

exports.handler = async (event) => {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: '' };
  }

  try {
    var body = JSON.parse(event.body || '{}');

    var query = cleanStr(body.query, 200);
    if (!query || query.length < 2) {
      return { statusCode: 400, headers: CORS_HEADERS, body: '' };
    }

    var resultsCount = parseInt(body.results_count, 10);
    if (!isFinite(resultsCount) || resultsCount < 0) resultsCount = 0;

    var validSources = ['navbar', 'category-page', '404-page', 'all-tools'];
    var source = validSources.includes(body.source) ? body.source : 'navbar';

    var record = {
      query: query,
      results_count: resultsCount,
      source: source,
      country_code: cleanStr(body.country_code, 2),
      page_url: cleanStr(body.page_url, 2000),
      session_id: cleanStr(body.session_id, 36)
    };

    // Strip nulls
    var clean = {};
    for (var key in record) {
      if (record[key] != null) clean[key] = record[key];
    }

    if (!SUPABASE_SERVICE_KEY) {
      console.warn('No SUPABASE_KEY — skipping search capture');
      return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    await fetch(SUPABASE_URL + '/rest/v1/search_queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(clean)
    });

    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  } catch (err) {
    console.error('capture-search error:', err.message);
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }
};
