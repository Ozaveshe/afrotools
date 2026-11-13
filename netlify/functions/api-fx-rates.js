/**
 * api-fx-rates.js - Public v1 FX rates endpoint.
 *
 * GET /api/v1/fx/rates?base=USD&target=NGN          -> single pair
 * GET /api/v1/fx/rates?base=USD                     -> all available rates for base
 * GET /api/v1/fx/rates?target=NGN                   -> all available base rates for target
 * GET /api/v1/fx/rates?base=USD&target=NGN&days=30  -> 30-day history when stored
 */

var { validateApiKey, rateLimitHeaders, authErrorBody } = require('./utils/api-auth');
var { getAllowedOrigin } = require('./utils/cors');
var { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
var { getData } = require('./_shared/data-store');
var { getOrFetch } = require('./_lib/cache');
var { pairResponse } = require('./_shared/forex-response');

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};


function sandboxFxResponse(params) {
  params = params || {};
  var base = normalizeCode(params.base || params.from || 'USD');
  var target = normalizeCode(params.target || params.to || 'NGN');
  if (base && target) {
    var amount = Number(params.amount || 0);
    return {
      base: base,
      target: target,
      pair: base + '/' + target,
      rate: 1500.25,
      amount: amount || undefined,
      converted_amount: amount ? Math.round(amount * 1500.25 * 100) / 100 : undefined,
      source: 'AfroTools sandbox data',
      updated_at: '2026-01-01T00:00:00.000Z',
      change_24h: 0,
      sandbox: true,
      data_policy: 'deterministic sandbox data'
    };
  }
  return {
    base: base,
    updated_at: '2026-01-01T00:00:00.000Z',
    rates: { NGN: 1500.25, KES: 129.5, ZAR: 18.2, GHS: 12.8 },
    sandbox: true,
    data_policy: 'deterministic sandbox data'
  };
}

function jsonResponse(statusCode, body, extraHeaders) {
  return {
    statusCode: statusCode,
    headers: Object.assign({}, CORS_HEADERS, extraHeaders || {}),
    body: JSON.stringify(body)
  };
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

async function historicalResponse(base, target, days, headers) {
  var safeDays = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);
  var period = safeDays + 'd';
  var key = 'forex-history-' + base.toLowerCase() + '-' + target.toLowerCase() + '-' + period;
  var history = await getData(key);
  if (!history) {
    return jsonResponse(404, {
      error: 'Historical data not available for ' + base + '/' + target + ' (' + period + ')',
      available_pairs: ['USD/NGN', 'USD/KES', 'USD/ZAR', 'USD/GHS', 'USD/EGP'],
      available_periods: ['30d']
    }, headers);
  }
  return jsonResponse(200, history, Object.assign({ 'Cache-Control': 'public, max-age=3600, s-maxage=7200' }, headers));
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
  var apiKey = (event.headers || {})['x-api-key'] || (event.headers || {})['X-Api-Key'] || params.api_key;
  var rlHeaders = {};
  if (apiKey) {
    var auth = await validateApiKey(event, 'fx:rates');
    if (!auth.valid) {
      return jsonResponse(auth.status || 401, authErrorBody(auth));
    }
    rlHeaders = rateLimitHeaders(auth);
    if (auth.sandbox) return jsonResponse(200, sandboxFxResponse(params), rlHeaders);
  } else {
    var clientIp = String(
      (event.headers || {})['x-nf-client-connection-ip'] ||
      (event.headers || {})['client-ip'] ||
      (event.headers || {})['x-forwarded-for'] ||
      'unknown'
    ).split(',')[0].trim() || 'unknown';
    var limitKey = 'anon:fx-rates:' + clientIp;
    if (!checkRateLimit(limitKey, 100)) {
      return jsonResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.'
      }, {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0'
      });
    }
    rlHeaders = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': String(getRemaining(limitKey, 100))
    };
  }

  try {
    var base = normalizeCode(params.base || params.from || 'USD');
    var target = normalizeCode(params.target || params.to);
    var days = parseInt(params.days, 10) || 0;

    if (days > 0 && base && target) return historicalResponse(base, target, days, rlHeaders);

    var fetched = await getOrFetch('forex-latest', 600000);
    var data = fetched && fetched.data;
    const headers = Object.assign({}, rlHeaders, {
      'Cache-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Netlify-CDN-Cache-Control': 'no-store'
    });
    if (!data || !data.rates) return jsonResponse(503, { error: 'FX data unavailable. Please try again later.' }, headers);

    const now = new Date().toISOString();
    const provenance = {
      source: data.source || null,
      updated_at: data.timestamp || data.updated_at || data.lastUpdated || null,
      next_update: data.next_update || null
    };
    const statusCode = quote => quote.status === 'available' ? 200 : quote.reason === 'invalid-currency' ? 404 : 503;
    if (base && target) {
      const amount = parseFloat(params.amount) || 0;
      const quote = pairResponse(data, base, target, now);
      return jsonResponse(statusCode(quote), {
        base, target, pair: base + '/' + target,
        rate: quote.rate,
        amount: amount || undefined,
        converted_amount: amount && quote.rate !== null ? Math.round(amount * quote.rate * 100) / 100 : undefined,
        ...provenance, status: quote.status, reason: quote.reason,
        qualification: { base: quote.base, target: quote.target }
      }, headers);
    }

    const anchor = base || target || normalizeCode(data.base || 'USD') || 'USD';
    const reverse = !base && Boolean(target);
    const baseQuote = pairResponse(data, anchor, anchor, now);
    const rates = {};
    for (const currency of new Set([...Object.keys(data.rates).sort(), normalizeCode(data.base || 'USD')])) {
      const quote = reverse ? pairResponse(data, currency, anchor, now) : pairResponse(data, anchor, currency, now);
      if (quote.rate !== null) rates[currency] = quote.rate;
    }
    return jsonResponse(statusCode(baseQuote), {
      ...(reverse ? { target: anchor } : { base: anchor }),
      rates, ...provenance, status: baseQuote.status, reason: baseQuote.reason
    }, headers);
  } catch (err) {
    console.error('[api-fx-rates] Error:', err.message);
    return jsonResponse(500, { error: 'FX data temporarily unavailable. Please try again later.' }, rlHeaders);
  }
};

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-fx-rates' });
