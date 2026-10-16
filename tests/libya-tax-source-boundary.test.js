'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const policy = require('../scripts/lib/libya-tax-source-boundary');
const ROOT = path.resolve(__dirname, '..');
const ownerFile = path.join(ROOT, 'scripts/apply-tool-verification.js');
const files = ['libya/ly-paye.html', 'libya/ly-vat.html', 'fr/libya/ly-paye.html', 'fr/libya/ly-vat.html'];

function ownerHarness({ stale = false } = {}) {
  const virtual = new Map(files.map(file => [path.join(ROOT, file), fs.readFileSync(path.join(ROOT, file), 'utf8')]));
  const prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-verification.json'), 'utf8'));
  if (stale) {
    for (const id of ['ly-paye', 'ly-vat']) {
      prior.tools[id].source_urls = ['https://financialministry.gov.sd', 'https://tax.gov.ly/'];
      prior.tools[id].source_titles = ['Wrong-country source', 'Homepage, not evidence'];
    }
    for (const [file, html] of virtual) {
      virtual.set(file, html.replaceAll(policy.LEGISLATION_URL, 'https://financialministry.gov.sd'));
    }
  }
  virtual.set(path.join(ROOT, 'data/tool-verification.json'), JSON.stringify(prior));
  const writes = [];
  const localFs = Object.create(fs);
  localFs.readFileSync = (file, encoding) => virtual.has(String(file))
    ? encoding ? virtual.get(String(file)) : Buffer.from(virtual.get(String(file)))
    : fs.readFileSync(file, encoding);
  localFs.writeFileSync = (file, value) => { virtual.set(String(file), value); writes.push(String(file)); };
  const localRequire = createRequire(ownerFile);
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, __dirname: path.dirname(ownerFile),
    process: { argv: ['node', ownerFile, '--write'], env: {} }, console, URL,
    require: name => name === 'fs' ? localFs : localRequire(name),
  };
  context.require.main = {};
  vm.runInNewContext(fs.readFileSync(process.env.AFROTOOLS_LIBYA_OWNER_FIXTURE || ownerFile, 'utf8'), context, { filename: ownerFile });
  return { api: module.exports, virtual, prior, writes };
}

function scripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(match => !/application\/ld\+json/i.test(match[1])).map(match => match[0]);
}

test('actual verification owner rejects wrong Libya sources without changing Sudan source treatment', () => {
  const { api } = ownerHarness();
  for (const id of ['ly-paye', 'ly-vat']) {
    assert.equal(api.shouldKeepToolSource('https://financialministry.gov.sd', id), false);
    assert.equal(api.shouldKeepToolSource('https://tax.gov.ly/', id), false);
    assert.equal(api.shouldKeepToolSource(policy.LEGISLATION_URL, id), true);
  }
  assert.equal(api.shouldKeepToolSource('https://financialministry.gov.sd', 'sd-paye'), true);
});

test('actual owner rebuild cannot revive old cross-country links; unrelated records and dates survive', () => {
  const h = ownerHarness({ stale: true });
  const built = h.api.buildManifest(files.map(file => path.join(ROOT, file)));
  for (const [id, previous] of Object.entries(h.prior.tools)) {
    if (!policy.isLibyaTool(id)) assert.equal(JSON.stringify(built.tools[id]), JSON.stringify(previous), id);
  }
  for (const id of ['ly-paye', 'ly-vat']) {
    assert.deepEqual(Array.from(built.tools[id].source_urls), [policy.LEGISLATION_URL]);
    assert.equal(built.tools[id].last_verified, h.prior.tools[id].last_verified);
    assert.equal(built.tools[id].verification_status, 'calculation-review-pending');
    assert.equal(built.tools[id].source_scope, 'legislation-directory-only');
  }
  assert.deepEqual(h.writes, []);
});

test('real four-page panel roundtrip is stable and preserves executable math, dates and input defaults', () => {
  const h = ownerHarness({ stale: true });
  const built = h.api.buildManifest(files.map(file => path.join(ROOT, file)));
  for (const file of files) {
    const absolute = path.join(ROOT, file), before = h.virtual.get(absolute);
    const id = file.includes('ly-paye') ? 'ly-paye' : 'ly-vat';
    h.api.applyPanelToFile(absolute, built.tools[id]);
    const after = h.virtual.get(absolute);
    assert.doesNotMatch(after, /financialministry\.gov\.sd|SRTD|\bLTA\b/);
    assert.deepEqual(scripts(after), scripts(before), file + ' executable scripts');
    assert.deepEqual([...after.matchAll(/<input\b[^>]*>/gi)].map(x => x[0]), [...before.matchAll(/<input\b[^>]*>/gi)].map(x => x[0]));
    assert.deepEqual([...after.matchAll(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/g)].map(x => x[1]), [...before.matchAll(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/g)].map(x => x[1]));
    assert.ok(after.includes(built.tools[id].last_verified));
    assert.match(after, file.startsWith('fr/') ? /Revue du calcul en attente/ : /Calculation review pending/);
    assert.doesNotMatch(after, /data-source-meta-id="(?:paye|vat)-ly-source"/);
    assert.equal(h.api.applyPanelToFile(absolute, built.tools[id]), false, file + ' idempotence');
    assert.equal(h.virtual.get(absolute), after);
  }
  assert.ok(h.writes.every(file => files.some(relative => path.join(ROOT, relative) === file)));
});

