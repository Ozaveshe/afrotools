/**
 * AfroTools AfroCrypto — Unified API Endpoint
 *
 * GET /api/crypto/prices?currency=NGN         — proxies to crypto-prices
 * GET /api/crypto/p2p                         — retired with a stable 410
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
  const currency = (params.currency || 'ngn').toLowerCase();
  const limit = params.limit || '100';

  const baseUrl = process.env.URL || 'https://afrotools.org';
  const url = `${baseUrl}/.netlify/functions/crypto-prices?currency=${encodeURIComponent(currency)}&limit=${encodeURIComponent(limit)}`;

  const res = await fetch(url);
  const data = await res.json();
  return { statusCode: res.status, data };
}

async function handleStablecoins(params) {
  const currency = (params.currency || 'ngn').toLowerCase();
  const baseUrl = process.env.URL || 'https://afrotools.org';
  const url = `${baseUrl}/.netlify/functions/crypto-stablecoins?currency=${encodeURIComponent(currency)}`;
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

    // --- /api/crypto/stablecoins ---
    if (subRoute === 'stablecoins') {
      const result = await handleStablecoins(params);
      return jsonResponse(result.statusCode, {
        endpoint: 'crypto/stablecoins',
        ...result.data,
      }, rateLimitHeaders);
    }

    // --- /api/crypto/p2p ---
    if (subRoute === 'p2p') {
      return jsonResponse(410, {
        endpoint: 'crypto/p2p',
        error: 'p2p_rate_endpoint_retired',
        status: 'retired',
        message: 'AfroTools no longer publishes aggregated P2P rates. Compare executable quotes you obtain directly using the local worksheet.',
        replacement: '/crypto/p2p-rates/',
      }, rateLimitHeaders);
    }

    // --- /api/crypto (root) — API overview ---
    return jsonResponse(200, {
      name: 'AfroTools Crypto API',
      version: '1.0.0',
      description: 'Fresh CoinGecko market snapshots in currently verified African quote currencies.',
      endpoints: {
        prices: {
          path: '/api/crypto/prices',
          method: 'GET',
          description: 'CoinGecko market rows updated within 30 minutes, quoted in NGN or ZAR. Unsupported currencies are not estimated.',
          params: {
            currency: 'Quote currency (default: ngn). Supported: ngn, zar.',
            limit: 'Number of requested rows, 1-100 (default: 100). The response count is the number of fresh rows that survived validation.',
          },
          example: '/api/crypto/prices?currency=ngn&limit=20',
        },
        stablecoins: {
          path: '/api/crypto/stablecoins',
          method: 'GET',
          description: 'CoinGecko reference prices for USDT, USDC and DAI in USD plus NGN or ZAR. This is not an exchange or P2P quote.',
          params: {
            currency: 'Quote currency (default: ngn). Supported: ngn, zar.',
          },
          example: '/api/crypto/stablecoins?currency=ngn',
        },
        p2p: {
          path: '/api/crypto/p2p',
          method: 'GET',
          status: 'retired',
          response: '410 Gone',
          description: 'Retired. Use the local user-entered quote worksheet at /crypto/p2p-rates/.',
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
