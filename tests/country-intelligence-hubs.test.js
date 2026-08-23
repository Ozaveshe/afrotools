'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'registry', 'country-intelligence-hubs.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'country-intelligence-hubs.json'), 'utf8'));

test('wave 1 contains the five strongest requested hubs and all ten utility areas', () => {
  assert.deepEqual(config.countries.map((country) => country.code), ['NG', 'KE', 'GH', 'ZA', 'TZ']);
  assert.equal(config.areaOrder.length, 10);
  for (const country of config.countries) {
    assert.deepEqual(Object.keys(country.areas), config.areaOrder);
    for (const areaId of config.areaOrder) {
      assert.ok(country.areas[areaId].links.length > 0, `${country.code}/${areaId} must not be empty`);
    }
  }
});

test('every generated hub exposes crawlable lanes, freshness, coverage, and missing areas', () => {
  for (const country of config.countries) {
    const html = fs.readFileSync(path.join(ROOT, country.slug, 'index.html'), 'utf8');
    assert.match(html, /<!-- country-intelligence-hub:start -->/);
    assert.match(html, new RegExp(`data-country-intelligence="${country.code}"`));
    assert.match(html, /What AfroTools has for/);
    assert.match(html, /Live market data/);
    assert.match(html, /What is still missing/);
    assert.equal((html.match(/class="country-intelligence__area"/g) || []).length, 10);
    assert.ok((html.match(/class="country-intelligence__link"/g) || []).length >= 20);
    assert.match(html, /assets\/css\/country-intelligence-hub\.css/);
  }
});

test('coverage report measures the five hubs and queues the remaining priority countries', () => {
  assert.equal(report.implemented.length, 5);
  assert.deepEqual(report.expansionQueue.map((country) => country.code), ['UG', 'CI', 'SN']);
  const counts = report.implemented.map((country) => country.countryTaggedLiveTools);
  assert.deepEqual([...counts].sort((a, b) => b - a), counts, 'implemented hubs should remain ranked by live-tool depth');
  for (const country of report.implemented) {
    assert.ok(country.coverageScore >= 40 && country.coverageScore <= 100);
    assert.equal(country.strongAreas + country.usefulAreas.length + country.sharedOnlyAreas.length, 10);
    assert.ok(country.nextExpansion.length > 0);
  }
});
