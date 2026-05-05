/**
 * AfroTools — API Authentication & Tier System
 *
 * Validates dashboard API keys from Netlify Blobs, with legacy Supabase
 * api_keys support for older keys.
 * Enforces rate limits per tier (free/growth/pro/enterprise).
 * Tracks usage in api_usage table.
 *
 * Usage:
 *   const { validateApiKey } = require('./_shared/api-auth');
 *   const auth = await validateApiKey(event, 'forex');
 *   if (auth.error) return jsonResp(auth.status, { error: auth.error }, CORS);
 *   // auth.tier, auth.key_prefix, auth.remaining available
 */

var crypto = require('crypto');
var { getStore } = require('@netlify/blobs');
var { getApiPlanLimit, normalizeApiTier } = require('./api-plans');

var SUPABASE_URL = process.env.SUPABASE_AUTH_URL ||
                   process.env.SUPABASE_URL ||
                   'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

// In-memory cache for key lookups (avoids Supabase call on every request)
var keyCache = new Map();
var KEY_CACHE_TTL = 5 * 60 * 1000; // 5 min

// Use shared rate limiter (bounded, auto-evicting)
var { checkRateLimit: checkSharedRateLimit } = require('./rate-limit');
var ANON_DAILY_LIMIT = getApiPlanLimit('free').day;

/**
 * Hash an API key for lookup
 */
function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getHeader(event, name) {
  var headers = event.headers || {};
  var wanted = String(name || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) return headers[keys[i]];
  }
  return null;
}

function todayBuckets() {
  var today = new Date().toISOString().split('T')[0];
  return { today: today, month: today.slice(0, 7) };
}

/**
 * Validate an API key and check rate limits.
 * @param {object} event - Netlify function event
 * @param {string} endpoint - The API endpoint being accessed (e.g. 'forex', 'fuel')
 * @returns {object} { tier, key_prefix, remaining, daily_limit } or { error, status }
 */
async function validateApiKey(event, endpoint) {
  var rawKey = getHeader(event, 'x-api-key') || ((event.queryStringParameters || {}).api_key);
  var clientIp = getHeader(event, 'x-forwarded-for') || 'unknown';

  // No key provided — anonymous access
  if (!rawKey || rawKey.length < 10) {
    return checkAnonLimit(clientIp);
  }

  if (rawKey.indexOf('afro_test_') === 0) {
    return {
      error: 'Test keys are supported on PAYE and VAT sandbox endpoints only. Use a free dashboard key for live data APIs.',
      status: 403,
    };
  }

  if (rawKey.indexOf('afro_live_') === 0) {
    var blobAuth = await checkBlobKeyLimit(rawKey, endpoint);
    if (blobAuth) return blobAuth;
    return { error: 'Invalid API key', status: 401 };
  }

  // Check key cache first
  var hash = hashKey(rawKey);
  var cached = keyCache.get(hash);
  if (cached && Date.now() - cached.ts < KEY_CACHE_TTL) {
    return checkKeyLimit(cached.data, endpoint);
  }

  // Lookup in Supabase
  if (!SUPABASE_KEY) {
    // No legacy Supabase key configured.
    return { error: 'API key verification unavailable', status: 503 };
  }

  try {
    var res = await fetch(
      SUPABASE_URL + '/rest/v1/api_keys?key_hash=eq.' + hash + '&enabled=eq.true&select=*',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );

    if (!res.ok) {
      // Legacy Supabase lookup failed.
      return { error: 'API key verification unavailable', status: 503 };
    }

    var keys = await res.json();
    if (!keys || keys.length === 0) {
      return { error: 'Invalid API key', status: 401 };
    }

    var keyRecord = keys[0];

    // Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { error: 'API key expired', status: 401 };
    }

    // Check scope
    if (keyRecord.scopes && !keyRecord.scopes.includes(endpoint)) {
      return { error: 'API key does not have access to /' + endpoint, status: 403 };
    }

    // Cache the lookup
    keyCache.set(hash, { data: keyRecord, ts: Date.now() });

    // Update last_used_at (fire-and-forget)
    fetch(SUPABASE_URL + '/rest/v1/api_keys?id=eq.' + keyRecord.id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    }).catch(function() {});

    return checkKeyLimit(keyRecord, endpoint);
  } catch (err) {
    // Legacy Supabase lookup failed.
    return { error: 'API key verification unavailable', status: 503 };
  }
}

