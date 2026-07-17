#!/usr/bin/env node

const assert = require("assert");

const manifestApi = require("../assets/js/ai/tool-manifest.js");
const promptRegistry = require("../assets/js/ai/example-registry.js");

const manifest = manifestApi.loadDefaultToolManifest();
const manifestValidation = manifestApi.validateToolManifest(manifest);
assert.deepStrictEqual(manifestValidation.errors, [], "AI tool manifest contract should validate cleanly");

const manifestIds = new Set(
  manifest
    .map((entry) => entry.id)
    .concat(Object.keys(manifestApi.MAJOR_TOOL_OVERRIDES || {}))
);

const promptValidation = promptRegistry.validatePromptExamples(promptRegistry.PROMPT_EXAMPLES, {
  expectedToolIds: manifestIds,
});
assert.deepStrictEqual(promptValidation.errors, [], "AI prompt-example registry contract should validate cleanly");

const routerManifest = manifestApi.getToolManifestForRouter(manifest);
assert.strictEqual(routerManifest.length, manifest.length, "router manifest should preserve entry count");

const allowedRouterFields = new Set([
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

routerManifest.forEach((entry) => {
  Object.keys(entry).forEach((key) => {
    assert.ok(allowedRouterFields.has(key), "router manifest should not expose " + key);
  });
});

console.log("CI type-check passed: AI manifest and prompt contracts validated.");
