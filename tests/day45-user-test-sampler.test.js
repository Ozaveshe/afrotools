'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BASE_PER_CATEGORY,
  SAMPLE_SIZE,
  TARGET_CATEGORIES,
  buildEligiblePools,
  canonicalRouteFromHtml,
  formatMarkdown,
  hasNoindex,
  inspectCandidate,
  loadRegistry,
  parseArgs,
  sampleApps,
} = require('../scripts/sample-day45-user-tests');

const repoRoot = path.resolve(__dirname, '..');
const registry = loadRegistry();
const pools = buildEligiblePools(registry, repoRoot);

test('eligible pools contain at least three canonical English apps per target category', () => {
  assert.deepEqual(Object.keys(pools), [...TARGET_CATEGORIES]);
  for (const category of TARGET_CATEGORIES) {
    assert.ok(pools[category].length >= BASE_PER_CATEGORY, `${category} has too few apps`);
    for (const candidate of pools[category]) {
      assert.equal(candidate.category, category);
      assert.match(candidate.route, /^\/tools\/[^/]+\/$/);
      assert.ok(fs.existsSync(candidate.sourceFile), `${candidate.route} is missing`);
      const html = fs.readFileSync(candidate.sourceFile, 'utf8');
      assert.equal(canonicalRouteFromHtml(html), candidate.route);
      assert.equal(hasNoindex(html), false);
      assert.doesNotMatch(candidate.id, /(?:^|-)hub$/);
    }
  }
});

test('localized, alias, hub, missing, and noncanonical registry rows cannot enter pools', () => {
  const pooledRoutes = new Set(Object.values(pools).flat().map((candidate) => candidate.route));
  const localized = registry.find((row) =>
    TARGET_CATEGORIES.includes(row.category) && row.lang && row.lang !== 'en');
  const aliasBase = registry.find((row) =>
    TARGET_CATEGORIES.includes(row.category) && (!row.lang || row.lang === 'en') && !row.sourceId);
  const alias = { ...aliasBase, sourceId: aliasBase.id };
  const hub = registry.find((row) => row.id === 'education-hub');

  assert.equal(inspectCandidate(localized, repoRoot).reason, 'localized');
  assert.equal(inspectCandidate(alias, repoRoot).reason, 'alias-or-localized');
  assert.equal(inspectCandidate(hub, repoRoot).reason, 'hub');
  assert.equal(pooledRoutes.has(hub.href), false);
  assert.equal(inspectCandidate({
    category: 'education',
    id: 'missing-fixture',
    name: 'Missing fixture',
    href: '/tools/definitely-missing-day45-fixture/',
    status: 'live',
  }, repoRoot).reason, 'missing-route');
});

test('the same explicit seed produces the same sample', () => {
  const first = sampleApps({ seed: 'release-sha-example', pools });
  const second = sampleApps({ seed: 'release-sha-example', pools });
  assert.deepEqual(first, second);
});

test('different seeds alter the deterministic selection', () => {
  const first = sampleApps({ seed: 'release-a', pools });
  const second = sampleApps({ seed: 'release-b', pools });
  assert.notDeepEqual(first.map((item) => item.route), second.map((item) => item.route));
});

test('sample is balanced, unique, and exactly twenty apps', () => {
  const sample = sampleApps({ seed: 'balance-contract', pools });
  assert.equal(sample.length, SAMPLE_SIZE);
  assert.equal(new Set(sample.map((item) => item.route)).size, SAMPLE_SIZE);
  assert.equal(new Set(sample.map((item) => item.id)).size, SAMPLE_SIZE);

  const counts = Object.fromEntries(TARGET_CATEGORIES.map((category) => [category, 0]));
  for (const item of sample) counts[item.category] += 1;
  assert.deepEqual(Object.values(counts).sort(), [3, 3, 3, 3, 4, 4]);
});

test('every sampled row has the requested user-test fields and a concise action', () => {
  const sample = sampleApps({ seed: 'field-contract', pools });
  for (const item of sample) {
    assert.ok(TARGET_CATEGORIES.includes(item.category));
    assert.ok(item.appName);
    assert.match(item.productionUrl, /^https:\/\/afrotools\.com\/tools\/[^/]+\/$/);
    assert.ok(item.smokeAction.length > 20 && item.smokeAction.length < 180);
  }
});

test('seed is mandatory and markdown carries the acceptance warning', () => {
  assert.throws(() => parseArgs([]), /explicit-seed/);
  assert.throws(() => sampleApps({ seed: '', pools }), /explicit non-empty seed/);

  const seed = 'format-contract';
  const output = formatMarkdown(sampleApps({ seed, pools }), seed);
  assert.match(output, /Sampling is not readiness acceptance/);
  assert.match(output, /\| Category \| App \| Production URL \| Suggested smoke action \|/);
  assert.equal((output.match(/https:\/\/afrotools\.com\//g) || []).length, SAMPLE_SIZE);
});
