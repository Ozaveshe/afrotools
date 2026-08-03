'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/seed-rate');
const rows = manifest.rows.filter(row => row.family === 'seed-rate');
const countryRows = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);

function loadRuntime(code, engineFile) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  [
    `data/agriculture/${code.toLowerCase()}-agri-data.js`,
    'data/agriculture/seed-data.js',
    engineFile,
    'data/agriculture/seed-data-extension.js'
  ].forEach(relative => vm.runInContext(
    fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, { filename: relative }
  ));
  return sandbox.window.AfroTools;
}

function stable(value) { return JSON.parse(JSON.stringify(value)); }

function oracle(runtime, code) {
  const data = runtime.countryData;
  const crop = data.crops.find(candidate => runtime.seedData[candidate.id]);
  assert.ok(crop, `${code} has no country crop represented by the maintained seed data`);
  const seed = runtime.seedData[crop.id];
  const override = seed.countryOverrides && seed.countryOverrides[code] || {};
  const spacing = override.spacing || seed.defaultSpacing || {};
  const input = {
    cropId: crop.id,
    farmSizeHa: data.agriStats.avgFarmSizeHa || 1,
    seedQuality: 'improved',
    fieldConditions: 'average',
    intercrop: 'sole',
    plantingMethod: override.method || seed.plantingMethod && seed.plantingMethod[0] || 'drilling',
    rowSpacing_cm: spacing.row_cm || 100,
    plantSpacing_cm: spacing.plant_cm === 'continuous' ? 10 : spacing.plant_cm || 100,
    seedsPerHole: override.seedsPerHole || seed.seedsPerHole || 1
  };
  return { input, result: runtime.SeedRateEngine.calculate(input, runtime.seedData, code, data) };
}

