'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const NOW = '2026-10-13T06:00:00.000Z';
const nowMs = Date.parse(NOW);
const maximumAge = require('../netlify/functions/_shared/live-data-contracts')
  .findContract('forex-latest').maxAgeHours * 3600000;
const rates = Object.fromEntries(Object.keys(require('../data/forex/latest.json').rates).map(code => [code, 100]));
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return nowMs; }
}
const stamp = age => new Date(nowMs - age).toISOString();
const snapshot = (source, last_updated, coverage = rates) => ({ source, last_updated, rates: coverage });
const clone = value => JSON.parse(JSON.stringify(value));

function load(options = {}) {
  const file = path.resolve(__dirname, '../netlify/functions/scheduled-fetch-forex-rates.js');
  const nativeRequire = createRequire(file);
  const module = { exports: {} };
  const writes = [], metaPatches = [], calls = [], logs = [];
  const previous = { schemaVersion: 1, base: 'USD', source: 'exchangerate-api',
    timestamp: stamp(maximumAge + 3600000), rates: { NGN: 1500 }, retained_rate_codes: [] };
  const before = clone(previous);
  const meta = { last_fetch: previous.timestamp, source: previous.source, status: 'ok' };
  const context = vm.createContext({
    module, exports: module.exports, Date: Clock, process: { env: options.env || {} },
    require: id => id === './_shared/data-store' ? {
      getData: async () => previous,
      setData: async (key, value) => { writes.push({ key, value: clone(value) }); return true; },
      updateMeta: async (_key, value) => { metaPatches.push(clone(value)); Object.assign(meta, value); }
    } : id === './_shared/scraper-request' ? {
      fetchWithRetry: options.fetchWithRetry || (async () => { throw new Error('Unexpected network access'); })
    } : nativeRequire(id),
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push(args.join(' '))]))
  });
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  function providers(results) {
    for (const [name, result] of Object.entries(results)) {
      context[name] = async () => { calls.push(name); if (result instanceof Error) throw result; return result; };
    }
  }
  return { api: module.exports, context, providers, previous, before, meta, writes, metaPatches, calls, logs };
}
function configure(owner, primary, fallback = snapshot('fawazahmed', stamp(3600000))) {
  owner.providers({
    fetchFromExchangeRateAPI: primary,
    fetchFromFrankfurter: snapshot('frankfurter', stamp(3600000), { EUR: 1 }),
    fetchFromFawazAhmed: fallback
  });
}

test('exact registered 24-hour boundary is accepted without changing observation time or provider priority', async () => {
  const owner = load();
  configure(owner, snapshot('exchangerate-api', stamp(maximumAge)));
  assert.equal((await owner.api.handler()).statusCode, 200);
  assert.equal(owner.writes.length, 1);
  const saved = owner.writes[0].value;
  assert.equal(saved.timestamp, stamp(maximumAge));
  assert.equal(saved.source, 'exchangerate-api');
  assert.equal(saved.rate_observations.NGN.observed_at, stamp(maximumAge));
  assert.equal(owner.calls.includes('fetchFromFrankfurter'), false);
  assert.equal(owner.meta.status, 'ok');
});

for (const [description, observation, reason] of [
  ['one millisecond expired', stamp(maximumAge + 1), 'expired-observation'],
  ['older snapshot', stamp(maximumAge + 86400000), 'expired-observation'],
  ['one millisecond future', stamp(-1), 'future-observation'],
  ['five minutes future', stamp(-300000), 'future-observation'],
  ['missing date', null, 'invalid-observation-date'],
  ['unparseable date', 'not-a-date', 'invalid-observation-date'],
  ['impossible calendar day', '2026-02-30T06:00:00.000Z', 'invalid-observation-date']
]) {
  test(description + ' primary cannot block an eligible fallback', async () => {
    const owner = load();
    configure(owner, snapshot('exchangerate-api', observation));
    assert.equal((await owner.api.handler()).statusCode, 200);
    assert.equal(owner.writes.length, 1);
    assert.equal(owner.writes[0].value.source, 'fawazahmed');
    assert.equal(owner.writes[0].value.timestamp, stamp(3600000));
    assert.ok(owner.logs.some(line => line.includes(reason)));
    assert.equal(owner.meta.last_fetch, stamp(3600000));
    assert.deepEqual(owner.previous, owner.before);
  });
}

