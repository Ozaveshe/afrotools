'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../scripts/lib/route-contract');
const root = path.resolve(__dirname, '..');
const graph = api.buildRouteGraph();
const redirects = api.parseRedirectsFile();
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const decisions = [
  ['/sw/central-africa/', '/sw/central-african-republic/', 'sw'],
  ['/fr/afya-na-bima/', '/fr/insurance/', 'fr'],
  ['/sw/lifestyle/', '/sw/personal-finance/', 'sw']
];

for (const [source, target, lang] of decisions) {
  test(source + ' resolves once to its existing same-language canonical task owner', () => {
    for (const spelling of [source, source.slice(0, -1), source + '?utm_source=gsc']) {
      const resolved = api.resolveFinalRoute(graph, spelling);
      assert.equal(resolved.finalRoute, target);
      assert.equal(resolved.hops, 1);
      assert.equal(resolved.statusCode, 301);
    }
    const record = api.getRouteRecord(graph, target);
    assert.equal(record.state, 'page');
    assert.equal(record.locale, lang);
    assert.equal(record.canonicalRoute, target);
    const rule = redirects.find(row => row.route === source);
    assert.equal(rule.force, true);
    assert.deepEqual(rule.conditions, {});
  });
}

test('country alias follows explicit country ownership, not a guessed Central Africa region', () => {
  const oldOwner = read('central-africa/index.html');
  assert.match(oldOwner, /<title>Central African Republic Tools/);
  assert.match(oldOwner, /canonical[^>]+central-african-republic\//);
  assert.match(read('fr/central-africa/index.html'), /outils fiscaux Centrafrique/);
  const countries = JSON.parse(read('data/registry/countries.json'));
  const country = countries.find(row => row.id === 'CF');
  assert.equal(country.localeCoverage.sw.route, '/sw/central-african-republic/');
  assert.ok(!redirects.some(row => row.route === '/sw/central-africa/*'));
});

test('lifestyle preserves household-budget intent rather than the workday directory mismatch', () => {
  const legacy = read('lifestyle/index.html');
  for (const term of ['budgeting', '/lifestyle/costs/', '/lifestyle/inflation/', '/lifestyle/savings/']) assert.ok(legacy.includes(term));
  assert.notEqual(api.resolveFinalRoute(graph, '/sw/lifestyle/').finalRoute, '/sw/data-na-tija/');
  assert.match(read('sw/personal-finance/index.html'), /\/sw\/zana\/bajeti-50-30-20\//);
});

test('retired localized prize URL returns 410 with an existing truthful Swahili body', () => {
  const record = api.getRouteRecord(graph, '/sw/matchday-os/prizes/');
  assert.equal(record.state, 'gone');
  assert.equal(record.statusCode, 410);
  const rule = redirects.find(row => row.route === '/sw/matchday-os/prizes/');
  assert.equal(rule.target, '/sw/prize-challenge-retired.html');
  assert.equal(rule.force, true);
  const body = read('sw/prize-challenge-retired.html');
  assert.match(body, /<html lang="sw">/);
  assert.match(body, /zawadi umeondolewa/);
  assert.match(body, /si ukurasa wa kujiandikisha/);
  assert.match(body, /noindex, follow/);
  assert.doesNotMatch(body, /\$3,000|\$1,000|doesn't exist yet/);
  for (const target of ['/sw/zana/utabiri-wa-afcon/', '/sw/zana-zote/', '/sw/']) {
    assert.ok(body.includes('href="' + target + '"'));
    assert.equal(api.getRouteRecord(graph, target).state, 'page');
  }
});

test('Hausa travel entry identifies each task and English language before a deliberate choice', () => {
  const body = read('ha/travel/cost/index.html');
  assert.match(body, /<html lang="ha">/);
  assert.match(body, /noindex, follow/);
  assert.match(body, /ba kalkuletar kuɗin tafiya ta Hausa ba ce/);
  assert.doesNotMatch(body, /http-equiv="refresh"|location\.(?:href|replace)|<form\b/i);
  for (const target of ['/tools/africa-flight/', '/tools/beach-holiday-budget/', '/travel/']) {
    const anchor = body.match(new RegExp('<a href="' + target + '" hreflang="en">([^<]+)</a>'));
    assert.ok(anchor, target);
    assert.match(anchor[1], /Turanci/);
    assert.equal(api.getRouteRecord(graph, target).state, 'page');
  }
  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  const override = policy.overrides.find(row => row.route === '/ha/travel/cost/');
  assert.equal(override.state, 'english-fallback');
  assert.equal(override.fallbackRoute, '/travel/');
});
