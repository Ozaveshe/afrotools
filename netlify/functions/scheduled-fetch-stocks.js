/**
 * AfroTools — Scheduled African Stock Index Fetcher
 * Runs every hour via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. Alpha Vantage GLOBAL_QUOTE end-of-day observations (key required)
 *  2. MarketStack end-of-day observations (key required)
 *  Provider failure retains the last-known-good payload; static references are not quotes.
 *
 * Tracks major African stock exchanges:
 *   NGX (Nigeria), JSE (South Africa), NSE (Kenya), GSE (Ghana),
 *   EGX (Egypt), DSE (Tanzania), USE (Uganda), RSE (Rwanda)
 *
 * Writes to Netlify Blobs 'live-data' → key 'stock-indices-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const stockObservations = require('./_shared/stock-observations');

// African stock exchanges and their index symbols
var EXCHANGES = [
  { code: 'NGX', country: 'NG', name: 'Nigerian Exchange', index: 'NGX ASI', yahoo: '^NGSE', av: 'NGX.IND', marketstack: 'NGXASI.NGA' },
  { code: 'JSE', country: 'ZA', name: 'Johannesburg Stock Exchange', index: 'JSE Top 40', yahoo: '^JN0U.JO', av: 'JSE.IND', marketstack: 'J200.JSE' },
  { code: 'NSE', country: 'KE', name: 'Nairobi Securities Exchange', index: 'NSE 20', yahoo: '^NSE20', av: 'NSE20.IND', marketstack: 'NSE20.NSE' },
  { code: 'GSE', country: 'GH', name: 'Ghana Stock Exchange', index: 'GSE-CI', yahoo: '^GSECI', av: 'GSE.IND', marketstack: 'GSECI.GSE' },
  { code: 'EGX', country: 'EG', name: 'Egyptian Exchange', index: 'EGX 30', yahoo: '^CASE', av: 'EGX30.IND', marketstack: 'EGX30.EGX' },
  { code: 'DSE', country: 'TZ', name: 'Dar es Salaam Stock Exchange', index: 'DSE ASI', yahoo: null, av: null, marketstack: null },
  { code: 'USE', country: 'UG', name: 'Uganda Securities Exchange', index: 'USE ASI', yahoo: null, av: null, marketstack: null },
  { code: 'RSE', country: 'RW', name: 'Rwanda Stock Exchange', index: 'RSE ASI', yahoo: null, av: null, marketstack: null },
  { code: 'BRVM', country: 'CI', name: 'BRVM (West Africa)', index: 'BRVM Composite', yahoo: null, av: null, marketstack: null },
  { code: 'CSE', country: 'MA', name: 'Casablanca Stock Exchange', index: 'MASI', yahoo: '^MASI', av: null, marketstack: 'MASI.CSE' },
];

/**
 * Source 1: Alpha Vantage (key required)
 */
async function fetchFromAlphaVantage() {
  var key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');

  var results = [];
  var fetchable = EXCHANGES.filter(function(e) { return e.yahoo; });

  // Fetch all in parallel — each call is independent and fast.
  // Retain the existing five-symbol limit; provider plan/symbol access is separate.
  var promises = fetchable.slice(0, 5).map(function(ex) {
    var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' +
      encodeURIComponent(ex.yahoo) + '&apikey=' + key;
    return fetchWithRetry(url, { retries: 1 })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        var quote = json['Global Quote'];
        if (quote && quote['05. price']) {
          return {
            exchange: ex.code,
            country: ex.country,
            name: ex.name,
            index_name: ex.index,
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change'] || 0),
            change_pct: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
            volume: parseInt(quote['06. volume'] || 0),
            last_trading_day: quote['07. latest trading day'] || null,
            source: 'alphavantage',
          };
        }
        return null;
      })
      .catch(function(e) {
        console.log('[stocks] AlphaVantage request failed for ' + ex.code);
        return null;
      });
  });

  var settled = await Promise.all(promises);
  var payload = { indices: settled, collection_coverage: {
    requested_exchanges: fetchable.slice(0, 5).map(function(ex) { return ex.code; }) } };
  var count = stockObservations.normalizeSnapshot(payload, Date.now()).count;
  if (count < 2) throw new Error('Alpha Vantage: only ' + count + ' dated indices');
  return payload;
}

/**
 * Source 2: MarketStack EOD API (account and symbol access required)
 */
async function fetchFromMarketStack() {
  var key = process.env.MARKETSTACK_KEY;
  if (!key) throw new Error('MARKETSTACK_KEY not set');

  var symbols = EXCHANGES.filter(function(e) { return e.marketstack; }).map(function(e) { return e.marketstack; });

  var url = 'https://api.marketstack.com/v1/eod/latest?access_key=' + encodeURIComponent(key) +
    '&symbols=' + symbols.join(',');

  var res = await fetchWithRetry(url, { redirect: 'error' });
  var json = await res.json();

  if (!json.data || json.data.length === 0) throw new Error('MarketStack returned no data');

  var symbolMap = {};
  EXCHANGES.forEach(function(e) { if (e.marketstack) symbolMap[e.marketstack] = e; });

  var results = json.data.map(function(d) {
    var ex = symbolMap[d.symbol];
    if (!ex) return null;
    return {
      exchange: ex.code,
      country: ex.country,
      name: ex.name,
      index_name: ex.index,
      price: d.close,
      change: d.close - d.open,
      change_pct: d.open > 0 ? Math.round(((d.close - d.open) / d.open) * 1000) / 10 : 0,
      volume: d.volume || 0,
      last_trading_day: d.date ? d.date.slice(0, 10) : null,
      source: 'marketstack',
    };
  }).filter(Boolean);

  var payload = { indices: results, collection_coverage: {
    requested_exchanges: EXCHANGES.filter(function(ex) { return ex.marketstack; }).map(function(ex) { return ex.code; }) } };
  var count = stockObservations.normalizeSnapshot(payload, Date.now()).count;
  if (count < 2) throw new Error('MarketStack: only ' + count + ' dated indices');
  return payload;
}

function transformStockData(indices) {
  return stockObservations.buildSnapshot(indices, new Date().toISOString());
}

exports.handler = async function(event) {
  return runScraper({
    id: 'stock-indices',
    blobKey: 'stock-indices-latest',
    metaKey: 'stocks',
    sources: [
      { name: 'AlphaVantage', fn: fetchFromAlphaVantage },
      { name: 'MarketStack', fn: fetchFromMarketStack },
    ],
    transform: transformStockData,
    validate: function(next, previous) { return stockObservations.validateSnapshot(next, previous, Date.now()); },
  });
};
