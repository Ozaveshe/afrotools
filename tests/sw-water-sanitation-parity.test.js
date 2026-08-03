'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-water-sanitation-parity-manifest.json');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const base = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const allowlist = [
  'assets/css/sw-water-sanitation-parity.css',
  'assets/js/pages/sw-water-sanitation-parity.js',
  'data/localization/sw-water-sanitation-parity-manifest.json',
  'fr/tools/materiaux-plomberie/index.html',
  'playwright.sw-water-sanitation.config.js',
  'reports/sw-water-sanitation-artwork-queue-2026-08-02.json',
  'reports/sw-water-sanitation-parity-receipt-2026-08-02.md',
  'scripts/generate-sw-water-sanitation-parity.js',
  'sw/zana/ukubwa-wa-septic-tank/index.html',
  'sw/zana/vifaa-vya-mabomba/index.html',
  'tests/e2e/sw-water-sanitation-parity.spec.js',
  'tests/sw-water-sanitation-parity.test.js',
  'tools/plumbing-material/index.html'
].sort();
const engines = {
  'septic-tank': require('../engines/src/septic-tank-engine.js'),
  'plumbing-material': require('../engines/src/plumbing-material-engine.js')
};
const expectedIds = ['plumbing-material', 'septic-tank'];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function close(actual, expected, label) {
  const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-12);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

function finite(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'object') return true;
  return Object.values(value).every(finite);
}

function schemaTypes(html) {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), match => JSON.parse(match[1])['@type']);
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|quot|lt|gt);/g, ' ')
    .replace(/\s+/g, ' ');
}

test('manifest owns exactly the two reconciled coordinator-accepted Engineering rows', () => {
  assert.equal(manifest.coordinatorBase, base);
  assert.equal(manifest.scopeCount, 2);
  assert.deepEqual(manifest.apps.map(app => app.id).sort(), expectedIds);
  const rows = inventory.rows.filter(row => expectedIds.includes(row.englishId));
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.categoryKey, 'engineering');
    assert.equal(row.accepted, true);
    const app = manifest.apps.find(candidate => candidate.id === row.englishId);
    assert.equal(app.englishRoute.replace(/\/$/, ''), row.englishRoute);
  }
  assert.equal(rows.find(row => row.englishId === 'septic-tank').state, 'localized-shell-candidate');
  assert.equal(rows.find(row => row.englishId === 'plumbing-material').state, 'localized-shell-candidate');
});

test('maintained DOM-free engines satisfy primary, boundary and invalid oracles without NaN', () => {
  for (const app of manifest.apps) {
    const engine = engines[app.id];
    const result = engine.calculate(app.oracle.inputs);
    assert.equal(result.ok, true, app.id);
    assert.equal(finite(result), true, `${app.id} finite primary report`);
    for (const [key, expected] of Object.entries(app.oracle.expected)) close(result[key], expected, `${app.id}.${key}`);
    const boundary = engine.calculate(app.boundaryOracle.inputs);
    assert.equal(boundary.ok, true, `${app.id} boundary`);
    assert.equal(finite(boundary), true, `${app.id} finite boundary report`);
    for (const [key, expected] of Object.entries(app.boundaryOracle.expected)) close(boundary[key], expected, `${app.id}.boundary.${key}`);
  }
  const plumbing = engines['plumbing-material'].calculate(manifest.apps.find(app => app.id === 'plumbing-material').oracle.inputs);
  assert.deepEqual(plumbing.bom.map(({ kind, qty, unit, unitCost, total }) => ({ kind, qty, unit, unitCost, total })), [
    { kind:'pipe',qty:240,unit:'metres',unitCost:6500,total:1560000 },
    { kind:'fittings',qty:120,unit:'pcs',unitCost:4550,total:546000 },
    { kind:'sanitaryware',qty:3,unit:'sets',unitCost:520000,total:1560000 },
    { kind:'connection',qty:30,unit:'metres',unitCost:6500,total:195000 },
    { kind:'tank',qty:1,unit:'unit',unitCost:700000,total:700000 },
    { kind:'labour',qty:13,unit:'days',unitCost:60000,total:780000 }
  ]);
  assert.equal(engines['septic-tank'].calculate({ ...manifest.apps[0].oracle.inputs, people:0 }).ok, false);
  assert.equal(engines['plumbing-material'].calculate({ ...manifest.apps[1].oracle.inputs, bathrooms:0 }).ok, false);
});

