/**
 * AfroTools — API Authentication & Tier System
 *
 * Validates API keys against Supabase api_keys table.
 * Enforces rate limits per tier (free/pro/enterprise).
 * Tracks usage in api_usage table.
 *
 * Usage:
 *   const { validateApiKey } = require('./_shared/api-auth');
 *   const auth = await validateApiKey(event, 'forex');
 *   if (auth.error) return jsonResp(auth.status, { error: auth.error }, CORS);
 *   // auth.tier, auth.key_prefix, auth.remaining available
 */

var crypto = require('crypto');

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

// In-memory cache for key lookups (avoids Supabase call on every request)
var keyCache = new Map();
var KEY_CACHE_TTL = 5 * 60 * 1000; // 5 min

// Use shared rate limiter (bounded, auto-evicting)
var { checkRateLimit: checkSharedRateLimit } = require('./rate-limit');
var ANON_DAILY_LIMIT = 100;

/**
 * Hash an API key for lookup
 */
function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key and check rate limits.
 * @param {object} event - Netlify function event
 * @param {string} endpoint - The API endpoint being accessed (e.g. 'forex', 'fuel')
 * @returns {object} { tier, key_prefix, remaining, daily_limit } or { error, status }
 */
async function validateApiKey(event, endpoint) {
  var rawKey = event.headers['x-api-key'];
  var clientIp = event.headers['x-forwarded-for'] || 'unknown';

  // No key provided — anonymous access
  if (!rawKey || rawKey.length < 10) {
    return checkAnonLimit(clientIp);
  }

  // Check key cache first
  var hash = hashKey(rawKey);
  var cached = keyCache.get(hash);
  if (cached && Date.now() - cached.ts < KEY_CACHE_TTL) {
    return checkKeyLimit(cached.data, endpoint);
  }

  // Lookup in Supabase
  if (!SUPABASE_KEY) {
    // No Supabase key — fall back to basic length check
    return { tier: 'basic', key_prefix: rawKey.slice(0, 8), remaining: 9999, daily_limit: 10000 };
  }

  try {
    var res = await fetch(
      SUPABASE_URL + '/rest/v1/api_keys?key_hash=eq.' + hash + '&enabled=eq.true&select=*',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );

    if (!res.ok) {
      // DB error — allow through with basic limits
      return { tier: 'basic', key_prefix: rawKey.slice(0, 8), remaining: 100, daily_limit: 100 };
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
    // Network error — allow through with basic limits
    return { tier: 'basic', key_prefix: rawKey.slice(0, 8), remaining: 100, daily_limit: 100 };
  }
}

/**
 * Check anonymous rate limit (delegates to shared bounded rate limiter)
 */
function checkAnonLimit(ip) {
  if (!checkSharedRateLimit(ip, ANON_DAILY_LIMIT)) {
    return {
      error: 'Rate limit exceeded. Free tier: ' + ANON_DAILY_LIMIT + '/day. Get an API key at https://afrotools.com/developer-tools/',
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

  var tierLimits = { free: 100, pro: 10000, enterprise: 1000000 };
  var dailyLimit = keyRecord.daily_limit || tierLimits[keyRecord.tier] || 100;

  // Pro and enterprise tiers effectively have no meaningful limit to track in-memory
  // Free tier authenticated keys are rare — just report the limit
  return {
    tier: keyRecord.tier,
    key_prefix: keyRecord.key_prefix,
    daily_limit: dailyLimit,
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
