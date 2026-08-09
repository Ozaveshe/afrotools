'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const directory = require('../assets/js/pages/paye-country-directory.js');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pagePath = route => {
  const clean = route.replace(/^\//, '').replace(/\/$/, '');
  const asDirectory = path.join(root, clean, 'index.html');
  if (fs.existsSync(asDirectory)) return asDirectory;
  const asHtml = path.join(root, clean + '.html');
  return fs.existsSync(asHtml) ? asHtml : null;
};

test('paye-calculator is a distinct route-only directory product', () => {
  const inventory = JSON.parse(read('reports/swahili-free-app-parity-inventory.json'));
  const row = inventory.rows.find(item => item.englishId === 'paye-calculator');
  assert.equal(row.englishRoute, '/tools/paye-calculator');
  assert.equal(row.primarySwahiliRoute, '/sw/mshahara-na-kodi/paye');
  assert.equal(directory.countries.length, 54);
  assert.equal(directory.countries.filter(country => country.route).length, 54);
});

test('all 54 Swahili destinations are physical, localized owners', () => {
  const routes = new Set();
  for (const country of directory.countries) {
    const resolved = directory.resolveCountry(country.code, 'sw');
    assert.ok(resolved.supported, country.code + ' must be supported');
    assert.ok(resolved.localized, country.code + ' must use a Swahili route');
    assert.match(resolved.route, /^\/sw\//);
    assert.ok(!routes.has(resolved.route), resolved.route + ' must be unique');
    routes.add(resolved.route);
    const file = pagePath(resolved.route);
    assert.ok(file, resolved.route + ' must resolve to a physical owner');
    assert.match(fs.readFileSync(file, 'utf8'), /<html[^>]+lang="sw"/i, resolved.route + ' must declare Swahili');
  }
  assert.equal(routes.size, 54);
});

test('Swahili owner is directory-only, local-first and SEO reciprocal', () => {
  const sw = read('sw/mshahara-na-kodi/paye/index.html');
  const en = read('tools/paye-calculator/index.html');
  const fr = read('fr/tools/calculateur-paye/index.html');
  for (const html of [sw, en, fr]) {
    assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/paye-calculator\/"/);
    assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/calculateur-paye\/"/);
    assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/mshahara-na-kodi\/paye\/"/);
    assert.match(html, /hreflang="x-default" href="https:\/\/afrotools\.com\/tools\/paye-calculator\/"/);
  }
  assert.match(sw, /"@type":"CollectionPage"/);
  assert.match(sw, /"numberOfItems":54/);
  assert.doesNotMatch(sw, /type="number"|gross salary|mshahara wako|data-action="(?:pdf|csv|json)"/i);
  assert.match(sw, /PDF, CSV au JSON haitolewi hapa/);
  assert.match(sw, /paye-tax-engine-country-packs/);
  assert.match(read('salary-tax/paye/index.html'), /hreflang="en" href="https:\/\/afrotools\.com\/salary-tax\/paye\/"/);
  assert.doesNotMatch(read('salary-tax/paye/index.html'), /hreflang="sw"/);
  assert.doesNotMatch(read('fr/salary-tax/paye/index.html'), /hreflang="sw"/);
});

test('source ledger is reviewed inside cadence and makes no official assessment claim', () => {
  const registry = JSON.parse(read('data/source-registry.json'));
  const source = registry.sources.find(item => item.id === 'paye-tax-engine-country-packs');
  assert.equal(source.lastCheckedAt, '2026-06-14');
  assert.equal(source.lastReviewedAt, '2026-06-14');
  assert.equal(source.reviewCadenceDays, 90);
  assert.equal(source.confidence, 'reviewed');
  assert.match(source.displayDisclaimer, /planning estimates/i);
});

test('source owner regenerates the same pages', () => {
  const tracked = ['tools/paye-calculator/index.html', 'fr/tools/calculateur-paye/index.html', 'sw/mshahara-na-kodi/paye/index.html', 'salary-tax/paye/index.html', 'fr/salary-tax/paye/index.html'];
  const before = new Map(tracked.map(file => [file, read(file)]));
  childProcess.execFileSync(process.execPath, ['scripts/build-sw-paye-country-directory.js'], {cwd: root, stdio: 'pipe'});
  for (const file of tracked) assert.equal(read(file), before.get(file), file + ' must regenerate deterministically');
});
