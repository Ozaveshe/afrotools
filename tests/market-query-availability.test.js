'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const directory = path.resolve(__dirname, '../netlify/functions');
function stub(name, exports) {
  const id = require.resolve(path.join(directory, name));
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub('_shared/market-data', { SUPABASE_URL: 'https://fixture.invalid', SUPABASE_KEY: 'fixture', cleanText: value => value || '' });
stub('_shared/api-auth', { validateApiKey: async () => ({ tier: 'free' }) });
stub('utils/cors', { getAllowedOrigin: () => 'https://fixture.invalid' });

const endpoints = [
  'backup-power-costs', 'clinic-costs', 'fintech-fees', 'fx-spreads', 'lease-risk',
  'pharmacy-prices', 'remittance-quotes', 'rent-intelligence', 'school-fees',
  'transport-fares', 'wholesale-retail-spreads', 'salary-intelligence', 'staple-baskets'
];
const event = { httpMethod: 'GET', queryStringParameters: { country: 'ke' } };
const ok = rows => Response.json(rows);
function unavailable(response) {
  assert.equal(response.statusCode, 502);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.deepEqual(JSON.parse(response.body), { error: 'Market data lookup unavailable' });
}

test('each market lookup distinguishes a valid empty array from a failed read', async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  for (const name of endpoints) {
    await t.test(name, async () => {
      const handler = require(path.join(directory, 'api-' + name)).handler;
      global.fetch = async () => ok([]);
      const empty = await handler(event);
      assert.equal(empty.statusCode, 200);
      assert.equal(JSON.parse(empty.body).count, 0);
      assert.equal(JSON.parse(empty.body).ok, true);
      assert.match(empty.headers['Cache-Control'], /public/);
      for (const result of [
        () => new Response('[]', { status: 503 }),
        () => new Response('invalid json'),
        () => ok({ error: 'fixture' }),
        () => ok([{}, null]),
        () => { throw new Error('connection closed'); }
      ]) {
        global.fetch = async () => result();
        unavailable(await handler(event));
      }
    });
  }
});

test('basket requires three successful reads, including genuinely empty tables', async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  const handler = require(path.join(directory, 'api-staple-baskets')).handler;
  const groups = { market_basket_snapshots: [{ id: 'example' }], community_prices: [{ product_name: 'fixture' }], market_basket_templates: [] };
  for (const missing of [...Object.keys(groups), null]) {
    global.fetch = async url => {
      const table = new URL(url).pathname.split('/').pop();
      return table === missing ? new Response('', { status: 403 }) : ok(groups[table]);
    };
    const response = await handler(event);
    if (missing) { unavailable(response); continue; }
    const body = JSON.parse(response.body);
    assert.equal(body.count, 1);
    assert.deepEqual(body.snapshots, groups.market_basket_snapshots);
    assert.deepEqual(body.recent_prices, groups.community_prices);
    assert.deepEqual(body.templates, []);
  }
});
