/**
 * AfroTools AI tool invocation runtime.
 *
 * Turns a validated router decision into a launchable existing-tool execution
 * plan. This keeps Ask AfroTools AI as an orchestration layer over canonical
 * tools, with session prefill and route-only fallbacks handled consistently.
 */
(function initToolInvocationRuntime(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./prefill-adapters.js"));
  } else {
    root.AfroToolsAIToolInvocationRuntime = factory(root.AfroToolsAIPrefillAdapters);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createRuntime(defaultPrefillAdapters) {
  "use strict";

  function text(value, fallback) {
    return String(value || fallback || "").trim();
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function mergeInputs(extractedInputs, clarificationAnswers) {
    return Object.assign({}, extractedInputs || {}, clarificationAnswers || {});
  }

  function safeRoute(route, fallback) {
    var clean = text(route, fallback || "/tools/");
    if (!clean) return "/tools/";
    if (/^https?:\/\//i.test(clean)) return "/tools/";
    return clean.charAt(0) === "/" ? clean : "/" + clean;
  }

  function fallbackValidation() {
    return { valid: true, errors: [] };
  }

  function fallbackLaunch(toolId, route) {
    return {
      supported: false,
      toolId: text(toolId, "tool-search"),
      route: safeRoute(route, "/tools/"),
      launchUrl: safeRoute(route, "/tools/"),
      payload: null,
      missingInputs: [],
      validation: fallbackValidation(),
      userFacingSummary: "Open the selected AfroTools workflow.",
      privacyNote: "No prefill payload will be created for this route-only workflow.",
    };
  }

  function buildBaseToolCall(options, launch) {
    var opts = options || {};
    var toolCall = clone(opts.toolCall || {});
    var toolId = text(opts.toolId || toolCall.toolId || opts.selectedToolId, "tool-search");
    var action = toolCall.action || (launch && launch.supported ? "prefill_existing_tool" : "open_existing_tool");
    return {
      type: "existing_tool_call",
      action: action,
      toolId: toolId,
      route: safeRoute(toolCall.route || opts.selectedRoute || launch && launch.route, "/tools/"),
      title: text(toolCall.title || opts.title, toolId.replace(/-/g, " ")),
      category: text(toolCall.category || opts.category, "tools"),
      subcategory: text(toolCall.subcategory || opts.subcategory, "general"),
      invocationMode: toolCall.invocationMode || (launch && launch.supported ? "session_prefill" : "route_only"),
      canPrefill: Boolean(toolCall.canPrefill || launch && launch.supported),
      inputSchema: toolCall.inputSchema || { requiredInputs: [], optionalInputs: [] },
      providedInputNames: unique(toolCall.providedInputNames || Object.keys(opts.extractedInputs || {})),
      missingInputNames: unique(toolCall.missingInputNames || opts.missingInputs || launch && launch.missingInputs || []),
      privacyMode: text(toolCall.privacyMode || opts.privacyMode, "browser_local"),
      sourcePolicy: text(toolCall.sourcePolicy || opts.sourcePolicy, "reviewed"),
      safetyDomain: text(toolCall.safetyDomain || opts.safetyDomain, "none"),
      capabilities: unique(toolCall.capabilities || ["route_only"]),
      outputTypes: unique(toolCall.outputTypes || []),
    };
  }

  function buildExecution(options) {
    var opts = options || {};
    var adapters = opts.prefillAdapters || defaultPrefillAdapters;
    var mergedInputs = mergeInputs(opts.extractedInputs, opts.clarificationAnswers);
    var toolId = text(opts.toolId || opts.selectedToolId || opts.toolCall && opts.toolCall.toolId, "tool-search");
    var selectedRoute = safeRoute(opts.selectedRoute || opts.route || opts.toolCall && opts.toolCall.route, "/tools/");
    var launch = adapters && typeof adapters.buildSafeLaunch === "function"
      ? adapters.buildSafeLaunch(toolId, mergedInputs, { selectedRoute: selectedRoute })
      : fallbackLaunch(toolId, selectedRoute);
    var toolCall = buildBaseToolCall(Object.assign({}, opts, { toolId: toolId, selectedRoute: selectedRoute }), launch);
    var normalizedInputs = launch && launch.payload && launch.payload.normalizedInputs ? clone(launch.payload.normalizedInputs) : {};
    var missingInputs = unique(launch && launch.missingInputs && launch.missingInputs.length ? launch.missingInputs : toolCall.missingInputNames);
    var validation = launch && launch.validation ? launch.validation : fallbackValidation();
    var canLaunch = Boolean((launch && launch.launchUrl) || selectedRoute);
    return {
      schemaVersion: 1,
      type: "afrotools_existing_tool_execution",
      toolCall: toolCall,
      toolId: launch && launch.toolId || toolCall.toolId,
      requestedToolId: toolId,
      action: toolCall.action,
      invocationMode: toolCall.invocationMode,
      route: safeRoute(launch && launch.route || toolCall.route || selectedRoute, selectedRoute),
      launchUrl: safeRoute(launch && launch.launchUrl || toolCall.route || selectedRoute, selectedRoute),
      canLaunch: canLaunch,
      canPrefill: Boolean(launch && launch.supported),
      supported: Boolean(launch && launch.supported),
      prefillSupported: Boolean(launch && launch.supported),
      payloadReady: Boolean(launch && launch.payload),
      payload: launch && launch.payload || null,
      normalizedInputs: normalizedInputs,
      providedInputNames: unique(Object.keys(mergedInputs)),
      missingInputs: missingInputs,
      validation: validation,
      userFacingSummary: text(launch && launch.userFacingSummary, "Open the selected AfroTools workflow."),
      privacyNote: text(launch && launch.privacyNote, "This workflow opens an existing AfroTools tool."),
      storagePolicy: launch && launch.supported ? "sessionStorage_short_ttl" : "none",
      privacyMode: toolCall.privacyMode,
      sourcePolicy: toolCall.sourcePolicy,
      safetyDomain: toolCall.safetyDomain,
      capabilities: unique(toolCall.capabilities),
      outputTypes: unique(toolCall.outputTypes),
    };
  }

  function storeExecution(execution, storage, adapters) {
    var runtimeAdapters = adapters || defaultPrefillAdapters;
    if (!execution || !execution.payloadReady || !execution.payload) return false;
    if (runtimeAdapters && typeof runtimeAdapters.storeLaunchPayload === "function") {
      return runtimeAdapters.storeLaunchPayload(execution, storage);
    }
    var target = storage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
    if (!target) return false;
    try {
      target.setItem("afrotools.aiPrefillDraft", JSON.stringify(execution.payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  function publicExecutionSummary(execution) {
    var item = execution || {};
    return {
      schemaVersion: 1,
      type: "afrotools_existing_tool_execution_summary",
      toolId: text(item.toolId),
      action: text(item.action),
      invocationMode: text(item.invocationMode),
      route: safeRoute(item.route || item.launchUrl, "/tools/"),
      canLaunch: Boolean(item.canLaunch),
      canPrefill: Boolean(item.canPrefill),
      payloadReady: Boolean(item.payloadReady),
      missingInputs: unique(item.missingInputs),
      validationValid: !item.validation || item.validation.valid !== false,
      storagePolicy: text(item.storagePolicy, "none"),
      privacyMode: text(item.privacyMode, "browser_local"),
      sourcePolicy: text(item.sourcePolicy, "reviewed"),
      safetyDomain: text(item.safetyDomain, "none"),
    };
  }

  return {
    buildExecution: buildExecution,
    storeExecution: storeExecution,
    publicExecutionSummary: publicExecutionSummary,
    mergeInputs: mergeInputs,
  };
});
