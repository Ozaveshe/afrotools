#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const evaluator = require("../scripts/evaluate-ai-tool-call-corpus.js");

const result = evaluator.runEvaluation();
const report = result.report;

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.task, "afrotools_tool_call_routing_eval");
assert.strictEqual(report.corpus.syntheticOnly, true);
assert.strictEqual(report.corpus.containsRealUserData, false);
assert.ok(report.corpus.recordCount >= 140, "tool-call eval should cover the generated corpus");
assert.strictEqual(report.totals.total, result.records.length);
assert.strictEqual(report.totals.exactToolPassRate, 1, "deterministic router should match every synthetic expected tool");
assert.strictEqual(report.totals.executablePassRate, 1, "every routed tool call should produce an executable launch plan");
assert.strictEqual(report.totals.urlPrivacyPassRate, 1, "launch URLs should not expose private extracted values");
assert.strictEqual(report.gate.passed, true, "tool-call eval gate should pass");
assert.deepStrictEqual(report.failures, []);

["routing_eval_fixture", "prompt_example_registry"].forEach((source) => {
  assert.ok(report.bySource[source], `report should include source bucket ${source}`);
  assert.strictEqual(report.bySource[source].exactToolPassRate, 1);
});

["education", "career", "sme", "trade", "energy", "documents", "construction", "agriculture"].forEach((category) => {
  assert.ok(report.byCategory[category], `report should include category bucket ${category}`);
  assert.strictEqual(report.byCategory[category].executablePassRate, 1);
});

const reportPath = path.join(__dirname, "..", "data", "ai", "tool-call-eval-report.json");
if (fs.existsSync(reportPath)) {
  const checkedIn = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.strictEqual(checkedIn.corpus.recordCount, report.corpus.recordCount, "checked-in eval report should match generated corpus size");
  assert.strictEqual(checkedIn.gate.passed, true, "checked-in eval report should keep the gate passing");
  assert.strictEqual(checkedIn.totals.exactToolPassRate, report.totals.exactToolPassRate);
}

console.log(`AI tool-call eval gate passed: ${report.totals.exactToolPassRate} exact tool rate across ${report.totals.total} records.`);
