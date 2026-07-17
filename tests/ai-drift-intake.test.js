#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const driftIntake = require("../scripts/generate-ai-drift-intake.js");

const ROOT = path.resolve(__dirname, "..");
const sampleInput = path.join(ROOT, "data", "ai", "drift-intake", "sample-router-feedback-report.json");
const checkedReportPath = path.join(ROOT, "data", "ai", "drift-intake", "router-drift-intake-report.json");

const report = driftIntake.buildReport({ input: sampleInput });

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.task, "afrotools_ai_drift_to_eval_intake");
assert.strictEqual(report.scope, "sanitized_aggregate_feedback_not_raw_prompts");
assert.strictEqual(report.source.rawPromptRequired, false);
assert.strictEqual(report.source.rawPromptIncluded, false);
assert.strictEqual(report.privacy.syntheticPromptsOnly, true);
assert.strictEqual(report.privacy.generatedQueueRawPromptDetected, false);
assert.strictEqual(report.gate.passed, true);
assert.strictEqual(report.gate.needsHumanReview, true);
assert.ok(report.gate.reviewQueueCount >= 5, "drift intake should create a useful review queue");

const queueText = JSON.stringify(report.reviewQueue);
assert(!/person@example\.com|555-0100|private solar question|raw_query|originalQuery/i.test(queueText));
assert.strictEqual(
  new Set(report.reviewQueue.map((item) => item.fixtureStub.id)).size,
  report.reviewQueue.length,
  "fixture stubs should have unique ids before promotion into eval fixtures"
);

const solar = report.reviewQueue.find((item) => item.selectedToolId === "solar-roi");
assert.ok(solar, "known solar-roi feedback should create a queue item");
assert.strictEqual(solar.selectedRoute, "/tools/solar-roi/");
assert.strictEqual(solar.priority, "high");
assert.ok(/synthetic routing fixture|manifest synonym/i.test(solar.recommendedAction));
assert.strictEqual(solar.fixtureStub.privacy.containsRealUserData, false);
assert.strictEqual(solar.fixtureStub.privacy.rawPromptUnavailable, true);
assert.strictEqual(solar.fixtureStub.prompt.includes("[REDACTED:"), true);

const fallback = report.reviewQueue.find((item) => item.signal === "fallback_or_no_match");
assert.ok(fallback, "fallback/no-match feedback should create a queue item");
assert.strictEqual(fallback.selectedToolId, "tool-search");
assert.ok(/full-catalog retrieval|no-match regression/i.test(fallback.recommendedAction));

const missingInput = report.reviewQueue.find((item) => item.signal === "missing_context");
assert.ok(missingInput, "missing-input aggregate should create a clarification review item");
assert.ok(/Clarification review|review-needed/.test(missingInput.title + missingInput.selectedToolId));

assert.strictEqual(driftIntake.hasRawText({ email: "person@example.com" }), true);
assert.strictEqual(driftIntake.hasRawText(report.reviewQueue), false);

if (fs.existsSync(checkedReportPath)) {
  const checkedReport = JSON.parse(fs.readFileSync(checkedReportPath, "utf8"));
  assert.strictEqual(checkedReport.schemaVersion, report.schemaVersion);
  assert.strictEqual(checkedReport.task, report.task);
  assert.strictEqual(checkedReport.gate.passed, true);
  assert.strictEqual(checkedReport.gate.reviewQueueCount, report.gate.reviewQueueCount);
  assert.strictEqual(checkedReport.privacy.generatedQueueRawPromptDetected, false);
}

console.log("AI drift-to-eval intake report validated.");
