'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CATEGORY_KEYS = new Set(['legal', 'government', 'insurance']);
const inventory = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json'),
  'utf8'
));
const rows = inventory.rows.filter((row) => CATEGORY_KEYS.has(row.categoryKey));

function normalize(route) {
  return route === '/' ? route : String(route).replace(/\/+$/, '');
}

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function registryRows() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return {}; },
      head: { appendChild() {} }
    },
    CustomEvent: function CustomEvent() {}
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'),
    sandbox
  );
  return sandbox.AFRO_TOOLS;
}

test('exact scoped denominator is 66 + 15 + 16', () => {
  assert.equal(rows.length, 97);
  assert.equal(rows.filter((row) => row.categoryKey === 'legal').length, 66);
  assert.equal(rows.filter((row) => row.categoryKey === 'government').length, 15);
  assert.equal(rows.filter((row) => row.categoryKey === 'insurance').length, 16);
  assert.ok(rows.every((row) => row.state === 'localized-shell-candidate'));
  assert.ok(rows.every((row) => row.primarySwahiliRoute));
});

test('all 97 owners are native Swahili documents with self canonical metadata', () => {
  for (const row of rows) {
    const html = fs.readFileSync(routeFile(row.primarySwahiliRoute), 'utf8');
    const route = normalize(row.primarySwahiliRoute);
    assert.match(html, /<html\b[^>]*\blang=["']sw["']/i, row.englishId);
    assert.match(
      html,
      new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']https://afrotools\\.com${route}/?["']`, 'i'),
      `canonical ${row.englishId}`
    );
    assert.match(html, /hreflang=["']en["']/i, `English alternate ${row.englishId}`);
    assert.match(html, /hreflang=["']sw["']/i, `Swahili alternate ${row.englishId}`);
    assert.match(html, /property=["']og:title["']/i, `OG title ${row.englishId}`);
    assert.match(html, /property=["']og:description["']/i, `OG description ${row.englishId}`);
    assert.match(html, /application\/ld\+json/i, `schema ${row.englishId}`);
    assert.match(html, /["']inLanguage["']\s*:\s*["']sw["']/i, `schema language ${row.englishId}`);
    assert.doesNotMatch(html, /<iframe\b/i, `iframe forbidden ${row.englishId}`);
    assert.doesNotMatch(html, /\bfetch\s*\(\s*["']\/tools\//i, `English HTML fetch forbidden ${row.englishId}`);
    assert.doesNotMatch(html, /afrotools-(?:locale|language)-fallback["'][^>]*content=["']en/i, `fallback forbidden ${row.englishId}`);
  }
});

test('all 97 routes have exactly one Swahili registry owner', () => {
  const registry = registryRows();
  for (const row of rows) {
    const matches = registry.filter((item) => (
      item.lang === 'sw'
      && item.sourceId === row.englishId
      && normalize(item.href) === normalize(row.primarySwahiliRoute)
    ));
    assert.equal(matches.length, 1, `registry owner ${row.englishId}`);
  }
});

test('all 97 owners use available canonical artwork', () => {
  for (const row of rows) {
    const artwork = path.join(ROOT, 'assets', 'img', 'tools', `${row.englishId}.webp`);
    assert.ok(fs.existsSync(artwork), `artwork ${row.englishId}`);
    assert.ok(fs.statSync(artwork).size > 100, `non-empty artwork ${row.englishId}`);
  }
});

test('11 legal/property gaps execute the shared English-owner engine', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const engine = require('../assets/js/engines/french-mortgage-property.js');
  global.window = {};
  require('../engines/src/legal-engine.js');
  const legalEngine = global.window.AfroTools.LegalEngine;
  assert.equal(manifest.count, 11);
  for (const contract of manifest.rows) {
    const input = Object.fromEntries(contract.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const result = engine.run(contract, input, { legalEngine });
    assert.equal(result.ok, true, contract.englishId);
    assert.ok(Object.keys(result.resultFields || {}).length > 0, contract.englishId);
  }
  delete global.window;
});

test('Government and Insurance shared engines reject invalid state and compute fixtures', () => {
  const government = require('../assets/js/engines/government-parity-engine.js');
  const insurance = require('../assets/js/pages/insurance-assumption-workflow.js');
  assert.equal(government.calculatePension({
    monthlyContribution: -1, currentBalance: 0, years: 10, annualRate: 5
  }).ok, false);
  assert.equal(government.calculatePermit({
    mainApplicants: 1, dependants: 0, mainFee: 100, dependantFee: 50,
    supportingCosts: 20, professionalCosts: 0, travelCosts: 0, otherCosts: 0,
    contingencyRate: 10
  }).total, 132);
  assert.equal(insurance.calculate('quote', {
    exposure: 10000, rate: 2, fixed: 50, contingency: 10
  }).total, 275);
  assert.equal(insurance.calculate('quote', {
    exposure: 0, rate: 2, fixed: 50, contingency: 10
  }).ok, false);
});

test('the 19 generated gaps are idempotent and source-owned', () => {
  const { LEGAL, GOVERNMENT, INSURANCE } = require('../scripts/build-sw-legal-government-insurance-parity.js');
  assert.equal(Object.keys(LEGAL).length, 11);
  assert.equal(Object.keys(GOVERNMENT).length, 6);
  assert.equal(Object.keys(INSURANCE).length, 2);
  const gapRoutes = [...Object.values(LEGAL), ...Object.values(GOVERNMENT), ...Object.values(INSURANCE)]
    .map((value) => value.route || value[0]);
  for (const route of gapRoutes) {
    const html = fs.readFileSync(routeFile(route), 'utf8');
    assert.match(html, /build-sw-legal-government-insurance-parity\.js/);
  }
});

test('the 19 reconciled owners have reciprocal French or Hausa hreflang', () => {
  const { RECIPROCAL_LOCALE_OWNERS } = require('../scripts/build-sw-legal-government-insurance-parity.js');
  assert.equal(Object.keys(RECIPROCAL_LOCALE_OWNERS).length, 19);
  const byId = new Map(rows.map((row) => [row.englishId, row]));
  for (const [englishId, ownerRoutes] of Object.entries(RECIPROCAL_LOCALE_OWNERS)) {
    const swahiliRoute = `${normalize(byId.get(englishId).primarySwahiliRoute)}/`;
    for (const ownerRoute of ownerRoutes) {
      const ownerHtml = fs.readFileSync(routeFile(ownerRoute), 'utf8');
      assert.match(
        ownerHtml,
        new RegExp(`hreflang=["']sw["'][^>]+href=["']https://afrotools\\.com${swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i'),
        `${englishId} reciprocal owner ${ownerRoute}`
      );
    }
  }
  const nhf = fs.readFileSync(routeFile('/sw/zana/kikokotoo-nhf-nigeria/'), 'utf8');
  assert.match(nhf, /hreflang=["']ha["'][^>]+href=["']https:\/\/afrotools\.com\/ha\/kayan-aiki\/nhf-najeriya\/["']/i);
});
