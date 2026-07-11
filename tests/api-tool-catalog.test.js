const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const contract = require('../data/api-public-contract.json');
const source = require('../data/api-tool-catalog.v1.json');
const publicDirectory = require('../data/tool-directory.json');
const catalogModule = require('../netlify/functions/_shared/tool-catalog.js');
const serviceAuth = require('../netlify/functions/_shared/salarypadi-service-auth.js');
const catalogApi = require('../netlify/functions/api-tool-catalog.js');

function event(pathname, options = {}) {
  return {
    httpMethod: options.method || 'GET',
    path: pathname,
    headers: {
      origin: 'https://salarypadi.com',
      'x-api-key': options.key === undefined ? 'salarypadi-test-service-key' : options.key,
      ...(options.headers || {}),
    },
    queryStringParameters: options.query || {},
  };
}

function validLink(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    id: 'test-link',
    name: 'Test link',
    description: 'A tested link record.',
    category: 'career',
    published: true,
    priority: 1,
    integrationMode: 'link',
    canonicalUrl: 'https://afrotools.com/tools/test-link/',
    countries: ['ALL'],
    api: null,
    widget: null,
    inputSchema: null,
    outputSchema: null,
    rulesVersion: null,
    lastVerified: '2026-07-11',
    disclaimer: 'Link integration only.',
    attribution: { required: true, text: 'Tool by AfroTools', url: 'https://afrotools.com' },
    ...overrides,
  };
}

