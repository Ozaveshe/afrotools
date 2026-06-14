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