test('Swahili Seed Rate owns exactly 55 native physical routes', () => {
  assert.equal(rows.length, 55);
  assert.equal(countryRows.length, 54);
  assert.ok(hub);
  const html = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
  assert.equal((html.match(/<li><a href="\/sw\/kilimo\/kiwango-cha-mbegu\//g) || []).length, 54);
  assert.match(html, /<html\b[^>]*\blang="sw"/);
  assert.match(html, /data-seed-rate-family/);
  assert.match(html, /--seed-control-border:#63758a/);
  assert.match(html, /--seed-focus:#075eb8/);
  assert.match(html, /Hakuna ingizo linalotumwa kwa seva au AI/);
  assert.match(html, /Vyanzo, upya na kiwango cha uhakika/);
  assert.match(html, /Taarifa za FAO kuhusu zao la nyanya/);
  assert.match(html, /href="https:\/\/www\.cgiar\.org\/"/);
  assert.match(html, /href="https:\/\/data\.worldbank\.org\/"/);
  assert.match(html, /yamesasishwa mwaka 2026; si data ya moja kwa moja/);
  assert.match(html, /Makadirio ya kupanga tu/);
  assert.doesNotMatch(html, /Data sources|Tomato planning parameters also reference|FAO crop information|World Bank/i);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
});

for (const row of countryRows) {
  test(`${row.english.id}: English-owner oracle, route, privacy and source contracts`, () => {
    const code = row.country.code;
    const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
    const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
    assert.match(html, /<html\b[^>]*\blang="sw"/);
    assert.match(html, /data-seed-rate-family/);
    assert.match(html, /--seed-control-border:#8297b0/);
    assert.match(html, /--seed-focus:#75b8ff/);
    assert.match(html, /window\.__SW_AGRI_PAGE__/);
    assert.match(html, new RegExp(`/data/agriculture/${code.toLowerCase()}-agri-data\\.js`));
    assert.match(html, /\/data\/agriculture\/seed-data\.js/);
    assert.match(html, /\/data\/agriculture\/seed-data-extension\.js/);
    assert.match(html, /\/engines\/seed-rate-engine\.js/);
    assert.match(html, /\/assets\/js\/pages\/sw-seed-rate-controller\.js/);
    assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(|window\.__FR_AGRI_PAGE__|<html\b[^>]*\blang="fr"/i);
    ['crop', 'farmSize', 'quality', 'conditions', 'intercrop', 'method', 'rowSpacing', 'plantSpacing', 'seedsPerHole'].forEach(id => {
      assert.match(html, new RegExp(`id="${id}"`));
      assert.match(html, new RegExp(`label for="${id}"`));
    });
    ['Nakili', 'Shiriki', 'Hifadhi kwenye kivinjari hiki', 'Pakua PDF', 'Pakua CSV', 'Pakua JSON', 'Pakua TXT', 'Weka upya'].forEach(label => {
      assert.ok(html.includes(label), `${code} is missing ${label}`);
    });
    assert.match(html, /Hakuna ingizo linalotumwa kwa seva/);
    assert.match(html, /kikokotoo hiki hakitumi AI/);
    const metadata = contract.sourceMetadata(row, row.country.swahiliName);
    const englishSourceFooter = english.match(/<div class="sources-footer">([\s\S]*?)<\/div>/i);
    const linkedEnglishSources = [...englishSourceFooter[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    assert.equal(metadata.links.length, linkedEnglishSources.length);
    assert.equal(metadata.links.length, 1);
    assert.equal(metadata.links[0].href, linkedEnglishSources[0][1]);
    assert.equal(metadata.links[0].label, 'Taarifa za FAO kuhusu zao la nyanya');
    if (code === 'NG') {
      assert.match(metadata.source, /Baraza la Taifa la Mbegu za Kilimo la Nigeria \(NASC\)/);
      assert.match(metadata.source, /IITA/);
      assert.match(metadata.source, /Ofisi ya Taifa ya Takwimu ya Nigeria/);
    } else {
      assert.match(metadata.source, new RegExp(`mamlaka ya kitaifa ya kilimo ya ${row.country.swahiliName}`));
    }
    assert.match(metadata.source, /Benki ya Dunia/);
    assert.match(html, new RegExp(`href="${metadata.links[0].href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /Taarifa za FAO kuhusu zao la nyanya/);
    const visibleText = html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visibleText, /\b(?:calculate|result|export|save|copy|share|privacy|freshness|confidence|select|reset|download|seed rate)\b/i);
    assert.doesNotMatch(visibleText, /Data sources|Tomato planning parameters also reference|also reference|FAO crop information|crop guidance|national agricultural authority|World Bank/i);
    if (code === 'NG') assert.match(visibleText, /Mwongozo wa mazao wa FAO, Baraza la Taifa la Mbegu/);
    else assert.match(visibleText, /Mwongozo wa mazao wa FAO, CGIAR/);
    assert.match(visibleText, /Vigezo vya kupanga nyanya pia vinarejelea/);
    assert.match(visibleText, /Data ilivyopitiwa/);
    assert.match(visibleText, /Uhakika/);
    assert.match(html, /href="\/sw\/ai\/"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${row.swahili.routeKey}">`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${row.english.route}"`));
    assert.match(html, new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili.routeKey}"`));
    assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
    assert.ok(french.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
    assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)));
    assert.ok(html.includes(row.artwork.file));

    const source = loadRuntime(code, 'engines/src/seed-rate-engine.js');
    const browser = loadRuntime(code, 'engines/seed-rate-engine.js');
    const sourceOracle = oracle(source, code);
    const browserOracle = oracle(browser, code);
    assert.equal(sourceOracle.result.error, undefined);
    assert.deepEqual(stable(browserOracle), stable(sourceOracle));
    assert.equal(sourceOracle.result.countryCode, code);
    assert.ok(contract.CROP_NAMES[sourceOracle.input.cropId], `${code} lacks native crop copy`);
    if (sourceOracle.result.propagation === 'seed') {
      assert.ok(sourceOracle.result.totalSeedKg > 0);
      assert.equal(sourceOracle.result.currency, source.countryData.currency);
    } else {
      assert.ok(sourceOracle.result.totalPlants > 0);
    }
    if (sourceOracle.input.cropId === 'tomato') assert.equal(sourceOracle.result.numBags, null);
  });
}

test('Seed Rate source owner and browser controller remain DOM/network separated', () => {
  const engine = fs.readFileSync(path.join(ROOT, 'engines/src/seed-rate-engine.js'), 'utf8');
  const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-seed-rate-controller.js'), 'utf8');
  assert.doesNotMatch(engine, /\bdocument\b|querySelector|getElementById|\bfetch\s*\(/);
  assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  assert.match(controller, /sentToServer:\s*false/);
  assert.match(controller, /sentToAI:\s*false/);
  assert.match(controller, /modelConsentHandledOnSeparatePage:\s*true/);
});
