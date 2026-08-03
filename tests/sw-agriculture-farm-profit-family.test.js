'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const frenchManifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/farm-profit');
const irrigation = require('../scripts/lib/sw-agriculture-family-contracts/irrigation');
const { alternateEntries } = require('../scripts/lib/fr-agriculture-hreflang');

const ROOT = path.resolve(__dirname, '..');
const rows = manifest.rows.filter((row) => row.family === 'farm-profit');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const frenchById = new Map(frenchManifest.rows.map((row) => [row.english.id, row.french]));

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function inputFor(runtime) {
  const crop = runtime.countryData.crops[0];
  return {
    cropId: crop.id,
    farmSizeHa: runtime.countryData.agriStats.avgFarmSizeHa || 1,
    yieldPerHa: crop.baseYieldPerHa || 1,
    marketPricePerTonne: crop.localMarketPrice || 1,
    sellingMethod: 'local',
    exportPricePerTonne: 0,
    postHarvestLossPct: 15,
    seedCost: 0,
    fertilizerCost: 0,
    familyLaborPct: 50,
    landType: 'communal',
    mechanizationType: 'none',
    distanceToMarket: 20,
    throughMiddleman: false,
    storageMonths: 0,
    loanAmount: 0,
    insurancePremiumPct: 0,
  };
}

