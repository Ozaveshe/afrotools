#!/usr/bin/env node

const assert = require("assert");

const orchestrator = require("../assets/js/ai/orchestrator.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const manifest = manifestApi.getToolManifestForRouter();

const cvPlan = orchestrator.buildPlan("Write a CV for an electrical engineer in Ghana", {
  manifest,
  locale: "en",
  consentToModel: false,
});

assert.strictEqual(cvPlan.schemaVersion, 1);
assert.strictEqual(cvPlan.type, "afrotools_ai_orchestration_plan");
assert.strictEqual(cvPlan.status, "success");
assert.strictEqual(cvPlan.source, "deterministic_full_catalog");
assert.strictEqual(cvPlan.query.rawIncluded, false);
assert.strictEqual(cvPlan.manifest.routerSafeToolCount, manifest.length);
assert.strictEqual(cvPlan.selectedTool.id, "cv-builder");
assert.strictEqual(cvPlan.toolCall.type, "existing_tool_call");
assert.strictEqual(cvPlan.toolCall.toolId, "cv-builder");
assert.strictEqual(cvPlan.execution.type, "afrotools_existing_tool_execution");
assert.strictEqual(cvPlan.execution.toolId, "cv-builder");
assert.ok(cvPlan.execution.launchUrl.startsWith("/tools/cv-builder/"));
assert.strictEqual(cvPlan.consent.consentToModel, false);
assert.strictEqual(cvPlan.safety.privacyMode, "browser_local");
assert.ok(Array.isArray(cvPlan.toolCandidates));
assert.ok(cvPlan.toolCandidates.every((candidate) => candidate.type === "existing_tool_candidate"));
assert.ok(!JSON.stringify(cvPlan.toolCandidates).toLowerCase().includes("electrical engineer"));

const cvSummary = orchestrator.publicPlanSummary(cvPlan);
assert.strictEqual(cvSummary.type, "afrotools_ai_orchestration_summary");
assert.strictEqual(cvSummary.rawQueryIncluded, false);
assert.strictEqual(cvSummary.selectedToolId, "cv-builder");
assert.strictEqual(cvSummary.toolCallType, "existing_tool_call");
assert.strictEqual(cvSummary.execution.type, "afrotools_existing_tool_execution_summary");
assert.strictEqual(cvSummary.routerSafeToolCount, manifest.length);
assert.ok(!JSON.stringify(cvSummary).toLowerCase().includes("electrical engineer"));

const partialCvPlan = orchestrator.buildPlan("n electrical engineer in Ghana", {
  manifest,
  locale: "en",
});
assert.strictEqual(partialCvPlan.status, "success");
assert.strictEqual(partialCvPlan.selectedTool.id, "cv-builder");
assert.strictEqual(partialCvPlan.decision.extractedInputs.country, "Ghana");
assert.strictEqual(partialCvPlan.decision.extractedInputs.targetRole, "electrical engineer");

const passportPlan = orchestrator.buildPlan("Get Ghana passport documents, fees to check, and next steps", {
  manifest,
  locale: "en",
});
assert.strictEqual(passportPlan.selectedTool.id, "passport-checklist");
assert.strictEqual(passportPlan.execution.canLaunch, true);
assert.strictEqual(passportPlan.execution.payloadReady, false);

const noMatch = orchestrator.buildPlan("blue sky weekend vibes", { manifest });
assert.strictEqual(noMatch.status, "no_match");
assert.strictEqual(noMatch.selectedTool.id, "tool-search");
assert.strictEqual(noMatch.toolCall.toolId, "tool-search");
assert.ok(noMatch.execution.launchUrl.startsWith("/search/"));

console.log("AI orchestrator validated: query to existing-tool execution plan stays local-first and sanitized.");
