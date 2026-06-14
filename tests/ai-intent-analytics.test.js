const assert = require("assert");

function createStorage() {
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
    clear() {
      data.clear();
    }
  };
}

global.localStorage = createStorage();
global.location = { search: "" };
global.AFROTOOLS_FLAGS = {};

const analytics = require("../assets/js/ai/intent-analytics.js");

function sampleState(overrides = {}) {
  return Object.assign({
    originalQuery: "Import a 2016 Toyota Axio into Nigeria with $8,000",
    selectedToolId: "import-duty",
    selectedToolRoute: "/tools/import-duty/",
    confidence: 0.82,
    extractedInputs: {
      destinationCountry: "Nigeria",
      itemCategory: "Toyota Axio"
    },
    missingInputs: ["itemValue", "engineCc"],
    clarificationAnswers: {},
    source: "deterministic",
    entrySource: "homepage_input",
    consentToModel: false
  }, overrides);
}

analytics.reset();

assert.strictEqual(analytics.queryLengthBucket(""), "0");
assert.strictEqual(analytics.queryLengthBucket("short query"), "1-20");
assert.strictEqual(analytics.queryLengthBucket("x".repeat(61)), "61-140");
assert.strictEqual(analytics.normalizeSource("example_chip"), "prompt_chip");
assert.strictEqual(analytics.normalizeSource("home"), "homepage_input");

const payload = analytics.buildPayload("ai_intent_routed", sampleState(), {});
assert.strictEqual(payload.intent_category, "unknown");
assert.strictEqual(payload.selected_tool_id, "import-duty");
assert.strictEqual(payload.country_detected, "Nigeria");
assert.deepStrictEqual(payload.missing_input_types, ["itemValue", "engineCc"]);
assert.strictEqual(payload.source, "homepage_input");
assert.strictEqual(payload.query_length_bucket, "21-60");
assert.strictEqual(Object.prototype.hasOwnProperty.call(payload, "raw_query"), false);

analytics.record("ai_intent_routed", sampleState({ intentCategory: "finance" }), { intentCategory: "finance" });
analytics.record("ai_intent_clarification_shown", sampleState({ intentCategory: "finance" }), { intentCategory: "finance" });
analytics.record("ai_intent_clarification_answered", sampleState({ intentCategory: "finance", missingInputs: ["engineCc"] }), {
  intentCategory: "finance",
  missingInputs: ["engineCc"]
});
analytics.record("ai_intent_tool_open", sampleState({ intentCategory: "finance", missingInputs: [] }), {
  intentCategory: "finance",
  toolOpenClicked: true,
  missingInputs: []
});

let report = analytics.getReport();
assert.strictEqual(report.totals.routed, 1);
assert.strictEqual(report.totals.toolOpen, 1);
assert.strictEqual(report.totals.clarificationShown, 1);
assert.strictEqual(report.totals.clarificationAnswered, 1);
assert.strictEqual(report.fallbackRate, 0);
assert.strictEqual(report.toolOpenRate, 100);
assert.strictEqual(report.clarificationCompletionRate, 100);
assert.strictEqual(report.topRoutedCategories[0].name, "finance");
assert.strictEqual(report.topCountriesDetected[0].name, "Nigeria");
assert(report.topMissingInputs.some((item) => item.name === "engineCc"));

analytics.reset();
const promptPayload = analytics.record("ai_prompt_submitted", sampleState({
  originalQuery: "Write a CV for an electrical engineer in Ghana. Phone 555-0100."
}), {
  query: "Write a CV for an electrical engineer in Ghana. Phone 555-0100.",
  queryLength: 65,
  source: "homepage_input"
});
assert.strictEqual(promptPayload.query_length_bucket, "61-140");
assert.strictEqual(promptPayload.safe_prompt_example, "import-duty / Nigeria / length:61-140");
assert.strictEqual(Object.prototype.hasOwnProperty.call(promptPayload, "raw_query"), false);

