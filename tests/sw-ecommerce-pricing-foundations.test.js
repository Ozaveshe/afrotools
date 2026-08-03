'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-ecommerce-parity-manifest.json');
const receipt = require('../reports/sw-ecommerce-acceptance/pricing-foundations.json');
const swRouteMap = require('../assets/js/ai/swahili-route-map.generated.js');
const swAiEntry = require('../assets/js/pages/sw-ai-route-entry.js');

const EXPECTED = Object.freeze({
  'profit-margin': {
    english: '/tools/profit-margin/',
    swahili: '/sw/zana/kikokotoo-margin-ya-faida/',
    engine: 'assets/js/engines/profit-margin.js',
    controller: 'assets/js/pages/profit-margin-vip.js'
  },
  'markup-calc': {
    english: '/tools/markup-calc/',
    swahili: '/sw/zana/kikokotoo-markup/',
    engine: 'assets/js/engines/markup-selling-price.js',
    controller: 'assets/js/pages/markup-calc-vip.js'
  },
  'discount-calc': {
    english: '/tools/discount-calc/',
    swahili: '/sw/zana/kikokotoo-discount/',
    engine: 'assets/js/engines/discount-planner.js',
    controller: 'assets/js/pages/discount-planner.js'
  }
});

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function absolute(route) {
  return `https://afrotools.com${route}`;
}

test('pricing foundations owns exactly three maintained Swahili app routes', () => {
  const rows = manifest.rows.filter(row => row.family === 'pricing-foundations');
  assert.deepEqual(rows.map(row => row.english.id), Object.keys(EXPECTED));
  for (const row of rows) {
    const expected = EXPECTED[row.english.id];
    assert.equal(row.english.route, expected.english);
    assert.equal(row.swahili.route, expected.swahili);
    assert.deepEqual(row.owners.englishEngine, [expected.engine]);
    assert.deepEqual(row.owners.englishController, [expected.controller]);
    assert.ok(row.swahili.maintainedRuntimeOwners.includes(expected.engine));
    assert.ok(row.swahili.maintainedRuntimeOwners.includes(expected.controller));
    assert.equal(row.swahili.ownerState, 'mapped-accepted-scoped');
    assert.equal(row.acceptance.state, 'accepted-scoped');
  }
});

test('canonical, OG, artwork and reciprocal hreflang contracts are complete', () => {
  for (const [id, expected] of Object.entries(EXPECTED)) {
    const row = manifest.rows.find(item => item.english.id === id);
    const englishHtml = read(row.english.file);
    const swahiliHtml = read(row.swahili.file);
    assert.match(englishHtml, new RegExp(`<link rel=["']canonical["'] href=["']${absolute(expected.english)}["']`));
    assert.match(swahiliHtml, new RegExp(`<link rel=["']canonical["'] href=["']${absolute(expected.swahili)}["']`));
    assert.ok(englishHtml.includes(`hreflang="sw" href="${absolute(expected.swahili)}"`));
    assert.ok(swahiliHtml.includes(`hreflang="en" href="${absolute(expected.english)}"`));
    assert.ok(swahiliHtml.includes(`property="og:url" content="${absolute(expected.swahili)}"`));
    assert.ok(swahiliHtml.includes(`property="og:image" content="https://afrotools.com/${row.artwork.file}"`));
    assert.equal(row.artwork.state, 'present');
    assert.equal(fs.existsSync(path.join(ROOT, row.artwork.file)), true);
  }
});

test('coordinator-accepted pricing routes are present in the central Swahili AI map', () => {
  for (const [id, expected] of Object.entries(EXPECTED)) {
    const row = manifest.rows.find(item => item.english.id === id);
    const context = JSON.parse(read(`data/ai/tool-context/${id}.json`));
    assert.equal(context.toolKey, id);
    assert.equal(row.aiRouting.englishContext, `data/ai/tool-context/${id}.json`);
    assert.equal(row.aiRouting.scopedRoute, expected.swahili);
    assert.equal(row.aiRouting.state, 'central-accepted');
    assert.equal(swRouteMap.ids[id], expected.swahili);
    assert.equal(swAiEntry.resolveToolRoute(id, swRouteMap), expected.swahili);
  }
});

test('controllers remain local, deterministic and sponsor independent', () => {
  for (const expected of Object.values(EXPECTED)) {
    const source = read(expected.controller);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
    assert.doesNotMatch(source, /sponsor|affiliate|partner ranking/i);
  }
});

test('family receipt preserves the independent proof used by coordinator acceptance', () => {
  assert.equal(receipt.coordinatorBaseSha, manifest.coordinatorBaseSha);
  assert.equal(receipt.acceptedRows, 3);
  assert.equal(receipt.remainingRows, 60);
  assert.deepEqual(receipt.englishIds, Object.keys(EXPECTED));
  assert.deepEqual(receipt.swahiliRoutes, Object.values(EXPECTED).map(item => item.swahili));
  assert.equal(receipt.aiRouting.centralFilesChanged, false);
  assert.equal(receipt.aiRouting.centralSwahiliRouteMap, 'intentionally-fail-closed-pending-coordinator-integration');
  assert.equal(receipt.proof.staticAcceptance.passed, 8);
  assert.equal(receipt.proof.scopedBrowser.passed, 5);
  assert.equal(receipt.proof.legacyBrowser.passed, 33);
  assert.equal(receipt.proof.legacyBrowser.result, 'pass');
  for (const id of Object.keys(EXPECTED)) {
    const minimum = receipt.proof.computedContrastMinima[id];
    assert.ok(minimum.text >= 4.5, `${id} text contrast receipt`);
    assert.ok(minimum.controlBoundary >= 3, `${id} control boundary contrast receipt`);
    assert.ok(minimum.focusIndicator >= 3, `${id} focus contrast receipt`);
  }
  assert.equal(receipt.status, 'accepted-scoped');
});
