/**
 * AfroTools — Scholarships API
 *
 * GET /api/scholarships — fetch & filter scholarships (public, cached)
 *
 * Query params: level, destination, field, funding, search, limit, offset
 *
 * Uses DATA Supabase instance (jbmhfpkzbgyeodsqhprx) with anon key.
 * Caches full list in Netlify Blobs for 1 hour.
 */

const { getData, setData } = require('./_shared/data-store');

const SUPABASE_DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_DATA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTg2NzIsImV4cCI6MjA2MDE5NDY3Mn0.71rkEJm1dXSKJSNPFLAmdLU-_XmEf0-UrFaLW5XUGQ0';

const CACHE_KEY = 'scholarships-latest';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function fetchFromSupabase() {
  const url = `${SUPABASE_DATA_URL}/rest/v1/scholarships?is_active=eq.true&select=*&order=name.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_DATA_ANON,
      Authorization: `Bearer ${SUPABASE_DATA_ANON}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase: HTTP ${res.status}`);
  return res.json();
}

function filterScholarships(scholarships, params) {
  var results = scholarships;

  if (params.level && params.level !== 'all') {
    results = results.filter(function (s) {
      return s.levels && s.levels.indexOf(params.level) !== -1;
    });
  }

  if (params.destination && params.destination !== 'all') {
    results = results.filter(function (s) {
      return s.destinations && s.destinations.indexOf(params.destination) !== -1;
    });
  }

  if (params.field && params.field !== 'all') {
    results = results.filter(function (s) {
      return s.fields && (s.fields.indexOf(params.field) !== -1 || s.fields.indexOf('any') !== -1);
    });
  }

  if (params.funding && params.funding !== 'all') {
    results = results.filter(function (s) {
      return s.funding === params.funding;
    });
  }

  if (params.search) {
    var q = params.search.toLowerCase();
    results = results.filter(function (s) {
      return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
        (s.provider && s.provider.toLowerCase().indexOf(q) !== -1) ||
        (s.description && s.description.toLowerCase().indexOf(q) !== -1);
    });
  }

  return results;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  var params = event.queryStringParameters || {};

  try {
    // Try cache first
    var cached = await getData(CACHE_KEY);
    var scholarships = null;

    if (cached && cached.data && cached.timestamp) {
      var age = Date.now() - new Date(cached.timestamp).getTime();
      if (age < CACHE_TTL_MS) {
        scholarships = cached.data;
        console.log('[scholarships-api] Cache hit, ' + scholarships.length + ' scholarships');
      }
    }

    // Fetch from Supabase if cache miss
    if (!scholarships) {
      console.log('[scholarships-api] Cache miss, fetching from Supabase...');
      scholarships = await fetchFromSupabase();
      // Update cache
      await setData(CACHE_KEY, {
        data: scholarships,
        timestamp: new Date().toISOString(),
        count: scholarships.length,
      });
      console.log('[scholarships-api] Cached ' + scholarships.length + ' scholarships');
    }

    // Apply filters
    var filtered = filterScholarships(scholarships, params);

    // Pagination
    var offset = parseInt(params.offset) || 0;
    var limit = parseInt(params.limit) || 0;
    var total = filtered.length;

    if (offset > 0) {
      filtered = filtered.slice(offset);
    }
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return jsonResponse(200, {
      scholarships: filtered,
      total: total,
      count: filtered.length,
      cached: !!cached,
    });

  } catch (err) {
    console.error('[scholarships-api] Error:', err.message);

    // Last resort: try cache even if stale
    try {
      var stale = await getData(CACHE_KEY);
      if (stale && stale.data) {
        var filtered2 = filterScholarships(stale.data, params);
        return jsonResponse(200, {
          scholarships: filtered2,
          total: filtered2.length,
          count: filtered2.length,
          cached: true,
          stale: true,
        });
      }
    } catch (e) { /* ignore */ }

    return jsonResponse(500, { error: 'Failed to fetch scholarships' });
  }
};
