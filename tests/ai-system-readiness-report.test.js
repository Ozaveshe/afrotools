#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const readiness = require("../scripts/generate-ai-system-readiness-report.js");

const report = readiness.buildReport();

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.task, "afrotools_ai_system_readiness");
assert.strictEqual(report.scope, "repo_artifacts_not_live_production");
assert.strictEqual(report.gate.passed, true, "AI readiness gate should pass for current repo artifacts");
assert.strictEqual(report.gate.failedCount, 0, "readiness report should not have failed checks");
assert.ok(report.checks.length >= 10, "readiness report should include production AI checks");

const checkMap = new Map(report.checks.map((check) => [check.label, check]));
[
  "prompt_registry_valid",
  "router_prompt_production",
  "manifest_large_enough",
  "tool_catalog_pack_complete",
  "corpus_large_enough",
  "category_coverage",
  "model_splits_present",
  "held_out_category_coverage",
  "tool_call_eval_gate",
  "synthetic_privacy_contract",
].forEach((label) => {
  assert.ok(checkMap.has(label), `readiness report missing ${label}`);
  assert.strictEqual(checkMap.get(label).passed, true, `${label} should pass`);
});

assert.ok(report.promptRegistry.productionPromptCount >= 4, "prompt registry should expose production prompt versions");
assert.ok(report.promptRegistry.prompts.some((prompt) => prompt.id === "router.classify-intent" && prompt.hasProductionVersion));
assert.ok(report.routerManifest.routerSafeToolCount >= 1000, "readiness should cover the full existing-tool manifest");
assert.strictEqual(report.toolCatalogPack.toolCount, report.routerManifest.routerSafeToolCount);
assert.ok(report.toolCatalogPack.chunkCount > 1, "tool catalog pack should be chunked for model context windows");
assert.strictEqual(report.toolCatalogPack.gate.passed, true);
assert.strictEqual(report.toolCatalogPack.privacy.containsRealUserData, false);
assert.strictEqual(report.toolCatalogPack.privacy.rawPromptIncluded, false);
assert.ok(report.corpus.recordCount >= 100, "readiness should cover production-scale synthetic corpus");
assert.ok(report.corpus.categoryCount >= 20, "readiness should cover broad AfroTools categories");
assert.strictEqual(report.corpus.syntheticOnly, true);
assert.strictEqual(
  report.modelTraining.splitCounts.train + report.modelTraining.splitCounts.validation + report.modelTraining.splitCounts.test,
  report.corpus.recordCount,
  "model split counts should cover the generated corpus"
);
assert.ok(report.modelTraining.splitCounts.train >= 100, "training split should stay production-scale");
assert.ok(report.modelTraining.splitCounts.validation >= 20, "validation split should stay meaningful");
assert.ok(report.modelTraining.splitCounts.test >= 20, "test split should stay meaningful");
assert.ok(report.modelTraining.heldOutCategoryCount >= 12, "held-out splits should cover many categories");
assert.strictEqual(report.modelTraining.privacy.syntheticOnly, true);
assert.strictEqual(report.evaluation.gate.passed, true);
assert.strictEqual(report.evaluation.totals.exactToolPassRate, 1);
assert.strictEqual(report.evaluation.totals.executablePassRate, 1);
assert.strictEqual(report.evaluation.totals.urlPrivacyPassRate, 1);
assert.ok(report.operations.primaryRunbook.includes("npm run test:ai"));
assert.ok(report.operations.liveDataNote.includes("repo artifacts only"));

const checkedReportPath = path.join(__dirname, "..", "data", "ai", "ai-system-readiness-report.json");
if (fs.existsSync(checkedReportPath)) {
  const checkedReport = JSON.parse(fs.readFileSync(checkedReportPath, "utf8"));
  assert.strictEqual(checkedReport.schemaVersion, report.schemaVersion);
  assert.strictEqual(checkedReport.gate.passed, report.gate.passed);
  assert.strictEqual(checkedReport.routerManifest.routerSafeToolCount, report.routerManifest.routerSafeToolCount);
  assert.strictEqual(checkedReport.toolCatalogPack.toolCount, report.toolCatalogPack.toolCount);
  assert.strictEqual(checkedReport.toolCatalogPack.chunkCount, report.toolCatalogPack.chunkCount);
  assert.strictEqual(checkedReport.toolCatalogPack.manifestHash, report.toolCatalogPack.manifestHash);
  assert.strictEqual(checkedReport.corpus.recordCount, report.corpus.recordCount);
  assert.deepStrictEqual(checkedReport.modelTraining.splitCounts, report.modelTraining.splitCounts);
}

console.log("AI system readiness report validated: repo AI artifacts are coherent and gated.");
