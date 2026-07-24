'use strict';

const { getAllowedOrigin } = require('./utils/cors');

const ASSETS = Object.freeze({ bitcoin: 'bitcoin', ethereum: 'ethereum' });
const CURRENCIES = Object.freeze(['ngn', 'zar', 'usd']);
const DAY_MS = 86400000;
const MAX_RANGE_DAYS = 365;
const CACHE_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 8000;
const responseCache = new Map();

function headers(event, extra = {}) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate',
    ...extra,
  };
}

function json(event, statusCode, body, extraHeaders) {
  return { statusCode, headers: headers(event, extraHeaders), body: JSON.stringify(body) };
}

function utcDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

function lastCompletedUtcDay(nowMs = Date.now()) {
  const now = new Date(nowMs);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - DAY_MS);
}

function validateQuery(query, nowMs = Date.now()) {
  const asset = String(query.asset || '').toLowerCase();
  const currency = String(query.currency || '').toLowerCase();
  const from = utcDate(query.from);
  const to = utcDate(query.to);
  const expectedTo = lastCompletedUtcDay(nowMs);
  if (!ASSETS[asset]) return { error: 'unsupported_asset', supportedAssets: Object.keys(ASSETS) };
  if (!CURRENCIES.includes(currency)) return { error: 'unsupported_currency', supportedCurrencies: CURRENCIES.slice() };
  if (!from || !to) return { error: 'invalid_date', message: 'from and to must use valid YYYY-MM-DD UTC dates.' };
  if (to.getTime() !== expectedTo.getTime()) {
    return { error: 'invalid_end_date', expectedEndDate: expectedTo.toISOString().slice(0, 10) };
  }
  const rangeDays = Math.floor((to - from) / DAY_MS) + 1;
  if (rangeDays < 2 || rangeDays > MAX_RANGE_DAYS) {
    return { error: 'invalid_range', maxRangeDays: MAX_RANGE_DAYS, rangeDays };
  }
  return { asset, currency, from, to, rangeDays };
}

function normalizeProviderPrices(payload, from, to) {
  if (!payload || !Array.isArray(payload.prices) || !payload.prices.length) {
    throw Object.assign(new Error('CoinGecko returned no price history.'), { code: 'invalid_provider_payload' });
  }
  const fromMs = from.getTime() - 36 * 60 * 60 * 1000;
  const toMs = to.getTime() + DAY_MS - 1;
  const byTimestamp = new Map();
  payload.prices.forEach(row => {
    if (!Array.isArray(row) || row.length < 2) {
      throw Object.assign(new Error('CoinGecko returned a malformed history row.'), { code: 'invalid_provider_payload' });
    }
    const timestamp = Number(row[0]);
    const price = Number(row[1]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(price) || price <= 0) {
      throw Object.assign(new Error('CoinGecko returned an invalid timestamp or price.'), { code: 'invalid_provider_payload' });
    }
    if (timestamp >= fromMs && timestamp <= toMs) byTimestamp.set(timestamp, price);
  });
  const prices = Array.from(byTimestamp.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, price]) => ({ at: new Date(timestamp).toISOString(), price }));
  if (!prices.length) {
    throw Object.assign(new Error('CoinGecko returned no usable rows in the requested range.'), { code: 'invalid_provider_payload' });
  }
  for (let index = 1; index < prices.length; index += 1) {
    if (Date.parse(prices[index].at) <= Date.parse(prices[index - 1].at)) {
      throw Object.assign(new Error('Normalized history is not strictly ordered.'), { code: 'invalid_provider_payload' });
    }
  }
  return prices;
}

function providerConfig() {
  const proKey = process.env.COINGECKO_PRO_API_KEY;
  const demoKey = process.env.COINGECKO_DEMO_API_KEY || process.env.COINGECKO_API_KEY;
  if (proKey) return { base: 'https://pro-api.coingecko.com/api/v3', headers: { 'x-cg-pro-api-key': proKey } };
  return {
    base: 'https://api.coingecko.com/api/v3',
    headers: demoKey ? { 'x-cg-demo-api-key': demoKey } : {},
  };
}

