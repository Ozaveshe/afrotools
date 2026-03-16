/**
 * AfroTools AfroCrypto — P2P Rate Aggregator
 *
 * GET /.netlify/functions/crypto-p2p?asset=USDT&fiat=NGN&action=buy
 *
 * Fetches P2P rate data from multiple exchanges:
 *  1. Binance P2P (primary)
 *  2. Bybit P2P (secondary)
 *  3. CoinGecko exchange tickers (fallback)
 *
 * Caches results for 5 minutes using global cache object.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60, s-maxage=300',
};

// In-memory cache (persists across warm invocations)
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

/**
 * Fetch Binance P2P ads
 * Public endpoint, no auth needed.
 */
async function fetchBinanceP2P(asset, fiat, tradeType) {
  const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
  const body = {
    asset: asset.toUpperCase(),
    fiat: fiat.toUpperCase(),
    tradeType: tradeType.toUpperCase(), // "BUY" or "SELL"
    page: 1,
    rows: 10,
    publisherType: null,
    payTypes: [],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Binance P2P: HTTP ${res.status}`);

  const json = await res.json();
  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('Binance P2P: unexpected response format');
  }

  return json.data.map(ad => ({
    price: parseFloat(ad.adv.price),
    available: parseFloat(ad.adv.surplusAmount),
    minAmount: parseFloat(ad.adv.minSingleTransAmount),
    maxAmount: parseFloat(ad.adv.maxSingleTransAmount),
    methods: (ad.adv.tradeMethods || []).map(m => m.identifier),
    advertiser: ad.advertiser?.nickName || 'Unknown',
    completionRate: ad.advertiser?.monthFinishRate
      ? parseFloat(ad.advertiser.monthFinishRate) * 100
      : null,
  }));
}

/**
 * Fetch Bybit P2P ads
 */
async function fetchBybitP2P(asset, fiat, side) {
  const url = 'https://api2.bybit.com/fiat/otc/item/online';
  const body = {
    tokenId: asset.toUpperCase(),
    currencyId: fiat.toUpperCase(),
    side: side === 'BUY' ? '1' : '0',
    size: '10',
    page: '1',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Bybit P2P: HTTP ${res.status}`);

  const json = await res.json();
  if (!json.result || !Array.isArray(json.result.items)) {
    throw new Error('Bybit P2P: unexpected response format');
  }

  return json.result.items.map(item => ({
    price: parseFloat(item.price),
    available: parseFloat(item.quantity),
    minAmount: parseFloat(item.minAmount),
    maxAmount: parseFloat(item.maxAmount),
    methods: (item.payments || []).map(p => p.paymentType || p),
    advertiser: item.nickName || 'Unknown',
    completionRate: item.recentExecuteRate
      ? parseFloat(item.recentExecuteRate) * 100
      : null,
  }));
}

/**
 * Fallback: CoinGecko exchange tickers for approximate pricing
 */
async function fetchCoinGeckoFallback(asset, fiat) {
  const coinMap = {
    USDT: 'tether',
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
  };

  const coinId = coinMap[asset.toUpperCase()] || asset.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fiat.toLowerCase()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko fallback: HTTP ${res.status}`);

  const json = await res.json();
  const price = json[coinId]?.[fiat.toLowerCase()];

  if (!price) throw new Error('CoinGecko fallback: price not found');

  return price;
}

/**
 * Compute summary from ads list
 */
function computeSummary(ads) {
  if (!ads || ads.length === 0) return null;
  const prices = ads.map(a => a.price);
  return {
    median: prices[Math.floor(prices.length / 2)],
    low: Math.min(...prices),
    high: Math.max(...prices),
    count: ads.length,
  };
}

exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const asset = (params.asset || 'USDT').toUpperCase();
  const fiat = (params.fiat || 'NGN').toUpperCase();
  const action = (params.action || 'buy').toUpperCase();

  // Validate
  const validAssets = ['USDT', 'BTC', 'ETH', 'USDC', 'BNB'];
  if (!validAssets.includes(asset)) {
    return jsonResponse(400, {
      error: `Invalid asset. Supported: ${validAssets.join(', ')}`,
    });
  }

  const cacheKey = `p2p-${asset}-${fiat}-${action}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return jsonResponse(200, { ...cached, cached: true });
  }

  const platforms = [];
  let source = 'live';

  // --- Binance P2P ---
  try {
    const buyAds = await fetchBinanceP2P(asset, fiat, 'BUY');
    const sellAds = await fetchBinanceP2P(asset, fiat, 'SELL');

    const buyPrices = buyAds.map(a => a.price);
    const sellPrices = sellAds.map(a => a.price);

    const buyPrice = buyPrices.length > 0 ? buyPrices[0] : null;
    const sellPrice = sellPrices.length > 0 ? sellPrices[0] : null;

    const allMethods = new Set();
    [...buyAds, ...sellAds].forEach(ad =>
      ad.methods.forEach(m => allMethods.add(m))
    );

    platforms.push({
      name: 'Binance P2P',
      buyPrice,
      sellPrice,
      spread: buyPrice && sellPrice ? Math.round((buyPrice - sellPrice) * 100) / 100 : null,
      methods: [...allMethods],
      ads: action === 'BUY' ? buyAds.slice(0, 5) : sellAds.slice(0, 5),
      buySummary: computeSummary(buyAds),
      sellSummary: computeSummary(sellAds),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[crypto-p2p] Binance failed: ${err.message}`);
  }

  // --- Bybit P2P ---
  try {
    const buyAds = await fetchBybitP2P(asset, fiat, 'BUY');
    const sellAds = await fetchBybitP2P(asset, fiat, 'SELL');

    const buyPrice = buyAds.length > 0 ? buyAds[0].price : null;
    const sellPrice = sellAds.length > 0 ? sellAds[0].price : null;

    const allMethods = new Set();
    [...buyAds, ...sellAds].forEach(ad =>
      ad.methods.forEach(m => allMethods.add(m))
    );

    platforms.push({
      name: 'Bybit P2P',
      buyPrice,
      sellPrice,
      spread: buyPrice && sellPrice ? Math.round((buyPrice - sellPrice) * 100) / 100 : null,
      methods: [...allMethods],
      ads: action === 'BUY' ? buyAds.slice(0, 5) : sellAds.slice(0, 5),
      buySummary: computeSummary(buyAds),
      sellSummary: computeSummary(sellAds),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[crypto-p2p] Bybit failed: ${err.message}`);
  }

  // --- Fallback: CoinGecko if no P2P data ---
  if (platforms.length === 0) {
    try {
      const price = await fetchCoinGeckoFallback(asset, fiat);
      platforms.push({
        name: 'CoinGecko (spot)',
        buyPrice: price,
        sellPrice: price,
        spread: 0,
        methods: [],
        ads: [],
        buySummary: null,
        sellSummary: null,
        lastUpdated: new Date().toISOString(),
      });
      source = 'fallback';
    } catch (err) {
      console.error(`[crypto-p2p] CoinGecko fallback failed: ${err.message}`);
    }
  }

  if (platforms.length === 0) {
    return jsonResponse(503, {
      error: 'P2P data unavailable. All sources failed.',
      asset,
      fiat,
    });
  }

  const result = {
    asset,
    fiat,
    action,
    platforms,
    source,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, result);

  return jsonResponse(200, result);
};
