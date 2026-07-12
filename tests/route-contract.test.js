const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const routeApi = require('../scripts/lib/route-contract');
const localeResolver = require('../assets/js/lib/locale-route-resolver');

function issueCodes(result) {
  return new Set(result.errors.map((issue) => issue.code));
}

const graph = routeApi.buildRouteGraph();
const validation = routeApi.validateRouteGraph(graph, { checkArtifacts: true });
assert.strictEqual(validation.ok, true, validation.errors.slice(0, 50).map(routeApi.formatIssue).join('\n'));

assert.ok(graph.routes.length >= 10000, 'AC-1: graph must document every public page and routing rule');
const routeIds = new Set();
for (const record of graph.routes) {
  assert.ok(record.id && !routeIds.has(record.id), `AC-1: duplicate or missing route ID ${record.id}`);
  routeIds.add(record.id);
  [
    'route', 'normalizedRoute', 'state', 'canonicalRoute', 'locale', 'pageType',
    'indexability', 'sitemap', 'equivalenceGroup', 'fallback', 'deprecated', 'source'
  ].forEach((field) => assert.ok(Object.prototype.hasOwnProperty.call(record, field), `${record.id} missing ${field}`));
  assert.ok(record.source && record.source.owner, `${record.id} missing source owner`);
}

const expectedMigrations = {
  '/all-tools/': '/tools/',
  '/terms-of-use': '/terms/',
  '/terms-of-use.html': '/terms/',
  '/fr/tools/': '/fr/all-tools/'
};
for (const [source, target] of Object.entries(expectedMigrations)) {
  const resolved = routeApi.resolveFinalRoute(graph, source);
  assert.strictEqual(resolved.finalRoute, target, `AC-2: ${source} must resolve to ${target}`);
  assert.strictEqual(resolved.hops, 1, `AC-2: ${source} must resolve in one hop`);
  assert.strictEqual(resolved.statusCode, 301, `AC-2: ${source} must be permanent`);
  assert.ok(resolved.deprecated, `AC-2: ${source} must remain documented as deprecated`);
}

const redirects = graph.routes.filter((record) => record.state === 'redirect');
assert.ok(redirects.length > 0, 'AC-3: redirect graph must not be empty');
assert.strictEqual(routeApi.validateRedirectGraph(redirects).errors.length, 0, 'AC-3: redirects must be direct and acyclic');

