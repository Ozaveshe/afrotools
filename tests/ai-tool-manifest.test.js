#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const directoryPath = path.join(ROOT, "data", "tool-directory.json");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const prefill = require("../assets/js/ai/prefill-adapters.js");

const directoryEntries = JSON.parse(fs.readFileSync(directoryPath, "utf8"));
const manifest = manifestApi.buildToolManifest(directoryEntries);
const validation = manifestApi.validateToolManifest(manifest);

assert.deepStrictEqual(validation.errors, [], "AI tool manifest should validate cleanly");
assert.ok(manifest.length >= 1000, `expected at least 1000 manifest entries, found ${manifest.length}`);
assert.ok(manifest.length < directoryEntries.length, "duplicate route aliases should be collapsed for router safety");

const routeOwners = new Map();
for (const entry of manifest) {
  for (const field of manifestApi.TOOL_MANIFEST_SCHEMA.requiredFields) {
    assert.notStrictEqual(entry[field], undefined, `${entry.id}.${field} should exist`);
    assert.notStrictEqual(entry[field], null, `${entry.id}.${field} should not be null`);
  }
  assert.ok(entry.route.startsWith("/"), `${entry.id} route should be root-relative`);
  const routeKey = entry.route.replace(/\/index\.html$/i, "/").replace(/\/$/, "").toLowerCase();
  assert.ok(!routeOwners.has(routeKey), `${entry.id} duplicates route owned by ${routeOwners.get(routeKey)}`);
  routeOwners.set(routeKey, entry.id);
}

const byId = new Map(manifest.map((entry) => [entry.id, entry]));

const STRATEGIC_AI_ROUTABLE_TOOLS = [
  { id: "cv-builder", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "employment", prefill: true },
  { id: "cover-letter", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "employment", prefill: false },
  { id: "scholarship-finder", privacyMode: "account_optional", sourcePolicy: "mixed", highStakesDomain: "education", prefill: true },
  { id: "study-abroad-cost", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: true },
  { id: "import-duty", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: true },
  { id: "car-import-cost", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: true },
  { id: "paye-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "tax", prefill: true },
  { id: "vat-calc-pan-african", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "tax", prefill: true },
  { id: "invoice-generator", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "finance", prefill: true },
  { id: "solar-roi", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "fuel-tracker", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "generator-fuel", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "cost-of-living", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "finance", prefill: false },
  { id: "japa-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "immigration", prefill: false },
  { id: "pdf-workspace", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "none", prefill: true },
  { id: "gpa-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "waec-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "ielts-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "afroplan-floor-planner", privacyMode: "ai_optional", sourcePolicy: "user_input", highStakesDomain: "none", prefill: false },
  { id: "afrodraft", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "none", prefill: false },
  { id: "building-materials", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "legal", prefill: false },
  { id: "boq-generator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "legal", prefill: false },
  { id: "crop-yield-estimator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "none", prefill: false },
  { id: "farm-profit-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: false },
  { id: "poultry-roi-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: false },
];

function expectEntry(id) {
  const entry = byId.get(id);
  assert.ok(entry, `${id} should be present in the AI tool manifest`);
  return entry;
}

assert.strictEqual(expectEntry("cv-builder").privacyMode, "browser_local");
assert.strictEqual(expectEntry("cv-builder").highStakesDomain, "employment");
assert.ok(expectEntry("cv-builder").aiCapabilities.includes("generate_document"));

assert.strictEqual(expectEntry("scholarship-finder").highStakesDomain, "education");
assert.ok(expectEntry("scholarship-finder").outputTypes.includes("shortlist"));

assert.strictEqual(expectEntry("import-duty").sourcePolicy, "mixed");
assert.ok(expectEntry("import-duty").aiCapabilities.includes("prefill"));

assert.strictEqual(expectEntry("solar-roi").highStakesDomain, "energy");
assert.strictEqual(expectEntry("medical-report").highStakesDomain, "health");
assert.strictEqual(expectEntry("pdf-workspace").privacyMode, "browser_local");

assert.strictEqual(STRATEGIC_AI_ROUTABLE_TOOLS.length, 25, "first AI-routable batch should cover exactly 25 strategic tools");
for (const expected of STRATEGIC_AI_ROUTABLE_TOOLS) {
  const entry = expectEntry(expected.id);
  assert.ok(entry.route.startsWith("/"), `${expected.id} should keep a public route`);
  assert.ok(entry.aiCapabilities.includes("route_only"), `${expected.id} should be safely routable without prefill`);
  assert.ok(entry.userIntents.length > 0, `${expected.id} should include intent phrases`);
  assert.ok(entry.exampleQueries.length > 0, `${expected.id} should include example queries`);
  assert.ok(entry.outputTypes.length > 0, `${expected.id} should define output types`);
  assert.strictEqual(entry.privacyMode, expected.privacyMode, `${expected.id} privacy mode should be curated`);
  assert.strictEqual(entry.sourcePolicy, expected.sourcePolicy, `${expected.id} source policy should be curated`);
  assert.strictEqual(entry.highStakesDomain, expected.highStakesDomain, `${expected.id} high-stakes domain should be curated`);
  if (expected.prefill) {
    assert.ok(entry.aiCapabilities.includes("prefill"), `${expected.id} should advertise prefill only with an adapter`);
    assert.ok(prefill.getPrefillAdapter(expected.id), `${expected.id} should have a safe prefill adapter`);
  } else {
    assert.ok(!entry.aiCapabilities.includes("prefill"), `${expected.id} should be route_only until a safe adapter exists`);
  }
}

const routerManifest = manifestApi.getToolManifestForRouter(manifest);
assert.strictEqual(routerManifest.length, manifest.length, "router helper should preserve manifest length");
const defaultRouterManifest = manifestApi.getToolManifestForRouter();
assert.strictEqual(defaultRouterManifest.length, manifest.length, "router helper should load the default manifest in Node");
const routerAllowedFields = new Set([
  "id",
  "slug",
  "route",
  "title",
  "shortDescription",
  "category",
  "subcategory",
  "countriesSupported",
  "languagesSupported",
  "currencySupport",
  "userIntents",
  "exampleQueries",
  "requiredInputs",
  "optionalInputs",
  "privacyMode",
  "aiCapabilities",
  "outputTypes",
  "sourcePolicy",
  "highStakesDomain",
  "aliases",
]);

for (const entry of routerManifest) {
  for (const key of Object.keys(entry)) {
    assert.ok(routerAllowedFields.has(key), `router manifest should not expose ${key}`);
  }
}

const minimumWage = expectEntry("minimum-wage");
assert.ok(minimumWage.aliases.includes("minimum-wage-legal"), "duplicate minimum-wage route should retain alias id");

console.log(`AI tool manifest validated: ${manifest.length} unique router entries from ${directoryEntries.length} directory rows.`);
