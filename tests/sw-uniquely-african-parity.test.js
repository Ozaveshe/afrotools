"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const engine = require("../engines/src/uniquely-african-engine");
const manifest = require("../data/localization/sw-uniquely-african-parity-manifest.json");
const fixtures = require("./fixtures/fr-uniquely-african-english-oracles.json");
const { getPresentation, COPY } = require("../scripts/lib/sw-uniquely-african-presentations");
const { generatedPage } = require("../scripts/generate-sw-uniquely-african-parity");
const { normalizeBuildManagedHtml } = require("../scripts/lib/shared-asset-references");

const root = path.resolve(__dirname, "..");

function normalizedSourceHash(relative) {
  const source = normalizeBuildManagedHtml(fs.readFileSync(path.join(root, relative), "utf8"))
    .replace(/<link\b[^>]*rel=["']alternate["'][^>]*>\s*/gi, "");
  return crypto.createHash("sha256").update(source).digest("hex");
}

function close(actual, expected, message) {
  if (typeof expected !== "number") return assert.deepStrictEqual(actual, expected, message);
  assert(Number.isFinite(actual), `${message}: expected a finite number`);
  const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-9);
  assert(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} != ${expected}`);
}

const invalidators = {
  "fintech-fee-watch": (value) => { value.amount = 0; },
  "ajo-chama": (value) => { value.members = 0; },
  "electricity-estimator": (value) => { value.watts = 0; },
  "fuel-cost": (value) => { value.distance = 0; },
  "hawala-tracker": (value) => { value.amount = 0; },
  "staple-basket": (value) => { value.weeklyCost = 0; },
  "wholesale-retail-spread": (value) => { value.wholesale = 0; },
  "land-size": (value) => { value.area = 0; },
  "informal-fx-watch": (value) => { value.officialRate = 0; },
  "cost-of-living": (value) => { value.city2 = value.city1; },
  afroatlas: (value) => { value.countryB = value.countryA; },
  afropoints: (value) => { value.records = 0; },
  afrokitchen: (value) => { value.ingredients = []; },
  "africa-conflict": (value) => { value.records = []; },
  "diaspora-guide": (value) => { value.daysPresent = -1; },
  "nollywood-pitch": (value) => { value.production = 0; },
  "okada-income": (value) => { value.trips = 0; },
  afroprices: (value) => { value.records = []; },
  "ankara-kente-cost": (value) => { value.pricePerYard = 0; },
  "fabric-cost": (value) => { value.yards = 0; },
};

assert.strictEqual(manifest.denominator, 34, "authoritative category denominator");
assert.strictEqual(manifest.rows.length, 34, "manifest row count");
assert.strictEqual(manifest.rows.filter((row) => row.swahili.mode === "shared-engine").length, 20, "implemented shared-engine routes");
assert.strictEqual(manifest.rows.filter((row) => row.swahili.mode.startsWith("native-blocked")).length, 14, "fail-closed native-owner backlog");
assert.strictEqual(fixtures.routes.length, 20, "English oracle count");
assert.strictEqual(Object.keys(COPY).length, 20, "Swahili presentation count");
const hub = fs.readFileSync(path.join(root, "sw", "zana-za-kipekee-afrika", "index.html"), "utf8");
assert(hub.includes('name="afrotools-source-owner" content="scripts/generate-sw-uniquely-african-parity.js"'), "hub source owner");
assert(hub.includes('name="afrotools-content-id" content="sw-uniquely-african:hub"'), "hub stable content id");

for (const fixture of fixtures.routes) {
  const row = manifest.rows.find((item) => item.english.id === fixture.id);
  assert(row && row.swahili.mode === "shared-engine", `${fixture.id}: implemented manifest row`);
  assert.strictEqual(normalizedSourceHash(fixture.sourceOwner), fixture.sourceSha256, `${fixture.id}: English owner fingerprint`);

  const presentation = getPresentation(fixture.id);
  assert(presentation, `${fixture.id}: Swahili presentation`);
  assert(presentation.source && presentation.freshness && presentation.confidence && presentation.limitations,
    `${fixture.id}: visible source, freshness, confidence and limits`);
  assert.deepStrictEqual(presentation.outputs, row.exports, `${fixture.id}: export contract`);

  const html = generatedPage(row, presentation);
  assert(html.includes(`data-sw-ua-app="${fixture.id}"`), `${fixture.id}: source-owner marker`);
  assert(html.includes(`name="afrotools-content-id" content="sw-uniquely-african:${fixture.id}"`), `${fixture.id}: stable content id`);
  assert(html.includes('/engines/uniquely-african-engine.js'), `${fixture.id}: shared engine reference`);
  assert(html.includes('/assets/js/pages/sw-uniquely-african.js'), `${fixture.id}: Swahili runtime reference`);
  assert(html.includes('/assets/js/lib/sw-accessibility.js'), `${fixture.id}: Swahili accessibility runtime`);
  assert(!/\b(?:Calculer|Comparez|Résultat|Fraîcheur|Confiance|Limites|Réinitialiser)\b/i.test(html), `${fixture.id}: no French UI copy`);
  assert(!/[\u00c2\u00c3]/.test(html), `${fixture.id}: no UTF-8 mojibake`);
  for (const field of presentation.fields) {
    assert.strictEqual(html.split(`data-ua-field="${field.key}"`).length - 1, 1, `${fixture.id}.${field.key}: one input owner`);
  }

  const actual = engine.calculate(fixture.id, fixture.input);
  assert.strictEqual(actual.status, "ok", `${fixture.id}: oracle status`);
  for (const [key, expected] of Object.entries(fixture.expected)) close(actual.values[key], expected, `${fixture.id}.${key}`);
  if (fixture.expectedRows != null) assert.strictEqual(actual.rows.length, fixture.expectedRows, `${fixture.id}: row count`);

  const invalidInput = JSON.parse(JSON.stringify(fixture.input));
  invalidators[fixture.id](invalidInput);
  const invalid = engine.calculate(fixture.id, invalidInput);
  assert.strictEqual(invalid.status, "invalid", `${fixture.id}: invalid input fails closed`);
  assert.deepStrictEqual(invalid.values, {}, `${fixture.id}: no stale invalid values`);
}

console.log("Swahili Uniquely African parity: 20 engine/oracle routes passed; 14 native-owner routes remain fail-closed.");
