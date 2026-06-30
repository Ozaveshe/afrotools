/**
 * scrape-fx-rates.js — Scheduled Netlify function
 * Scrapes live FX rates for major African currency pairs daily
 * and upserts them into the fx_snapshots Supabase table.
 *
 * Schedule: 0 6 * * * (6 AM UTC daily, configured in netlify.toml)
 * Manual trigger: GET /api/scrape-fx
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL ||
  process.env.SUPABASE_DATA_URL ||
  process.env.SUPABASE_URL ||
  'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const { getAllowedOrigin } = require('./utils/cors');

const AFRICAN_CURRENCIES = [
  'NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'RWF', 'ETB',
  'MAD', 'TND', 'DZD', 'XOF', 'XAF', 'MWK', 'ZMW', 'BWP', 'MUR',
  'NAD', 'SZL'
];
const BASE_CURRENCIES = ['USD', 'EUR', 'GBP'];

const PRIMARY_URL = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

async function fetchPrimaryRates() {
  const res = await fetch(PRIMARY_URL);
  if (!res.ok) throw new Error(`Primary API returned ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error('Primary API result not success');
  return { rates: data.rates, source: 'exchangerate-api' };
}

async function fetchFallbackRates() {
  const res = await fetch(FALLBACK_URL);
  if (!res.ok) throw new Error(`Fallback API returned ${res.status}`);
  const data = await res.json();
  // Fallback uses lowercase keys
  var rates = {};
  for (var key in data.usd) {
    rates[key.toUpperCase()] = data.usd[key];
  }
  return { rates: rates, source: 'fawazahmed0-currency-api' };
}

function buildRows(usdRates, source) {
  var now = new Date().toISOString();
  var rows = [];

  for (var b = 0; b < BASE_CURRENCIES.length; b++) {
    var base = BASE_CURRENCIES[b];
    var baseToUsd = base === 'USD' ? 1 : (1 / (usdRates[base] || 1));

    for (var a = 0; a < AFRICAN_CURRENCIES.length; a++) {
      var target = AFRICAN_CURRENCIES[a];
      var usdToTarget = usdRates[target];
      if (!usdToTarget) continue;

      // base→target = usdToTarget * baseToUsd
      var rate = usdToTarget * baseToUsd;

      rows.push({
        base_currency: base,
        quote_currency: target,
        bank_rate: Math.round(rate * 10000) / 10000,
        market_rate: null,
        remittance_rate: null,
        spread_pct: null,
        source: source,
        captured_at: now
      });
    }
  }

  return rows;
}

async function upsertToSupabase(rows) {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY not set');

  // Supabase REST UPSERT — need unique constraint on (base_currency, quote_currency, captured_at::date)
  // Since the table doesn't have that constraint, we delete today's rows first then insert
  var today = new Date().toISOString().slice(0, 10);

  // Delete today's existing rows (idempotent re-run)
  await fetch(
    `${SUPABASE_URL}/rest/v1/fx_snapshots?captured_at=gte.${today}T00:00:00Z&captured_at=lt.${today}T23:59:59Z`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Insert fresh rows in batches of 50
  for (var i = 0; i < rows.length; i += 50) {
    var batch = rows.slice(i, i + 50);
    var res = await fetch(`${SUPABASE_URL}/rest/v1/fx_snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      var err = await res.text();
      throw new Error(`Supabase insert failed: ${res.status} — ${err}`);
    }
  }
}

exports.handler = async function (event) {
  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getAllowedOrigin(event)
  };

  try {
    // Try primary source, fall back if it fails
    var result;
    try {
      result = await fetchPrimaryRates();
    } catch (primaryErr) {
      console.warn('[scrape-fx] Primary failed:', primaryErr.message, '— trying fallback');
      result = await fetchFallbackRates();
    }

    var rows = buildRows(result.rates, result.source);
    await upsertToSupabase(rows);

    var summary = {
      pairs_updated: rows.length,
      source: result.source,
      timestamp: new Date().toISOString()
    };
    console.log('[scrape-fx] Success:', JSON.stringify(summary));

    return { statusCode: 200, headers: headers, body: JSON.stringify(summary) };
  } catch (err) {
    console.error('[scrape-fx] Error:', err.message);
    return {
      statusCode: 200, // non-500 so Netlify doesn't retry
      headers: headers,
      body: JSON.stringify({ error: err.message, timestamp: new Date().toISOString() })
    };
  }
};
