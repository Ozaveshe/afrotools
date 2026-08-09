"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const engine = require("../engines/src/uniquely-african-engine");
const manifest = require("../data/localization/fr-uniquely-african-parity-manifest.json");
const fixtures = require("./fixtures/fr-uniquely-african-english-oracles.json");
const nativeFixtures = require("./fixtures/fr-uniquely-african-native-oracles.json");
const bridePriceEngine = require("../engines/src/brideprice-culture-engine");
const bridePriceData = require("../data/uniquely-african/brideprice-data.json");
const {
  PRESENTATION_FACTORIES,
  getPresentation,
} = require("../scripts/lib/fr-uniquely-african-presentations");
const {
  PAGE_RENDERERS,
  pageHtml,
} = require("../scripts/generate-fr-uniquely-african");
const { ownerStatus } = require("../scripts/validate-fr-uniquely-african");
const { normalizeBuildManagedHtml } = require("../scripts/lib/shared-asset-references");

const root = path.resolve(__dirname, "..");

function normalizedSourceHash(relative) {
  const source = normalizeBuildManagedHtml(fs.readFileSync(path.join(root, relative), "utf8"))
    .replace(/<link\b[^>]*rel=["']alternate["'][^>]*>\s*/gi, "");
  return crypto.createHash("sha256").update(source).digest("hex");
}

function close(actual, expected, message) {
  if (typeof expected === "number") {
    assert(Number.isFinite(actual), `${message}: expected finite number, got ${actual}`);
    const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-9);
    assert(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} != ${expected}`);
  } else {
    assert.deepStrictEqual(actual, expected, message);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mutatedInput(id, input) {
  const value = clone(input);
  const mutations = {
    "fintech-fee-watch": () => { value.amount *= 2; },
    "ajo-chama": () => { value.contribution *= 2; },
    "electricity-estimator": () => { value.hoursPerDay *= 2; },
    "fuel-cost": () => { value.distance *= 2; },
    "hawala-tracker": () => { value.amount *= 2; },
    "staple-basket": () => { value.householdSize += 1; },
    "wholesale-retail-spread": () => { value.retail += 10; },
    "land-size": () => { value.area *= 2; },
    "informal-fx-watch": () => { value.observedRate += 50; },
    "cost-of-living": () => { value.householdSize += 1; },
    afroatlas: () => { value.countries[1].gdp *= 2; },
    afropoints: () => { value.records += 1; },
    afrokitchen: () => { value.targetServings += 6; },
    "africa-conflict": () => { value.status = "critical"; },
    "diaspora-guide": () => { value.daysPresent += 10; },
    "nollywood-pitch": () => { value.production *= 2; },
    "okada-income": () => { value.trips += 2; },
    afroprices: () => { value.quantity += 1; },
    "ankara-kente-cost": () => { value.yards += 2; },
    "fabric-cost": () => { value.yards += 1; },
  };
  mutations[id]();
  return value;
}

function invalidInput(id, input) {
  const value = clone(input);
  const invalidators = {
    "fintech-fee-watch": () => { value.amount = 0; },
    "ajo-chama": () => { value.members = 0; },
    "electricity-estimator": () => { value.watts = 0; },
    "fuel-cost": () => { value.distance = 0; },
    "hawala-tracker": () => { value.amount = 0; },
    "staple-basket": () => { value.weeklyCost = 0; },
    "wholesale-retail-spread": () => { value.wholesale = 0; },
    "land-size": () => { value.area = 0; },
    "informal-fx-watch": () => { value.officialRate = 0; },
    "cost-of-living": () => { value.city2 = value.city1; },
    afroatlas: () => { value.countryB = value.countryA; },
    afropoints: () => { value.records = 0; },
    afrokitchen: () => { value.ingredients = []; },
    "africa-conflict": () => { value.records = []; },
    "diaspora-guide": () => { value.daysPresent = -1; },
    "nollywood-pitch": () => { value.production = 0; },
    "okada-income": () => { value.trips = 0; },
    afroprices: () => { value.records = []; },
    "ankara-kente-cost": () => { value.pricePerYard = 0; },
    "fabric-cost": () => { value.yards = 0; },
  };
  invalidators[id]();
  return value;
}

assert.strictEqual(manifest.denominator, 34, "programme denominator");
assert.strictEqual(manifest.rows.length, 34, "manifest rows");
assert.strictEqual(fixtures.routes.length, 20, "non-native/bridge oracle count");
assert.strictEqual(nativeFixtures.routes.length, 14, "hand-authored/semantic owner oracle count");
assert.strictEqual(Object.keys(bridePriceData).length, 8, "bride-price country groups");
assert.strictEqual(Object.values(bridePriceData).flat().length, 13, "bride-price cultural contracts");
const bridePriceFixture = bridePriceEngine.calculate({
  culture: bridePriceData.NG[0],
  saved: 0,
  months: 6,
  homes: 2,
  tone: "balanced",
});
assert.deepStrictEqual(bridePriceFixture, {
  status: "ok",
  values: { factor: 1, target: 712500, gap: 712500, monthly: 118750, perHome: 356250 },
}, "bride-price shared English/French planning invariant");
assert.deepStrictEqual(
  bridePriceEngine.calculate({ culture: bridePriceData.NG[0], saved: 0, months: 0, homes: 2, tone: "balanced" }),
  { status: "invalid", values: {} },
  "bride-price invalid duration fails closed"
);
assert.ok(Object.keys(engine.routeContracts).length >= 20, "route-specific engine contracts include the French programme");
assert.ok(Object.keys(engine.calculators).length >= 20, "route-specific calculators include the French programme");
assert.strictEqual(Object.keys(PRESENTATION_FACTORIES).length, 20, "route-specific presentation count");
assert.strictEqual(Object.keys(PAGE_RENDERERS).length, 20, "route-specific renderer count");

const fixtureIds = fixtures.routes.map((fixture) => fixture.id);
assert.strictEqual(new Set(fixtureIds).size, 20, "oracle fixture ids must be unique");
assert.ok(
  fixtureIds.every((id) => Object.prototype.hasOwnProperty.call(engine.routeContracts, id)),
  "every French programme oracle must have an engine contract"
);
assert.ok(
  fixtureIds.every((id) => Object.prototype.hasOwnProperty.call(engine.calculators, id)),
  "every French programme oracle must have a calculator"
);

for (const fixture of fixtures.routes) {
  const row = manifest.rows.find((item) => item.english.id === fixture.id);
  assert(row, `${fixture.id}: manifest row`);
  assert.strictEqual(
    normalizedSourceHash(fixture.sourceOwner),
    fixture.sourceSha256,
    `${fixture.id}: English owner logic fingerprint drifted; recapture before changing parity`
  );

  const presentation = getPresentation(fixture.id);
  assert(presentation, `${fixture.id}: French presentation contract`);
  assert(PAGE_RENDERERS[fixture.id], `${fixture.id}: French route renderer`);
  assert(presentation.description.length > 80, `${fixture.id}: route-specific French explanation`);
  assert(presentation.source && presentation.freshness && presentation.confidence && presentation.limitations,
    `${fixture.id}: source/freshness/confidence/limitations`);
  assert.deepStrictEqual(presentation.outputs, row.exports, `${fixture.id}: advertised exports equal manifest`);
  const generatedPage = pageHtml(row, presentation);
  for (const field of presentation.fields) {
    const marker = `data-ua-field="${field.key}"`;
    assert.strictEqual(
      generatedPage.split(marker).length - 1,
      1,
      `${fixture.id}: rendered route must expose ${field.key} exactly once`
    );
  }
  assert(generatedPage.includes(`data-fr-ua-app="${fixture.id}"`), `${fixture.id}: route owner marker`);
  assert(generatedPage.includes(`"workflow":"${presentation.workflow}"`), `${fixture.id}: workflow contract`);

  const contract = engine.routeContracts[fixture.id];
  assert(contract.inputKeys.length > 0 && contract.outputKeys.length > 0, `${fixture.id}: structured input/output contract`);
  const actual = engine.calculate(fixture.id, fixture.input);
  assert.strictEqual(actual.status, "ok", `${fixture.id}: same-fixture English oracle status`);
  for (const [key, expected] of Object.entries(fixture.expected)) {
    close(actual.values[key], expected, `${fixture.id}.${key}`);
  }
  if (fixture.expectedRows != null) {
    assert.strictEqual(actual.rows.length, fixture.expectedRows, `${fixture.id}: structured row count`);
  }

  const mutation = engine.calculate(fixture.id, mutatedInput(fixture.id, fixture.input));
  assert.strictEqual(mutation.status, "ok", `${fixture.id}: meaningful mutation status`);
  assert.notDeepStrictEqual(mutation, actual, `${fixture.id}: meaningful input mutation must change structured output`);

  const invalid = engine.calculate(fixture.id, invalidInput(fixture.id, fixture.input));
  assert.strictEqual(invalid.status, "invalid", `${fixture.id}: invalid input must fail closed`);
  assert.deepStrictEqual(invalid.values, {}, `${fixture.id}: invalid input exposes no stale values`);

  const serialized = JSON.stringify(actual);
  assert(!/<(?:div|span|table|tr|td|button|input|select)\b/i.test(serialized),
    `${fixture.id}: DOM-free engine must not return presentation HTML`);
}

const nativeIds = nativeFixtures.routes.map((fixture) => fixture.id);
assert.strictEqual(new Set(nativeIds).size, 14, "native oracle fixture ids must be unique");
const nativeExportSource = fs.readFileSync(
  path.join(root, "assets/js/pages/fr-uniquely-african-native-exports.js"),
  "utf8"
);
const nativeGuardSource = fs.readFileSync(
  path.join(root, "assets/js/pages/fr-uniquely-african-native-guards.js"),
  "utf8"
);
const nativeBrowserOracleSource = fs.readFileSync(
  path.join(root, "tests/e2e/fr-uniquely-african-parity.spec.js"),
  "utf8"
);
assert(nativeBrowserOracleSource.includes("exact same-fixture English/French semantic result equality"),
  "native browser proof must assert exact same-fixture semantic equality");
assert(!nativeBrowserOracleSource.includes("normalizeNumbers") && !nativeBrowserOracleSource.includes("numeric oracle overlap"),
  "permissive numeric-token overlap oracle must stay removed");
for (const fixture of nativeFixtures.routes) {
  const row = manifest.rows.find((item) => item.english.id === fixture.id);
  assert(row, `${fixture.id}: native manifest row`);
  assert.strictEqual(fixture.sourceOwner, row.engineOwner,
    `${fixture.id}: fixture owner must exactly match the manifest owner`);
  const resolvedOwner = ownerStatus(fixture.sourceOwner);
  assert(resolvedOwner.valid,
    `${fixture.id}: fail-closed owner must resolve to an existing file and symbol (${resolvedOwner.reason})`);
  const source = normalizeBuildManagedHtml(fs.readFileSync(path.join(root, row.english.file), "utf8"));
  assert.strictEqual(
    crypto.createHash("sha256").update(source).digest("hex"),
    fixture.sourceSha256,
    `${fixture.id}: hand-authored English owner fingerprint drifted; recapture its oracle before changing parity`
  );
  const frenchSource = fs.readFileSync(path.join(root, row.french.file), "utf8");
  const ownsNativeMobileMoneyContract = fixture.id === "mobile-money-fees"
    && frenchSource.includes("/assets/js/engines/mobile-money-quote-engine.js")
    && frenchSource.includes("/assets/js/pages/mobile-money-quote-parity.js")
    && frenchSource.includes('id="mm-copy"')
    && frenchSource.includes('id="mm-json"');
  const ownsNativeFuneralContract = fixture.id === "burial-cost"
    && frenchSource.includes("/assets/js/engines/funeral-budget-engine.js")
    && frenchSource.includes("/assets/js/pages/fr-funeral-budget-parity.js")
    && frenchSource.includes('id="fb-copy" data-native-export="copy"')
    && frenchSource.includes('id="fb-json" data-native-export="json"')
    && frenchSource.includes('id="fb-txt" data-native-export="txt"')
    && frenchSource.includes('id="fb-error" class="rm-error" role="alert"');
  const ownsNativeRemittanceV2Contract = fixture.id === "remittance-v2"
    && frenchSource.includes("/engines/remittance-quote-comparator-engine.js")
    && frenchSource.includes("/assets/js/pages/remittance-quote-parity.js")
    && frenchSource.includes("/assets/js/pages/fr-remittance-v2-a11y.js")
    && frenchSource.includes('id="rm-copy" data-native-export="copy"')
    && frenchSource.includes('id="rm-json" data-native-export="json"')
    && frenchSource.includes('id="rm-error" class="rm-error" role="alert"');
  const ownsPageNativeContract = ownsNativeMobileMoneyContract || ownsNativeFuneralContract || ownsNativeRemittanceV2Contract;
  assert(ownsPageNativeContract || nativeExportSource.includes(`"${fixture.id}": {`),
    `${fixture.id}: explicit French native export contract`);
  assert(ownsPageNativeContract || nativeGuardSource.includes(`"${fixture.id}": {`),
    `${fixture.id}: explicit French native invalid-state contract`);
  assert(ownsPageNativeContract || frenchSource.includes("/assets/js/pages/fr-uniquely-african-native-exports.js"),
    `${fixture.id}: French route loads its explicit export owner`);
  assert(ownsPageNativeContract || frenchSource.includes("/assets/js/pages/fr-uniquely-african-native-guards.js"),
    `${fixture.id}: French route loads its explicit validation owner`);
}

console.log("French Uniquely African oracles: 20/20 extracted contracts and 14/14 native owner fixtures passed.");
