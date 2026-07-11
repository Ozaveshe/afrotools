var crypto = require('crypto');
var { getStore } = require('@netlify/blobs');
var rateLimit = require('./rate-limit');

var DEFAULT_DAILY_LIMIT = 10000;
var DEFAULT_SCOPES = [
  'catalog:tools',
  'tax:paye',
  'tax:rates',
  'fx:rates',
  'countries',
  'career:offer-compare',
  'career:job-scam-check',
];

function env(name) {
  var netlifyValue = globalThis.Netlify && globalThis.Netlify.env && globalThis.Netlify.env.get(name);
  return String(netlifyValue || process.env[name] || '').trim();
}

function header(event, name) {
  var headers = (event && event.headers) || {};
  var wanted = String(name || '').toLowerCase();
  var key = Object.keys(headers).find(function (item) {
    return item.toLowerCase() === wanted;
  });
  return key ? String(headers[key] || '') : '';
}

function safeEqual(left, right) {
  var leftBuffer = Buffer.from(String(left || ''));
  var rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function dailyLimit() {
  var configured = Number(env('SALARYPADI_API_DAILY_LIMIT'));
  return Number.isInteger(configured) && configured > 0 && configured <= 1000000
    ? configured
    : DEFAULT_DAILY_LIMIT;
}

function allowedScopes() {
  var configured = env('SALARYPADI_API_SCOPES');
  if (!configured) return DEFAULT_SCOPES.slice();
  return configured.split(',').map(function (value) { return value.trim(); }).filter(Boolean);
}

async function consumeQuota(limit, dependencies) {
  var day = new Date().toISOString().slice(0, 10);
  var bucket = 'service:salarypadi:' + day;
  if (dependencies && dependencies.checkRateLimit) {
    var allowed = dependencies.checkRateLimit(bucket, limit);
    return {
      allowed: allowed,
      remaining: allowed ? dependencies.getRemaining(bucket, limit) : 0,
    };
  }
  try {
    var store = dependencies && dependencies.store || getStore({ name: 'api-service-usage', consistency: 'strong' });
    var key = 'salarypadi:' + day;
    var record = await store.get(key, { type: 'json' }) || { day: day, count: 0 };
    var count = record.day === day ? Number(record.count || 0) : 0;
    if (count >= limit) return { allowed: false, remaining: 0 };
    count += 1;
    await store.setJSON(key, { product: 'salarypadi', day: day, count: count });
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch (_) {
    if (String(process.env.NETLIFY || '').toLowerCase() === 'true') {
      return { allowed: false, unavailable: true, remaining: 0 };
    }
    var localAllowed = rateLimit.checkRateLimit(bucket, limit);
    return {
      allowed: localAllowed,
      remaining: localAllowed ? rateLimit.getRemaining(bucket, limit) : 0,
    };
  }
}

async function authenticateSalaryPadiServiceKey(event, scope, dependencies) {
  var expected = env('SALARYPADI_API_KEY');
  var supplied = header(event, 'x-api-key');
  if (!expected || !supplied || !safeEqual(supplied, expected)) return null;

  if (!allowedScopes().includes(scope)) {
    return {
      valid: false,
      error: 'SalaryPadi service key does not have access to this endpoint',
      status: 403,
      tier: 'service',
      product: 'salarypadi',
    };
  }

  var limit = dailyLimit();
  var quota = await consumeQuota(limit, dependencies);
  if (quota.unavailable) {
    return {
      valid: false,
      error: 'SalaryPadi service quota verification unavailable',
      status: 503,
      tier: 'service',
      product: 'salarypadi',
      limit: limit,
      remaining: 0,
    };
  }
  if (!quota.allowed) {
    return {
      valid: false,
      error: 'SalaryPadi service quota exceeded',
      status: 429,
      tier: 'service',
      product: 'salarypadi',
      limit: limit,
      remaining: 0,
      retryAfter: 3600,
    };
  }

  return {
    valid: true,
    tier: 'service',
    product: 'salarypadi',
    key_prefix: 'salarypadi_service',
    limit: limit,
    remaining: quota.remaining,
    scopes: allowedScopes(),
  };
}

function serviceRateLimitHeaders(auth) {
  var headers = { 'X-RateLimit-Scope': 'service:salarypadi' };
  if (Number.isFinite(auth && auth.limit)) headers['X-RateLimit-Limit'] = String(auth.limit);
  if (Number.isFinite(auth && auth.remaining)) headers['X-RateLimit-Remaining'] = String(auth.remaining);
  return headers;
}

module.exports = {
  DEFAULT_DAILY_LIMIT: DEFAULT_DAILY_LIMIT,
  DEFAULT_SCOPES: DEFAULT_SCOPES,
  authenticateSalaryPadiServiceKey: authenticateSalaryPadiServiceKey,
  serviceRateLimitHeaders: serviceRateLimitHeaders,
};
