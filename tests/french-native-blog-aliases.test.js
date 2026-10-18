'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const policy = JSON.parse(read('data/registry/route-policy.json'));
const content = JSON.parse(read('data/content/blog-article-manifest.json'));
const routeApi = require('../scripts/lib/route-contract');
// Fixed reviewed source/target identities, independent of proposed policy metadata.
const PAIRS = [
  ['/fr/blog/bareme-irpp-cote-divoire/', '/blog/bareme-irpp-cote-divoire/'],
  ['/fr/blog/cotisations-cnps-cote-divoire/', '/blog/cotisations-cnps-cote-divoire/'],
  ['/fr/blog/creation-entreprise-senegal-couts/', '/blog/creation-entreprise-senegal-couts/'],
  ['/fr/blog/frais-transfert-argent-senegal/', '/blog/frais-transfert-argent-senegal/'],
  ['/fr/blog/impot-cameroun-calcul-salaire/', '/blog/impot-cameroun-calcul-salaire/'],
  ['/fr/blog/impot-revenu-tunisie-2026/', '/blog/impot-revenu-tunisie-2026/'],
  ['/fr/blog/tva-maroc-taux-calcul/', '/blog/tva-maroc-taux-calcul/']
];
const physical = route => route.slice(1) + 'index.html';
const forms = route => [route, route.slice(0, -1), route.slice(0, -1) + '.html', route + 'index.html'];
const attribute = (tag, name) => tag.match(new RegExp('\\b' + name + '=["\']([^"\']*)["\']', 'i'))?.[1] || '';
const tags = (html, name, key, value) => [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(x => x[0]).filter(x => attribute(x, key).toLowerCase() === value);

test('exactly seven known French shells have 21 literal forced canonical alias decisions', () => {
  const aliases = policy.canonicalDecisions.filter(x => x.id.startsWith('native-french-blog-'));
  assert.equal(aliases.length, 21);
  const expected = PAIRS.flatMap(([source, target]) => [source, source.slice(0, -1) + '.html', source + 'index.html'].map(route => [route, target]));
  assert.deepEqual(aliases.map(x => [x.source, x.destination]).sort(), expected.sort());
  assert.equal(new Set(aliases.map(x => x.id)).size, 21);
  for (const row of aliases) {
    assert.deepEqual(Object.keys(row).sort(), ['destination', 'force', 'id', 'preserveEquity', 'rationale', 'source', 'statusCode']);
    assert.equal(row.statusCode, 301); assert.equal(row.force, true); assert.equal(row.preserveEquity, true);
    assert.doesNotMatch(row.source, /[*:?#]|\/\.\.?\//); assert.doesNotMatch(row.destination, /[*:?#]|\/\.\.?\//);
  }
});

test('each exact existing canonical is a complete published French reader, beyond its html language label', () => {
  for (const [source, target] of PAIRS) {
    const wrapper = read(physical(source)), file = physical(target), html = read(file);
    assert.match(wrapper, new RegExp('<iframe[^>]*src="' + target + '"'));
    assert.match(wrapper, /content="noindex, follow"/);
    assert.match(html, /<html\b[^>]*\blang="fr"/);
    assert.doesNotMatch(html, /<iframe\b/i);
    assert.ok((html.match(/<h2\b/gi) || []).length >= 10, 'full existing reader sections required');
    assert.match(html, /class="article-body"/);
    assert.equal(tags(html, 'link', 'rel', 'canonical').length, 1);
    assert.equal(attribute(tags(html, 'link', 'rel', 'canonical')[0], 'href'), 'https://afrotools.com' + target);
    assert.ok(!tags(html, 'meta', 'name', 'robots').some(x => /noindex/i.test(attribute(x, 'content'))));
    const row = content.articles.find(x => x.file === file); assert.ok(row); assert.equal(row.locale, 'fr'); assert.equal(row.publicationStatus, 'published');
    assert.match(html, new RegExp('content="' + row.contentId + '"'));
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(x => JSON.parse(x[1]));
    const article = schemas.find(x => x['@type'] === 'Article'); assert.ok(article); assert.equal(article.inLanguage, 'fr'); assert.equal(article.mainEntityOfPage, 'https://afrotools.com' + target);
    assert.ok(!policy.canonicalDecisions.some(x => x.source.replace(/\/$/, '') === target.replace(/\/$/, '')), 'canonical target cannot itself be a chained policy alias');
  }
});

test('the genuine route compiler sends all four compatibility forms in one hop to the existing French canonical', () => {
  const graph = routeApi.buildRouteGraph();
  for (const [source, target] of PAIRS) {
    for (const alias of forms(source)) {
      const record = routeApi.getRouteRecord(graph, alias); assert.ok(record); assert.equal(record.state, 'redirect'); assert.equal(record.statusCode, 301); assert.equal(record.force, true);
      const resolution = routeApi.resolveFinalRoute(graph, alias); assert.equal(resolution.finalRoute, target); assert.equal(resolution.hops, 1);
    }
    const canonical = routeApi.getRouteRecord(graph, target); assert.equal(canonical.state, 'page'); assert.equal(canonical.locale, 'fr');
    assert.equal(canonical.indexability, 'indexable'); assert.equal(canonical.localeCoverage.state, 'native'); assert.equal(canonical.canonicalRoute, target);
  }
});

test('official Netlify matcher redirects exactly the seven aliases and preserves unrelated and canonical paths', async () => {
  const entry = require.resolve('@netlify/redirect-matcher');
  const packageRoot = path.dirname(entry);
  assert.equal(JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'))).version, '0.4.2');
  for (const [file, hash] of Object.entries({
    'index.js': '99049d98c9825bf3f78635165d87319e6346166668fa39f14b648d84dcca0f2a',
    'matcher.wasm': 'c53e89bc6ef96a0558dee9ba86fca9c382ec568d8de1a07c046706615e89e856',
    'wasm_exec.js': '0c949f4996f9a89698e4b5c586de32249c3b69b7baadb64d220073cc04acba14'
  })) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(packageRoot, file))).digest('hex'), hash);
  const { createMatcher } = await import(pathToFileURL(entry).href);
  const rules = routeApi.parseRedirectsFile().map(r => ({ path: r.route, to: r.target, status: r.statusCode, force: r.force, params: {}, conditions: r.conditions || {}, headers: {}, proxy: false }));
  const additions = new Map(PAIRS.flatMap(([source, target]) => [source, source.slice(0, -1) + '.html', source + 'index.html'].map(alias => [alias, target])));
  const before = await createMatcher(rules.filter(r => additions.get(r.path) !== r.to), {});
  const matcher = await createMatcher(rules, {}), request = route => ({ scheme: 'https', host: 'example.invalid', path: route, query: '', headers: {}, cookies: {} });
  try {
    assert.deepEqual(matcher.parseErrors, []);
    assert.deepEqual(before.parseErrors, []);
    for (const [source, target] of PAIRS) {
      for (const alias of forms(source)) {
        const hit = matcher.match(request(alias)); assert.ok(hit); assert.equal(hit.type, 'match'); assert.equal(hit.status, 301); assert.equal(hit.force, true); assert.equal(hit.to, target);
      }
      for (const unrelated of [target, source + 'deeper/', source.replace('/fr/', '/sw/'), source.replace('/fr/', '/'), source.replace(/\/$/, '-unknown/')]) {
        assert.deepEqual(matcher.match(request(unrelated)), before.match(request(unrelated)), 'preserve existing unrelated/canonical routing: ' + unrelated);
      }
    }
    for (const unknown of ['/fr/blog/unknown-guide/', '/fr/blog/free-json-formatter-developer-tools/', '/sw/blogu/mwongozo/']) {
      assert.deepEqual(matcher.match(request(unknown)), before.match(request(unknown)), 'preserve unknown/other-language routing: ' + unknown);
    }
  } finally { matcher.close(); before.close(); }
});
