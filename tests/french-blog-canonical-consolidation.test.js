const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/route-policy.json'), 'utf8'));
const routeContract = require('../scripts/lib/route-contract');

const CONSOLIDATIONS = [
  ['/blog/calculer-salaire-net-senegal/', '/fr/blog/calculer-salaire-net-senegal/'],
  ['/blog/salaire-moyen-rdc-2026/', '/fr/blog/salaire-moyen-rdc-2026/']
];

test('legacy root-level French salary articles consolidate into the maintained /fr/ owners', () => {
  const decisions = new Map(policy.canonicalDecisions.map((row) => [row.source, row]));
  const graph = routeContract.buildRouteGraph();

  for (const [legacyRoute, frenchRoute] of CONSOLIDATIONS) {
    const decision = decisions.get(legacyRoute);
    assert.ok(decision, `${legacyRoute} needs an explicit canonical decision`);
    assert.equal(decision.destination, frenchRoute);
    assert.equal(decision.statusCode, 301);
    assert.equal(decision.force, true);
    assert.equal(decision.preserveEquity, true);

    const legacy = routeContract.getRouteRecord(graph, legacyRoute);
    const canonical = routeContract.getRouteRecord(graph, frenchRoute);
    assert.equal(legacy.state, 'redirect', `${legacyRoute} must not remain indexable`);
    assert.equal(routeContract.resolveFinalRoute(graph, legacyRoute).finalRoute, frenchRoute);
    assert.equal(canonical.state, 'page');
    assert.equal(canonical.indexability, 'indexable');
  }
});

test('generated sitemaps expose only the canonical /fr/ salary articles', () => {
  const sitemapFiles = fs.readdirSync(ROOT).filter((name) => /^sitemap.*\.xml$/i.test(name));
  const sitemapText = sitemapFiles.map((name) => fs.readFileSync(path.join(ROOT, name), 'utf8')).join('\n');

  for (const [legacyRoute, frenchRoute] of CONSOLIDATIONS) {
    assert.ok(!sitemapText.includes(`https://afrotools.com${legacyRoute}`), `${legacyRoute} must be absent from sitemaps`);
    assert.ok(sitemapText.includes(`https://afrotools.com${frenchRoute}`), `${frenchRoute} must remain in sitemaps`);
  }
});
