/**
 * Shared API authentication middleware
 * Validates x-api-key header or api_key query param against Netlify Blobs store.
 *
 * Usage:
 *   const { validateApiKey } = require('./utils/api-auth');
 *   const auth = await validateApiKey(event);
 *   if (!auth.valid) return respond(auth.status, { error: auth.error });
 */
const { getStore } = require('@netlify/blobs');

const LIMITS = {
  free:       { day: 100,    month: 3000 },
  starter:    { day: 10000,  month: 300000 },
  pro:        { day: 100000, month: 3000000 },
  enterprise: { day: -1,     month: -1 }
};

async function validateApiKey(event) {
  var apiKey =
    (event.headers || {})['x-api-key'] ||
    ((event.queryStringParameters || {}).api_key);

  if (!apiKey) {
    return {
      valid: false,
      status: 401,
      error: 'Missing API key. Include x-api-key header or api_key query param. Get one at afrotools.com/api'
    };
  }

  // Sandbox / test keys always pass
  if (apiKey.startsWith('afro_test_')) {
    return { valid: true, tier: 'free', sandbox: true, remaining: 999, limit: 1000 };
  }

  try {
    var store = getStore('apikeys');
    var data = await store.get(apiKey, { type: 'json' });
    if (!data) {
      return { valid: false, status: 403, error: 'Invalid API key. Get one at afrotools.com/api' };
    }

    var tier = data.tier || 'free';
    var limits = LIMITS[tier] || LIMITS.free;
    var today = new Date().toISOString().split('T')[0];
    var month = today.slice(0, 7);

    if (!data.usage) data.usage = {};
    if (!data.usage[today]) data.usage[today] = 0;
    if (!data.usage[month]) data.usage[month] = 0;

    var dailyUsage = data.usage[today];
    var monthlyUsage = data.usage[month];

    // Check daily limit
    if (limits.day !== -1 && dailyUsage >= limits.day) {
      return {
        valid: false,
        status: 429,
        error: 'Daily rate limit exceeded. Resets at midnight UTC.',
        tier: tier,
        remaining: 0,
        limit: limits.day
      };
    }
    // Check monthly limit
    if (limits.month !== -1 && monthlyUsage >= limits.month) {
      return {
        valid: false,
        status: 429,
        error: 'Monthly rate limit exceeded.',
        tier: tier,
        remaining: 0,
        limit: limits.month
      };
    }

    // Increment counters
    data.usage[today] = dailyUsage + 1;
    data.usage[month] = monthlyUsage + 1;
    data.lastUsed = new Date().toISOString();
    await store.setJSON(apiKey, data);

    return {
      valid: true,
      tier: tier,
      remaining: limits.day === -1 ? 999999 : limits.day - dailyUsage - 1,
      limit: limits.day === -1 ? 'unlimited' : limits.day,
      sandbox: false
    };
  } catch (err) {
    console.error('[api-auth] Key validation error:', err.message);
    return { valid: false, status: 500, error: 'Internal authentication error' };
  }
}

function rateLimitHeaders(auth) {
  return {
    'X-RateLimit-Limit': String(auth.limit || 100),
    'X-RateLimit-Remaining': String(auth.remaining || 0)
  };
}

module.exports = { validateApiKey, rateLimitHeaders, LIMITS };
