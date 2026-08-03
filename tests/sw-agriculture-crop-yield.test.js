'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/crop-yield');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const rows = manifest.rows.filter(row => row.family === 'crop-yield');
const countries = rows.filter(row => row.country);

function loadSharedEngine() {
  const sandbox = { window: { AfroTools: {} } };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  for (const relative of ['data/agriculture/crop-database.js', 'engines/src/crop-yield-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, { filename: relative });
  }
  return sandbox.window.AfroTools;
}

test('Crop Yield owns one Swahili hub and 54 country applications', () => {
  assert.equal(rows.length, 55);
  assert.equal(countries.length, 54);
  assert.equal(new Set(rows.map(row => row.swahili.route)).size, 55);
  assert.equal(rows.filter(row => row.artwork.state === 'present').length, 55);
});

test('all Crop Yield routes are native Swahili, source-owned and route-correct', () => {
  for (const row of rows) {
    const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    assert.match(html, /<html\b[^>]*\blang="sw"/);
    assert.match(html, new RegExp(`https://afrotools.com${row.swahili.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(html, new RegExp(row.artwork.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(|window\.__FR_AGRI_PAGE__|content-language" content="fr"/i);
    assert.doesNotMatch(html, /\b(?:Calculer|Choisissez|Confidentialité|Exporter|Rendement)\b/);
    const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
    const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
    assert.match(
      english,
      new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)
    );
    assert.match(
      french,
      new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)
    );
    assert.match(
      html,
      new RegExp(`hreflang="fr" href="https://afrotools.com${row.french.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)
    );
    if (row.country) {
      assert.match(html, /\/engines\/crop-yield-engine\.js/);
      assert.match(html, /window\.__SW_AGRI_TEST__/);
      assert.match(html, new RegExp(row.country.swahiliName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(html, /Pakua PDF/);
      assert.match(html, /Pakua CSV/);
      assert.match(html, /Pakua JSON/);
      assert.match(html, /Pakua TXT/);
    }
  }
});

test('all 54 country datasets execute through the shared Crop Yield engine', () => {
  const shared = loadSharedEngine();
  assert.equal(typeof shared.CropYieldEngine.calculate, 'function');
  for (const row of countries) {
    const data = contract.loadCountryData(row.country.code);
    const crop = data.crops[0];
    const region = data.regions[0];
    const season = data.seasons.find(item => (
      !item.applicableRegions || item.applicableRegions.includes(region.id)
    )) || data.seasons[0];
    const result = shared.CropYieldEngine.calculate({
      countryCode: row.country.code,
      cropId: crop.id,
      regionId: region.id,
      farmSizeHa: Number(data.agriStats.avgFarmSizeHa || 1),
      soilType: region.soilTypes[0],
      irrigationType: 'rainfed',
      fertilizerUsage: 'moderate_inorganic',
      seedType: 'local_variety',
      season: season.id
    }, data, shared.cropDatabase);
    assert.equal(result.error, undefined, `${row.english.id} returned ${result.error}`);
    assert.equal(result.cropId, crop.id);
    assert.ok(result.estimatedYieldPerHa > 0);
    assert.ok(result.totalEstimatedYield > 0);
    assert.ok(Number.isFinite(result.revenueEstimate.mid));
    assert.equal(contract.CROPS[crop.id] != null, true, `Missing crop label ${crop.id}`);
    for (const soil of region.soilTypes) {
      assert.equal(contract.SOILS[soil] != null, true, `Missing soil label ${soil}`);
    }
  }
});

test('Crop Yield manifest is the scoped Swahili AI route owner', () => {
  for (const row of rows) {
    assert.equal(row.ai.state, 'manifest-mapped');
    assert.equal(row.ai.mappedRoute, row.swahili.route);
  }
});
