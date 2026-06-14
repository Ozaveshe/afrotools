#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const directoryPath = path.join(ROOT, "data", "tool-directory.json");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

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
