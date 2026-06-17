#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const architectureReport = require("../scripts/generate-ai-product-architecture-report.js");

const report = architectureReport.buildReport();

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.task, "afrotools_ai_product_architecture");
assert.strictEqual(report.scope, "repo_artifacts_not_live_production");
assert.strictEqual(report.gate.passed, true, "AI product architecture gate should pass");
assert.strictEqual(report.gate.failedCount, 0, "architecture report should have no failed checks");
assert.ok(report.architecture.layerCount >= 6, "architecture should describe the major AI product layers");
assert.strictEqual(report.architecture.architectureStyle, "static_first_ai_orchestration");
assert.ok(/vanilla browser JavaScript/.test(report.architecture.frameworkDecision.decision), "framework decision should stay lightweight");
assert.deepStrictEqual(report.dependencyPolicy.installedHeavyUiFrameworks, [], "AI product should not add a heavy UI framework dependency by default");
assert.ok(report.catalog.toolCount >= 1000, "architecture should be backed by the full existing-tool catalog");
assert.ok(report.catalog.chunkCount > 1, "architecture should include chunked model context");
assert.strictEqual(report.catalog.gate.passed, true);
assert.strictEqual(report.readiness.gate.passed, true);
assert.ok(report.checks.some((item) => item.label === "orchestrator_contract_present" && item.passed), "architecture should gate the shared AI orchestrator contract");
assert.ok(report.checks.some((item) => item.label === "homepage_ai_bridge_present" && item.passed), "architecture should gate the homepage AI bridge");
assert.ok(report.checks.some((item) => item.label === "ask_ai_bridge_present" && item.passed), "architecture should gate the Ask AfroTools AI bridge");
assert.ok(report.checks.some((item) => item.label === "ask_refinement_chips_present" && item.passed), "architecture should gate Ask AfroTools AI refinement chips");
assert.ok(report.checks.some((item) => item.label === "ask_feedback_telemetry_present" && item.passed), "architecture should gate Ask AfroTools AI feedback telemetry");
assert.ok(report.checks.some((item) => item.label === "ask_funnel_telemetry_present" && item.passed), "architecture should gate Ask AfroTools AI funnel telemetry");
assert.ok(report.checks.some((item) => item.label === "ask_source_freshness_notice_present" && item.passed), "architecture should gate Ask AfroTools AI source and freshness guidance");
assert.ok(report.checks.some((item) => item.label === "analytics_surface_dimension_present" && item.passed), "architecture should gate sanitized AI surface telemetry");
assert.ok(report.checks.some((item) => item.label === "multi_surface_funnel_telemetry_present" && item.passed), "architecture should gate homepage/search/widget AI funnel telemetry");
assert.ok(report.checks.some((item) => item.label === "ai_fallback_links_avoid_raw_prompt_urls" && item.passed), "architecture should gate raw-prompt-safe fallback links");
assert.ok(report.checks.some((item) => item.label === "search_ai_bridge_present" && item.passed), "architecture should gate the search-page AI bridge");
assert.ok(report.checks.some((item) => item.label === "widget_iframe_handoff_contract" && item.passed), "architecture should gate iframe-safe widget handoffs");
assert.ok(report.architecture.gates.includes("npm run ai:model-splits"));
assert.ok(report.architecture.gates.includes("npm run eval:ai-tool-calls"));
assert.ok(report.architecture.gates.includes("npm run test:ai"));
assert.ok(report.architecture.mermaid.includes("AI orchestrator"));
assert.ok(report.architecture.mermaid.includes("Existing AfroTools tool call"));

const checkedReportPath = path.join(__dirname, "..", "data", "ai", "ai-product-architecture-report.json");
if (fs.existsSync(checkedReportPath)) {
  const checkedReport = JSON.parse(fs.readFileSync(checkedReportPath, "utf8"));
  assert.strictEqual(checkedReport.schemaVersion, report.schemaVersion);
  assert.strictEqual(checkedReport.gate.passed, report.gate.passed);
  assert.strictEqual(checkedReport.architecture.layerCount, report.architecture.layerCount);
  assert.strictEqual(checkedReport.catalog.toolCount, report.catalog.toolCount);
  assert.strictEqual(checkedReport.catalog.chunkCount, report.catalog.chunkCount);
}

console.log("AI product architecture validated: lightweight static-first AI orchestration is gated.");
