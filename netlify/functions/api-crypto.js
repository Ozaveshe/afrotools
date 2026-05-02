/**
 * AfroTools AfroCrypto — Unified API Endpoint
 *
 * GET /api/crypto/prices?currency=NGN         — proxies to crypto-prices
 * GET /api/crypto/p2p?asset=USDT&fiat=NGN     — proxies to crypto-p2p
 * GET /api/crypto                              — API overview / docs
 *
 * Adds CORS headers, rate limit info, API key validation (optional).
 * Returns JSON with proper error handling.
 *
 * Headers: x-api-key for authenticated access
 * Free tier: 100 requests/day and 3,000/month
 */

const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=30, s-maxage=60',
};

// Simple in-memory rate limiting (resets per function cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 100; // per day per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  record.count++;
  return {
    allowed: record.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - record.count),
  };
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

/**
 * Determine the sub-route from the request path.
 * Handles both direct function calls and /api/crypto/* redirects.
 */
function getSubRoute(event) {
  const path = event.path || '';
  // Match /api/crypto/prices, /api/crypto/p2p, etc.
  const match = path.match(/\/api\/crypto\/(\w+)/);
  if (match) return match[1].toLowerCase();

  // Also check for ?route= param (alternative routing)
  const params = event.queryStringParameters || {};
  if (params.route) return params.route.toLowerCase();

  return null;
}

/**
 * Internal proxy to crypto-prices function
 */
async function handlePrices(params) {
  const currency = (params.currency || 'usd').toLowerCase();
  const limit = params.limit || '50';
  const page = params.page || '1';
  const order = params.order || 'market_cap_desc';
  const sparkline = params.sparkline || 'false';
  const priceChange = params.price_change || '24h';

  const baseUrl = process.env.URL || 'https://afrotools.org';
  const url = `${baseUrl}/.netlify/functions/crypto-prices?currency=${currency}&limit=${limit}&page=${page}&order=${order}&sparkline=${sparkline}&price_change=${priceChange}`;

  const res = await fetch(url);
  const data = await res.json();
  return { statusCode: res.status, data };
}

/**
 * Internal proxy to crypto-p2p function
 */
async function handleP2P(params) {
  const asset = (params.asset || 'USDT').toUpperCase();
  const fiat = (params.fiat || 'NGN').toUpperCase();
  const action = (params.action || 'buy').toUpperCase();

  const baseUrl = process.env.URL || 'https://afrotools.org';
  const url = `${baseUrl}/.netlify/functions/crypto-p2p?asset=${asset}&fiat=${fiat}&action=${action}`;

  const res = await fetch(url);
  const data = await res.json();
  return { statusCode: res.status, data };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // Rate limiting (skip if API key provided)
  const apiKey = event.headers['x-api-key'];
  const hasValidKey = apiKey && apiKey.length > 10;
  let rateLimitHeaders = {};

  if (!hasValidKey) {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    const rateCheck = checkRateLimit(clientIp);

    rateLimitHeaders = {
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
    };

    if (!rateCheck.allowed) {
      return jsonResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Free tier allows 100 requests/day and 3,000/month. Generate an API key from your dashboard for authenticated limits.',
        docs: 'https://afrotools.org/api-docs',
      }, rateLimitHeaders);
    }
  }

  const params = event.queryStringParameters || {};
  const subRoute = getSubRoute(event);

  try {
    // --- /api/crypto/prices ---
    if (subRoute === 'prices') {
      const result = await handlePrices(params);
      return jsonResponse(result.statusCode, {
        endpoint: 'crypto/prices',
        ...result.data,
      }, rateLimitHeaders);
    }

    // --- /api/crypto/p2p ---
    if (subRoute === 'p2p') {
      const result = await handleP2P(params);
      return jsonResponse(result.statusCode, {
        endpoint: 'crypto/p2p',
        ...result.data,
      }, rateLimitHeaders);
    }

    // --- /api/crypto (root) — API overview ---
    return jsonResponse(200, {
      name: 'AfroTools Crypto API',
      version: '1.0.0',
      description: 'Real-time cryptocurrency prices and P2P rates for African markets.',
      endpoints: {
        prices: {
          path: '/api/crypto/prices',
          method: 'GET',
          description: 'Top cryptocurrencies by market cap with prices in African currencies.',
          params: {
            currency: 'ISO currency code (default: usd). Supports: ngn, kes, zar, ghs, egp, etc.',
            limit: 'Number of results, 1-250 (default: 50)',
            page: 'Page number (default: 1)',
            order: 'Sort order (default: market_cap_desc)',
            sparkline: 'Include 7d sparkline data (default: false)',
          },
          example: '/api/crypto/prices?currency=ngn&limit=20',
        },
        p2p: {
          path: '/api/crypto/p2p',
          method: 'GET',
          description: 'P2P exchange rates from Binance, Bybit, and more.',
          params: {
            asset: 'Crypto asset (default: USDT). Supports: USDT, BTC, ETH, USDC, BNB',
            fiat: 'Fiat currency (default: NGN). Any African currency code.',
            action: 'Trade direction: buy or sell (default: buy)',
          },
          example: '/api/crypto/p2p?asset=USDT&fiat=NGN&action=buy',
        },
      },
      rate_limit: hasValidKey ? 'unlimited' : '100 requests/day (add x-api-key header for more)',
      docs: 'https://afrotools.org/api-docs',
    }, rateLimitHeaders);
  } catch (err) {
    console.error(`[api-crypto] Error: ${err.message}`);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: err.message,
    }, rateLimitHeaders);
  }
};
