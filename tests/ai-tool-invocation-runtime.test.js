#!/usr/bin/env node

const assert = require("assert");
const runtime = require("../assets/js/ai/tool-invocation-runtime.js");

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

const cvExecution = runtime.buildExecution({
  toolId: "cv-builder",
  selectedRoute: "/tools/cv-builder/",
  extractedInputs: {
    country: "Ghana",
    targetRole: "electrical engineer",
  },
  toolCall: {
    type: "existing_tool_call",
    action: "prefill_existing_tool",
    toolId: "cv-builder",
    route: "/tools/cv-builder/",
    title: "CV Builder",
    category: "career",
    subcategory: "career-documents",
    invocationMode: "session_prefill",
    canPrefill: true,
    inputSchema: { requiredInputs: [], optionalInputs: [] },
    providedInputNames: ["country", "targetRole"],
    missingInputNames: [],
    privacyMode: "browser_local",
    sourcePolicy: "user_input",
    safetyDomain: "employment",
    capabilities: ["route_only", "prefill", "generate_document", "export"],
    outputTypes: ["cv", "pdf", "json"],
  },
});

assert.strictEqual(cvExecution.type, "afrotools_existing_tool_execution");
assert.strictEqual(cvExecution.toolId, "cv-builder");
assert.strictEqual(cvExecution.action, "prefill_existing_tool");
assert.strictEqual(cvExecution.invocationMode, "session_prefill");
assert.strictEqual(cvExecution.canLaunch, true);
assert.strictEqual(cvExecution.canPrefill, true);
assert.strictEqual(cvExecution.payloadReady, true);
assert.strictEqual(cvExecution.storagePolicy, "sessionStorage_short_ttl");
assert.strictEqual(cvExecution.privacyMode, "browser_local");
assert.strictEqual(cvExecution.sourcePolicy, "user_input");
assert.strictEqual(cvExecution.safetyDomain, "employment");
assert.deepStrictEqual(cvExecution.missingInputs, []);
assert.strictEqual(cvExecution.normalizedInputs.country, "Ghana");
assert.strictEqual(cvExecution.normalizedInputs.targetRole, "electrical engineer");
assert.ok(!cvExecution.launchUrl.includes("Ghana"));
assert.ok(!cvExecution.launchUrl.toLowerCase().includes("electrical"));

const storage = memoryStorage();
assert.strictEqual(runtime.storeExecution(cvExecution, storage), true);
const stored = JSON.parse(storage.getItem("afrotools.aiPrefillDraft"));
assert.strictEqual(stored.toolId, "cv-builder");
assert.strictEqual(stored.normalizedInputs.country, "Ghana");

const routeOnlyExecution = runtime.buildExecution({
  toolId: "cost-of-living",
  selectedRoute: "/tools/cost-of-living/",
  extractedInputs: {
    country: "Kenya",
    monthlyBudget: 120000,
  },
  toolCall: {
    type: "existing_tool_call",
    action: "open_existing_tool",
    toolId: "cost-of-living",
    route: "/tools/cost-of-living/",
    canPrefill: false,
    invocationMode: "route_only",
    missingInputNames: [],
    privacyMode: "browser_local",
    sourcePolicy: "estimated",
    safetyDomain: "finance",
    capabilities: ["route_only", "explain", "export"],
    outputTypes: ["number", "report"],
  },
});

assert.strictEqual(routeOnlyExecution.toolId, "cost-of-living");
assert.strictEqual(routeOnlyExecution.action, "open_existing_tool");
assert.strictEqual(routeOnlyExecution.canLaunch, true);
assert.strictEqual(routeOnlyExecution.canPrefill, false);
assert.strictEqual(routeOnlyExecution.payloadReady, false);
assert.strictEqual(routeOnlyExecution.storagePolicy, "none");
assert.strictEqual(runtime.storeExecution(routeOnlyExecution, storage), false);
assert.ok(!routeOnlyExecution.launchUrl.includes("120000"));

const noAdapterExecution = runtime.buildExecution({
  toolId: "custom-workflow",
  selectedRoute: "tools/custom-workflow/",
  extractedInputs: { secret: "do not leak" },
  prefillAdapters: {},
});
assert.strictEqual(noAdapterExecution.route, "/tools/custom-workflow/");
assert.strictEqual(noAdapterExecution.launchUrl, "/tools/custom-workflow/");
assert.strictEqual(noAdapterExecution.payloadReady, false);
assert.ok(!noAdapterExecution.launchUrl.includes("do not leak"));

const summary = runtime.publicExecutionSummary(cvExecution);
assert.deepStrictEqual(summary, {
  schemaVersion: 1,
  type: "afrotools_existing_tool_execution_summary",
  toolId: "cv-builder",
  action: "prefill_existing_tool",
  invocationMode: "session_prefill",
  route: "/tools/cv-builder/",
  canLaunch: true,
  canPrefill: true,
  payloadReady: true,
  missingInputs: [],
  validationValid: true,
  storagePolicy: "sessionStorage_short_ttl",
  privacyMode: "browser_local",
  sourcePolicy: "user_input",
  safetyDomain: "employment",
});

console.log("AI tool invocation runtime validated: tool-call execution, prefill storage, route-only fallback, and public summaries.");
