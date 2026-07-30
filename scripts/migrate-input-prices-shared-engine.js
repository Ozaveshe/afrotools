#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const ENGINE_TAG = '<script src="/engines/input-prices-engine.js"></script>';
const CONTROLLER_TAG = '<script src="/assets/js/pages/input-prices-controller.js"></script>';

function countryRows() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const rows = manifest.rows.filter(row => row.family === 'input-prices' && row.country);
  assert.equal(rows.length, 15, 'Expected exactly 15 Input Prices country calculators');
  return rows;
}

function legacyController(html, file) {
  const match = html.match(/<script>\s*(var COUNTRY\s*=\s*"[A-Z]{2}";[\s\S]*?function runComparison\s*\([\s\S]*?)<\/script>/);
  assert(match, `Legacy Input Prices controller not found in ${file}`);
  return { full: match[0], source: match[1] };
}

function qualityHtml(controller, file) {
  const marker = "document.getElementById('qualityTip').innerHTML";
  const start = controller.lastIndexOf(marker);
  assert(start >= 0, `Quality note assignment not found in ${file}`);
  const assignment = controller.slice(start);
  const equals = assignment.indexOf('=');
  const end = assignment.lastIndexOf(';');
  assert(equals >= 0 && end > equals, `Quality note assignment is malformed in ${file}`);
  return vm.runInNewContext(`(${assignment.slice(equals + 1, end).trim()})`, Object.create(null));
}

function migrate(row) {
  const relativeFile = row.english.file;
  const absoluteFile = path.join(ROOT, relativeFile);
  let html = fs.readFileSync(absoluteFile, 'utf8');
  if (html.includes(ENGINE_TAG) && html.includes(CONTROLLER_TAG)) {
    return { file: relativeFile, state: 'unchanged' };
  }

  const legacy = legacyController(html, relativeFile);
  const countryMatch = legacy.source.match(/var COUNTRY\s*=\s*"([A-Z]{2})";/);
  const formatMatch = legacy.source.match(/var fmt\s*=\s*function\(n\)\{[\s\S]*?\};/);
  assert(countryMatch && formatMatch, `Country/currency formatter not found in ${relativeFile}`);
  assert.equal(countryMatch[1], row.country.code, `Manifest/page country mismatch in ${relativeFile}`);

  const compact = legacy.source.replace(/\s+/g, '');
  const perKgDecimals = compact.includes('.toFixed(0)') ? 0 : 1;
  const seedSortStrategy = compact.includes('a.price/a.bag_kg||a.price')
    ? 'legacy-post-division-fallback'
    : 'pack-fallback-25';
  const note = qualityHtml(legacy.source, relativeFile);
  const replacement = [
    ENGINE_TAG,
    '<script>',
    `var COUNTRY = ${JSON.stringify(row.country.code)};`,
    formatMatch[0],
    'window.INPUT_PRICES_PAGE_CONFIG = {',
    '  countryCode: COUNTRY,',
    '  formatAmount: fmt,',
    `  engineBehavior: ${JSON.stringify({ fertilizerPerKgDecimals: perKgDecimals, seedSortStrategy })},`,
    `  qualityHtml: ${JSON.stringify(note)}`,
    '};',
    '</script>',
    CONTROLLER_TAG,
  ].join('\n');

  html = html.replace(legacy.full, replacement);
  assert(html.includes(ENGINE_TAG) && html.includes(CONTROLLER_TAG), `Shared engine wiring failed in ${relativeFile}`);
  assert(!/\bfunction\s+runComparison\s*\(/.test(html), `Legacy formula controller remains in ${relativeFile}`);
  fs.writeFileSync(absoluteFile, html);
  return {
    file: relativeFile,
    state: 'migrated',
    countryCode: row.country.code,
    engineBehavior: { fertilizerPerKgDecimals: perKgDecimals, seedSortStrategy },
  };
}

const results = countryRows().map(migrate);
assert.equal(results.length, 15);
console.log(JSON.stringify({
  engine: 'engines/src/input-prices-engine.js',
  controller: 'assets/js/pages/input-prices-controller.js',
  pages: results,
}, null, 2));