analytics.record("ai_intent_detected", sampleState({
  originalQuery: "Should I install solar for my shop in Lagos?",
  selectedToolId: "solar-roi",
  confidence: 0.78,
  extractedInputs: { country: "Nigeria", city: "Lagos" },
  missingInputs: ["monthlyElectricitySpend"]
}), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor"
});
analytics.record("ai_clarification_shown", sampleState({
  selectedToolId: "solar-roi",
  missingInputs: ["monthlyElectricitySpend"]
}), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor",
  missingInputs: ["monthlyElectricitySpend"]
});
analytics.record("ai_clarification_answered", sampleState({
  selectedToolId: "solar-roi",
  missingInputs: []
}), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor",
  missingInputs: []
});
analytics.record("ai_tool_opened", sampleState({
  selectedToolId: "solar-roi",
  missingInputs: []
}), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor",
  toolOpenClicked: true,
  missingInputs: []
});
analytics.record("ai_prefill_success", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor",
  prefillStatus: "success"
});
analytics.record("ai_prefill_failed", sampleState({ selectedToolId: "invoice-generator" }), {
  intentCategory: "business",
  selectedToolId: "invoice-generator",
  workflowType: "sme_finance",
  prefillStatus: "unsupported"
});
analytics.record("ai_export_generated", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor",
  exportType: "pdf"
});
analytics.record("ai_project_saved", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  workflowType: "energy_advisor"
});
analytics.record("ai_signup_prompt_shown", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  conversionType: "signup"
});
analytics.record("ai_pro_upgrade_clicked", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  conversionType: "pro"
});
analytics.record("sponsor_lead_optin_submitted", sampleState({ selectedToolId: "solar-roi" }), {
  intentCategory: "energy",
  selectedToolId: "solar-roi",
  conversionType: "sponsor_lead"
});
analytics.record("ai_intent_fallback", sampleState({
  originalQuery: "unclear local task",
  selectedToolId: "tool-search",
  extractedInputs: {},
  missingInputs: [],
  source: "fallback",
  intentCategory: "unknown"
}), {
  selectedToolId: "tool-search",
  fallbackUsed: true,
  routerSource: "no_keyword_match",
  noMatchCategory: "no_keyword_match"
});

report = analytics.getReport();
assert.strictEqual(report.totals.promptsSubmitted, 1);
assert.strictEqual(report.totals.intentsDetected, 1);
assert.strictEqual(report.totals.toolOpen, 1);
assert.strictEqual(report.totals.prefillSuccess, 1);
assert.strictEqual(report.totals.prefillFailed, 1);
assert.strictEqual(report.totals.exportsGenerated, 1);
assert.strictEqual(report.totals.projectsSaved, 1);
assert.strictEqual(report.totals.signupPromptShown, 1);
assert.strictEqual(report.totals.proUpgradeClicked, 1);
assert.strictEqual(report.totals.sponsorLeadOptinSubmitted, 1);
assert.strictEqual(report.prefillSuccessRate, 50);
assert(report.topWorkflows.some((item) => item.name === "energy_advisor"));
assert(report.exportTypes.some((item) => item.name === "pdf"));
assert(report.noMatchCategories.some((item) => item.name === "no_keyword_match"));
assert(report.safePromptExamples.every((item) => !/555-0100|electrical engineer/i.test(item.name)));

analytics.reset();
analytics.record("ai_intent_fallback", sampleState({
  originalQuery: "unclear",
  selectedToolId: "tool-search",
  extractedInputs: {},
  missingInputs: [],
  source: "fallback",
  intentCategory: "unknown"
}), {
  selectedToolId: "tool-search",
  fallbackUsed: true,
  routerSource: "low_confidence_or_empty"
});
report = analytics.getReport();
assert.strictEqual(report.totals.fallback, 1);
assert.strictEqual(report.fallbackRate, 100);

global.NEXT_PUBLIC_AFROTOOLS_AI_RAW_QUERY_LOGGING = "true";
const rawPayload = analytics.buildPayload("ai_intent_routed", sampleState(), {});
assert.strictEqual(rawPayload.raw_query, "Import a 2016 Toyota Axio into Nigeria with $8,000");
assert.strictEqual(rawPayload.raw_query_logging_enabled, true);
delete global.NEXT_PUBLIC_AFROTOOLS_AI_RAW_QUERY_LOGGING;

global.location = { search: "?ai_debug=intent" };
assert.strictEqual(analytics.isDebugMode(), true);

console.log("ai-intent-analytics tests passed");
