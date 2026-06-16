const assert = require("assert");

const promptRegistry = require("../assets/js/ai/example-registry.js");
const toolManifest = require("../assets/js/ai/tool-manifest.js");

const manifestIds = new Set(
  toolManifest
    .loadDefaultToolManifest()
    .map((entry) => entry.id)
    .concat(Object.keys(toolManifest.MAJOR_TOOL_OVERRIDES || {}))
);

const requiredCategories = [
  "education",
  "career",
  "sme",
  "trade",
  "energy",
  "local-life",
  "documents",
  "construction",
  "agriculture",
  "country-intelligence",
];

const requiredSurfaces = [
  "homepage_command",
  "homepage_legacy",
  "ai_hub",
  "ai_vertical",
  "ai_widget",
  "eval",
];

function testRegistryShape() {
  assert(Array.isArray(promptRegistry.PROMPT_EXAMPLES), "registry should export prompt examples");
  assert(promptRegistry.PROMPT_EXAMPLES.length >= requiredCategories.length, "registry should cover the main AI categories");
  const validation = promptRegistry.validatePromptExamples(promptRegistry.PROMPT_EXAMPLES, { expectedToolIds: manifestIds });
  assert.strictEqual(validation.valid, true, validation.errors.join("\n"));
}

function testNoDuplicateIds() {
  const ids = promptRegistry.PROMPT_EXAMPLES.map((example) => example.id);
  assert.strictEqual(new Set(ids).size, ids.length, "prompt example IDs must be unique");
}

function testExpectedToolIdsAreKnown() {
  const invalid = promptRegistry.PROMPT_EXAMPLES
    .filter((example) => !manifestIds.has(example.expectedToolId))
    .map((example) => `${example.id}:${example.expectedToolId}`);
  assert.deepStrictEqual(invalid, [], "expectedToolId values must exist in the AI tool manifest or major overrides");
}

function testCategoryAndSurfaceCoverage() {
  requiredCategories.forEach((category) => {
    const examples = promptRegistry.getPromptExamplesByCategory(category);
    assert(examples.length > 0, `missing prompt examples for category ${category}`);
  });
  requiredSurfaces.forEach((surface) => {
    const examples = promptRegistry.getPromptExamplesForSurface(surface);
    assert(examples.length > 0, `missing prompt examples for surface ${surface}`);
  });
}

function testLookupHelpersReturnCopies() {
  const example = promptRegistry.getPromptExampleById("study-canada-ng");
  assert(example, "expected study-canada-ng example");
  assert.strictEqual(promptRegistry.getPromptText("study-canada-ng"), example.text);
  example.countryTags.push("MUTATED");
  const fresh = promptRegistry.getPromptExampleById("study-canada-ng");
  assert(!fresh.countryTags.includes("MUTATED"), "lookup helpers should not expose mutable registry state");
}

testRegistryShape();
testNoDuplicateIds();
testExpectedToolIdsAreKnown();
testCategoryAndSurfaceCoverage();
testLookupHelpersReturnCopies();

console.log("AI prompt example registry tests passed");