test('pure registry projection changes only two Libya sources and never refreshes review dates', () => {
  for (const id of ['paye-ly-source', 'vat-ly-source']) {
    const row = { id, sourceUrl: 'https://financialministry.gov.sd', sourceName: 'SRTD', lastCheckedAt: '2026-01-01', lastReviewedAt: '2026-01-01', effectiveFrom: '2025-01-01', reviewCadenceDays: 90, freshnessStatus: 'stale', countryCodes: ['LY'], routes: ['/libya/fixture'], toolIds: ['fixture'] };
    const copy = structuredClone(row), result = policy.curateSourceEntry(row);
    assert.deepEqual(row, copy);
    for (const key of ['lastCheckedAt', 'lastReviewedAt', 'effectiveFrom', 'reviewCadenceDays', 'freshnessStatus', 'countryCodes', 'routes', 'toolIds']) assert.deepEqual(result[key], row[key]);
    assert.equal(result.sourceUrl, policy.LEGISLATION_URL);
    assert.equal(result.confidence, 'low_confidence');
    assert.match(result.notes, /have not been verified/);
  }
  for (const id of ['paye-sd-source', 'vat-sd-source', 'official-ke-odpc', 'paye-tax-engine-country-packs']) {
    const row = { id, sourceUrl: 'https://financialministry.gov.sd' };
    assert.strictEqual(policy.curateSourceEntry(row), row);
  }
});

test('actual registry add path applies Libya boundary and preserves every other existing entry', () => {
  const registryFile = path.join(ROOT, 'scripts/build-source-registry.js');
  const source = fs.readFileSync(registryFile, 'utf8');
  const body = source.match(/  function add\(entry\) \{[\s\S]*?\n  \}/);
  assert.ok(body);
  const registry = JSON.parse(fs.readFileSync(process.env.AFROTOOLS_LIBYA_REGISTRY_FIXTURE || path.join(ROOT, 'data/source-registry.json'), 'utf8'));
  const entries = new Map();
  const context = { entries, libyaSource: policy, normalizeAppliesToScopes: values => values };
  vm.runInNewContext(body[0] + ';invoke=add', context);
  for (const row of registry.sources) context.invoke(structuredClone(row));
  assert.equal(entries.size, registry.sources.length);
  const changed = registry.sources.filter(row => JSON.stringify(entries.get(row.id)) !== JSON.stringify(row)).map(row => row.id);
  assert.deepEqual(changed.sort(), ['paye-ly-source', 'vat-ly-source']);
  assert.throws(() => context.invoke(structuredClone(registry.sources[0])), /Duplicate/);
});

test('actual formula source projection marks only Libya pending without old-source merge or new dates', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/lib/calculation-quality.js'), 'utf8');
  const body = source.match(/function sourceRefsFromVerification\(entry\) \{[\s\S]*?\n\}/);
  assert.ok(body);
  const context = { libyaSource: policy };
  vm.runInNewContext(body[0] + ';invoke=sourceRefsFromVerification', context);
  const tools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-verification.json'), 'utf8')).tools;
  for (const entry of Object.values(tools)) {
    const result = context.invoke(entry);
    assert.equal(result.length, entry.source_urls.length);
    for (const [i, reference] of result.entries()) {
      assert.equal(reference.url, entry.source_urls[i]);
      assert.equal(reference.title, entry.source_titles[i] || entry.source_urls[i]);
      assert.equal(reference.registryId, null);
      assert.equal(reference.kind, 'authority-link');
      assert.equal(reference.authorityStatus, policy.isLibyaTool(entry.tool_id) ? 'review-required' : 'source-reviewed');
      assert.deepEqual(Object.keys(reference).sort(), ['authorityStatus', 'kind', 'registryId', 'title', 'url']);
    }
  }
});

test('actual registry route filter retains the owned Libya pending panels without accepting other sources', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/build-source-registry.js'), 'utf8');
  const filter = source.match(/entry\.routes = \(entry\.routes \|\| \[\]\)\.filter\(function \(route\) \{([\s\S]*?)\n    \}\);/);
  assert.ok(filter);
  for (const file of files) {
    const entry = { id: file.includes('ly-paye') ? 'paye-ly-source' : 'vat-ly-source' };
    const context = { entry, fs, routeFile: () => path.join(ROOT, file), libyaSource: policy };
    vm.runInNewContext('invoke=function(route){' + filter[1] + '}', context);
    assert.equal(context.invoke('/' + file), true);
    entry.id = 'paye-sd-source';
    assert.equal(context.invoke('/' + file), false);
  }
  assert.equal(policy.ownsPendingSourcePanel('paye-ly-source', '<section data-tool-verification-panel data-tool-id="ly-vat">' + policy.LEGISLATION_URL), false);
  assert.equal(policy.ownsPendingSourcePanel('paye-ly-source', '<section data-tool-verification-panel data-tool-id="ly-paye">'), false);
});
