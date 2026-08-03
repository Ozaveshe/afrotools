'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const { LEGAL_IDS } = require('../scripts/build-sw-legal-remaining-parity');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const contracts = require('../data/registry/swahili-legal-remaining-parity.json');
const englishContracts = require('../data/registry/french-mortgage-property.json').rows;

function normalize(route) {
  return `${String(route).replace(/^\/+|\/+$/g, '')}/`;
}

function routeFile(route) {
  const relative = normalize(route);
  const folder = path.join(ROOT, relative, 'index.html');
  return fs.existsSync(folder) ? folder : path.join(ROOT, relative.replace(/\/$/, '.html'));
}

function fixtureInput(contract) {
  return Object.fromEntries(contract.fields.map((field) => [
    field.name,
    field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
  ]));
}

function registryRows() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete', addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
      getElementById() { return null; }, querySelector() { return null; }, createElement() { return {}; },
      head: { appendChild() {} }
    },
    CustomEvent: function CustomEvent() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'), sandbox);
  return sandbox.AFRO_TOOLS;
}

test('exact denominator is the 51 currently-unaccepted Legal app rows, with the hub separate', () => {
  assert.equal(LEGAL_IDS.length, 51);
  assert.equal(new Set(LEGAL_IDS).size, 51);
  const rows = inventory.rows.filter((row) => LEGAL_IDS.includes(row.englishId));
  assert.equal(rows.length, 51);
  assert.ok(rows.every((row) => row.categoryKey === 'legal'));
  assert.equal(contracts.count, 51);
  assert.equal(contracts.rows.length, 51);
  assert.deepEqual(new Set(contracts.rows.map((row) => row.englishId)), new Set(LEGAL_IDS));
  assert.ok(!LEGAL_IDS.includes('biashara-na-uzingatiaji'));
});

test('all 51 contracts execute the maintained English-owner engine with exact fixtures', () => {
  const engine = require('../assets/js/engines/french-mortgage-property.js');
  global.window = {};
  delete require.cache[require.resolve('../engines/src/legal-engine.js')];
  require('../engines/src/legal-engine.js');
  const legalEngine = global.window.AfroTools.LegalEngine;
  const owners = new Map(englishContracts.map((row) => [row.englishId, row]));
  for (const contract of contracts.rows) {
    const owner = owners.get(contract.englishId);
    assert.ok(owner, contract.englishId);
    assert.equal(contract.sharedEngine, owner.sharedEngine, contract.englishId);
    assert.deepEqual(contract.fields.map((field) => field.name), owner.fields.map((field) => field.name), contract.englishId);
    const result = engine.run(contract, fixtureInput(contract), { legalEngine });
    assert.equal(result.ok, true, contract.englishId);
    assert.ok(Object.keys(result.resultFields || {}).length > 0, contract.englishId);
    assert.deepEqual(new Set(Object.keys(contract.resultLabels)), new Set(Object.keys(result.resultFields)), contract.englishId);
  }
  delete global.window;
});

test('all 51 physical owners are native, local-first, source-bounded and export-complete', () => {
  for (const contract of contracts.rows) {
    const html = fs.readFileSync(routeFile(contract.swahiliRoute), 'utf8');
    const route = `/${normalize(contract.swahiliRoute)}`;
    assert.match(html, /<html\b[^>]*\blang=["']sw["']/i, contract.englishId);
    assert.match(html, new RegExp(`rel=["']canonical["'][^>]+https://afrotools\\.com${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), contract.englishId);
    assert.match(html, /hreflang=["']en["']/i, contract.englishId);
    assert.match(html, /hreflang=["']fr["']/i, contract.englishId);
    assert.match(html, /hreflang=["']sw["']/i, contract.englishId);
    assert.match(html, /property=["']og:url["']/i, contract.englishId);
    assert.match(html, /["']inLanguage["']\s*:\s*["']sw["']/i, contract.englishId);
    assert.match(html, /data-contract-manifest="\/data\/registry\/swahili-legal-remaining-parity\.json"/, contract.englishId);
    assert.match(html, /data-action="txt"/, contract.englishId);
    assert.match(html, /data-action="json"/, contract.englishId);
    assert.match(html, /data-action="import"/, contract.englishId);
    assert.match(html, /data-action="pdf"/, contract.englishId);
    assert.match(html, /Faragha:/, contract.englishId);
    assert.match(html, /Hakuna akaunti, barua pepe, AI wala kutumwa kwa data/, contract.englishId);
    assert.match(html, /si ushauri wa kisheria/i, contract.englishId);
    assert.match(html, /Tarehe ya ukaguzi/, contract.englishId);
    assert.match(html, /Uhakika|Injini inarudia tabia/, contract.englishId);
    assert.doesNotMatch(html, /<iframe\b/i, contract.englishId);
    assert.doesNotMatch(html, /\bfetch\s*\(\s*["']\/tools\//i, contract.englishId);
    assert.doesNotMatch(html, /[âÃ�]/, contract.englishId);
    assert.ok(fs.statSync(path.join(ROOT, `assets/img/tools/${contract.englishId}.webp`)).size > 100, contract.englishId);
  }
});

test('English and French owners already reciprocate all 51 Swahili routes', () => {
  for (const contract of contracts.rows) {
    const tag = `hreflang="sw" href="https://afrotools.com${contract.swahiliRoute}"`;
    for (const ownerRoute of [contract.englishRoute, contract.frenchRoute]) {
      assert.match(fs.readFileSync(routeFile(ownerRoute), 'utf8'), new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${contract.englishId} ${ownerRoute}`);
    }
  }
});

test('registry ownership is exactly one row per app and the Legal hub links every route', () => {
  const registry = registryRows();
  const hub = fs.readFileSync(path.join(ROOT, 'sw/biashara-na-uzingatiaji/index.html'), 'utf8');
  for (const contract of contracts.rows) {
    const matches = registry.filter((row) => row.lang === 'sw'
      && row.sourceId === contract.englishId
      && normalize(row.href) === normalize(contract.swahiliRoute));
    assert.equal(matches.length, 1, contract.englishId);
    assert.ok(hub.split(`href="${contract.swahiliRoute}"`).length - 1 >= 1, `hub ${contract.englishId}`);
  }
});

test('the scoped generator is current and has no broad generated-output ownership', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/build-sw-legal-remaining-parity.js'), 'utf8');
  assert.match(source, /LEGAL_IDS\.length !== 51/);
  assert.doesNotMatch(source, /sitemap|dist\/|locale-page-coverage|swahili-free-app-acceptance|swahili-free-app-parity-inventory\.json[^\n]+write/i);
});
