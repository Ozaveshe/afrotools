"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-agriculture-parity-manifest.json");
const contract = require("../scripts/lib/sw-agriculture-family-contracts/fertilizer");
const aiRouteMap = require("../assets/js/ai/swahili-agriculture-route-map.generated.js");

const rows = manifest.rows.filter(row => row.family === "fertilizer");
const countryRows = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);

function loadScript(sandbox, relativeFile) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, relativeFile), "utf8"), sandbox, {
    filename: relativeFile
  });
}

function loadRuntime(code, engineFile) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  loadScript(sandbox, "data/agriculture/crop-database.js");
  loadScript(sandbox, `data/agriculture/${code.toLowerCase()}-agri-data.js`);
  loadScript(sandbox, engineFile);
  return sandbox.window.AfroTools;
}

function stable(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Swahili fertilizer manifest owns exactly 55 native physical routes", () => {
  assert.equal(rows.length, 55);
  assert.equal(countryRows.length, 54);
  assert.ok(hub);
  assert.equal(aiRouteMap.report.rows, 55);
  assert.equal(aiRouteMap.report.hubRows, 1);
  assert.equal(aiRouteMap.report.countryRows, 54);
  assert.equal(Object.keys(aiRouteMap.routes).length, 55);

  const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), "utf8");
  assert.equal((hubHtml.match(/<li><a href="\/sw\/kilimo\/mbolea\//g) || []).length, 54);
  assert.match(hubHtml, /<html lang="sw"/);
  assert.match(hubHtml, /hreflang="sw"/);
  assert.doesNotMatch(hubHtml, /<iframe\b|\bfetch\s*\(/i);
});

for (const row of countryRows) {
  test(`${row.english.id}: shared-engine deterministic parity and native route contract`, () => {
    const code = row.country.code;
    const html = fs.readFileSync(path.join(ROOT, row.swahili.file), "utf8");
    const english = fs.readFileSync(path.join(ROOT, row.english.file), "utf8");
    const artwork = path.join(ROOT, row.artwork.file);

    assert.match(html, /<html lang="sw"/);
    assert.match(html, /window\.__SW_AGRI_PAGE__/);
    assert.match(html, new RegExp(`/data/agriculture/${code.toLowerCase()}-agri-data\\.js`));
    assert.match(html, /\/data\/agriculture\/crop-database\.js/);
    assert.match(html, /\/engines\/fertilizer-engine\.js/);
    assert.match(html, /\/assets\/js\/pages\/sw-fertilizer-controller\.js/);
    assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(|window\.__FR_AGRI_PAGE__|<html\b[^>]*\blang="fr"/i);

    [
      "crop", "region", "farmSize", "targetYield", "soil", "previousCrop",
      "soilPh", "organicMatter", "availableN", "phosphorus", "potassium"
    ].forEach(id => {
      assert.match(html, new RegExp(`id="${id}"`));
      assert.match(html, new RegExp(`label for="${id}"`));
    });
    [
      "Nakili", "Shiriki", "Hifadhi kwenye kivinjari hiki", "Pakua PDF",
      "Pakua CSV", "Pakua JSON", "Pakua TXT", "Weka upya"
    ].forEach(label => assert.ok(html.includes(label), `${code} is missing ${label}`));
    assert.match(html, /Hakuna ingizo linalotumwa kwa seva/);
    assert.match(html, /kikokotoo hiki hakitumi AI/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${row.swahili.routeKey}">`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${row.english.route}"`));
    assert.match(html, new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili.routeKey}"`));
    assert.match(html, new RegExp(`content="https://afrotools.com${row.swahili.routeKey}"`));
    assert.ok(fs.existsSync(artwork), `${code} artwork is missing`);
    assert.ok(fs.statSync(artwork).size > 0, `${code} artwork is empty`);
    assert.ok(html.includes(row.artwork.file));
    assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
    assert.equal(aiRouteMap.routes[row.english.routeKey], row.swahili.routeKey);

    const sourceRuntime = loadRuntime(code, "engines/src/fertilizer-engine.js");
    const browserRuntime = loadRuntime(code, "engines/fertilizer-engine.js");
    const data = sourceRuntime.countryData;
    const supported = data.crops.filter(crop => (
      crop.nutrientUptake
      || sourceRuntime.cropDatabase.crops[crop.id]
      && sourceRuntime.cropDatabase.crops[crop.id].nutrientUptake
    ));
    assert.ok(supported.length, `${code} has no maintained nutrient method`);
    supported.forEach(crop => assert.ok(contract.CROP_NAMES[crop.id], `${code} lacks Swahili crop copy for ${crop.id}`));
    const region = data.regions[0];
    const input = {
      cropId: supported[0].id,
      regionId: region.id,
      farmSizeHa: data.agriStats.avgFarmSizeHa || 1,
      targetYieldPerHa: null,
      soilType: region.soilTypes[0],
      previousCrop: "none",
      soilTest: {
        pH: 6.5,
        organicMatter: 1.2,
        N_ppm: 8,
        P_ppm: 5,
        K_ppm: 10
      }
    };
    const sourceResult = sourceRuntime.FertilizerEngine.calculate(input, data, sourceRuntime.cropDatabase);
    const browserResult = browserRuntime.FertilizerEngine.calculate(
      input,
      browserRuntime.countryData,
      browserRuntime.cropDatabase
    );
    assert.equal(sourceResult.error, undefined);
    assert.deepEqual(stable(browserResult), stable(sourceResult));
    assert.equal(sourceResult.currency, data.currency);
  });
}

test("Swahili fertilizer AI routing stays local and requires no model consent", () => {
  const router = require("../assets/js/ai/intent-router.js");
  const decision = router.routeDeterministically("Nataka kukokotoa mbolea ya mahindi", { locale: "sw" });
  assert.equal(decision.selectedToolId, "fertilizer-calculator");
  assert.equal(decision.selectedRoute, `${hub.swahili.routeKey}?source=ask`);
  assert.equal(decision.privacyMode, "browser_local");
  assert.equal(decision.handoffPlan.consentRequiredForModel, false);
  assert.equal(decision._meta.localeRoute.status, "mapped");
  const routeMap = require("../assets/js/ai/swahili-route-map.generated.js");
  assert.equal(routeMap.ids[decision.selectedToolId], hub.swahili.routeKey);
});
