/**
 * AfroTools Live Monitoring — Scheduled Forex Rate Fetcher
 * Runs every 15 minutes via Netlify Scheduled Functions.
 *
 * Sources (with fallback chain):
 *  1. ExchangeRate-API (primary)
 *  2. Frankfurter (fallback)
 *  3. Fawaz Ahmed open API (fallback2)
 *
 * Writes to Netlify Blobs store 'live-data' under key 'forex-latest'.
 */

const { setData, getData, updateMeta } = require('./_shared/data-store');

// All African + global currencies we track
const AFRICAN_CURRENCIES = [
  'NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'RWF', 'ETB',
  'XOF', 'XAF', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SSP', 'MZN',
  'MGA', 'ZMW', 'ZWL', 'MWK', 'BWP', 'NAD', 'LSL', 'SZL', 'MUR',
  'SCR', 'DJF', 'KMF', 'ERN', 'SOS', 'BIF', 'GMD', 'GNF', 'LRD',
  'SLE', 'CVE', 'STN', 'MRU', 'AOA', 'CDF'
];

const GLOBAL_CURRENCIES = ['EUR', 'GBP', 'CNY', 'AED', 'INR', 'CAD', 'AUD', 'JPY'];

const ALL_CURRENCIES = [...AFRICAN_CURRENCIES, ...GLOBAL_CURRENCIES];

/**
 * Source 1: ExchangeRate-API (free tier)
 */
async function fetchFromExchangeRateAPI() {
  const apiKey = process.env.EXCHANGERATE_API_KEY || 'free';
  const url = apiKey === 'free'
    ? 'https://open.er-api.com/v6/latest/USD'
    : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ExchangeRate-API: HTTP ${res.status}`);

  const json = await res.json();
  if (json.result === 'error') throw new Error(`ExchangeRate-API: ${json['error-type']}`);

  const rates = {};
  for (const code of ALL_CURRENCIES) {
    if (json.rates && json.rates[code] !== undefined) {
      rates[code] = json.rates[code];
    }
  }

  return { rates, source: 'exchangerate-api' };
}

/**
 * Source 2: Frankfurter API (ECB data, limited currencies)
 */
async function fetchFromFrankfurter() {
  const url = 'https://api.frankfurter.app/latest?from=USD';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Frankfurter: HTTP ${res.status}`);

  const json = await res.json();
  const rates = {};
  for (const code of ALL_CURRENCIES) {
    if (json.rates && json.rates[code] !== undefined) {
      rates[code] = json.rates[code];
    }
  }

  return { rates, source: 'frankfurter' };
}

/**
 * Source 3: Fawaz Ahmed Currency API (GitHub-hosted, free)
 */
async function fetchFromFawazAhmed() {
  const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FawazAhmed: HTTP ${res.status}`);

  const json = await res.json();
  const rawRates = json.usd || {};
  const rates = {};

  for (const code of ALL_CURRENCIES) {
    const key = code.toLowerCase();
    if (rawRates[key] !== undefined) {
      rates[code] = rawRates[key];
    }
  }

  return { rates, source: 'fawazahmed' };
}

/**
 * Main scheduled handler
 */
exports.handler = async function (event) {
  console.log('[forex-fetch] Starting scheduled forex rate fetch...');

  const sources = [
    { name: 'ExchangeRate-API', fn: fetchFromExchangeRateAPI },
    { name: 'Frankfurter', fn: fetchFromFrankfurter },
    { name: 'Fawaz Ahmed', fn: fetchFromFawazAhmed },
  ];

  let fetchedRates = null;
  let usedSource = null;

  for (const source of sources) {
    try {
      console.log(`[forex-fetch] Trying source: ${source.name}`);
      const result = await source.fn();

      if (Object.keys(result.rates).length >= 5) {
        fetchedRates = result.rates;
        usedSource = result.source;
        console.log(`[forex-fetch] Success from ${source.name} — ${Object.keys(result.rates).length} currencies`);
        break;
      } else {
        console.log(`[forex-fetch] ${source.name} returned too few currencies (${Object.keys(result.rates).length}), trying next...`);
      }
    } catch (err) {
      console.error(`[forex-fetch] ${source.name} failed: ${err.message}`);
    }
  }

  // If all sources fail, retain stale data
  if (!fetchedRates) {
    console.warn('[forex-fetch] All sources failed. Retaining existing cached data.');
    await updateMeta('forex', {
      status: 'stale',
      error: 'All sources failed',
      last_attempt: new Date().toISOString(),
    });
    return { statusCode: 500, body: 'All forex sources failed' };
  }

  // Merge with existing data (preserve currencies not in new fetch)
  const existing = await getData('forex-latest');
  const mergedRates = existing && existing.rates ? { ...existing.rates, ...fetchedRates } : fetchedRates;

  // Build the data object
  const now = new Date().toISOString();
  const nextUpdate = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const data = {
    timestamp: now,
    base: 'USD',
    rates: mergedRates,
    crypto: existing && existing.crypto ? existing.crypto : {
      BTC_USD: 87450.00,
      ETH_USD: 3240.00,
      USDT_USD: 1.0001,
    },
    source: usedSource,
    next_update: nextUpdate,
  };

  // Write to Blobs
  const written = await setData('forex-latest', data);

  // Update meta
  await updateMeta('forex', {
    last_fetch: now,
    source: usedSource,
    status: written ? 'ok' : 'write-failed',
    currencies_count: Object.keys(mergedRates).length,
  });

  console.log(`[forex-fetch] Complete. Source: ${usedSource}, Currencies: ${Object.keys(mergedRates).length}`);

  return { statusCode: 200, body: `Forex rates updated from ${usedSource}` };
};