test('Swahili Farm Profit owns exactly 55 native routes with one 54-country hub', () => {
  assert.equal(rows.length, 55);
  assert.equal(countries.length, 54);
  assert.ok(hub);
  const html = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
  assert.equal((html.match(/<li><a href="\/sw\/kilimo\/faida-ya-shamba\//g) || []).length, 54);
  assert.match(html, /<html\b[^>]*\blang="sw"/);
  assert.match(html, /data-ai-routing="farm-profit-calculator"/);
  assert.match(html, /data-ai-consent="required-before-model-send"/);
  assert.doesNotMatch(html, /<iframe\b|window\.__FR_AGRI_PAGE__|english-html-fetch/i);
});

test('all Farm Profit routes preserve the exact shared engine, data, sources and reciprocal mesh', () => {
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
    const sourceRuntime = contract.loadFarmRuntime(code);
    const publicRuntime = contract.loadFarmRuntime(code, 'engines/farm-profit-engine.js');
    const input = inputFor(publicRuntime);
    const publicValid = plain(publicRuntime.FarmProfitEngine.calculate(
      input,
      publicRuntime.countryData,
      publicRuntime.farmCosts[code]
    ));
    const sourceValid = plain(sourceRuntime.FarmProfitEngine.calculate(
      input,
      sourceRuntime.countryData,
      sourceRuntime.farmCosts[code]
    ));
    const invalidInput = { ...input, cropId: `invalid-${code}` };
    const invalid = plain(publicRuntime.FarmProfitEngine.calculate(
      invalidInput,
      publicRuntime.countryData,
      publicRuntime.farmCosts[code]
    ));
    const exportInput = {
      ...input,
      sellingMethod: 'export',
      exportPricePerTonne: input.marketPricePerTonne * 1.2,
    };
    const exportResult = plain(publicRuntime.FarmProfitEngine.calculate(
      exportInput,
      publicRuntime.countryData,
      publicRuntime.farmCosts[code]
    ));
    const processInput = { ...input, sellingMethod: 'process' };
    const processResult = plain(publicRuntime.FarmProfitEngine.calculate(
      processInput,
      publicRuntime.countryData,
      publicRuntime.farmCosts[code]
    ));

    assert.deepEqual(publicValid, sourceValid, `${code} public/source engine drift.`);
    assert.equal(publicValid.error, undefined);
    assert.equal(publicValid.currency, publicRuntime.countryData.currency);
    assert.ok(Number.isFinite(publicValid.totalCost));
    assert.ok(Number.isFinite(publicValid.netProfit));
    assert.ok(Number.isFinite(publicValid.roi));
    assert.equal(invalid.error, true);
    assert.match(invalid.message, /Crop not found/);
    assert.equal(exportResult.sellingMethod, 'export');
    assert.equal(exportResult.effectivePrice, exportInput.exportPricePerTonne);
    assert.equal(processResult.sellingMethod, 'process');
    assert.ok(Number.isFinite(processResult.netProfit));
    publicRuntime.countryData.crops.forEach((crop) => {
      assert.ok(irrigation.CROP_NAMES[crop.id], `${code} lacks a Swahili crop label for ${crop.id}.`);
    });

    assert.match(swahili, /<html\b[^>]*\blang="sw"/);
    assert.match(swahili, /\/engines\/farm-profit-engine\.js/);
    assert.ok(swahili.includes(`/data/agriculture/${code.toLowerCase()}-agri-data.js`));
    assert.match(swahili, /data-result-action data-action="share" disabled/);
    assert.match(swahili, /navigator\.share/);
    assert.match(swahili, /invalidateResult/);
    assert.match(swahili, /<a class="skip-link skip-main-link" href="#contenu">Ruka hadi maudhui<\/a>/);
    assert.match(swahili, /<main class="shell" id="contenu" tabindex="-1">/);
    assert.match(swahili, /<caption class="visually-hidden">Mgawanyo wa gharama za makadirio<\/caption>/);
    assert.equal((swahili.match(/aria-describedby="formError"/g) || []).length, 30);
    assert.match(swahili, /hakuna ulichoingiza kinachotumwa kwa seva/i);
    assert.doesNotMatch(swahili, /<iframe\b|window\.__FR_AGRI_PAGE__|langue:'fr'/i);
    assert.doesNotMatch(swahili, /&amp;amp;/i);
    assert.doesNotMatch(swahili, /\brejea ya(?: nchi ya)? [A-Z]{2}\b/);
    assert.doesNotMatch(
      visibleText(swahili),
      /\b(?:Calculate|Reset|Result|Revenue|Total cost|Export to|Share result|Data Sources)\b/i
    );
    assert.ok(swahili.includes(row.artwork.file));
    assert.equal(fs.existsSync(path.join(ROOT, row.artwork.file)), true);
    assert.ok(swahili.includes(`content="${row.english.id}"`));
    assert.ok(swahili.includes(`content="${code}"`));
    assert.ok(swahili.includes(`https://afrotools.com${row.swahili.route}`));

    const mesh = alternateEntries({ ...row, french: frenchOwner });
    for (const { hreflang, route } of mesh) {
      const link = `hreflang="${hreflang}" href="https://afrotools.com${route}"`;
      assert.ok(swahili.includes(link), `${row.english.id} Swahili mesh lacks ${hreflang}.`);
      assert.ok(english.includes(link), `${row.english.id} English mesh lacks ${hreflang}.`);
      assert.ok(french.includes(link), `${row.english.id} French mesh lacks ${hreflang}.`);
    }
    if (code === 'NG') {
      const hausa = fs.readFileSync(path.join(ROOT, 'ha/kayan-aiki/ribar-gona/index.html'), 'utf8');
      for (const { hreflang, route } of mesh) {
        assert.ok(hausa.includes(`hreflang="${hreflang}" href="https://afrotools.com${route}"`));
      }
    }
    const metadata = contract.sourceMetadata(row);
    assert.doesNotMatch(metadata.source, /&(?:amp;)+/i);

    oracleRows.push({
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      swahiliRoute: row.swahili.routeKey,
      countryCode: code,
      engineOwner: 'engines/src/farm-profit-engine.js#calculate',
      publicEngine: 'engines/farm-profit-engine.js',
      dataOwners: [
        `data/agriculture/${code.toLowerCase()}-agri-data.js`,
        'data/agriculture/farm-costs.js',
      ],
      currency: publicRuntime.countryData.currency,
      currencySymbol: publicRuntime.countryData.currencySymbol,
      source: metadata.source,
      freshness: metadata.dataReviewed,
      validOracle: {
        input,
        totalYield: publicValid.totalYield,
        grossRevenue: publicValid.grossRevenue,
        netRevenue: publicValid.netRevenue,
        totalCost: publicValid.totalCost,
        netProfit: publicValid.netProfit,
        roi: publicValid.roi,
        breakEvenYieldPerHa: publicValid.breakEvenYieldPerHa,
      },
      sellingMethodBoundaries: {
        local: {
          effectivePrice: publicValid.effectivePrice,
          netProfit: publicValid.netProfit,
        },
        export: {
          input: exportInput,
          effectivePrice: exportResult.effectivePrice,
          netProfit: exportResult.netProfit,
        },
        process: {
          input: processInput,
          effectivePrice: processResult.effectivePrice,
          netProfit: processResult.netProfit,
        },
      },
      invalidOracle: { input: invalidInput, result: invalid },
      exports: { applicable: true, formats: ['json', 'txt', 'csv', 'pdf'] },
    });
  }

  assert.equal(oracleRows.length, 55);
  const report = {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    family: 'farm-profit',
    routes: oracleRows.length,
    countryOracles: countries.length,
    sharedEngine: 'engines/src/farm-profit-engine.js#calculate',
    rows: oracleRows,
  };
  if (process.env.SW_AGRI_FARM_PROFIT_ORACLE_OUTPUT) {
    fs.writeFileSync(
      path.resolve(process.env.SW_AGRI_FARM_PROFIT_ORACLE_OUTPUT),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
  }
});

test('Farm Profit acceptance is fail-closed with exact accepted and blocked IDs', () => {
  const expectedIds = rows.map((row) => row.english.id);
  const browser = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'reports/sw-agriculture-farm-profit-browser-proof.json'),
    'utf8'
  ));
  const receipt = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'reports/sw-agriculture-acceptance/farm-profit.json'),
    'utf8'
  ));
  assert.equal(browser.routes, 55);
  assert.equal(browser.passedLocalProof, 55);
  assert.equal(browser.runner.passed, 55);
  assert.equal(browser.runner.failed, 0);
  assert.deepEqual(browser.rows.map((row) => row.englishId), expectedIds);
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
