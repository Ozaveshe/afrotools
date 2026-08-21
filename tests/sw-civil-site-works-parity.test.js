'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-civil-site-works-parity-manifest.json');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');

function read(relativePath) { return fs.readFileSync(path.join(ROOT, relativePath), 'utf8'); }
function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) <= Math.max(1e-9, Math.abs(expected) * 1e-12), `${label}: ${actual} != ${expected}`);
}

test('manifest is the exact two-row civil site-works family with accepted Energy exclusions', () => {
  assert.equal(manifest.coordinatorBase, '8354e321ff34caf60a33a3393cd0dcddfb00c023');
  assert.equal(manifest.scopeCount, 2);
  assert.deepEqual(manifest.apps.map((app) => app.id), ['site-clearance', 'road-construction-cost']);
  assert.deepEqual(manifest.excludedAcceptedEnergyIds, ['solar-sizing', 'battery-sizing', 'backup-duration']);
  const counts = Object.fromEntries(['Engineering & Construction', 'Climate & Environment', 'Energy & Utilities'].map((category) => [category, inventory.rows.filter((row) => row.category === category).length]));
  assert.deepEqual(counts, { 'Engineering & Construction': 26, 'Climate & Environment': 13, 'Energy & Utilities': 19 });
  for (const app of manifest.apps) {
    const row = inventory.rows.find((candidate) => candidate.englishId === app.inventoryEnglishId);
    assert.ok(row, `missing inventory row ${app.id}`);
    assert.equal(row.englishRoute.replace(/\/?$/, '/'), app.englishRoute);
    assert.equal(row.category, 'Engineering & Construction');
  }
});

