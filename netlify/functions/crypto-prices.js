/**
 * AfroTools AfroCrypto — Crypto Market Prices Proxy
 *
 * GET /.netlify/functions/crypto-prices?currency=ngn&limit=50
 *
 * Proxies CoinGecko /coins/markets to avoid browser CORS and rate limits.
 * Caches results for 60 seconds.
 */

const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=30, s-maxage=60',
};

// In-memory cache (persists across warm invocations)
const cache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Supported vs_currencies for African markets
const VALID_CURRENCIES = [
  'usd', 'eur', 'gbp', 'ngn', 'kes', 'zar', 'ghs', 'egp', 'tzs', 'ugx',
  'rwf', 'etb', 'xof', 'xaf', 'mad', 'tnd', 'dzd', 'bwp', 'zmw', 'mzn',
  'aed', 'cny', 'inr', 'btc', 'eth',
];

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const currency = (params.currency || 'usd').toLowerCase();
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 50, 1), 250);
  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const order = params.order || 'market_cap_desc';
  const sparkline = params.sparkline === 'true';
  const priceChange = params.price_change || '24h';

  // Validate currency
  if (!VALID_CURRENCIES.includes(currency)) {
    return jsonResponse(400, {
      error: `Unsupported currency "${currency}".`,
      supported: VALID_CURRENCIES,
    });
  }

  const cacheKey = `prices-${currency}-${limit}-${page}-${order}-${sparkline}-${priceChange}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return jsonResponse(200, cached, { 'X-Cache': 'HIT' });
  }

  try {
    const cgUrl = new URL('https://api.coingecko.com/api/v3/coins/markets');
    cgUrl.searchParams.set('vs_currency', currency);
    cgUrl.searchParams.set('order', order);
    cgUrl.searchParams.set('per_page', String(limit));
    cgUrl.searchParams.set('page', String(page));
    cgUrl.searchParams.set('sparkline', String(sparkline));
    cgUrl.searchParams.set('price_change_percentage', priceChange);

    // Use CoinGecko demo key if available
    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-key'] = process.env.COINGECKO_API_KEY;
    }

    const res = await fetch(cgUrl.toString(), { headers });

    if (res.status === 429) {
      return jsonResponse(429, {
        error: 'Upstream rate limit reached. Please try again in a few seconds.',
      });
    }

    if (!res.ok) {
      throw new Error(`CoinGecko API: HTTP ${res.status}`);
    }

    const data = await res.json();

    const result = {
      currency,
      count: data.length,
      page,
      limit,
      data,
      timestamp: new Date().toISOString(),
    };

    setCache(cacheKey, result);

    return jsonResponse(200, result, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(`[crypto-prices] Error: ${err.message}`);
    return jsonResponse(502, {
      error: 'Failed to fetch crypto prices from upstream.',
      message: err.message,
    });
  }
};