const indexablePages = graph.routes.filter((record) => record.state === 'page' && record.indexability === 'indexable');
assert.ok(indexablePages.length > 0, 'AC-4: indexable page set must not be empty');
for (const page of indexablePages) {
  assert.strictEqual(page.canonicalTags.length, 1, `AC-4: ${page.route} must have one canonical`);
  assert.strictEqual(page.canonicalRoute, page.route, `AC-4: ${page.route} must self-canonicalize`);
  assert.strictEqual(page.canonicalRoute, page.canonicalRoute.toLowerCase(), `AC-4: ${page.route} canonical must be lowercase`);
  assert.ok(!/[?#]/.test(page.canonicalRoute), `AC-4: ${page.route} canonical must not contain query or fragment`);
}

const equivalenceValidation = routeApi.validateEquivalenceGroups(graph.equivalenceGroups, graph.routes);
assert.strictEqual(equivalenceValidation.errors.length, 0, `AC-5: invalid equivalence groups:\n${equivalenceValidation.errors.slice(0, 25).map(routeApi.formatIssue).join('\n')}`);
for (const group of graph.equivalenceGroups) {
  assert.ok(group.xDefault, `AC-5: ${group.id} must declare x-default`);
}

const fallback = routeApi.getLocaleDestination(graph, '/afrowork/', 'fr');
assert.ok(['english-fallback', 'locale-home'].includes(fallback.relationship), 'AC-6: missing native route must use an explicit fallback');
assert.ok(fallback.label && /fallback|accueil|home|anglais|english/i.test(fallback.label), 'AC-6: fallback must have a visible label');
assert.strictEqual(fallback.advertisedAsEquivalent, false, 'AC-6: fallback must not be advertised as native');

const sitemapEntries = routeApi.loadSitemapEntries();
assert.strictEqual(routeApi.validateSitemapEntries(sitemapEntries, graph.routes).errors.length, 0, 'AC-7: sitemap entries must be canonical and indexable');

assert.strictEqual(
  routeApi.rewriteInternalHref(graph, '/terms-of-use?source=footer#legal'),
  '/terms/?source=footer#legal',
  'AC-8: alias link rewrite must preserve query and fragment'
);

let fixture = routeApi.validateRedirectGraph([
  { id: 'redirect:a', route: '/a', normalizedRoute: '/a', state: 'redirect', redirectTarget: '/b', statusCode: 301, conditions: {} },
  { id: 'redirect:b', route: '/b', normalizedRoute: '/b', state: 'redirect', redirectTarget: '/a', statusCode: 301, conditions: {} }
]);
assert.ok(issueCodes(fixture).has('REDIRECT_LOOP'), 'AC-9: loop fixture must fail with REDIRECT_LOOP');

fixture = routeApi.validateRedirectGraph([
  { id: 'redirect:a', route: '/a', normalizedRoute: '/a', state: 'redirect', redirectTarget: '/b', statusCode: 301, conditions: {} },
  { id: 'redirect:b', route: '/b', normalizedRoute: '/b', state: 'redirect', redirectTarget: '/c', statusCode: 301, conditions: {} }
]);
assert.ok(issueCodes(fixture).has('REDIRECT_CHAIN'), 'AC-9: chain fixture must fail with REDIRECT_CHAIN');

fixture = routeApi.validateRedirectGraph([
  { id: 'redirect:slash', route: '/a/', normalizedRoute: '/a', state: 'redirect', redirectTarget: '/a', statusCode: 301, force: true, conditions: {} }
]);
assert.ok(issueCodes(fixture).has('REDIRECT_NORMALIZED_SELF'), 'AC-9: slash-only forced redirect must fail');

fixture = routeApi.validatePageRecords([
  { id: 'page:a', route: '/a/', normalizedRoute: '/a', state: 'page', indexability: 'indexable', canonicalRoute: '/a/', canonicalTags: ['/a/', '/b/'], locale: 'en' }
]);
assert.ok(issueCodes(fixture).has('CANONICAL_MULTIPLE'), 'AC-9: multiple canonical fixture must fail');

fixture = routeApi.validatePageRecords([
  { id: 'page:a', route: '/a/', normalizedRoute: '/a', state: 'page', indexability: 'indexable', canonicalRoute: '/a/', canonicalTags: ['/a/'], locale: 'en' },
  { id: 'page:b', route: '/b/', normalizedRoute: '/b', state: 'page', indexability: 'indexable', canonicalRoute: '/a/', canonicalTags: ['/a/'], locale: 'en' }
]);
assert.ok(issueCodes(fixture).has('CANONICAL_DUPLICATE_CLAIM'), 'AC-9: duplicate canonical fixture must fail');

fixture = routeApi.validateEquivalenceGroups([
  { id: 'eq:test', routes: { en: '/a/', fr: '/fr/a/' }, xDefault: '/a/' }
], [
  { id: 'page:a', route: '/a/', state: 'page', indexability: 'indexable', canonicalRoute: '/a/', locale: 'en', hreflangs: { en: '/a/', fr: '/fr/a/', 'x-default': '/a/' } },
  { id: 'page:fr-a', route: '/fr/a/', state: 'page', indexability: 'indexable', canonicalRoute: '/fr/a/', locale: 'fr', hreflangs: { fr: '/fr/a/', 'x-default': '/a/' } }
]);
assert.ok(issueCodes(fixture).has('HREFLANG_RECIPROCAL_MISSING'), 'AC-9: missing reciprocal fixture must fail');

fixture = routeApi.validateSitemapEntries([
  { sitemapId: 'sitemap-tools', route: '/old/' }
], [
  { id: 'redirect:old', route: '/old/', state: 'redirect', indexability: 'redirect', redirectTarget: '/new/' }
]);
assert.ok(issueCodes(fixture).has('SITEMAP_REDIRECT'), 'AC-9: sitemap redirect fixture must fail');

fixture = routeApi.validateInternalLinks([
  { sourceRoute: '/', href: '/terms-of-use' }
], graph);
assert.ok(issueCodes(fixture).has('INTERNAL_LINK_ALIAS'), 'AC-9: internal alias fixture must fail');

const report = routeApi.buildRouteReport(graph);
['pages', 'redirects', 'rewrites', 'conditionalRedirects', 'gone', 'patterns', 'equivalenceGroups', 'fallbacks', 'indexable', 'sitemapEntries'].forEach((key) => {
  assert.ok(Number.isInteger(report.summary[key]), `AC-10: report missing integer ${key}`);
});

const rootRecord = routeApi.getRouteRecord(graph, '/');
assert.strictEqual(rootRecord.state, 'page', 'AC-11: root must remain a page');
assert.strictEqual(rootRecord.canonicalRoute, '/', 'AC-11: root must remain the English canonical homepage');
assert.ok(graph.routes.some((record) => record.state === 'conditional-redirect' && record.route === '/' && record.conditions.Language), 'AC-11: language redirects must remain conditional edges');

const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/route-policy.json'), 'utf8'));
for (const decision of policy.canonicalDecisions) {
  if (!decision.preserveEquity) continue;
  const resolved = routeApi.resolveFinalRoute(graph, decision.source);
  assert.strictEqual(resolved.statusCode, 301, `AC-12: ${decision.source} must retain a permanent redirect`);
  assert.strictEqual(resolved.finalRoute, decision.destination, `AC-12: ${decision.source} must retain its intended destination`);
}

const navbarSource = fs.readFileSync(path.join(ROOT, 'assets/js/components/navbar.js'), 'utf8');
assert.ok(navbarSource.includes('AfroLocaleRouteResolver'), 'AC-6: navbar must consume the shared locale route resolver');
assert.ok(!navbarSource.includes('var routeMap = {'), 'AC-6: navbar must not retain a hand-maintained equivalent-route map');
for (const sourceFile of ['navbar.js', 'footer.js', 'related-tools.js', 'site-assistant.js']) {
  const componentSource = fs.readFileSync(path.join(ROOT, 'assets/js/components', sourceFile), 'utf8');
  assert.ok(!/['"]\/all-tools\/?['"]/.test(componentSource), `AC-8: ${sourceFile} must link to canonical /tools/`);
}

const nativeDestination = localeResolver.resolve({
  currentLocale: 'en',
  targetLocale: 'fr',
  currentRoute: '/tools/',
  canonicalRoute: '/tools/',
  alternates: { en: '/tools/', fr: '/fr/all-tools/', 'x-default': '/tools/' }
});
assert.deepStrictEqual(nativeDestination, {
  requestedLocale: 'fr',
  route: '/fr/all-tools/',
  relationship: 'equivalent',
  label: 'Français',
  advertisedAsEquivalent: true
});

console.log('Route contract tests passed');
