'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const ID = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const ORIGIN = 'https://zpclagtgczsygrgztlts.supabase.co';
const KEY = 'synthetic-service-key';
const approved = () => [{ id: ID, is_published: true, is_verified: true }];
const response = (data, ok = true) => ({ ok, status: ok ? 200 : 500,
  json: async () => data, text: async () => JSON.stringify(data) });
const plain = value => JSON.parse(JSON.stringify(value));

// All function dependencies and transport are local synthetic substitutes.
// Requiring a function must never resolve installed Netlify clients or use env secrets.
function fixture({ parent = approved(), transport, blobFailure = false, env = {} } = {}) {
  const calls = [], logs = [], signals = [], timers = new Map();
  let nextTimer = 0;
  const blobs = {
    list: async opts => { calls.push({ type: 'blob-list', opts }); if (blobFailure) throw Error(KEY); return { blobs: [] }; },
    get: async key => { calls.push({ type: 'blob-get', key }); return null; },
    setJSON: async (key, data) => { calls.push({ type: 'blob-write', key, data }); }
  };
  const sandbox = {
    Buffer, URL, AbortController,
    process: { env: { SUPABASE_AUTH_URL: ORIGIN, SUPABASE_AUTH_SERVICE_KEY: KEY, ...env } },
    console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    setTimeout: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: async (url, options = {}) => {
      const call = { type: 'fetch', url, options }; calls.push(call);
      if (url.includes('/rest/v1/recipes?')) {
        signals.push(options.signal);
        if (typeof parent === 'function') return parent(call);
        return response(parent);
      }
      if (transport) return transport(call);
      if (url.includes('/recipe_reviews?')) return response([]);
      if (url.endsWith('/recipe_reviews')) return response([{ id: OTHER }]);
      if (url.includes('/recipe_ingredients?')) return response([]);
      if (url.includes('/storage/v1/')) return response({});
      throw Error('Unexpected synthetic request');
    }
  };
  const context = vm.createContext(sandbox), modules = new Map();
  function load(relative) {
    const filename = path.join(ROOT, relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} }; modules.set(filename, module);
    const requireMock = name => {
      if (name === './_shared/rate-limit') return load('netlify/functions/_shared/rate-limit.js');
      if (name === 'crypto') return { randomUUID: () => OTHER };
      if (name === '@netlify/blobs') return { getStore: name => { calls.push({ type: 'blob-store', name }); return blobs; } };
      if (name === './_shared/afrokitchen-publication') return load('netlify/functions/_shared/afrokitchen-publication.js');
      throw Error('Unmocked dependency: ' + name);
    };
    const wrap = vm.runInContext('(function(require,module,exports){' + fs.readFileSync(filename, 'utf8') + '\n})', context, { filename });
    wrap(requireMock, module, module.exports);
    return module.exports;
  }
  return { load, calls, logs, signals, timers,
    timeout() { const pending = [...timers.values()]; assert.equal(pending.length, 1); assert.equal(pending[0].ms, 8000); pending[0].fn(); } };
}

const costsEvent = extra => ({ httpMethod: 'GET', headers: { origin: 'https://afrotools.com' },
  queryStringParameters: { recipe_id: ID, country: 'ng' }, ...extra });
const communityEvent = (method = 'GET', body) => ({ httpMethod: method, headers: { origin: 'https://afrotools.com' },
  queryStringParameters: { recipeId: ID, limit: '99' }, body: body === undefined ? undefined : JSON.stringify({ recipeId: ID, ...body }) });
const flows = [
  ['costs', 'netlify/functions/afrokitchen-costs.js', () => costsEvent()],
  ['community GET', 'netlify/functions/afrokitchen-community.js', () => communityEvent()],
  ['review POST', 'netlify/functions/afrokitchen-community.js', () => communityEvent('POST', { action: 'review', rating: 4 })],
  ['cooksnap POST', 'netlify/functions/afrokitchen-community.js', () => communityEvent('POST', { action: 'cooksnap', photoDataUrl: 'data:image/webp;base64,AA==' })]
];