test('all stale provider observations retain saved values and provenance and cannot mark collection ok', async () => {
  const owner = load();
  const stale = stamp(maximumAge + 1);
  owner.providers({
    fetchFromExchangeRateAPI: snapshot('exchangerate-api', stale),
    fetchFromFrankfurter: snapshot('frankfurter', stale),
    fetchFromFawazAhmed: snapshot('fawazahmed', stale)
  });
  assert.equal((await owner.api.handler()).statusCode, 500);
  assert.equal(owner.writes.length, 0);
  assert.deepEqual(owner.previous, owner.before);
  assert.equal(owner.meta.status, 'stale');
  assert.equal(owner.meta.last_fetch, owner.before.timestamp);
  assert.equal(owner.meta.source, owner.before.source);
  assert.equal(owner.meta.last_attempt, NOW);
  assert.equal(owner.metaPatches.length, 1);
});

test('provider exception details remain absent from metadata and logs on all-source failure', async () => {
  const owner = load();
  const privateMessage = 'synthetic-provider-key-must-not-appear';
  owner.providers({
    fetchFromExchangeRateAPI: new Error(privateMessage),
    fetchFromFrankfurter: new Error(privateMessage),
    fetchFromFawazAhmed: new Error(privateMessage)
  });
  assert.equal((await owner.api.handler()).statusCode, 500);
  assert.equal(owner.writes.length, 0);
  assert.equal(owner.meta.status, 'stale');
  assert.equal(JSON.stringify({ logs: owner.logs, meta: owner.meta }).includes(privateMessage), false);
});

function providerResponse(observedAt = NOW, providerRates = rates) {
  return new Response(JSON.stringify({ result: 'success', conversion_rates: providerRates,
    time_last_update_utc: observedAt, time_next_update_utc: stamp(-3600000) }));
}
const FREE_URL = 'https://open.er-api.com/v6/latest/USD';
const syntheticKey = 'synthetic-key-not-a-real-credential';

test('keyed quota failure recovers through the same provider free endpoint and stores its original observation', async () => {
  const requests = [];
  const owner = load({
    env: { EXCHANGERATE_API_KEY: syntheticKey },
    fetchWithRetry: async (url, options) => {
      requests.push(url);
      assert.deepEqual(clone(options), { retries: 1, timeoutMs: 5000 });
      if (url.includes('/' + syntheticKey + '/')) return new Response(
        JSON.stringify({ result: 'error', 'error-type': 'quota-reached' }), { status: 429 });
      if (url === FREE_URL) return providerResponse(stamp(3600000));
      return new Response(JSON.stringify({ date: '2026-10-13',
        usd: Object.fromEntries(Object.entries(rates).map(([code, value]) => [code.toLowerCase(), value])) }));
    }
  });
  assert.equal((await owner.api.handler()).statusCode, 200);
  assert.ok(requests[0].includes('/' + syntheticKey + '/'));
  assert.equal(requests[1], FREE_URL);
  assert.equal(requests.some(url => url.includes('frankfurter')), false);
  const saved = owner.writes[0].value;
  assert.equal(saved.source, 'exchangerate-api');
  assert.equal(saved.timestamp, stamp(3600000));
  assert.equal(saved.rate_observations.NGN.source, 'exchangerate-api');
  assert.equal(saved.rate_observations.NGN.observed_at, stamp(3600000));
  assert.equal(saved.rates.NGN, rates.NGN);
  assert.equal(owner.meta.status, 'ok');
  assert.equal(JSON.stringify({ logs: owner.logs, meta: owner.meta }).includes(syntheticKey), false);
});

