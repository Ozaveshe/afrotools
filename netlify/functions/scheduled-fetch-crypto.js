/**
 * AfroTools — Scheduled Crypto Price Fetcher
 * Runs every hour via Netlify Scheduled Functions.
 *
 * Integrates into the runScraper pattern with anomaly detection + health logging.
 * Sources:
 *  1. CoinGecko API (key exists on Netlify)
 *  2. Existing forex blob crypto data as fallback
 *
 * Writes to Netlify Blobs 'live-data' → key 'crypto-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');

var COINS = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'cardano', 'dogecoin', 'tron', 'avalanche-2'];

var AFRICAN_STABLECOINS = [
  { id: 'cngn', name: 'cNGN', country: 'NG' },
  { id: 'zar-stablecoin', name: 'ZARS', country: 'ZA' },
];

async function fetchFromCoinGecko() {
  var key = process.env.COINGECKO_API_KEY;
  var allIds = COINS.concat(AFRICAN_STABLECOINS.map(function(c) { return c.id; }));

  var url = 'https://api.coingecko.com/api/v3/simple/price?ids=' +
    allIds.join(',') +
    '&vs_currencies=usd,ngn,kes,zar,ghs,egp&include_24hr_change=true&include_market_cap=true';

  if (key) {
    url += '&x_cg_demo_api_key=' + key;
  }

  var res = await fetchWithRetry(url, {
    headers: { 'Accept': 'application/json' },
  });
  var json = await res.json();

  if (!json || !json.bitcoin) throw new Error('CoinGecko returned no data');

  var coins = Object.keys(json).map(function(id) {
    var d = json[id];
    return {
      id: id,
      price_usd: d.usd || null,
      price_ngn: d.ngn || null,
      price_kes: d.kes || null,
      price_zar: d.zar || null,
      price_ghs: d.ghs || null,
      price_egp: d.egp || null,
      change_24h_pct: d.usd_24h_change || null,
      market_cap_usd: d.usd_market_cap || null,
      source: 'coingecko',
    };
  });

  return coins;
}

function transformCryptoData(coins) {
  var benchmarks = {};
  coins.forEach(function(c) { benchmarks[c.id] = c.price_usd; });

  return {
    timestamp: new Date().toISOString(),
    coins: coins,
    benchmarks: benchmarks,
    record_count: coins.length,
  };
}

function validateCryptoPrices(newData, oldData) {
  if (!oldData || !oldData.coins) return { valid: true, warnings: [] };

  var oldMap = {};
  oldData.coins.forEach(function(c) { oldMap[c.id] = c.price_usd; });

  var warnings = [];
  var anomalies = 0;
  (newData.coins || []).forEach(function(c) {
    var old = oldMap[c.id];
    if (!old || old === 0 || !c.price_usd) return;
    var ratio = c.price_usd / old;
    if (ratio > 3 || ratio < 0.33) {
      anomalies++;
      warnings.push(c.id + ': $' + old + ' → $' + c.price_usd);
    }
  });

  if (anomalies > newData.coins.length * 0.5) {
    return { valid: false, warnings: warnings };
  }
  return { valid: true, warnings: warnings };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'crypto-prices',
    blobKey: 'crypto-latest',
    metaKey: 'crypto',
    sources: [{ name: 'CoinGecko', fn: fetchFromCoinGecko }],
    transform: transformCryptoData,
    validate: validateCryptoPrices,
  });
};