for (const [name, file, event] of flows) {
  test(`${name}: absent/ineligible parent returns generic404 before every downstream dependency`, async () => {
    const f = fixture({ parent: [] });
    const r = await f.load(file).handler(event());
    assert.equal(r.statusCode, 404); assert.deepEqual(JSON.parse(r.body), { error: 'Recipe not found' });
    assert.equal(f.calls.length, 1); assert.ok(f.calls[0].url.includes('/rest/v1/recipes?'));
    assert.equal(f.signals[0].aborted, true); assert.equal(f.timers.size, 0);
  });
  for (const [label, parent] of [
    ['HTTP failure', () => response({ error: KEY }, false)],
    ['transport failure', () => { throw Error(ORIGIN + '?access_key=' + KEY); }],
    ['malformed JSON', () => ({ ok: true, json: async () => { throw Error(KEY); } })],
    ['wrong shape', {}], ['duplicate approval', [...approved(), ...approved()]],
    ['wrong UUID', [{ ...approved()[0], id: OTHER }]],
    ['false publication', [{ ...approved()[0], is_published: false }]],
    ['unknown verification', [{ ...approved()[0], is_verified: null }]]
  ]) test(`${name}: ${label} returns503 with no child/review/blob/write or leaked dependency error`, async () => {
    const f = fixture({ parent }); const r = await f.load(file).handler(event());
    assert.equal(r.statusCode, 503); assert.equal(f.calls.length, 1);
    assert.equal(JSON.parse(r.body).error, 'Recipe availability could not be checked');
    assert.ok(!r.body.includes(KEY)); assert.ok(!JSON.stringify(f.logs).includes(KEY));
    assert.equal(f.signals[0].aborted, true); assert.equal(f.timers.size, 0);
  });
}

