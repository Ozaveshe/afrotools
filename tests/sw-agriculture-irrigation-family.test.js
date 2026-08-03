'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/irrigation');
const frenchManifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const { alternateEntries } = require('../scripts/lib/fr-agriculture-hreflang');
const rows = manifest.rows.filter((row) => row.family === 'irrigation');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const expectedIds = rows.map((row) => row.english.id);
const frenchById = new Map(frenchManifest.rows.map((row) => [row.english.id, row.french]));

function runtime(code, engineFile) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  [
    'data/agriculture/crop-database.js',
    `data/agriculture/${code.toLowerCase()}-agri-data.js`,
    engineFile,
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox.window.AfroTools;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('Swahili Irrigation owns exactly 55 native routes with one 54-country hub', () => {
  assert.equal(rows.length, 55);
  assert.equal(countries.length, 54);
  assert.ok(hub);
  const html = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
  assert.equal((html.match(/<li><a href="\/sw\/kilimo\/umwagiliaji\//g) || []).length, 54);
  assert.match(html, /<html lang="sw"/);
  assert.match(html, /<a class="skip-link skip-main-link" href="#contenu">Ruka hadi maudhui<\/a>/);
  assert.match(html, /data-ai-routing="irrigation-calculator"/);
  assert.match(html, /data-ai-consent="required-before-model-send"/);
  assert.doesNotMatch(html, /<iframe\b|window\.__FR_AGRI_PAGE__|english-html-fetch/i);
  assert.equal(new Set(expectedIds).size, 55);
  rows.forEach((row) => {
    const routeHtml = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    assert.equal(row.ai.owner, 'data/localization/sw-agriculture-parity-manifest.json');
    assert.equal(row.ai.mappedRoute, row.swahili.route);
    assert.ok(routeHtml.includes(`content="${row.english.id}"`));
    assert.match(routeHtml, /data-ai-routing="irrigation-calculator"/);
    assert.match(routeHtml, /data-ai-consent="required-before-model-send"/);
  });
});

test('all 26 reviewed region descriptors have explicit Swahili owners', () => {
  assert.equal(Object.keys(contract.REGION_LABELS).length, 26);
  const allRegionIds = new Set(countries.flatMap((row) => (
    contract.loadCountryData(row.country.code).regions.map((region) => region.id)
  )));
  Object.entries(contract.REGION_LABELS).forEach(([id, label]) => {
    assert.ok(allRegionIds.has(id), `Unknown reviewed region ID ${id}.`);
    assert.doesNotMatch(label, /\b(?:Northern|Southern|Eastern|Western|Central|Highlands?|Lowlands?|Coast(?:al)?|Inland|Outer islands?|River|Foothills?)\b/i);
  });
});

test('all country routes preserve exact engine, country data, sources, artwork and reciprocal metadata', () => {
  const oracleRows = [{
    englishId: hub.english.id,
    englishRoute: hub.english.routeKey,
    swahiliRoute: hub.swahili.routeKey,
    kind: 'hub',
    validOracle: { countryLinks: 54 },
    invalidOracle: { unsupportedCountryRoutes: 0 },
    exports: { applicable: false, reason: 'The family hub has no result export.' },
  }];

  for (const row of countries) {
    const code = row.country.code;
    const swahili = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
    const frenchOwner = frenchById.get(row.english.id);
    const french = fs.readFileSync(path.join(ROOT, frenchOwner.file), 'utf8');
    const publicRuntime = runtime(code, 'engines/irrigation-engine.js');
    const sourceRuntime = runtime(code, 'engines/src/irrigation-engine.js');
    const data = publicRuntime.countryData;
    const supported = data.crops.filter((crop) => (
      crop.cropCoefficients
      || (publicRuntime.cropDatabase.crops[crop.id]
        && publicRuntime.cropDatabase.crops[crop.id].cropCoefficients)
    ));
    assert.ok(supported.length, `${code} has no crop supported by the shared engine.`);
    supported.forEach((crop) => {
      assert.ok(contract.CROP_NAMES[crop.id], `${code} lacks a Swahili crop label for ${crop.id}.`);
    });

    const input = {
      cropId: supported[0].id,
      regionId: data.regions[0].id,
      farmSizeHa: data.agriStats.avgFarmSizeHa || 1,
      irrigationMethod: 'furrow',
      month: 0,
      growthStage: 'flowering',
    };
    const publicValid = plain(publicRuntime.IrrigationEngine.calculate(
      input,
      data,
      publicRuntime.cropDatabase.crops
    ));
    const sourceValid = plain(sourceRuntime.IrrigationEngine.calculate(
      input,
      sourceRuntime.countryData,
      sourceRuntime.cropDatabase.crops
    ));
    const invalidRegionInput = { ...input, regionId: `invalid-${code}` };
    const invalidCropInput = { ...input, cropId: `invalid-${code}` };
    const invalidRegion = plain(publicRuntime.IrrigationEngine.calculate(
      invalidRegionInput,
      data,
      publicRuntime.cropDatabase.crops
    ));
    const invalidCrop = plain(publicRuntime.IrrigationEngine.calculate(
      invalidCropInput,
      data,
      publicRuntime.cropDatabase.crops
    ));

    assert.deepEqual(publicValid, sourceValid, `${code} public/source engine drift.`);
    assert.equal(publicValid.error, false);
    assert.equal(publicValid.mode, 'season');
    assert.ok(publicValid.totalWater_m3 >= 0);
    assert.ok(publicValid.dailyAvgVolume_m3 >= 0);
    assert.equal(invalidRegion.error, true);
    assert.equal(invalidCrop.error, true);
    assert.match(invalidRegion.message, /Region not found/);
    assert.match(invalidCrop.message, /Crop not found/);
    const monthlyInput = { ...input, month: 7, growthStage: 'flowering' };
    const monthly = plain(publicRuntime.IrrigationEngine.calculate(
      monthlyInput,
      data,
      publicRuntime.cropDatabase.crops
    ));
    assert.equal(monthly.error, false);
    assert.equal(monthly.mode, 'single');
    assert.equal(monthly.month, 7);
    const methodBoundaries = ['flood', 'furrow', 'bucket', 'sprinkler', 'drip'].map(
      (irrigationMethod) => plain(publicRuntime.IrrigationEngine.calculate(
        { ...monthlyInput, irrigationMethod },
        data,
        publicRuntime.cropDatabase.crops
      ))
    );
    assert.deepEqual(methodBoundaries.map((result) => result.efficiencyPercent), [40, 55, 60, 75, 90]);
    assert.deepEqual(
      methodBoundaries.map((result) => result.monthVolume_m3),
      methodBoundaries.map((result) => result.monthVolume_m3).sort((left, right) => right - left)
    );

    assert.match(swahili, /<html lang="sw"/);
    assert.match(swahili, /\/engines\/irrigation-engine\.js/);
    assert.ok(swahili.includes(`/data/agriculture/${code.toLowerCase()}-agri-data.js`));
    assert.ok(swahili.includes(`content="${code}"`));
    assert.ok(swahili.includes(`content="${row.english.id}"`));
    assert.ok(swahili.includes(`https://afrotools.com${row.swahili.route}`));
    assert.ok(swahili.includes(`hreflang="en" href="https://afrotools.com${row.english.route}"`));
    assert.ok(swahili.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
    assert.ok(swahili.includes(row.artwork.file));
    assert.ok(english.includes(
      `hreflang="sw" href="https://afrotools.com${row.swahili.route}"`
    ));
    const mesh = alternateEntries({ ...row, french: frenchOwner });
    for (const { hreflang, route } of mesh) {
      const link = `hreflang="${hreflang}" href="https://afrotools.com${route}"`;
      assert.ok(swahili.includes(link), `${row.english.id} Swahili mesh lacks ${hreflang}.`);
      assert.ok(english.includes(link), `${row.english.id} English mesh lacks ${hreflang}.`);
      assert.ok(french.includes(link), `${row.english.id} French mesh lacks ${hreflang}.`);
    }
    if (code === 'NG') {
      const hausa = fs.readFileSync(path.join(ROOT, 'ha/noma/ban-ruwa-najeriya/index.html'), 'utf8');
      for (const { hreflang, route } of mesh) {
        assert.ok(hausa.includes(`hreflang="${hreflang}" href="https://afrotools.com${route}"`));
      }
    }
    assert.match(swahili, /data-ai-routing="irrigation-calculator"/);
    assert.match(swahili, /data-ai-consent="required-before-model-send"/);
    assert.match(
      swahili,
      /<caption class="visually-hidden">Ulinganisho wa njia za umwagiliaji na matumizi ya maji<\/caption>/
    );
    assert.match(swahili, /<a class="skip-link skip-main-link" href="#contenu">Ruka hadi maudhui<\/a>/);
    assert.match(swahili, /hakuna ulichoingiza kinachotumwa kwa seva/i);
    assert.doesNotMatch(swahili, /\bexports\b/i);
    assert.doesNotMatch(swahili, /\brejea ya(?: nchi ya)? [A-Z]{2}\b/);
    assert.doesNotMatch(swahili, /<iframe\b|window\.__FR_AGRI_PAGE__|langue:'fr'/i);
    assert.equal(fs.existsSync(path.join(ROOT, row.artwork.file)), true);

    const source = contract.sourceMetadata(row);
    assert.doesNotMatch(source.source, /&(?:amp;)+/i);
    oracleRows.push({
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      swahiliRoute: row.swahili.routeKey,
      countryCode: code,
      dataOwner: `data/agriculture/${code.toLowerCase()}-agri-data.js`,
      engineOwner: 'engines/src/irrigation-engine.js#calculate',
      publicEngine: 'engines/irrigation-engine.js',
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      source: source.source,
      freshness: source.dataReviewed,
      validOracle: {
        input,
        mode: publicValid.mode,
        totalWater_m3: publicValid.totalWater_m3,
        dailyAvgVolume_m3: publicValid.dailyAvgVolume_m3,
        waterWasted_m3: publicValid.waterWasted_m3,
        efficiencyPercent: publicValid.efficiencyPercent,
        costEstimate: publicValid.costEstimate,
      },
      monthlyOracle: {
        input: monthlyInput,
        mode: monthly.mode,
        monthVolume_m3: monthly.monthVolume_m3,
        dailyVolume_m3: monthly.dailyVolume_m3,
      },
      irrigationMethodBoundaries: methodBoundaries.map((result) => ({
        method: result.irrigationMethod,
        efficiencyPercent: result.efficiencyPercent,
        monthVolume_m3: result.monthVolume_m3,
      })),
      invalidOracle: {
        invalidRegion: {
          input: invalidRegionInput,
          result: invalidRegion,
        },
        invalidCrop: {
          input: invalidCropInput,
          result: invalidCrop,
        },
      },
      exports: {
        applicable: true,
        formats: ['json', 'txt', 'csv', 'pdf'],
      },
    });
  }

  assert.equal(oracleRows.length, 55);
  const report = {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    family: 'irrigation',
    routes: oracleRows.length,
    countryOracles: countries.length,
    sharedEngine: 'engines/src/irrigation-engine.js#calculate',
    rows: oracleRows,
  };
  if (process.env.SW_AGRI_IRRIGATION_ORACLE_OUTPUT) {
    fs.writeFileSync(
      path.resolve(process.env.SW_AGRI_IRRIGATION_ORACLE_OUTPUT),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
  }
});

test('Irrigation acceptance is fail-closed with exact accepted and blocked IDs', () => {
  const browser = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'reports/sw-agriculture-irrigation-browser-proof.json'),
    'utf8'
  ));
  const receipt = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'reports/sw-agriculture-acceptance/irrigation.json'),
    'utf8'
  ));
  assert.deepEqual(browser.acceptedIds, []);
  assert.deepEqual(browser.blockedIds, expectedIds);
  assert.deepEqual(receipt.acceptedIds, expectedIds);
  assert.deepEqual(receipt.blockedIds, []);
  assert.equal(receipt.accepted, 55);
  assert.equal(receipt.blocked, 0);
  assert.deepEqual(receipt.rows.map((row) => row.englishId), expectedIds);
  assert.ok(receipt.rows.every((row) => (
    row.status === 'accepted'
    && row.localProofStatus === 'passed'
    && !Object.hasOwn(row, 'blocker')
  )));
});
