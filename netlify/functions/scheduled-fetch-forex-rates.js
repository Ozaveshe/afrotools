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
const MIN_SOURCE_COVERAGE = 40;
const SOURCE_DISAGREEMENT_THRESHOLD = 0.2;
const UNVERIFIED_JUMP_THRESHOLD = 0.5;

function countTrackedRates(rates) {
  return ALL_CURRENCIES.filter(code => rates && rates[code] !== undefined).length;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

function stabilizeRates(fetchedRates, existingRates, comparisonRates) {
  const safeRates = { ...fetchedRates };
  const warnings = [];

  for (const code of Object.keys(fetchedRates || {})) {
    const nextRate = fetchedRates[code];
    const existingRate = existingRates && existingRates[code];
    const comparisonRate = comparisonRates && comparisonRates[code];

    if (typeof comparisonRate === 'number' && comparisonRate > 0 && typeof nextRate === 'number' && nextRate > 0) {
      const disagreement = Math.abs(nextRate - comparisonRate) / Math.max(nextRate, comparisonRate);
      if (disagreement > SOURCE_DISAGREEMENT_THRESHOLD && typeof existingRate === 'number' && existingRate > 0) {
        safeRates[code] = existingRate;
        warnings.push(code + ': source disagreement (' + nextRate + ' vs ' + comparisonRate + '), kept existing ' + existingRate);
        continue;
      }
    }

    if ((comparisonRate === undefined || comparisonRate === null) && typeof existingRate === 'number' && existingRate > 0 && typeof nextRate === 'number' && nextRate > 0) {
      const jump = Math.abs(nextRate - existingRate) / existingRate;
      if (jump > UNVERIFIED_JUMP_THRESHOLD) {
        safeRates[code] = existingRate;
        warnings.push(code + ': unverified jump (' + existingRate + ' -> ' + nextRate + '), kept existing rate');
      }
    }
  }

  return { rates: safeRates, warnings };
}

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

  const rawRates = json.rates || json.conversion_rates || {};
  const rates = {};
  for (const code of ALL_CURRENCIES) {
    if (rawRates[code] !== undefined) {
      rates[code] = rawRates[code];
    }
  }

  return {
    rates,
    source: 'exchangerate-api',
    last_updated: normalizeTimestamp(json.time_last_update_utc),
    next_update: normalizeTimestamp(json.time_next_update_utc),
  };
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

  return {
    rates,
    source: 'frankfurter',
    last_updated: json.date ? json.date + 'T00:00:00.000Z' : null,
    next_update: null,
  };
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

  return {
    rates,
    source: 'fawazahmed',
    last_updated: json.date ? json.date + 'T00:00:00.000Z' : null,
    next_update: null,
  };
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
  let sourceLastUpdated = null;
  let sourceNextUpdate = null;

  for (const source of sources) {
    try {
      console.log(`[forex-fetch] Trying source: ${source.name}`);
      const result = await source.fn();
      const coverage = countTrackedRates(result.rates);

      if (coverage >= MIN_SOURCE_COVERAGE) {
        fetchedRates = result.rates;
        usedSource = result.source;
        sourceLastUpdated = result.last_updated || null;
        sourceNextUpdate = result.next_update || null;
        console.log(`[forex-fetch] Success from ${source.name} - ${coverage} tracked currencies`);
        break;
      } else {
        console.log(`[forex-fetch] ${source.name} returned too few tracked currencies (${coverage}), trying next...`);
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
  let comparisonRates = null;
  if (usedSource !== 'fawazahmed') {
    try {
      const comparison = await fetchFromFawazAhmed();
      comparisonRates = comparison.rates;
    } catch (err) {
      console.warn('[forex-fetch] Fawaz comparison fetch failed: ' + err.message);
    }
  }

  const stabilized = stabilizeRates(
    fetchedRates,
    existing && existing.rates ? existing.rates : null,
    comparisonRates
  );
  if (stabilized.warnings.length > 0) {
    console.warn('[forex-fetch] Stabilized rates: ' + stabilized.warnings.join('; '));
  }

  const mergedRates = existing && existing.rates ? { ...existing.rates, ...stabilized.rates } : stabilized.rates;

  // Build the data object
  const now = sourceLastUpdated || new Date().toISOString();
  const nextUpdate = sourceNextUpdate || new Date(Date.now() + 15 * 60 * 1000).toISOString();

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
