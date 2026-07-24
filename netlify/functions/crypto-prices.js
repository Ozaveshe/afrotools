/**
 * AfroTools crypto market snapshot proxy.
 *
 * GET /.netlify/functions/crypto-prices?currency=ngn&limit=100
 *
 * CoinGecko currently supports NGN and ZAR among the African quote currencies
 * this product has verified. We do not synthesize unsupported FX conversions.
 */

const { getAllowedOrigin } = require('./utils/cors');

const CACHE_TTL_MS = 60 * 1000;
const FRESHNESS_CEILING_MS = 30 * 60 * 1000;
const FUTURE_CLOCK_TOLERANCE_MS = 5 * 60 * 1000;
const SUPPORTED_CURRENCIES = Object.freeze(['ngn', 'zar']);
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
  return {
    statusCode,
    headers: { ...corsHeaders(event), ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function parseLimit(value) {
  if (value == null || value === '') return 100;
  if (!/^\d+$/.test(String(value))) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 100 ? parsed : null;
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

function normaliseMarketRows(rows, now) {
  if (!Array.isArray(rows)) return [];

  function optionalNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return rows.reduce((usable, row) => {
    if (!row || typeof row !== 'object') return usable;
    const sourceUpdatedMs = Date.parse(row.last_updated);
    const ageMs = now - sourceUpdatedMs;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const symbol = typeof row.symbol === 'string' ? row.symbol.trim() : '';
    const currentPrice = Number(row.current_price);
    const isUsable = (
      id &&
      name &&
      symbol &&
      Number.isFinite(currentPrice) &&
      currentPrice > 0 &&
      Number.isFinite(sourceUpdatedMs) &&
      ageMs >= -FUTURE_CLOCK_TOLERANCE_MS &&
      ageMs <= FRESHNESS_CEILING_MS
    );
    if (!isUsable) return usable;

    const sparkline = row.sparkline_in_7d && Array.isArray(row.sparkline_in_7d.price)
      ? row.sparkline_in_7d.price.map(optionalNumber).filter(value => value != null)
      : [];

    usable.push({
      ...row,
      id,
      name,
      symbol,
      image: typeof row.image === 'string' ? row.image : '',
      current_price: currentPrice,
      market_cap_rank: optionalNumber(row.market_cap_rank),
      price_change_percentage_24h_in_currency: optionalNumber(row.price_change_percentage_24h_in_currency),
      price_change_percentage_7d_in_currency: optionalNumber(row.price_change_percentage_7d_in_currency),
      market_cap: optionalNumber(row.market_cap),
      total_volume: optionalNumber(row.total_volume),
      ath: optionalNumber(row.ath),
      atl: optionalNumber(row.atl),
      circulating_supply: optionalNumber(row.circulating_supply),
      last_updated: new Date(sourceUpdatedMs).toISOString(),
      sparkline_in_7d: { price: sparkline },
    });
    return usable;
  }, []);
}

function buildSnapshot(currency, limit, rows, now) {
  const sourceTimes = rows.map((row) => Date.parse(row.last_updated));
  return {
    status: 'fresh',
    source: {
      name: 'CoinGecko',
      url: 'https://www.coingecko.com/',
    },
    currency,
    count: rows.length,
    requestedLimit: limit,
    fetchedAt: new Date(now).toISOString(),
    sourceUpdatedAt: new Date(Math.min(...sourceTimes)).toISOString(),
    latestSourceUpdatedAt: new Date(Math.max(...sourceTimes)).toISOString(),
    freshnessCeilingMinutes: FRESHNESS_CEILING_MS / 60000,
    cache: 'miss',
    data: rows,
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(event, 405, {
      status: 'unavailable',
      error: 'method_not_allowed',
      message: 'Use GET for this endpoint.',
    });
  }

  const params = event.queryStringParameters || {};
  const currency = String(params.currency || 'ngn').toLowerCase();
  const limit = parseLimit(params.limit);

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return jsonResponse(event, 400, {
      status: 'unavailable',
      error: 'unsupported_currency',
      message: 'This snapshot currently supports NGN and ZAR only.',
      supportedCurrencies: SUPPORTED_CURRENCIES,
    });
  }

  if (limit == null) {
    return jsonResponse(event, 400, {
      status: 'unavailable',
      error: 'invalid_limit',
      message: 'limit must be a whole number from 1 to 100.',
    });
  }

  const now = Date.now();
  const cacheKey = `${currency}:${limit}`;
  const cached = getFreshCache(cacheKey, now);
  if (cached) {
    return jsonResponse(
      event,
      200,
      { ...cached, cache: 'hit' },
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const upstreamUrl = new URL('https://api.coingecko.com/api/v3/coins/markets');
    upstreamUrl.searchParams.set('vs_currency', currency);
    upstreamUrl.searchParams.set('order', 'market_cap_desc');
    upstreamUrl.searchParams.set('per_page', String(limit));
    upstreamUrl.searchParams.set('page', '1');
    upstreamUrl.searchParams.set('sparkline', 'true');
    upstreamUrl.searchParams.set('price_change_percentage', '24h,7d');

    const upstreamHeaders = { Accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) {
      upstreamHeaders['x-cg-demo-key'] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(upstreamUrl.toString(), {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 429) {
      return jsonResponse(
        event,
        429,
        {
          status: 'unavailable',
          error: 'provider_rate_limited',
          source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
          message: 'The data provider is rate-limiting requests. No price snapshot is shown.',
        },
        { 'Retry-After': response.headers.get('retry-after') || '60' },
      );
    }

    if (!response.ok) {
      throw new Error(`provider_http_${response.status}`);
    }

    const rows = normaliseMarketRows(await response.json(), now);
    if (!rows.length) {
      return jsonResponse(event, 503, {
        status: 'unavailable',
        error: 'no_fresh_rows',
        source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
        freshnessCeilingMinutes: FRESHNESS_CEILING_MS / 60000,
        message: 'The provider returned no market rows updated within the last 30 minutes. No price snapshot is shown.',
      });
    }

    const snapshot = buildSnapshot(currency, limit, rows, now);
    cache.set(cacheKey, { cachedAt: now, payload: snapshot });

    return jsonResponse(event, 200, snapshot, { 'X-Cache': 'MISS' });
  } catch (error) {
    console.error(`[crypto-prices] ${error && error.message ? error.message : 'provider_unavailable'}`);
    return jsonResponse(event, 503, {
      status: 'unavailable',
      error: 'provider_unavailable',
      source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
      message: 'Fresh provider data is unavailable. No cached or estimated prices are shown.',
    });
  }
};

exports._test = {
  CACHE_TTL_MS,
  FRESHNESS_CEILING_MS,
  SUPPORTED_CURRENCIES,
  buildSnapshot,
  cache,
  normaliseMarketRows,
  parseLimit,
};