test('valid keyed provider keeps priority and performs no free-endpoint request', async () => {
  const requests = [];
  const owner = load({ env: { EXCHANGERATE_API_KEY: syntheticKey }, fetchWithRetry: async url => {
    requests.push(url); return providerResponse();
  } });
  assert.equal((await owner.context.fetchFromExchangeRateAPI()).last_updated, NOW);
  assert.equal(requests.length, 1);
  assert.ok(requests[0].includes('/' + syntheticKey + '/'));
});

for (const key of [undefined, 'free']) {
  test('unconfigured or explicit free mode has exactly one provider endpoint path: ' + String(key), async () => {
    const requests = [];
    const owner = load({ env: key === undefined ? {} : { EXCHANGERATE_API_KEY: key },
      fetchWithRetry: async (url, options) => {
        requests.push(url); assert.deepEqual(clone(options), { retries: 1, timeoutMs: 5000 });
        return providerResponse();
      } });
    assert.equal((await owner.context.fetchFromExchangeRateAPI()).source, 'exchangerate-api');
    assert.deepEqual(requests, [FREE_URL]);
  });
}

for (const [label, freeResponse] of [
  ['expired', () => providerResponse(stamp(maximumAge + 1))],
  ['malformed', () => providerResponse('not-a-date')],
  ['future', () => providerResponse(stamp(-1))],
  ['insufficient coverage', () => providerResponse(NOW, { NGN: 100 })]
]) {
  test('keyed failure and ' + label + ' free response allow the next provider', async () => {
    const requests = [];
    const owner = load({ env: { EXCHANGERATE_API_KEY: syntheticKey }, fetchWithRetry: async url => {
      requests.push(url);
      if (url.includes('/' + syntheticKey + '/')) return new Response('{}', { status: 429 });
      if (url === FREE_URL) return freeResponse();
      if (url.includes('frankfurter')) return new Response(JSON.stringify({ date: '2026-10-13', rates }));
      return new Response(JSON.stringify({ date: '2026-10-13',
        usd: Object.fromEntries(Object.entries(rates).map(([code, value]) => [code.toLowerCase(), value])) }));
    } });
    assert.equal((await owner.api.handler()).statusCode, 200);
    assert.equal(requests[1], FREE_URL);
    assert.ok(requests[2].includes('frankfurter'));
    assert.equal(owner.writes[0].value.source, 'frankfurter');
    assert.equal(owner.writes[0].value.timestamp, '2026-10-13T00:00:00.000Z');
    assert.equal(owner.meta.status, 'ok');
  });
}

test('keyed network failure recovers through free without leaking keyed URLs or exception text', async () => {
  const requests = [];
  const owner = load({ env: { EXCHANGERATE_API_KEY: syntheticKey }, fetchWithRetry: async url => {
    requests.push(url);
    if (url !== FREE_URL) throw new Error('private request URL ' + url);
    return providerResponse();
  } });
  assert.equal((await owner.context.fetchFromExchangeRateAPI()).last_updated, NOW);
  assert.equal(requests.length, 2);
  assert.equal(owner.logs.join(' ').includes(syntheticKey), false);
});
test('all ExchangeRate endpoints fail with a fixed error and no raw provider response detail', async () => {
  const owner = load({ env: { EXCHANGERATE_API_KEY: syntheticKey }, fetchWithRetry: async () =>
    new Response(JSON.stringify({ result: 'error', 'error-type': syntheticKey })) });
  await assert.rejects(owner.context.fetchFromExchangeRateAPI(), error => {
    assert.equal(error.message, 'ExchangeRate-API: no current valid snapshot');
    assert.equal(error.message.includes(syntheticKey), false); return true;
  });
  assert.equal(owner.logs.join(' ').includes(syntheticKey), false);
});
