#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const corpus = require("../scripts/generate-ai-tool-call-corpus.js");
const evalRunner = require("../scripts/evaluate-ai-routing.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const promptExamples = require("../assets/js/ai/example-registry.js");
const invocationRuntime = require("../assets/js/ai/tool-invocation-runtime.js");

const result = corpus.buildCorpus();
assert.deepStrictEqual(result.errors, [], "generated AI tool-call corpus should validate cleanly");

const manifest = manifestApi.getToolManifestForRouter();
const manifestIds = new Set(manifest.map((entry) => entry.id));
const fixtures = evalRunner.loadFixtures();

assert.ok(result.records.length >= fixtures.length + promptExamples.PROMPT_EXAMPLES.length, "corpus should include routing fixtures and prompt examples");
assert.strictEqual(result.report.privacy.syntheticOnly, true);
assert.strictEqual(result.report.privacy.containsRealUserData, false);
assert.ok(result.report.bySplit.eval >= fixtures.length, "routing fixtures should land in the eval split");
assert.ok(result.report.bySplit.train > 0, "prompt examples should contribute train records");

const categories = new Set(result.records.map((record) => record.expected.intentCategory));
evalRunner.REQUIRED_CATEGORIES.forEach((category) => {
  assert.ok(categories.has(category), `corpus missing category ${category}`);
});

for (const record of result.records) {
  assert.strictEqual(record.schemaVersion, 1);
  assert.ok(record.id.includes(":"), `${record.id} should namespace source`);
  assert.ok(["routing_eval_fixture", "prompt_example_registry"].includes(record.source), `${record.id} should use a known safe source`);
  assert.ok(["train", "eval"].includes(record.split), `${record.id} split should be train or eval`);
  assert.strictEqual(record.task, "afrotools_tool_call_routing");
  assert.strictEqual(record.prompt.promptId, "router.classify-intent");
  assert.ok(record.prompt.promptVersion, `${record.id} should include prompt version`);
  assert.strictEqual(record.messages.length, 1);
  assert.strictEqual(record.messages[0].role, "user");
  assert.ok(record.messages[0].content.length > 8);
  assert.ok(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(record.messages[0].content), `${record.id} should not include emails`);
  assert.ok(!/\+?\d[\d\s().-]{7,}\d/.test(record.messages[0].content), `${record.id} should not include phone-like strings`);
  assert.ok(manifestIds.has(record.expected.selectedToolId), `${record.id} selected tool should exist`);
  assert.strictEqual(record.expected.toolCall.type, "existing_tool_call");
  assert.strictEqual(record.expected.toolCall.toolId, record.expected.selectedToolId);
  assert.ok(record.expected.toolCall.route.startsWith("/"));
  const execution = invocationRuntime.buildExecution({
    toolId: record.expected.selectedToolId,
    selectedRoute: record.expected.selectedRoute,
    extractedInputs: {},
    toolCall: record.expected.toolCall,
  });
  assert.strictEqual(execution.type, "afrotools_existing_tool_execution");
  assert.strictEqual(execution.toolCall.type, "existing_tool_call");
  assert.ok(execution.launchUrl.startsWith("/"), `${record.id} execution launch URL should stay root-relative`);
  assert.ok(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(execution.launchUrl + execution.userFacingSummary), `${record.id} execution should not expose emails`);
  assert.ok(!/\+?\d[\d\s().-]{7,}\d/.test(execution.launchUrl + execution.userFacingSummary), `${record.id} execution should not expose phone-like strings`);
  assert.strictEqual(record.privacy.synthetic, true);
  assert.strictEqual(record.privacy.containsRealUserData, false);
  assert.strictEqual(record.privacy.storesRawPrivateContent, false);
}

const outputPath = path.join(__dirname, "..", "data", "ai", "tool-call-training-corpus.jsonl");
const reportPath = path.join(__dirname, "..", "data", "ai", "tool-call-training-corpus.report.json");
if (fs.existsSync(outputPath)) {
  const lines = fs.readFileSync(outputPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  assert.strictEqual(lines.length, result.records.length, "checked-in corpus should match generated record count");
  JSON.parse(lines[0]);
}
if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.strictEqual(report.recordCount, result.records.length, "checked-in corpus report should match generated record count");
}

console.log(`AI tool-call corpus validated: ${result.records.length} synthetic records across ${categories.size} categories.`);