test('eligible costs preserve lowercase-country normalization, ingredient filtering and array response', async () => {
  const prices = [{ ingredient_id: OTHER, country_code: 'NG', price: 10 }];
  const f = fixture({ transport: async call => call.url.includes('/recipe_ingredients?')
    ? response([{ ingredient_id: OTHER }, { ingredient_id: null }, { ingredient_id: 'invalid' }]) : response(prices) });
  const r = await f.load('netlify/functions/afrokitchen-costs.js').handler(costsEvent());
  assert.equal(r.statusCode, 200); assert.deepEqual(JSON.parse(r.body), prices);
  assert.equal(f.calls.length, 3); assert.ok(f.calls[2].url.includes('country_code=eq.NG'));
  assert.ok(f.calls[2].url.includes(OTHER)); assert.ok(!f.calls[2].url.includes('invalid'));
  assert.equal(r.headers['Access-Control-Allow-Origin'], 'https://afrotools.com');
  const u = new URL(f.calls[0].url); assert.equal(u.origin, ORIGIN);
  assert.equal(u.searchParams.get('id'), 'eq.' + ID); assert.equal(u.searchParams.get('is_published'), 'eq.true');
  assert.equal(u.searchParams.get('is_verified'), 'eq.true'); assert.equal(u.searchParams.get('select'), 'id,is_published,is_verified');
});
test('eligible costs and community retain genuine empty200 contracts', async () => {
  const f = fixture(); const c = await f.load('netlify/functions/afrokitchen-costs.js').handler(costsEvent());
  assert.equal(c.statusCode, 200); assert.deepEqual(JSON.parse(c.body), []);
  const b = await f.load('netlify/functions/afrokitchen-community.js').handler(communityEvent());
  assert.equal(b.statusCode, 200); assert.deepEqual(JSON.parse(b.body), { success: true, data: { reviews: [], cooksnaps: [], reviewCount: 0, averageRating: null } });
  assert.ok(f.calls.find(c => c.type === 'fetch' && c.url.includes('limit=20')));
});
test('eligible review keeps sanitizers, country normalization, creation response and one write', async () => {
  const f = fixture(); const r = await f.load('netlify/functions/afrokitchen-community.js').handler(communityEvent('POST', {
    action: 'review', rating: 4, authorName: '<b>A cook</b>', comment: ' one\n two ', countryCode: 'ng', modifications: ' less salt '
  }));
  assert.equal(r.statusCode, 201); assert.deepEqual(JSON.parse(r.body), { success: true, data: { id: OTHER } });
  assert.equal(f.calls.length, 2); const write = f.calls[1]; assert.equal(write.options.method, 'POST');
  assert.deepEqual(JSON.parse(write.options.body), { recipe_id: ID, rating: 4, comment: 'one two', author_name: 'A cook', country_code: 'NG', modifications: 'less salt' });
});
test('eligible cooksnap keeps WebP upload/no-upsert and blob metadata after parent approval', async () => {
  const f = fixture(); const r = await f.load('netlify/functions/afrokitchen-community.js').handler(communityEvent('POST', {
    action: 'cooksnap', photoDataUrl: 'data:image/webp;base64,AA==', photoName: '../My dish', authorName: '<b>A cook</b>', note: ' hello\n world '
  }));
  assert.equal(r.statusCode, 201); const data = JSON.parse(r.body).data;
  assert.equal(data.recipeId, ID); assert.equal(data.authorName, 'A cook'); assert.equal(data.note, 'hello world');
  const upload = f.calls.find(c => c.type === 'fetch' && c.url.includes('/storage/v1/'));
  assert.equal(upload.options.headers['Content-Type'], 'image/webp'); assert.equal(upload.options.headers['x-upsert'], 'false');
  assert.ok(upload.url.includes('-my-dish.webp')); assert.equal(f.calls.filter(c => c.type === 'blob-write').length, 1);
  assert.equal(f.calls[0].type, 'fetch'); assert.ok(f.calls[0].url.includes('/rest/v1/recipes?'));
});
test('malformed input, upload type/size, unsupported methods/action and OPTIONS preserve local validation without transport', async () => {
  for (const [file, event, status] of [
    ['afrokitchen-costs', costsEvent({ queryStringParameters: { recipe_id: '-'.repeat(36), country: 'NG' } }), 400],
    ['afrokitchen-costs', costsEvent({ queryStringParameters: { recipe_id: ID, country: 'invalid' } }), 400],
    ['afrokitchen-costs', costsEvent({ httpMethod: 'OPTIONS' }), 204],
    ['afrokitchen-community', communityEvent('OPTIONS'), 204],
    ['afrokitchen-community', communityEvent('DELETE'), 405],
    ['afrokitchen-community', communityEvent('POST', { action: 'unknown' }), 400],
    ['afrokitchen-community', communityEvent('POST', { action: 'cooksnap', photoDataUrl: 'data:image/png;base64,AA==' }), 400],
    ['afrokitchen-community', communityEvent('POST', { action: 'cooksnap', photoDataUrl: 'data:image/webp;base64,' + 'A'.repeat(10_000_000) }), 400]
  ]) {
    const f = fixture(); assert.equal((await f.load('netlify/functions/' + file + '.js').handler(event)).statusCode, status);
    assert.equal(f.calls.length, 0);
  }
});
test('downstream failures do not leak key-bearing errors and are never automatically retried', async () => {
  for (const [name, file, event] of flows) {
    const f = fixture({ transport: async () => { throw Error('https://example.test/?access_key=' + KEY); } });
    const r = await f.load(file).handler(event()); assert.equal(r.statusCode, 500, name);
    assert.ok(!r.body.includes(KEY)); assert.ok(!JSON.stringify(f.logs).includes(KEY));
    assert.equal(f.calls.filter(c => c.type === 'fetch').length, 2);
  }
  const f = fixture({ blobFailure: true });
  const r = await f.load('netlify/functions/afrokitchen-community.js').handler(communityEvent());
  assert.equal(r.statusCode, 200); assert.ok(!JSON.stringify(f.logs).includes(KEY));
});
test('parent lookup has one8s header/body budget, aborts and permits an explicit subsequent request', async () => {
  for (const stage of ['headers', 'body']) {
    const f = fixture({ parent: () => stage === 'headers' ? new Promise(() => {}) : { ok: true, json: () => new Promise(() => {}) } });
    const handler = f.load('netlify/functions/afrokitchen-costs.js').handler;
    const pending = handler(costsEvent()); await new Promise(resolve => setImmediate(resolve));
    f.timeout(); const r = await pending; assert.equal(r.statusCode, 503);
    assert.equal(f.calls.length, 1); assert.equal(f.signals[0].aborted, true); assert.equal(f.timers.size, 0);
    const next = handler(costsEvent()); await new Promise(resolve => setImmediate(resolve)); f.timeout();
    assert.equal((await next).statusCode, 503); assert.equal(f.calls.length, 2);
  }
});
test('an unexpected configured project fails closed before sending any credential', async () => {
  const f = fixture({ env: { SUPABASE_AUTH_URL: 'https://other-project.supabase.co' } });
  const r = await f.load('netlify/functions/afrokitchen-costs.js').handler(costsEvent());
  assert.equal(r.statusCode, 503); assert.equal(f.calls.length, 0);
});
