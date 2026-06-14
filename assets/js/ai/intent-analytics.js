!function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root || {});
  } else {
    root.AfroToolsAIIntentAnalytics = factory(root);
  }
}(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var STORAGE_KEY = "afrotools.aiIntentAnalytics.v1";
  var RAW_QUERY_ENV = "NEXT_PUBLIC_AFROTOOLS_AI_RAW_QUERY_LOGGING";
  var DEBUG_STORAGE_KEY = "afrotools.aiIntentDebug";
  var ALLOWED_SOURCES = {
    homepage_input: true,
    prompt_chip: true,
    direct_ai: true,
    category_pill: true,
    search_fallback: true,
    unknown: true
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function safeString(value, fallback) {
    var text = String(value || "").trim();
    return text ? text.slice(0, 80) : fallback || "unknown";
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function increment(map, key, amount) {
    var clean = safeString(key);
    map[clean] = (Number(map[clean]) || 0) + (Number(amount) || 1);
  }

  function emptyStore() {
    return {
      version: 2,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      totals: {
        promptsSubmitted: 0,
        intentsDetected: 0,
        routed: 0,
        fallback: 0,
        toolOpen: 0,
        prefillSuccess: 0,
        prefillFailed: 0,
        clarificationShown: 0,
        clarificationAnswered: 0,
        clarificationAbandoned: 0,
        exportsGenerated: 0,
        projectsSaved: 0,
        signupPromptShown: 0,
        proUpgradeClicked: 0,
        sponsorLeadOptinSubmitted: 0
      },
      categories: {},
      workflows: {},
      tools: {},
      countries: {},
      missingInputs: {},
      queryLengthBuckets: {},
      sources: {},
      confidenceBuckets: {},
      exportTypes: {},
      noMatchCategories: {},
      safePromptExamples: {}
    };
  }

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (err) {
      return null;
    }
  }

  function readStore() {
    var storage = getStorage();
    if (!storage) return emptyStore();
    try {
      var parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
      if (!parsed || !parsed.totals) return emptyStore();
      return Object.assign(emptyStore(), parsed, {
        totals: Object.assign(emptyStore().totals, parsed.totals || {}),
        categories: Object.assign({}, parsed.categories || {}),
        workflows: Object.assign({}, parsed.workflows || {}),
        tools: Object.assign({}, parsed.tools || {}),
        countries: Object.assign({}, parsed.countries || {}),
        missingInputs: Object.assign({}, parsed.missingInputs || {}),
        queryLengthBuckets: Object.assign({}, parsed.queryLengthBuckets || {}),
        sources: Object.assign({}, parsed.sources || {}),
        confidenceBuckets: Object.assign({}, parsed.confidenceBuckets || {}),
        exportTypes: Object.assign({}, parsed.exportTypes || {}),
        noMatchCategories: Object.assign({}, parsed.noMatchCategories || {}),
        safePromptExamples: Object.assign({}, parsed.safePromptExamples || {})
      });
    } catch (err) {
      return emptyStore();
    }
  }

  function writeStore(store) {
    var storage = getStorage();
    if (!storage) return false;
    try {
      store.updatedAt = nowIso();
      storage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (err) {
      return false;
    }
  }

  function queryLengthBucket(queryOrLength) {
    var length = typeof queryOrLength === "number" ? queryOrLength : String(queryOrLength || "").trim().length;
    if (!length) return "0";
    if (length <= 20) return "1-20";
    if (length <= 60) return "21-60";
    if (length <= 140) return "61-140";
    if (length <= 280) return "141-280";
    return "281+";
  }

  function normalizeSource(source) {
    var value = safeString(source, "unknown").toLowerCase().replace(/[-\s]+/g, "_");
    if (value === "homepage" || value === "home" || value === "form" || value === "button" || value === "keyboard") return "homepage_input";
    if (value === "example" || value === "example_chip" || value === "chip") return "prompt_chip";
    if (value === "category" || value === "category_tile") return "category_pill";
    if (value === "direct" || value === "ai") return "direct_ai";
    return ALLOWED_SOURCES[value] ? value : "unknown";
  }

  function normalizeMissingInputs(inputs) {
    var values = Array.isArray(inputs) ? inputs : [];
    return values.map(function (item) {
      return safeString(item).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    }).filter(Boolean);
  }

  function isRawQueryLoggingEnabled() {
    var flags = root.AFROTOOLS_FLAGS || {};
    var candidates = [
      root[RAW_QUERY_ENV],
      flags[RAW_QUERY_ENV],
      flags.aiRawQueryLogging
    ];
    for (var i = 0; i < candidates.length; i += 1) {
      if (candidates[i] === true || candidates[i] === 1) return true;
      if (typeof candidates[i] === "string" && /^(1|true|yes|enabled)$/i.test(candidates[i])) return true;
    }
    try {
      return /^(1|true|yes|enabled)$/i.test(String(root.localStorage && root.localStorage.getItem(RAW_QUERY_ENV) || ""));
    } catch (err) {
      return false;
    }
  }

  function isDebugMode() {
    try {
      var params = new URLSearchParams(root.location && root.location.search || "");
      if (/^(1|true|intent)$/i.test(params.get("ai_debug") || "")) return true;
      if (/^(1|true|intent)$/i.test(params.get("debug_intent") || "")) return true;
      if (root.localStorage && /^(1|true|intent)$/i.test(root.localStorage.getItem(DEBUG_STORAGE_KEY) || "")) return true;
    } catch (err) {}
    return false;
  }

  function buildPayload(eventName, state, meta) {
    state = isObject(state) ? state : {};
    meta = isObject(meta) ? meta : {};
    var query = String(state.originalQuery || meta.query || "");
    var extractedInputs = isObject(state.extractedInputs) ? state.extractedInputs : {};
    var clarificationAnswers = isObject(state.clarificationAnswers) ? state.clarificationAnswers : {};
    var country = extractedInputs.country || extractedInputs.destinationCountry || extractedInputs.targetCountry ||
      clarificationAnswers.country || clarificationAnswers.destinationCountry || clarificationAnswers.targetCountry || "";
    var payload = {
      surface: "ai_command_page",
      intent_category: safeString(meta.intentCategory || state.intentCategory || state.safetyDomain || state.domain || "unknown"),
      selected_tool_id: safeString(meta.selectedToolId || state.selectedToolId || "unknown"),
      country_detected: safeString(meta.country || country, "unknown"),
      missing_input_types: normalizeMissingInputs(meta.missingInputs || state.missingInputs),
      fallback_used: Boolean(meta.fallbackUsed || state.source === "fallback" || state.source === "deterministic_fallback"),
      tool_open_clicked: Boolean(meta.toolOpenClicked),
      clarification_abandoned: Boolean(meta.clarificationAbandoned),
      query_length_bucket: queryLengthBucket(meta.queryLength || query.length),
      source: normalizeSource(meta.source || state.entrySource || "direct_ai"),
      router_source: safeString(meta.routerSource || state.source || "unknown"),
      confidence_bucket: confidenceBucket(meta.confidence !== undefined ? meta.confidence : state.confidence),
      workflow_type: safeString(meta.workflowType || state.workflowType || state.selectedToolId || meta.selectedToolId || "unknown"),
      export_type: safeString(meta.exportType || meta.export_type || "none"),
      prefill_status: safeString(meta.prefillStatus || meta.prefill_status || "unknown"),
      conversion_type: safeString(meta.conversionType || meta.conversion_type || "none"),
      no_match_category: safeString(meta.noMatchCategory || (meta.fallbackUsed ? meta.routerSource || state.source || "fallback" : ""), "none"),
      safe_prompt_example: safePromptExample(meta.safePromptExample || "", state, meta)
    };
    if (isRawQueryLoggingEnabled()) {
      payload.raw_query = query.slice(0, 500);
      payload.raw_query_logging_enabled = true;
    }
    return payload;
  }

  function safePromptExample(explicitValue, state, meta) {
    var explicit = String(explicitValue || "").trim().slice(0, 80);
    if (explicit) return explicit;
    var tool = String(meta.selectedToolId || state.selectedToolId || "").trim().slice(0, 80);
    var category = safeString(meta.intentCategory || state.intentCategory || state.safetyDomain || "unknown");
    var country = String(meta.country || "").trim().slice(0, 80);
    if (!country) {
      var extractedInputs = isObject(state.extractedInputs) ? state.extractedInputs : {};
      var clarificationAnswers = isObject(state.clarificationAnswers) ? state.clarificationAnswers : {};
      country = String(extractedInputs.country || extractedInputs.destinationCountry || extractedInputs.targetCountry ||
        clarificationAnswers.country || clarificationAnswers.destinationCountry || clarificationAnswers.targetCountry || "").trim().slice(0, 80);
    }
    var parts = [];
    if (tool) parts.push(tool);
    if (category && category !== "unknown") parts.push(category);
    if (country && country !== "unknown") parts.push(country);
    parts.push("length:" + queryLengthBucket(meta.queryLength || String(state.originalQuery || meta.query || "").length));
    return parts.join(" / ");
  }

  function confidenceBucket(value) {
    var number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return "unknown";
    if (number < 0.35) return "low";
    if (number < 0.7) return "medium";
    return "high";
  }

  function updateAggregate(eventName, payload) {
    var store = readStore();
    var totals = store.totals;
    if (eventName === "ai_prompt_submitted") totals.promptsSubmitted += 1;
    if (eventName === "ai_intent_detected" || eventName === "ai_intent_routed") totals.intentsDetected += 1;
    if (eventName === "ai_intent_routed") totals.routed += 1;
    if (eventName === "ai_intent_detected") totals.routed += 1;
    if (eventName === "ai_intent_fallback" || eventName === "ai_intent_routed" && payload.fallback_used) totals.fallback += 1;
    if (eventName === "ai_tool_opened" || eventName === "ai_intent_tool_open" || payload.tool_open_clicked) totals.toolOpen += 1;
    if (eventName === "ai_prefill_success") totals.prefillSuccess += 1;
    if (eventName === "ai_prefill_failed") totals.prefillFailed += 1;
    if (eventName === "ai_clarification_shown" || eventName === "ai_intent_clarification_shown") totals.clarificationShown += 1;
    if (eventName === "ai_clarification_answered" || eventName === "ai_intent_clarification_answered") totals.clarificationAnswered += 1;
    if (eventName === "ai_intent_clarification_abandoned" || payload.clarification_abandoned) totals.clarificationAbandoned += 1;
    if (eventName === "ai_export_generated") totals.exportsGenerated += 1;
    if (eventName === "ai_project_saved") totals.projectsSaved += 1;
    if (eventName === "ai_signup_prompt_shown") totals.signupPromptShown += 1;
    if (eventName === "ai_pro_upgrade_clicked") totals.proUpgradeClicked += 1;
    if (eventName === "sponsor_lead_optin_submitted") totals.sponsorLeadOptinSubmitted += 1;

    increment(store.categories, payload.intent_category);
    increment(store.workflows, payload.workflow_type);
    increment(store.tools, payload.selected_tool_id);
    increment(store.countries, payload.country_detected);
    increment(store.queryLengthBuckets, payload.query_length_bucket);
    increment(store.sources, payload.source);
    increment(store.confidenceBuckets, payload.confidence_bucket);
    if (payload.export_type && payload.export_type !== "none") increment(store.exportTypes, payload.export_type);
    if (payload.no_match_category && payload.no_match_category !== "none") increment(store.noMatchCategories, payload.no_match_category);
    if (payload.safe_prompt_example) increment(store.safePromptExamples, payload.safe_prompt_example);
    payload.missing_input_types.forEach(function (input) {
      increment(store.missingInputs, input);
    });
    writeStore(store);
    return store;
  }

  function forward(eventName, payload) {
    var analytics = root.AfroTools && root.AfroTools.analytics;
    try {
      if (analytics && typeof analytics.track === "function") {
        analytics.track(eventName, payload);
      } else if (typeof root.gtag === "function" && root.localStorage && root.localStorage.getItem("afrotools_cookie_consent") === "accepted") {
        root.gtag("event", eventName, payload);
      }
    } catch (err) {}
  }

  function record(eventName, state, meta) {
    var payload = buildPayload(eventName, state, meta);
    updateAggregate(eventName, payload);
    forward(eventName, payload);
    return payload;
  }

  function top(map, limit) {
    return Object.keys(map || {}).map(function (key) {
      return { name: key, count: Number(map[key]) || 0 };
    }).sort(function (a, b) {
      return b.count - a.count || a.name.localeCompare(b.name);
    }).slice(0, limit || 10);
  }

  function rate(part, whole) {
    if (!whole) return 0;
    return Math.round((part / whole) * 1000) / 10;
  }

  function getReport() {
    var store = readStore();
    var routed = store.totals.routed || store.totals.intentsDetected || store.totals.fallback || 0;
    var shown = store.totals.clarificationShown || 0;
    var prefillAttempts = (store.totals.prefillSuccess || 0) + (store.totals.prefillFailed || 0);
    return {
      generatedAt: nowIso(),
      storageKey: STORAGE_KEY,
      rawQueryLoggingEnabled: isRawQueryLoggingEnabled(),
      totals: clone(store.totals),
      topRoutedCategories: top(store.categories, 10),
      topWorkflows: top(store.workflows, 10),
      topCountriesDetected: top(store.countries, 10),
      topMissingInputs: top(store.missingInputs, 10),
      topSelectedTools: top(store.tools, 10),
      queryLengthBuckets: top(store.queryLengthBuckets, 8),
      sourceBreakdown: top(store.sources, 8),
      topSources: top(store.sources, 8),
      confidenceBuckets: top(store.confidenceBuckets, 8),
      exportTypes: top(store.exportTypes, 8),
      noMatchCategories: top(store.noMatchCategories, 8),
      safePromptExamples: top(store.safePromptExamples, 8),
      fallbackRate: rate(store.totals.fallback, routed),
      toolOpenRate: rate(store.totals.toolOpen, routed),
      prefillSuccessRate: rate(store.totals.prefillSuccess, prefillAttempts),
      clarificationCompletionRate: rate(store.totals.clarificationAnswered, shown)
    };
  }

  function reset() {
    var storage = getStorage();
    if (!storage) return false;
    try {
      storage.removeItem(STORAGE_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  return {
    storageKey: STORAGE_KEY,
    rawQueryEnv: RAW_QUERY_ENV,
    debugStorageKey: DEBUG_STORAGE_KEY,
    queryLengthBucket: queryLengthBucket,
    normalizeSource: normalizeSource,
    buildPayload: buildPayload,
    record: record,
    getReport: getReport,
    reset: reset,
    isRawQueryLoggingEnabled: isRawQueryLoggingEnabled,
    isDebugMode: isDebugMode
  };
});
