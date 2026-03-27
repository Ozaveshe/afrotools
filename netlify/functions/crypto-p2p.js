/**
 * AfroTools AfroCrypto — P2P Rate Aggregator
 *
 * GET /.netlify/functions/crypto-p2p?asset=USDT&fiat=NGN
 *
 * Data sources:
 *  1. Binance P2P API  (live, real ads)
 *  2. Bybit P2P API    (live, real ads)
 *  3. Supabase p2p_rates table (admin-managed manual rates)
 *  4. CoinGecko spot   (fallback if all above fail)
 *
 * Caches results for 2 minutes using global cache object.
 */

const { createClient } = require('@supabase/supabase-js');
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60, s-maxage=120',
};

// In-memory cache (persists across warm invocations)
const cache = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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

/* ── Supabase client ──────────────────────────────────────── */
const SUPABASE_URL = process.env.SUPABASE_URL_AUTH || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
if (!SUPABASE_ANON_KEY) console.warn('[crypto-p2p] Missing SUPABASE_ANON_KEY_AUTH env var');

let supabase;
function getSupabase() {
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

/* ── Binance P2P ──────────────────────────────────────────── */
async function fetchBinanceP2P(asset, fiat, tradeType) {
  const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
  const body = {
    asset: asset.toUpperCase(),
    fiat: fiat.toUpperCase(),
    tradeType: tradeType.toUpperCase(),
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

/* ── Bybit P2P ────────────────────────────────────────────── */
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

/* ── Supabase manual rates ────────────────────────────────── */
async function fetchManualRates(asset, fiat) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('p2p_rates')
    .select('*')
    .eq('asset', asset.toUpperCase())
    .eq('fiat', fiat.toUpperCase())
    .eq('is_active', true);

  if (error) {
    console.error('[crypto-p2p] Supabase error:', error.message);
    return [];
  }
  return data || [];
}

/* ── CoinGecko fallback ───────────────────────────────────── */
async function fetchCoinGeckoFallback(asset, fiat) {
  const coinMap = {
    USDT: 'tether', BTC: 'bitcoin', ETH: 'ethereum',
    USDC: 'usd-coin', BNB: 'binancecoin',
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

/* ── Helpers ──────────────────────────────────────────────── */
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

/* ── Handler ──────────────────────────────────────────────── */
exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const asset = (params.asset || 'USDT').toUpperCase();
  const fiat = (params.fiat || 'NGN').toUpperCase();

  const validAssets = ['USDT', 'BTC', 'ETH', 'USDC', 'BNB'];
  if (!validAssets.includes(asset)) {
    return jsonResponse(400, {
      error: `Invalid asset. Supported: ${validAssets.join(', ')}`,
    });
  }

  const cacheKey = `p2p-${asset}-${fiat}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return jsonResponse(200, { ...cached, cached: true });
  }

  const platforms = [];

  // --- Fetch all sources in parallel ---
  const [binanceResult, bybitResult, manualResult] = await Promise.allSettled([
    // Binance: fetch both buy and sell
    (async () => {
      const [buyAds, sellAds] = await Promise.all([
        fetchBinanceP2P(asset, fiat, 'BUY'),
        fetchBinanceP2P(asset, fiat, 'SELL'),
      ]);
      return { buyAds, sellAds };
    })(),
    // Bybit: fetch both buy and sell
    (async () => {
      const [buyAds, sellAds] = await Promise.all([
        fetchBybitP2P(asset, fiat, 'BUY'),
        fetchBybitP2P(asset, fiat, 'SELL'),
      ]);
      return { buyAds, sellAds };
    })(),
    // Supabase manual rates
    fetchManualRates(asset, fiat),
  ]);

  // --- Process Binance ---
  if (binanceResult.status === 'fulfilled') {
    const { buyAds, sellAds } = binanceResult.value;
    const buyPrice = buyAds.length > 0 ? buyAds[0].price : null;
    const sellPrice = sellAds.length > 0 ? sellAds[0].price : null;
    const allMethods = new Set();
    [...buyAds, ...sellAds].forEach(ad => ad.methods.forEach(m => allMethods.add(m)));

    platforms.push({
      id: 'binance',
      name: 'Binance P2P',
      source: 'live',
      buyPrice,
      sellPrice,
      spread: buyPrice && sellPrice ? Math.round((buyPrice - sellPrice) * 100) / 100 : null,
      methods: [...allMethods],
      trust: 95,
      fees: { maker: 0, taker: 0 },
      url: 'https://p2p.binance.com',
      ads: { buy: buyAds.slice(0, 5), sell: sellAds.slice(0, 5) },
      buySummary: computeSummary(buyAds),
      sellSummary: computeSummary(sellAds),
      lastUpdated: new Date().toISOString(),
    });
  } else {
    console.error(`[crypto-p2p] Binance failed: ${binanceResult.reason?.message}`);
  }

  // --- Process Bybit ---
  if (bybitResult.status === 'fulfilled') {
    const { buyAds, sellAds } = bybitResult.value;
    const buyPrice = buyAds.length > 0 ? buyAds[0].price : null;
    const sellPrice = sellAds.length > 0 ? sellAds[0].price : null;
    const allMethods = new Set();
    [...buyAds, ...sellAds].forEach(ad => ad.methods.forEach(m => allMethods.add(m)));

    platforms.push({
      id: 'bybit',
      name: 'Bybit P2P',
      source: 'live',
      buyPrice,
      sellPrice,
      spread: buyPrice && sellPrice ? Math.round((buyPrice - sellPrice) * 100) / 100 : null,
      methods: [...allMethods],
      trust: 90,
      fees: { maker: 0, taker: 0 },
      url: 'https://www.bybit.com/fiat/trade/otc',
      ads: { buy: buyAds.slice(0, 5), sell: sellAds.slice(0, 5) },
      buySummary: computeSummary(buyAds),
      sellSummary: computeSummary(sellAds),
      lastUpdated: new Date().toISOString(),
    });
  } else {
    console.error(`[crypto-p2p] Bybit failed: ${bybitResult.reason?.message}`);
  }

  // --- Process Supabase manual rates ---
  if (manualResult.status === 'fulfilled' && manualResult.value.length > 0) {
    for (const row of manualResult.value) {
      platforms.push({
        id: row.platform,
        name: formatPlatformName(row.platform),
        source: 'manual',
        buyPrice: parseFloat(row.buy_price),
        sellPrice: parseFloat(row.sell_price),
        spread: Math.round((parseFloat(row.buy_price) - parseFloat(row.sell_price)) * 100) / 100,
        methods: row.methods || [],
        trust: row.trust_score || 80,
        fees: { maker: parseFloat(row.fees_maker) || 0, taker: parseFloat(row.fees_taker) || 0 },
        url: row.platform_url || '',
        countries: row.countries || [],
        ads: { buy: [], sell: [] },
        buySummary: null,
        sellSummary: null,
        lastUpdated: row.updated_at,
        notes: row.notes,
      });
    }
  } else if (manualResult.status === 'rejected') {
    console.error(`[crypto-p2p] Supabase failed: ${manualResult.reason?.message}`);
  }

  // --- Fallback: CoinGecko if nothing else worked ---
  if (platforms.length === 0) {
    try {
      const price = await fetchCoinGeckoFallback(asset, fiat);
      platforms.push({
        id: 'coingecko',
        name: 'CoinGecko (spot)',
        source: 'fallback',
        buyPrice: price,
        sellPrice: price,
        spread: 0,
        methods: [],
        trust: 70,
        fees: { maker: 0, taker: 0 },
        url: 'https://www.coingecko.com',
        ads: { buy: [], sell: [] },
        buySummary: null,
        sellSummary: null,
        lastUpdated: new Date().toISOString(),
      });
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
    platforms,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return jsonResponse(200, result);
};

/* ── Platform name formatter ──────────────────────────────── */
function formatPlatformName(slug) {
  const names = {
    kucoin: 'KuCoin P2P',
    luno: 'Luno',
    quidax: 'Quidax',
    yellowcard: 'Yellow Card',
    noones: 'Noones',
    roqqu: 'Roqqu',
  };
  return names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}