async function fetchProvider(validated) {
  const config = providerConfig();
  const fromSeconds = Math.floor((validated.from.getTime() - 36 * 60 * 60 * 1000) / 1000);
  const toSeconds = Math.floor((validated.to.getTime() + DAY_MS - 1) / 1000);
  const url = `${config.base}/coins/${validated.asset}/market_chart/range?vs_currency=${validated.currency}&from=${fromSeconds}&to=${toSeconds}&interval=daily&precision=full`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json', ...config.headers }, signal: controller.signal });
  } catch (error) {
    const timeout = error && error.name === 'AbortError';
    throw Object.assign(new Error(timeout ? 'CoinGecko request timed out.' : 'CoinGecko is unavailable.'), {
      code: timeout ? 'provider_timeout' : 'provider_unavailable',
      statusCode: 503,
    });
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) {
    throw Object.assign(new Error('CoinGecko rate limit reached.'), {
      code: 'provider_rate_limited',
      statusCode: 429,
      retryAfter: response.headers && response.headers.get ? response.headers.get('retry-after') : null,
    });
  }
  if (!response.ok) {
    throw Object.assign(new Error(`CoinGecko returned HTTP ${response.status}.`), {
      code: 'provider_error',
      statusCode: 502,
      upstreamStatus: response.status,
    });
  }
  let payload;
  try {
    payload = await response.json();
  } catch (_) {
    throw Object.assign(new Error('CoinGecko returned invalid JSON.'), { code: 'invalid_provider_payload', statusCode: 502 });
  }
  return normalizeProviderPrices(payload, validated.from, validated.to);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(event), body: '' };
  if (event.httpMethod !== 'GET') return json(event, 405, { error: 'method_not_allowed' });
  const validated = validateQuery(event.queryStringParameters || {});
  if (validated.error) return json(event, 400, validated);
  const cacheKey = `${validated.asset}:${validated.currency}:${validated.from.toISOString().slice(0, 10)}:${validated.to.toISOString().slice(0, 10)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt <= CACHE_TTL_MS) {
    return json(event, 200, { ...cached.body, cache: 'hit' }, { 'X-Cache': 'HIT' });
  }
  if (cached) responseCache.delete(cacheKey);
  try {
    const prices = await fetchProvider(validated);
    const fetchedAt = new Date(Date.now()).toISOString();
    const body = {
      status: 'fresh',
      asset: validated.asset,
      currency: validated.currency,
      request: {
        from: validated.from.toISOString().slice(0, 10),
        to: validated.to.toISOString().slice(0, 10),
        rangeDays: validated.rangeDays,
      },
      source: {
        name: 'CoinGecko',
        url: 'https://www.coingecko.com/',
        endpoint: 'market_chart/range',
        attribution: 'Data provided by CoinGecko',
      },
      fetchedAt,
      actualRange: { from: prices[0].at, to: prices[prices.length - 1].at },
      granularity: 'provider daily reference points',
      cache: 'miss',
      prices,
    };
    responseCache.set(cacheKey, { cachedAt: Date.now(), body });
    return json(event, 200, body, { 'X-Cache': 'MISS' });
  } catch (error) {
    const statusCode = error.statusCode || 502;
    const extra = error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {};
    return json(event, statusCode, {
      status: 'unavailable',
      error: error.code || 'provider_error',
      message: error.message,
      upstreamStatus: error.upstreamStatus || undefined,
      fallback: 'none',
    }, extra);
  }
};

exports.__test = {
  ASSETS,
  CURRENCIES,
  MAX_RANGE_DAYS,
  CACHE_TTL_MS,
  TIMEOUT_MS,
  responseCache,
  lastCompletedUtcDay,
  validateQuery,
  normalizeProviderPrices,
  providerConfig,
};
