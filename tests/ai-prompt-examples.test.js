const assert = require("assert");

const promptRegistry = require("../assets/js/ai/example-registry.js");
const toolManifest = require("../assets/js/ai/tool-manifest.js");

const manifestIds = new Set(
  toolManifest
    .loadDefaultToolManifest()
    .map((entry) => entry.id)
    .concat(Object.keys(toolManifest.MAJOR_TOOL_OVERRIDES || {}))
);
const manifestById = new Map(
  toolManifest
    .loadDefaultToolManifest()
    .map((entry) => [entry.id, entry])
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
  "government",
  "african",
  "legal",
  "telecom",
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
  const validation = promptRegistry.validatePromptExamples(promptRegistry.PROMPT_EXAMPLES, {
    expectedToolIds: manifestIds,
    expectedToolMap: manifestById,
  });
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
  promptRegistry.PROMPT_EXAMPLES.forEach((example) => {
    const tool = manifestById.get(example.expectedToolId);
    assert(tool, `${example.id} should map to a manifest tool`);
    assert.strictEqual(example.expectedRoute, tool.route, `${example.id} expectedRoute should match the manifest route`);
    assert.strictEqual(example.toolCall.type, "existing_tool_call", `${example.id} should carry a tool-call contract`);
    assert.strictEqual(example.toolCall.toolId, example.expectedToolId, `${example.id} toolCall tool should match`);
    assert.strictEqual(example.toolCall.route, example.expectedRoute, `${example.id} toolCall route should match`);
  });
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
  const homepageExamples = promptRegistry.getPromptExamplesForSurface("homepage_command", { limit: 8 });
  const homepageCategories = new Set(homepageExamples.map((example) => example.category));
  assert.strictEqual(homepageExamples.length, 8, "homepage command surface should expose eight prompt chips");
  assert.ok(homepageCategories.size >= 8, "homepage command prompts should cover eight different workflow categories");
  assert.ok(homepageExamples.some((example) => example.category === "government"), "homepage command prompts should include a government workflow");
  assert.ok(homepageExamples.some((example) => example.category === "legal"), "homepage command prompts should include a legal workflow");
  assert.ok(homepageExamples.some((example) => example.category === "documents"), "homepage command prompts should include a browser-local document workflow");
  assert.ok(homepageExamples.every((example) => /\b(open|plan|estimate|compare|run|compress|prepare|build|get|generate|draft)\b/i.test(example.text)), "homepage prompts should read like action-oriented workflow requests");
  assert.ok(homepageExamples.every((example) => example.toolCall && example.toolCall.type === "existing_tool_call"), "homepage prompts should carry existing tool-call metadata");
  assert.ok(homepageExamples.every((example) => example.expectedRoute && example.expectedRoute.startsWith("/")), "homepage prompts should expose root-relative expected routes");
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
