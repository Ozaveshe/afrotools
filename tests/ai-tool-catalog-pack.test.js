#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const catalogPack = require("../scripts/generate-ai-tool-catalog-pack.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const ROOT = path.resolve(__dirname, "..");
const checkedPackPath = path.join(ROOT, "data", "ai", "tool-catalog-pack.json");

const pack = catalogPack.buildPack();
const manifest = manifestApi.getToolManifestForRouter();
const manifestIds = new Set(manifest.map((tool) => tool.id));
const packedIds = pack.chunks.flatMap((chunk) => chunk.toolIds);
const uniquePackedIds = new Set(packedIds);

assert.strictEqual(pack.schemaVersion, 1);
assert.strictEqual(pack.task, "afrotools_full_tool_catalog_pack");
assert.strictEqual(pack.scope, "model_context_for_existing_tool_calls");
assert.strictEqual(pack.gate.passed, true, "catalog pack gate should pass");
assert.strictEqual(pack.toolCount, manifest.length, "catalog pack should cover every router-safe manifest tool");
assert.ok(pack.toolCount >= 1000, "catalog pack should not shrink the available AfroTools catalog");
assert.ok(pack.categoryCount >= 20, "catalog pack should cover broad AfroTools categories");
assert.strictEqual(packedIds.length, manifest.length, "each manifest tool should appear in one catalog chunk");
assert.strictEqual(uniquePackedIds.size, manifest.length, "catalog chunks should not duplicate tools");
assert.deepStrictEqual([...uniquePackedIds].filter((id) => !manifestIds.has(id)), [], "catalog chunks should only include manifest tools");
assert.ok(pack.chunks.length > 1, "catalog should be chunked for model context windows");
assert.ok(pack.chunks.every((chunk) => chunk.charCount <= pack.maxChunkChars), "catalog chunks should obey the context budget");
assert.strictEqual(pack.privacy.containsRealUserData, false);
assert.strictEqual(pack.privacy.rawPromptIncluded, false);
assert.strictEqual(pack.privacy.rawTextDetected, false);
assert.ok(pack.retrievalPolicy.recommendedFlow.some((step) => /rankToolCandidates/.test(step)));
assert.ok(pack.toolCallSchema.requiredFields.includes("toolId"));

pack.chunks.forEach((chunk) => {
  assert.ok(chunk.id.startsWith("tool-catalog:"), `${chunk.id} should use catalog namespace`);
  assert.strictEqual(chunk.toolCount, chunk.tools.length);
  chunk.tools.forEach((tool) => {
    assert.ok(tool.id && manifestIds.has(tool.id), `${tool.id} should be in manifest`);
    assert.ok(tool.route.startsWith("/"), `${tool.id} route should be root-relative`);
    assert.strictEqual(tool.toolCall.type, "existing_tool_call");
    assert.strictEqual(tool.toolCall.toolId, tool.id);
    assert.strictEqual(tool.toolCall.route, tool.route);
    assert.ok(["open_existing_tool", "prefill_existing_tool"].includes(tool.toolCall.action));
    assert.strictEqual(catalogPack.hasSensitiveText(tool), false, `${tool.id} should not include sensitive-looking text`);
  });
});

["cv-builder", "import-duty", "solar-roi", "scholarship-finder", "pdf-workspace", "afroatlas"].forEach((toolId) => {
  assert.ok(uniquePackedIds.has(toolId), `${toolId} should be present in full catalog pack`);
});

if (fs.existsSync(checkedPackPath)) {
  const checkedPack = JSON.parse(fs.readFileSync(checkedPackPath, "utf8"));
  assert.strictEqual(checkedPack.schemaVersion, pack.schemaVersion);
  assert.strictEqual(checkedPack.toolCount, pack.toolCount);
  assert.strictEqual(checkedPack.chunkCount, pack.chunkCount);
  assert.strictEqual(checkedPack.manifestHash, pack.manifestHash);
  assert.strictEqual(checkedPack.gate.passed, true);
}

console.log(`AI full tool catalog pack validated: ${pack.toolCount} tools across ${pack.chunkCount} chunks.`);
