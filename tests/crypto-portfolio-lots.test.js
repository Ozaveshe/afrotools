const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/crypto-portfolio-lots.js');
const cloudApi = require('../netlify/functions/crypto-portfolio.js');
const advisorApi = require('../netlify/functions/crypto-portfolio-advisor.js');

function payload(overrides = {}) {
  return {
    status: 'fresh',
    source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
    fetchedAt: '2026-07-23T10:00:00.000Z',
    sourceUpdatedAt: '2026-07-23T09:58:00.000Z',
    latestSourceUpdatedAt: '2026-07-23T09:59:00.000Z',
    freshnessCeilingMinutes: 30,
    data: [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 100, price_change_percentage_24h_in_currency: 2 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 50, price_change_percentage_24h_in_currency: null },
    ],
    ...overrides,
  };
}

(async () => {
  const now = Date.parse('2026-07-23T10:00:00.000Z');
  const market = engine.normalizeMarket(payload(), now);
  assert.equal(market.ok, true);
  assert.equal(market.receipt.source, 'CoinGecko');
  assert.equal(market.rows.bitcoin.change24h, 2);
  assert.equal(market.rows.ethereum.change24h, null);

  const portfolio = engine.normalizePortfolio({
    version: 1,
    currency: 'NGN',
    lots: [
      { id: 'a', assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', quantity: 2, cost: 120, acquiredOn: '2026-01-01' },
      { id: 'b', assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', quantity: 1, cost: null },
      { id: 'c', assetId: 'ethereum', symbol: 'ETH', name: 'Ethereum', quantity: 2, cost: 80 },
    ],
  }, '2026-07-23');
  const result = engine.calculate(portfolio, market);
  assert.equal(result.ok, true);
  assert.equal(result.totalValue, 400);
  assert.equal(result.knownCost, 200);
  assert.equal(result.knownCostValue, 300);
  assert.equal(result.partialPnl, 100);
  assert.equal(result.costCoverage, 0.75);
  assert.equal(result.assets.find(row => row.assetId === 'bitcoin').averageCost, 60);

  const missing = engine.calculate(engine.normalizePortfolio({
    currency: 'NGN',
    lots: [{ assetId: 'not-listed', symbol: 'NOPE', name: 'Not listed', quantity: 1, cost: 10 }],
  }), market);
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'missing_market_rows');
  assert.deepEqual(missing.missingAssetIds, ['not-listed']);

  assert.equal(engine.normalizeMarket(payload({ status: 'unavailable' }), now).ok, false);
  assert.equal(engine.normalizeMarket(payload({ latestSourceUpdatedAt: '2026-07-23T09:29:59.000Z' }), now).ok, false);
  assert.equal(engine.normalizeMarket(payload({ data: [] }), now).ok, false);

  const futureLot = engine.normalizeLot({
    assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', quantity: 1, cost: 10, acquiredOn: '2027-01-01',
  }, '2026-07-23');
  assert.equal(futureLot.acquiredOn, null);
  assert.equal(engine.normalizeLot({ assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', quantity: -1 }), null);

  const validImport = engine.parseImport(JSON.stringify(portfolio), '2026-07-23');
  assert.equal(validImport.ok, true);
  assert.equal(validImport.portfolio.lots.length, 3);
  assert.equal(engine.parseImport('{"version":1,"currency":"KES","lots":[]}').ok, false);
  assert.equal(engine.parseImport('x'.repeat(engine.MAX_IMPORT_BYTES + 1)).error, 'size');
  assert.equal(engine.csvCell('=HYPERLINK("bad")').startsWith('"\'='), true);

  for (const [handler, error] of [
    [cloudApi.handler, 'cloud_portfolio_retired'],
    [advisorApi.handler, 'crypto_advisor_retired'],
  ]) {
    for (const method of ['GET', 'POST']) {
      const gone = await handler({ httpMethod: method, headers: {}, body: '{}' });
      assert.equal(gone.statusCode, 410);
      assert.equal(gone.headers['Cache-Control'], 'no-store');
      assert.equal(JSON.parse(gone.body).error, error);
      assert.equal(JSON.parse(gone.body).route, '/crypto/portfolio/');
    }
    const options = await handler({ httpMethod: 'OPTIONS', headers: {} });
    assert.equal(options.statusCode, 204);
  }

  console.log('crypto-portfolio-lots: ok');
})();
