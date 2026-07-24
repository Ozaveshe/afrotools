/**
 * Source-labelled CoinGecko reference snapshot for USDT, USDC and DAI.
 * This is not an exchange, P2P, remittance, savings or trading quote.
 */
const { getAllowedOrigin } = require('./utils/cors');

const CACHE_TTL_MS = 60 * 1000;
const FRESHNESS_CEILING_MS = 30 * 60 * 1000;
const FUTURE_CLOCK_TOLERANCE_MS = 5 * 60 * 1000;
const SUPPORTED_CURRENCIES = Object.freeze(['ngn', 'zar']);
const ASSETS = Object.freeze([
  Object.freeze({ id: 'tether', symbol: 'USDT', name: 'Tether' }),
  Object.freeze({ id: 'usd-coin', symbol: 'USDC', name: 'USDC' }),
  Object.freeze({ id: 'dai', symbol: 'DAI', name: 'Dai' }),
]);
const cache = new Map();

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=30, s-maxage=60, stale-if-error=0',
  };
}

function jsonResponse(event, statusCode, body, extraHeaders = {}) {
  return { statusCode, headers: { ...corsHeaders(event), ...extraHeaders }, body: JSON.stringify(body) };
}

function getFreshCache(key, now) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (now - entry.cachedAt >= CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.payload;
}

function optionalNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseRows(payload, currency, now) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return ASSETS.reduce((rows, asset) => {
    const raw = payload[asset.id];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return rows;
    const usdPrice = Number(raw.usd);
    const localPrice = Number(raw[currency]);
    const sourceUpdatedMs = Number(raw.last_updated_at) * 1000;
    const ageMs = now - sourceUpdatedMs;
    if (
      !Number.isFinite(usdPrice) || usdPrice <= 0 ||
      !Number.isFinite(localPrice) || localPrice <= 0 ||
      !Number.isFinite(sourceUpdatedMs) ||
      ageMs < -FUTURE_CLOCK_TOLERANCE_MS ||
      ageMs > FRESHNESS_CEILING_MS
    ) return rows;

    rows.push({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      usdPrice,
      localPrice,
      usd24hChange: optionalNumber(raw.usd_24h_change),
      local24hChange: optionalNumber(raw[currency + '_24h_change']),
      pegDistancePercent: (usdPrice - 1) * 100,
      sourceUpdatedAt: new Date(sourceUpdatedMs).toISOString(),
    });
    return rows;
  }, []);
}

function buildSnapshot(currency, rows, now) {
  const sourceTimes = rows.map((row) => Date.parse(row.sourceUpdatedAt));
  return {
    status: 'fresh',
    source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
    scope: 'provider_reference_not_exchange_quote',
    currency,
    count: rows.length,
    fetchedAt: new Date(now).toISOString(),
    sourceUpdatedAt: new Date(Math.min(...sourceTimes)).toISOString(),
    latestSourceUpdatedAt: new Date(Math.max(...sourceTimes)).toISOString(),
    freshnessCeilingMinutes: FRESHNESS_CEILING_MS / 60000,
    cache: 'miss',
    data: rows,
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' };
  if (event.httpMethod !== 'GET') {
    return jsonResponse(event, 405, { status: 'unavailable', error: 'method_not_allowed', message: 'Use GET for this endpoint.' });
  }

  const params = event.queryStringParameters || {};
  const currency = String(params.currency || 'ngn').toLowerCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return jsonResponse(event, 400, {
      status: 'unavailable',
      error: 'unsupported_currency',
      message: 'This snapshot currently supports NGN and ZAR only.',
      supportedCurrencies: SUPPORTED_CURRENCIES,
    });
  }

  const now = Date.now();
  const cached = getFreshCache(currency, now);
  if (cached) return jsonResponse(event, 200, { ...cached, cache: 'hit' }, { 'X-Cache': 'HIT' });

  try {
    const upstreamUrl = new URL('https://api.coingecko.com/api/v3/simple/price');
    upstreamUrl.searchParams.set('ids', ASSETS.map((asset) => asset.id).join(','));
    upstreamUrl.searchParams.set('vs_currencies', 'usd,' + currency);
    upstreamUrl.searchParams.set('include_24hr_change', 'true');
    upstreamUrl.searchParams.set('include_last_updated_at', 'true');
    const upstreamHeaders = { Accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) upstreamHeaders['x-cg-demo-key'] = process.env.COINGECKO_API_KEY;
    const response = await fetch(upstreamUrl.toString(), {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 429) {
      return jsonResponse(event, 429, {
        status: 'unavailable',
        error: 'provider_rate_limited',
        source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
        message: 'The data provider is rate-limiting requests. No stablecoin snapshot is shown.',
      }, { 'Retry-After': response.headers.get('retry-after') || '60' });
    }
    if (!response.ok) throw new Error(`provider_http_${response.status}`);

    const rows = normaliseRows(await response.json(), currency, now);
    if (!rows.length) {
      return jsonResponse(event, 503, {
        status: 'unavailable',
        error: 'no_fresh_rows',
        source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
        freshnessCeilingMinutes: FRESHNESS_CEILING_MS / 60000,
        message: 'The provider returned no valid stablecoin rows updated within the last 30 minutes. No snapshot is shown.',
      });
    }

    const snapshot = buildSnapshot(currency, rows, now);
    cache.set(currency, { cachedAt: now, payload: snapshot });
    return jsonResponse(event, 200, snapshot, { 'X-Cache': 'MISS' });
  } catch (error) {
    console.error(`[crypto-stablecoins] ${error && error.message ? error.message : 'provider_unavailable'}`);
    return jsonResponse(event, 503, {
      status: 'unavailable',
      error: 'provider_unavailable',
      source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
      message: 'Fresh provider data is unavailable. No cached, estimated or platform prices are shown.',
    });
  }
};

exports._test = {
  ASSETS,
  CACHE_TTL_MS,
  FRESHNESS_CEILING_MS,
  SUPPORTED_CURRENCIES,
  buildSnapshot,
  cache,
  getFreshCache,
  normaliseRows,
};