test('maintained DOM-free source and public engines match exact route-specific oracles', () => {
  for (const app of manifest.apps) {
    const sourceEngine = require(path.join(ROOT, app.engineSource));
    const publicEngine = require(path.join(ROOT, app.enginePublic.replace(/^\//, '')));
    for (const [name, engine] of [['source', sourceEngine], ['public', publicEngine]]) {
      const report = engine.calculate(app.oracle.inputs);
      assert.equal(report.ok, true, `${app.id} ${name}`);
      for (const [key, expected] of Object.entries(app.oracle.expected)) {
        if (key === 'comparison') {
          for (const [surface, cost] of Object.entries(expected)) close(report.comparison.find((item) => item.surface === surface).costPerKm, cost, `${app.id}.${name}.${surface}`);
        } else close(report[key], expected, `${app.id}.${name}.${key}`);
      }
      assert.doesNotMatch(JSON.stringify(report), /NaN|Infinity|undefined/);
    }
  }
  assert.deepEqual(require('../engines/src/site-clearing-engine').calculate({ country: 'TZ', area: 0, trees: 0, terrain: 'flat', vegetation: 'light', removeTopsoil: false, demolition: 'none', waste: 'haul' }), { ok: false, error: 'invalid-input' });
  assert.deepEqual(require('../engines/src/road-construction-cost-engine').calculate({ country: 'TZ', length: -1, width: '7.3', surface: 'asphalt', terrain: 'flat', location: 'rural' }), { ok: false, error: 'invalid-input' });
});

test('source owner regenerates both native pages without drift', () => {
  execFileSync(process.execPath, ['scripts/generate-sw-civil-site-works-parity.js', '--check'], { cwd: ROOT, stdio: 'pipe' });
  for (const app of manifest.apps) {
    const html = read(app.swFile);
    assert.match(html, /<html\b[^>]*\blang="sw"[^>]*>/);
    assert.match(html, new RegExp(`data-civil-tool="${app.id}"`));
    assert.doesNotMatch(html, /<iframe|fetch\([^)]*tools\//i);
    const visibleText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visibleText, /\b(?:Calculate|Download|Export|Source|Freshness|Confidence|Planning estimate)\b/i);
    assert.match(html, new RegExp(`<script src="${app.enginePublic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?v=[a-f0-9]{8})?"`));
    assert.match(html, /data-civil-export="copy" disabled>Nakili matokeo/);
    assert.match(html, /data-civil-export="json" disabled>Pakua JSON/);
    assert.match(html, /data-civil-export="txt" disabled>Pakua TXT/);
  }
});

test('pages have canonical, reciprocal English hreflang, artwork, OG and schema', () => {
  for (const app of manifest.apps) {
    const html = read(app.swFile);
    const english = read(app.englishFile);
    const frenchFile = app.frenchRoute.replace(/^\//, '') + 'index.html';
    const french = read(frenchFile);
    const canonical = `https://afrotools.com${app.swRoute}`;
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}"`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${app.englishRoute}"`));
    assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools.com${app.frenchRoute}"`));
    assert.match(english, new RegExp(`hreflang="sw" href="${canonical}"`));
    assert.match(french, new RegExp(`hreflang="sw" href="${canonical}"`));
    assert.match(html, new RegExp(`og:image" content="https://afrotools.com/assets/img/tools/${app.imageId}\\.webp"`));
    assert.ok(fs.statSync(path.join(ROOT, `assets/img/tools/${app.imageId}.webp`)).size > 1000);
    assert.match(html, /"@type":"WebApplication"/);
    assert.match(html, /"@type":"FAQPage"/);
    assert.match(html, /"inLanguage":"sw"/);
  }
});

test('shared controller is lifecycle/export-only and fail-closed against stale results', () => {
  const source = read('assets/js/pages/sw-civil-site-works-parity.js');
  assert.match(source, /root\.AfroTools\.SiteClearingEngine/);
  assert.match(source, /root\.AfroTools\.RoadConstructionCostEngine/);
  assert.match(source, /function finiteReport[\s\S]*function finite\(valueToCheck\)/);
  assert.match(source, /form\.addEventListener\('input',[\s\S]*clearResult/);
  assert.match(source, /form\.addEventListener\('change',[\s\S]*clearResult/);
  assert.match(source, /latest = null[\s\S]*setExports\(false\)/);
  assert.match(source, /if \(!latest\) return/);
  assert.match(source, /navigator\.clipboard[\s\S]*writeText\(text\)/);
  assert.match(source, /function fallbackCopy[\s\S]*document\.execCommand\('copy'\)/);
  assert.match(source, /JSON imefunguliwa na matokeo yamekokotolewa upya/);
  assert.doesNotMatch(source, /['"`](?:Calculate|Download|Export|Source|Freshness|Confidence|Planning estimate)\b/i);
  assert.doesNotMatch(source, /veg_light|drainage_pct|terrain_rolling|587125000|28110000/);
});

test('source/freshness/confidence, planning, privacy and consent boundaries are visible', () => {
  for (const app of manifest.apps) {
    const html = read(app.swFile);
    assert.match(html, /Chanzo, ubichi na uhakika/);
    assert.match(html, /Mabadiliko ya mwisho ya injini katika hazina: 2026-07-30/);
    assert.match(html, /Hii si uthibitisho wa bei za soko/);
    assert.match(html, /Viwango tuli vya kupanga; hakuna bei hai au dai rasmi/);
    assert.match(html, /Uhakika[\s\S]*Chini kwa ununuzi/);
    assert.match(html, /id="ai-consent"/);
    assert.match(html, new RegExp(`/sw/ai/\\?tool=${app.id}`));
    assert.match(html, /maingizo na matokeo hayatatumwa/);
  }
});

test('manifest keeps the immutable coordinator base and every declared physical owner', () => {
  assert.equal(manifest.coordinatorBase, '8354e321ff34caf60a33a3393cd0dcddfb00c023');
  for (const app of manifest.apps) {
    assert.equal(fs.existsSync(path.join(ROOT, app.swFile)), true, app.swFile);
    assert.equal(fs.existsSync(path.join(ROOT, app.englishFile)), true, app.englishFile);
    assert.equal(fs.existsSync(path.join(ROOT, app.frenchRoute.replace(/^\//, '') + 'index.html')), true, app.frenchRoute);
  }
});