test('source generator owns both routes and every route uses only its maintained engine', () => {
  const generator = read('scripts/generate-sw-water-sanitation-parity.js');
  assert.doesNotMatch(generator, /RATES\s*=|BUILDINGS\s*=|DAILY\s*=|SOIL\s*=/);
  for (const app of manifest.apps) {
    assert.match(generator, new RegExp(`['"]${app.id}['"]`));
    const html = read(app.swFile);
    assert.match(html, new RegExp(`<body[^>]+data-water-tool="${app.id}"`));
    assert.match(html, new RegExp(`<script src="${app.enginePublic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?v=[a-f0-9]+)?"`));
    assert.match(html, /assets\/js\/pages\/sw-water-sanitation-parity\.js/);
    assert.doesNotMatch(html, /<iframe\b|fetch\(|XMLHttpRequest|\/tools\/[^"']+\/app(?:\.html)?["']/i);
  }
});

test('native product surfaces preserve product fields, full BOM and scoped Kiswahili copy', () => {
  const css = read('assets/css/sw-water-sanitation-parity.css');
  assert.match(css, /\.sw-water-evidence\{[^}]*min-width:0/);
  assert.match(css, /\.sw-water-evidence code\{[^}]*overflow-wrap:anywhere;word-break:break-word/);
  const septic = read('sw/zana/ukubwa-wa-septic-tank/index.html');
  const plumbing = read('sw/zana/vifaa-vya-mabomba/index.html');
  for (const field of ['country','people','buildingType','toilets','soil','material','includeSoakaway']) assert.match(septic, new RegExp(`(?:id|name)="${field}"`));
  for (const field of ['country','buildingType','pipeType','bathrooms','includeTank','tankSize','includeLabour']) assert.match(plumbing, new RegExp(`(?:id|name)="${field}"`));
  assert.match(plumbing, /<tbody id="water-breakdown"><\/tbody>/);
  assert.match(read('assets/js/pages/sw-water-sanitation-parity.js'), /report\.bom\.forEach/);
  const combinedVisible = visibleText(septic + plumbing);
  assert.doesNotMatch(combinedVisible, /\b(?:fiberglass|galvani[sz]ed|Duplex|route|pipe class|traps|vent|pressure|flushing|leakage|offcuts|takeoff|Toilets|WC)\b/i);
  assert.match(combinedVisible, /nyuzi za kioo/);
  assert.match(combinedVisible, /chuma kilichopakwa zinki/i);
  assert.match(combinedVisible, /orodha ya vipimo/);
});

test('canonical, OG, artwork, reciprocal hreflang and all three schema types are complete', () => {
  for (const app of manifest.apps) {
    const html = read(app.swFile);
    const canonical = `https://afrotools.com${app.swRoute}`;
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}"`));
    assert.match(html, new RegExp(`<meta property="og:url" content="${canonical}"`));
    assert.match(html, new RegExp(`<img class="sw-water-art"[^>]+width="${app.imageWidth}" height="${app.imageHeight}"`));
    assert.deepEqual(schemaTypes(html).sort(), ['BreadcrumbList','FAQPage','WebApplication']);
    for (const [language, route] of [['en',app.englishRoute],['fr',app.frenchRoute],['sw',app.swRoute]]) {
      assert.match(html, new RegExp(`hreflang="${language}" href="https://afrotools.com${route}"`));
    }
    for (const ownerFile of [app.englishFile, app.frenchFile]) {
      assert.match(read(ownerFile), new RegExp(`hreflang="sw" href="${canonical}"`));
    }
  }
});

test('shared controller fails closed for stale/invalid results and keeps all exports local', () => {
  const source = read('assets/js/pages/sw-water-sanitation-parity.js');
  assert.match(source, /latest = null; panel\.hidden = true; breakdown\.innerHTML = ''; setActions\(false\)/);
  assert.match(source, /form\.addEventListener\('input'.*clear/);
  assert.match(source, /form\.addEventListener\('change'.*clear/);
  assert.match(source, /!report \|\| !report\.ok \|\| !allFinite\(report\)/);
  assert.match(source, /JSON\.stringify\(latest,null,2\)/);
  assert.match(source, /restore\(JSON\.parse\(text\)\)/);
  assert.match(source, /document\.execCommand\('copy'\)/);
  assert.match(source, /UNITS = \{ metres:'m',pcs:'vipande',sets:'seti',unit:'kimoja',days:'siku' \}/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
  for (const app of manifest.apps) {
    const html = read(app.swFile);
    assert.match(html, /data-water-export="copy" disabled/);
    assert.match(html, /data-water-export="json" disabled/);
    assert.match(html, /data-water-export="txt" disabled/);
    assert.match(html, new RegExp(`href="/sw/ai/\\?tool=${app.id}"`));
    assert.match(html, /aria-disabled="true" tabindex="-1"/);
    assert.match(html, /Dhana tuli za kupanga; hakuna bei hai au dai rasmi/);
  }
});

test('owned source scope excludes deploy and broad generated-output churn', () => {
  assert.equal(manifest.scopeCount, 2);
  assert.deepEqual(manifest.apps.map((app) => app.id).sort(), expectedIds);
  assert.ok(allowlist.every(file=>!/sitemap|dist\/|swahili-free-app-parity-inventory|assets\/js\/ai\//.test(file)));
});
