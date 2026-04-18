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
const ScholarshipFeed = require('../../assets/js/education-scholarship-feed.js');

const SUPABASE_DATA_URL = process.env.SUPABASE_DATA_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_DATA_ANON = process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_DATA_ANON) console.warn('[api-scholarships] Missing SUPABASE_ANON_KEY_DATA env var');

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

function getCachedScholarships(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return null;
}

function getCachedTimestamp(payload) {
  return payload && (payload.timestamp || payload.cachedAt || payload.updatedAt || payload.updated_at) || null;
}

function buildPayload(scholarships, params, options) {
  var filtered = filterScholarships(scholarships || [], params);
  var offset = parseInt(params.offset, 10) || 0;
  var limit = parseInt(params.limit, 10) || 0;
  var total = filtered.length;

  if (offset > 0) filtered = filtered.slice(offset);
  if (limit > 0) filtered = filtered.slice(0, limit);

  return {
    scholarships: filtered,
    total: total,
    count: filtered.length,
    mode: options && options.mode ? options.mode : 'live',
    cached: !!(options && options.mode === 'cache'),
    stale: !!(options && options.stale),
    cachedAt: options && options.cachedAt ? options.cachedAt : null,
    error: options && options.error ? String(options.error) : ''
  };
}

function getFallbackScholarships() {
  if (ScholarshipFeed && typeof ScholarshipFeed.getFallbackScholarships === 'function') {
    return ScholarshipFeed.getFallbackScholarships();
  }
  return [];
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
    var mode = 'live';
    var cachedAt = null;

    var cachedScholarships = getCachedScholarships(cached);
    cachedAt = getCachedTimestamp(cached);

    if (cachedScholarships && cachedAt) {
      var age = Date.now() - new Date(cachedAt).getTime();
      if (age < CACHE_TTL_MS) {
        scholarships = cachedScholarships;
        mode = 'cache';
        console.log('[scholarships-api] Cache hit, ' + scholarships.length + ' scholarships');
      }
    }

    // Fetch from Supabase if cache miss
    if (!scholarships) {
      console.log('[scholarships-api] Cache miss, fetching from Supabase...');
      scholarships = await fetchFromSupabase();
      mode = 'live';
      cachedAt = new Date().toISOString();
      // Update cache
      await setData(CACHE_KEY, {
        data: scholarships,
        timestamp: cachedAt,
        count: scholarships.length,
      });
      console.log('[scholarships-api] Cached ' + scholarships.length + ' scholarships');
    }

    return jsonResponse(200, buildPayload(scholarships, params, {
      mode: mode,
      cachedAt: cachedAt
    }));

  } catch (err) {
    console.error('[scholarships-api] Error:', err.message);

    // Last resort: try cache even if stale
    try {
      var stale = await getData(CACHE_KEY);
      var staleScholarships = getCachedScholarships(stale);
      if (staleScholarships && staleScholarships.length) {
        return jsonResponse(200, buildPayload(staleScholarships, params, {
          mode: 'cache',
          stale: true,
          cachedAt: getCachedTimestamp(stale),
          error: err.message
        }));
      }
    } catch (e) { /* ignore */ }

    var fallbackScholarships = getFallbackScholarships();
    if (fallbackScholarships.length) {
      return jsonResponse(200, buildPayload(fallbackScholarships, params, {
        mode: 'fallback',
        error: err.message
      }));
    }

    return jsonResponse(500, { error: 'Failed to fetch scholarships', mode: 'fallback' });
  }
};