(async () => {
  const previous = {
    key: process.env.SALARYPADI_API_KEY,
    limit: process.env.SALARYPADI_API_DAILY_LIMIT,
    scopes: process.env.SALARYPADI_API_SCOPES,
    netlify: process.env.NETLIFY,
  };
  process.env.SALARYPADI_API_KEY = 'salarypadi-test-service-key';
  process.env.SALARYPADI_API_DAILY_LIMIT = '100';
  delete process.env.SALARYPADI_API_SCOPES;

  try {
    const catalog = catalogModule.salaryPadiCatalog();
    assert.strictEqual(catalog.schemaVersion, '1.0.0');
    assert.strictEqual(catalog.count, 15);
    assert.strictEqual(catalog.tools.filter(tool => tool.integrationMode === 'api').length, 2);
    assert.strictEqual(catalog.tools.filter(tool => tool.integrationMode === 'widget').length, 0);
    assert.ok(catalog.tools.filter(tool => tool.integrationMode === 'link').every(tool => (
      tool.api === null && tool.widget === null && tool.inputSchema === null && tool.outputSchema === null
    )));
    assert.deepStrictEqual(
      catalog.tools.filter(tool => tool.integrationMode === 'api').map(tool => tool.id).sort(),
      ['currency-converter', 'ng-paye'],
    );
    const publicById = new Map(publicDirectory.map(tool => [tool.id, tool]));
    const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
    for (const tool of catalog.tools) {
      assert.strictEqual(publicById.get(tool.id)?.status, 'Live', `Catalog tool is not live in the public registry: ${tool.id}`);
      const pathname = new URL(tool.canonicalUrl).pathname.replace(/^\//, '').replace(/\/$/, '');
      const candidates = [
        path.join(ROOT, pathname, 'index.html'),
        path.join(ROOT, pathname + '.html'),
        path.join(ROOT, pathname),
      ];
      assert.ok(candidates.some(candidate => fs.existsSync(candidate)), `Canonical route has no source file: ${tool.canonicalUrl}`);
      if (tool.api) assert.ok(redirects.includes(tool.api.path), `Missing API route mapping: ${tool.api.path}`);
    }

    const unpublished = catalogModule.buildCatalog([validLink({ published: false })]);
    assert.deepStrictEqual(unpublished, []);
    assert.throws(
      () => catalogModule.buildCatalog([validLink({ integrationMode: 'api' })]),
      /Invalid tool catalog metadata/,
    );
    assert.throws(
      () => catalogModule.buildCatalog([validLink(), validLink()]),
      /duplicate id/,
    );
    assert.throws(
      () => catalogModule.validateSupportingApi({ id: 'countries', method: 'GET', path: '/api/v1/countries' }),
      /supporting API schemas/,
    );

    for (const tool of catalog.tools.filter(item => item.integrationMode === 'api')) {
      for (const reference of [tool.inputSchema, tool.outputSchema]) {
        const relative = new URL(reference).pathname.replace(/^\//, '');
        assert.ok(fs.existsSync(path.join(ROOT, relative)), `Missing schema ${relative}`);
      }
    }
    for (const file of fs.readdirSync(path.join(ROOT, 'api/schemas/v1'))) {
      assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(ROOT, 'api/schemas/v1', file), 'utf8')));
    }
    const sensitiveHandlers = [
      'netlify/functions/api-tax.js',
      'netlify/functions/api-fx-rates.js',
      'netlify/functions/api-career.mjs',
      'netlify/functions/api-tool-catalog.js',
    ].map(file => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
    assert.ok(
      !/console\.(?:log|warn|error)\([^\n]*(?:grossAnnual|grossMonthly|netAnnual|netMonthly|salary|result|event\.body)/i.test(sensitiveHandlers),
      'Salary inputs or results must not be logged',
    );
    const browserFacing = [
      fs.readFileSync(path.join(ROOT, 'api/docs/index.html'), 'utf8'),
      fs.readFileSync(path.join(ROOT, 'api/index.html'), 'utf8'),
    ].join('\n');
    assert.ok(!browserFacing.includes('salarypadi-test-service-key'));

    const missingKey = await catalogApi.handler(event('/api/v1/catalog/tools', {
      key: '',
      query: { product: 'salarypadi', category: 'career' },
    }));
    assert.strictEqual(missingKey.statusCode, 401);

    const response = await catalogApi.handler(event('/api/v1/catalog/tools', {
      query: { product: 'salarypadi', category: 'career' },
    }));
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers['Access-Control-Allow-Origin'], 'https://salarypadi.com');
    assert.match(response.headers['Cache-Control'], /private/);
    assert.match(response.headers.ETag, /^"sha256-/);
    assert.strictEqual(response.headers['X-AfroTools-Catalog-ETag'], response.headers.ETag);
    assert.match(response.headers['Access-Control-Expose-Headers'], /X-AfroTools-Catalog-ETag/);
    assert.strictEqual(response.headers['X-RateLimit-Scope'], 'service:salarypadi');
    assert.strictEqual(JSON.parse(response.body).count, 15);
    assert.ok(!response.body.includes('salarypadi-test-service-key'));

    const notModified = await catalogApi.handler(event('/api/v1/catalog/tools', {
      query: { product: 'salarypadi', category: 'career' },
      headers: { 'if-none-match': response.headers.ETag },
    }));
    assert.strictEqual(notModified.statusCode, 304);
    assert.strictEqual(notModified.body, '');
    assert.strictEqual(notModified.headers.ETag, response.headers.ETag);
    assert.strictEqual(notModified.headers['X-AfroTools-Catalog-ETag'], response.headers.ETag);

    const unsupported = await catalogApi.handler(event('/api/v1/catalog/tools', {
      query: { product: 'other', category: 'career' },
    }));
    assert.strictEqual(unsupported.statusCode, 400);
    assert.strictEqual(JSON.parse(unsupported.body).code, 'UNSUPPORTED_CATALOG_QUERY');

    const health = await catalogApi.handler(event('/api/v1/catalog/health'));
    assert.strictEqual(health.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(health.body), {
      status: 'operational',
      schemaVersion: '1.0.0',
      product: 'salarypadi',
      category: 'career',
      publishedToolCount: 15,
      lastVerified: '2026-07-11',
    });

    const cachePath = require.resolve('../netlify/functions/_lib/cache.js');
    const fxPath = require.resolve('../netlify/functions/api-fx-rates.js');
    const originalCacheModule = require.cache[cachePath];
    require.cache[cachePath] = {
      id: cachePath,
      filename: cachePath,
      loaded: true,
      exports: {
        getOrFetch: async () => ({
          fromCache: true,
          data: {
            base: 'USD',
            rates: { NGN: 1500, KES: 130 },
            source: 'Synthetic contract fixture',
            timestamp: '2026-07-11T00:00:00.000Z',
          },
        }),
        cacheHeaders: (_options, _fromCache, base) => ({ ...base, 'Cache-Control': 'public, max-age=300' }),
      },
    };
    delete require.cache[fxPath];
    const fxApi = require(fxPath);
    const fxResponse = await fxApi.handler(event('/api/v1/fx/rates', {
      query: { base: 'USD', target: 'NGN', amount: '1' },
    }));
    assert.strictEqual(fxResponse.statusCode, 200);
    assert.strictEqual(JSON.parse(fxResponse.body).rate, 1500);
    assert.strictEqual(fxResponse.headers['X-RateLimit-Scope'], 'service:salarypadi');
    delete require.cache[fxPath];
    if (originalCacheModule) require.cache[cachePath] = originalCacheModule;
    else delete require.cache[cachePath];

    const countriesApi = require('../netlify/functions/api-countries.js');
    const countriesResponse = await countriesApi.handler(event('/api/v1/countries', {
      query: { code: 'NG' },
    }));
    assert.strictEqual(countriesResponse.statusCode, 200);
    assert.strictEqual(JSON.parse(countriesResponse.body).currency, 'NGN');
    assert.strictEqual(countriesResponse.headers['X-RateLimit-Scope'], 'service:salarypadi');

    const quota = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools'),
      'catalog:tools',
      { checkRateLimit: () => false, getRemaining: () => 0 },
    );
    assert.strictEqual(quota.status, 429);
    assert.strictEqual(quota.remaining, 0);

    process.env.SALARYPADI_API_DAILY_LIMIT = '1';
    let storedQuota = null;
    let injectedStoreConnectCalls = 0;
    const quotaStore = {
      get: async () => storedQuota,
      setJSON: async (_key, value) => { storedQuota = value; },
    };
    const firstStoredQuota = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools'),
      'catalog:tools',
      { store: quotaStore, connectLambda: () => { injectedStoreConnectCalls += 1; } },
    );
    const exhaustedStoredQuota = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools'),
      'catalog:tools',
      { store: quotaStore, connectLambda: () => { injectedStoreConnectCalls += 1; } },
    );
    assert.strictEqual(firstStoredQuota.valid, true);
    assert.strictEqual(firstStoredQuota.remaining, 0);
    assert.strictEqual(exhaustedStoredQuota.status, 429);
    assert.strictEqual(injectedStoreConnectCalls, 0, 'Injected stores must not initialize Netlify Blobs');
    process.env.SALARYPADI_API_DAILY_LIMIT = '100';

    let connectedEvent = null;
    let storeFactoryCalls = 0;
    let factoryStoredQuota = null;
    const factoryEvent = event('/api/v1/catalog/tools');
    const factoryQuota = await serviceAuth.authenticateSalaryPadiServiceKey(
      factoryEvent,
      'catalog:tools',
      {
        connectLambda: receivedEvent => { connectedEvent = receivedEvent; },
        getStore: options => {
          storeFactoryCalls += 1;
          assert.deepStrictEqual(options, { name: 'api-service-usage', consistency: 'strong' });
          return {
            get: async () => factoryStoredQuota,
            setJSON: async (_key, value) => { factoryStoredQuota = value; },
          };
        },
      },
    );
    assert.strictEqual(factoryQuota.valid, true);
    assert.strictEqual(connectedEvent, factoryEvent, 'connectLambda must receive the actual request event');
    assert.strictEqual(storeFactoryCalls, 1, 'Netlify Blobs must be initialized once before creating the store');
    assert.strictEqual(factoryStoredQuota.count, 1);

    process.env.NETLIFY = 'true';
    let unavailableStoreCalls = 0;
    const unavailableQuota = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools'),
      'catalog:tools',
      {
        connectLambda: () => { throw new Error('Invalid Netlify Blobs context'); },
        getStore: () => { unavailableStoreCalls += 1; return quotaStore; },
      },
    );
    assert.strictEqual(unavailableQuota.valid, false);
    assert.strictEqual(unavailableQuota.status, 503);
    assert.strictEqual(unavailableStoreCalls, 0, 'Store creation must not continue after context initialization fails');

    const unavailableResponse = await catalogApi.handler(event('/api/v1/catalog/tools', {
      query: { product: 'salarypadi', category: 'career' },
    }));
    assert.strictEqual(unavailableResponse.statusCode, 503);
    assert.strictEqual(JSON.parse(unavailableResponse.body).code, 'SERVICE_QUOTA_UNAVAILABLE');
    assert.ok(!unavailableResponse.body.includes('"tools"'), 'Failed quota verification must not authorize catalog access');

    let invalidKeyConnectCalls = 0;
    const invalidKey = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools', { key: 'not-the-service-key' }),
      'catalog:tools',
      {
        connectLambda: () => { invalidKeyConnectCalls += 1; },
        getStore: () => quotaStore,
      },
    );
    assert.strictEqual(invalidKey, null);
    assert.strictEqual(invalidKeyConnectCalls, 0, 'Invalid credentials must not initialize quota storage');
    if (previous.netlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = previous.netlify;

    process.env.SALARYPADI_API_SCOPES = 'tax:paye';
    const denied = await serviceAuth.authenticateSalaryPadiServiceKey(
      event('/api/v1/catalog/tools'),
      'catalog:tools',
      { checkRateLimit: () => true, getRemaining: () => 99 },
    );
    assert.strictEqual(denied.status, 403);
    delete process.env.SALARYPADI_API_SCOPES;

    const existingPaths = [
      '/v1/tax/paye',
      '/v1/tax/rates',
      '/v1/fx/rates',
      '/v1/countries',
      '/v1/career/offer-compare',
      '/v1/career/job-scam-check',
    ];
    for (const existingPath of existingPaths) {
      assert.ok(contract.endpoints.some(endpoint => endpoint.path === existingPath), `Missing backward-compatible endpoint ${existingPath}`);
    }
    assert.strictEqual(source.schemaVersion, '1.0.0');
    console.log('SalaryPadi tool catalog contract tests passed.');
  } finally {
    if (previous.key === undefined) delete process.env.SALARYPADI_API_KEY;
    else process.env.SALARYPADI_API_KEY = previous.key;
    if (previous.limit === undefined) delete process.env.SALARYPADI_API_DAILY_LIMIT;
    else process.env.SALARYPADI_API_DAILY_LIMIT = previous.limit;
    if (previous.scopes === undefined) delete process.env.SALARYPADI_API_SCOPES;
    else process.env.SALARYPADI_API_SCOPES = previous.scopes;
    if (previous.netlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = previous.netlify;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
