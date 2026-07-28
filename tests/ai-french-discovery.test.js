'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const router = require('../assets/js/ai/intent-router');
const routeMap = require('../assets/js/ai/french-route-map.generated');
const manifestApi = require('../assets/js/ai/tool-manifest');
const api = require('../netlify/functions/ai-route-intent');

const ROOT = path.resolve(__dirname, '..');
const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ai/french-intent-eval.json'), 'utf8'));
const manifest = manifestApi.getToolManifestForRouter();

function routeExists(route) {
  const pathname = String(route).split(/[?#]/)[0].replace(/^\/+/, '');
  return [
    path.join(ROOT, pathname, 'index.html'),
    path.join(ROOT, `${pathname.replace(/\/$/, '')}.html`),
    path.join(ROOT, pathname),
  ].some((candidate) => fs.existsSync(candidate));
}

test('French route map reports bounded canonical coverage', () => {
  assert.equal(routeMap.locale, 'fr');
  assert.equal(routeMap.source, 'data/registry/locale-page-coverage.json');
  assert.equal(routeMap.report.manifestRecords, manifest.length);
  assert(routeMap.report.mappedManifestRecords > 100, 'French AI route coverage unexpectedly small');
  assert(routeMap.report.mappedManifestRecords < routeMap.report.manifestRecords, 'must not claim full French AI route parity');
  assert.equal(routeMap.report.ambiguousRoutes, 5, 'ambiguous source mappings must remain visible and omitted');
  assert.equal(routeMap.routes['/search/'], '/fr/search/');

  for (const [englishRoute, frenchRoute] of Object.entries(routeMap.routes)) {
    assert(englishRoute.startsWith('/') && frenchRoute.startsWith('/fr/'));
    assert(routeExists(frenchRoute), `missing French route: ${frenchRoute}`);
  }
});

test('focused French intent corpus routes only to verified French surfaces', () => {
  assert.equal(corpus.locale, 'fr');
  assert.deepEqual([...new Set(corpus.cases.map((item) => item.category))].sort(), [
    'agriculture',
    'health',
    'pdf',
    'salary',
    'trade',
    'vat',
  ]);

  for (const item of corpus.cases) {
    const decision = router.routeDeterministically(item.query, { manifest, locale: 'fr' });
    const validation = router.validateRouterOutput(decision);
    assert.deepEqual(validation.errors, [], item.query);
    assert.equal(decision.selectedToolId, item.expectedToolId, item.query);
    assert.equal(decision.selectedRoute, item.expectedRoute, item.query);
    assert.equal(decision._meta.providerUsed, false, item.query);
    assert.equal(decision._meta.localeRoute.status, 'mapped', item.query);
    assert(routeExists(decision.selectedRoute), item.query);

    const contextPath = path.join(ROOT, 'data/ai/tool-context', `${item.expectedToolId}.json`);
    if (item.contextPolicy === 'tool-context') {
      assert(fs.existsSync(contextPath), `${item.expectedToolId} must have a deterministic context owner`);
    } else {
      assert.equal(item.contextPolicy, 'route-only', `${item.expectedToolId} has an unknown context policy`);
    }
  }
});

test('French routing fails closed when no verified localized equivalent exists', () => {
  const fakeManifest = manifest.map((tool) => (
    tool.id === 'paye-calculator'
      ? Object.assign({}, tool, { route: '/tools/unmapped-french-test/' })
      : tool
  ));
  const decision = router.routeDeterministically('Calculer mon salaire net', { manifest: fakeManifest, locale: 'fr' });

  assert.equal(decision.selectedToolId, 'tool-search');
  assert.equal(decision.selectedRoute, '/fr/search/?source=ask');
  assert.equal(decision.canPrefill, false);
  assert.equal(decision._meta.localeRoute.status, 'unavailable');
  assert.equal(decision._meta.localeRoute.requestedToolId, 'paye-calculator');
  assert.deepEqual(router.validateRouterOutput(decision).errors, []);
});

test('English routing remains on the canonical English route', () => {
  const decision = router.routeDeterministically('Calculate VAT for an invoice', { manifest, locale: 'en' });
  assert.equal(decision.selectedToolId, 'vat-calc-pan-african');
  assert.equal(decision.selectedRoute, '/tools/vat-calculator/?source=ask');
  assert.equal(decision._meta.localeRoute, undefined);
});

test('AI route endpoint preserves the French deterministic destination', async () => {
  const response = await api.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://afrotools.com',
      'x-forwarded-for': '203.0.113.247',
    },
    body: JSON.stringify({
      query: 'Fusionner deux PDF sans les téléverser',
      locale: 'fr',
    }),
  });
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.decision.selectedToolId, 'pdf-workspace');
  assert.equal(payload.decision.selectedRoute, '/fr/tools/espace-pdf/?source=ask');
  assert.equal(payload.decision._meta.localeRoute.status, 'mapped');
});
