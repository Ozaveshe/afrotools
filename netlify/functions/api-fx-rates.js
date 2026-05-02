/**
 * api-fx-rates.js — Serves latest FX rates from fx_snapshots table
 *
 * GET /api/v1/fx/rates?base=USD&target=NGN          -> single pair
 * GET /api/v1/fx/rates?base=USD                     -> all African pairs for USD
 * GET /api/v1/fx/rates?target=NGN                   -> all base currencies for NGN
 * GET /api/v1/fx/rates?base=USD&target=NGN&days=30  -> 30-day history
 */

var { validateApiKey, rateLimitHeaders } = require('./utils/api-auth');
var { getAllowedOrigin } = require('./utils/cors');
var { checkRateLimit, getRemaining } = require('./_shared/rate-limit');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Cache-Control': 'public, max-age=3600'
};

async function querySupabase(path) {
  var res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Supabase query failed: ${res.status}`);
  return res.json();
}

function sandboxFxResponse(params) {
  params = params || {};
  var base = (params.base || 'USD').toUpperCase();
  var target = (params.target || 'NGN').toUpperCase();
  if (base && target) {
    var amount = Number(params.amount || 0);
    return {
      base: base,
      target: target,
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

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  /* ---- API key auth (optional — allows unauthenticated for backwards compat) ---- */
  var apiKey = (event.headers || {})['x-api-key'] || ((event.queryStringParameters || {}).api_key);
  var rlHeaders = {};
  if (apiKey) {
    var auth = await validateApiKey(event);
    if (!auth.valid) {
      return { statusCode: auth.status || 401, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS), body: JSON.stringify({ error: auth.error }) };
    }
    rlHeaders = rateLimitHeaders(auth);
    if (auth.sandbox) {
      return {
        statusCode: 200,
        headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS, rlHeaders),
        body: JSON.stringify(sandboxFxResponse(event.queryStringParameters || {}))
      };
    }
  } else {
    var clientIp = String(
      (event.headers || {})['x-nf-client-connection-ip'] ||
      (event.headers || {})['client-ip'] ||
      (event.headers || {})['x-forwarded-for'] ||
      'unknown'
    ).split(',')[0].trim() || 'unknown';
    var limitKey = 'anon:fx-rates:' + clientIp;
    if (!checkRateLimit(limitKey, 100)) {
      return {
        statusCode: 429,
        headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS, {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        }),
        body: JSON.stringify({ error: 'Rate limit exceeded', message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.' })
      };
    }
    rlHeaders = { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': String(getRemaining(limitKey, 100)) };
  }

  var headers = Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS, rlHeaders);

  try {
    if (!SUPABASE_KEY) throw new Error('Service key not configured');

    var params = event.queryStringParameters || {};
    var base = (params.base || '').toUpperCase();
    var target = (params.target || '').toUpperCase();
    var days = parseInt(params.days) || 0;

    // History mode
    if (days > 0 && base && target) {
      var since = new Date();
      since.setDate(since.getDate() - days);
      var sinceStr = since.toISOString();

      var rows = await querySupabase(
        `fx_snapshots?base_currency=eq.${base}&quote_currency=eq.${target}` +
        `&captured_at=gte.${sinceStr}&order=captured_at.desc&limit=${days}`
      );

      return {
        statusCode: 200, headers: headers,
        body: JSON.stringify({
          base: base,
          target: target,
          history: rows.map(function (r) {
            return { date: r.captured_at.slice(0, 10), rate: Number(r.bank_rate) };
          })
        })
      };
    }

    // Single pair
    if (base && target) {
      var amount = parseFloat(params.amount) || 0;
      var rows = await querySupabase(
        `fx_snapshots?base_currency=eq.${base}&quote_currency=eq.${target}` +
        `&order=captured_at.desc&limit=2`
      );

      if (rows.length === 0) {
        return {
          statusCode: 200, headers: headers,
          body: JSON.stringify({ base: base, target: target, rate: null, message: 'No data yet. The scraper may not have run.' })
        };
      }

      var latest = rows[0];
      var prev = rows[1];
      var change24h = prev ? Math.round((Number(latest.bank_rate) - Number(prev.bank_rate)) / Number(prev.bank_rate) * 10000) / 100 : null;

      return {
        statusCode: 200, headers: headers,
        body: JSON.stringify({
          base: base,
          target: target,
          rate: Number(latest.bank_rate),
          amount: amount || undefined,
          converted_amount: amount ? Math.round(amount * Number(latest.bank_rate) * 100) / 100 : undefined,
          source: latest.source,
          updated_at: latest.captured_at,
          change_24h: change24h
        })
      };
    }

    // All pairs for a base currency
    if (base) {
      // Get latest snapshot date for this base
      var latestRows = await querySupabase(
        `fx_snapshots?base_currency=eq.${base}&order=captured_at.desc&limit=1`
      );

      if (latestRows.length === 0) {
        return {
          statusCode: 200, headers: headers,
          body: JSON.stringify({ base: base, rates: {}, message: 'No data yet.' })
        };
      }

      var latestDate = latestRows[0].captured_at.slice(0, 10);
      var allRows = await querySupabase(
        `fx_snapshots?base_currency=eq.${base}&captured_at=gte.${latestDate}T00:00:00Z&captured_at=lt.${latestDate}T23:59:59Z`
      );

      var rates = {};
      allRows.forEach(function (r) { rates[r.quote_currency] = Number(r.bank_rate); });

      return {
        statusCode: 200, headers: headers,
        body: JSON.stringify({
          base: base,
          updated_at: latestRows[0].captured_at,
          rates: rates
        })
      };
    }

    // All base currencies for a target
    if (target) {
      var latestRows = await querySupabase(
        `fx_snapshots?quote_currency=eq.${target}&order=captured_at.desc&limit=3`
      );

      if (latestRows.length === 0) {
        return {
          statusCode: 200, headers: headers,
          body: JSON.stringify({ target: target, rates: {}, message: 'No data yet.' })
        };
      }

      var rates = {};
      latestRows.forEach(function (r) { rates[r.base_currency] = Number(r.bank_rate); });

      return {
        statusCode: 200, headers: headers,
        body: JSON.stringify({
          target: target,
          updated_at: latestRows[0].captured_at,
          rates: rates
        })
      };
    }

    // No params — return USD rates as default
    return {
      statusCode: 200, headers: headers,
      body: JSON.stringify({ error: 'Provide ?base=USD and/or ?target=NGN' })
    };

  } catch (err) {
    console.error('[api-fx-rates] Error:', err.message);
    return {
      statusCode: 500, headers: headers,
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};