async function checkBlobKeyLimit(rawKey, endpoint) {
  try {
    var store = getStore('apikeys');
    var keyRecord = await store.get(rawKey, { type: 'json' });
    if (!keyRecord) return null;

    var tier = normalizeApiTier(keyRecord.tier || 'free');
    var limits = getApiPlanLimit(tier);
    var buckets = todayBuckets();
    var usage = keyRecord.usage || keyRecord.monthlyUsage || {};
    if (!usage[buckets.today]) usage[buckets.today] = 0;
    if (!usage[buckets.month]) usage[buckets.month] = 0;

    var dailyUsage = usage[buckets.today];
    var monthlyUsage = usage[buckets.month];
    if (limits.day !== -1 && dailyUsage >= limits.day) {
      return {
        error: 'Rate limit exceeded',
        status: 429,
        tier: tier,
        key_prefix: rawKey.slice(0, 18),
        remaining: 0,
        daily_limit: limits.day,
        monthly_limit: limits.month,
      };
    }
    if (limits.month !== -1 && monthlyUsage >= limits.month) {
      return {
        error: 'Monthly rate limit exceeded',
        status: 429,
        tier: tier,
        key_prefix: rawKey.slice(0, 18),
        remaining: 0,
        daily_limit: limits.day,
        monthly_limit: limits.month,
      };
    }

    usage[buckets.today] = dailyUsage + 1;
    usage[buckets.month] = monthlyUsage + 1;
    keyRecord.usage = usage;
    keyRecord.tier = tier;
    keyRecord.lastUsed = new Date().toISOString();
    keyRecord.lastUsedEndpoint = endpoint || null;
    await store.setJSON(rawKey, keyRecord);

    return {
      tier: tier,
      key_prefix: rawKey.slice(0, 18),
      remaining: limits.day === -1 ? 999999 : Math.max(0, limits.day - dailyUsage - 1),
      daily_limit: limits.day,
      monthly_limit: limits.month,
      owner: keyRecord.email || keyRecord.owner_email || null,
    };
  } catch (err) {
    console.error('[api-auth] blob key validation failed:', err.message);
    return { error: 'API key verification unavailable', status: 503 };
  }
}

/**
 * Check anonymous rate limit (delegates to shared bounded rate limiter)
 */
function checkAnonLimit(ip) {
  if (!checkSharedRateLimit(ip, ANON_DAILY_LIMIT)) {
    return {
      error: 'Rate limit exceeded. Free tier: ' + ANON_DAILY_LIMIT + '/day. Get an API key at https://afrotools.com/dashboard/api/',
      status: 429,
    };
  }
  return { tier: 'free', key_prefix: null, daily_limit: ANON_DAILY_LIMIT };
}

/**
 * Check authenticated key rate limit
 */
function checkKeyLimit(keyRecord, endpoint) {
  // Track usage (fire-and-forget)
  if (SUPABASE_KEY) {
    fetch(SUPABASE_URL + '/rest/v1/rpc/increment_api_usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
      },
      body: JSON.stringify({ p_key_id: keyRecord.id, p_endpoint: endpoint }),
    }).catch(function() {});
  }

  var tier = normalizeApiTier(keyRecord.tier || 'free');
  var limits = getApiPlanLimit(tier);
  var dailyLimit = keyRecord.daily_limit || limits.day || 100;

  // Legacy Supabase-backed keys report their configured limit here.
  return {
    tier: tier,
    key_prefix: keyRecord.key_prefix,
    daily_limit: dailyLimit,
    monthly_limit: keyRecord.monthly_limit || limits.month,
    owner: keyRecord.owner_email,
  };
}

/**
 * Generate a new API key (admin function)
 */
function generateApiKey(prefix) {
  prefix = prefix || 'afk';
  var random = crypto.randomBytes(24).toString('base64url');
  return prefix + '_' + random;
}

module.exports = { validateApiKey, hashKey, generateApiKey };
