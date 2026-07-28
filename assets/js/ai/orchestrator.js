/**
 * AfroTools AI orchestration layer.
 *
 * Builds a complete local-first plan from a user query:
 * deterministic route -> existing tool call -> execution plan -> safe candidates.
 * This module is intentionally lightweight and framework-free.
 */
(function initAfroToolsAIOrchestrator(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("./intent-router.js"),
      require("./tool-manifest.js"),
      require("./tool-invocation-runtime.js")
    );
  } else {
    root.AfroToolsAIOrchestrator = factory(
      root.AfroToolsAIIntentRouter,
      root.AfroToolsAIToolManifest,
      root.AfroToolsAIToolInvocationRuntime
    );
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createOrchestrator(intentRouter, manifestApi, invocationRuntime) {
  "use strict";

  var WEAK_CANDIDATE_TERMS = {
    africa: true,
    african: true,
    compare: true,
    create: true,
    generate: true,
    ghana: true,
    kenya: true,
    lagos: true,
    nigeria: true,
    open: true,
    plan: true,
    planner: true,
    tool: true,
    workflow: true,
  };

  function text(value, fallback) {
    return String(value || fallback || "").trim();
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function safeNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function loadManifest(options) {
    var opts = options || {};
    if (Array.isArray(opts.manifest)) return manifestApi.getToolManifestForRouter(opts.manifest);
    if (!manifestApi || typeof manifestApi.loadDefaultToolManifest !== "function") return [];
    return manifestApi.getToolManifestForRouter(manifestApi.loadDefaultToolManifest());
  }

  function findTool(manifest, id) {
    var clean = text(id);
    return array(manifest).find(function find(entry) {
      return entry && (entry.id === clean || entry.slug === clean || array(entry.aliases).indexOf(clean) !== -1);
    }) || null;
  }

  function fallbackTool() {
    return {
      id: "tool-search",
      route: "/search/",
      title: "Search AfroTools",
      category: "search",
      subcategory: "search",
      requiredInputs: [],
      optionalInputs: [],
      privacyMode: "browser_local",
      sourcePolicy: "reviewed",
      highStakesDomain: "none",
      aiCapabilities: ["route_only"],
      outputTypes: ["report"],
    };
  }

  function safeDecision(query, options) {
    if (!intentRouter || typeof intentRouter.routeDeterministically !== "function") {
      return {
        selectedToolId: "tool-search",
        selectedRoute: "/search/",
        confidence: 0,
        intentCategory: "search",
        reasonShort: "Router unavailable; open AfroTools search.",
        extractedInputs: {},
        missingInputs: [],
        safetyDomain: "none",
        privacyMode: "browser_local",
      };
    }
    return applyAfroCalibration(query, intentRouter.routeDeterministically(query, options || {}), options);
  }

  /**
   * Afro 1.2 calibration over the deterministic decision.
   *
   * The deterministic router's confidence is effectively a constant — a probe of
   * 32 realistic prompts found three distinct values, and the highest was what
   * the WRONG answers carried. Afro grades the same query from margin,
   * precision against the user's own words, query specificity and country
   * scoping, and on 52 prompts it had never seen it is right about 95% of the
   * answers it presents without a warning.
   *
   * Deliberately fail-open: any missing dependency, malformed data or thrown
   * error returns the original decision untouched, so the worst case is exactly
   * today's behaviour rather than a broken route. It also refuses to act on a
   * result with no selected tool, which is how a bad load would most plausibly
   * present.
   */
  function applyAfroCalibration(query, decision, options) {
    try {
      /* NOT `root` — that is a parameter of the UMD wrapper and is out of
       * scope inside this factory. Referencing it threw a ReferenceError that
       * the catch below swallowed, so calibration silently never ran while
       * every test still passed. */
      var scope = typeof globalThis !== "undefined" ? globalThis : this;
      var afro = scope.AfroConfidence;
      var data = scope.AFRO_DATA;
      if (!afro || !data || typeof afro.retrieveAndResolve !== "function") return decision;
      if (!manifestApi || typeof manifestApi.rankToolCandidates !== "function") return decision;

      var graded = afro.retrieveAndResolve(query, manifestApi.rankToolCandidates, {
        manifest: loadManifest(options),
        lexicon: data.lexicon,
        synonyms: data.synonyms,
        limit: 8
      });
      if (!graded || !graded.selectedToolId) return decision;

      decision.confidence = graded.confidence;
      decision.confidenceBand = graded.band;
      decision.uncertain = graded.uncertain;
      decision.confidenceReason = graded.reason;
      decision.alternatives = graded.alternatives || [];
      decision.calibratedBy = afro.VERSION;

      /* Re-point the route whenever Afro names a different tool, including when
       * it is unsure of that tool.
       *
       * The conservative rule (only reroute when confident) was measured on the
       * 52-case holdout and lost: 60% vs 67% accuracy at identical
       * precision-when-confident (96%) and error recall (95% vs 94%). Holding
       * the router's pick during uncertainty bought nothing, because an
       * uncertain result is flagged and offered alternatives either way — the
       * user sees the same "not sure, did you mean" treatment. It just made
       * that flagged answer wrong more often. */
      if (graded.selectedToolId !== decision.selectedToolId) {
        /* Take the route off the graded candidate itself. The manifest module
         * exposes no id lookup, and inventing one here would have left the old
         * route pointing at the old tool while the id said otherwise — a
         * mismatch far worse than not rerouting at all. */
        var picked = null;
        var list = graded.candidates || [];
        for (var i = 0; i < list.length; i++) {
          var candidateTool = list[i] && list[i].tool;
          if (candidateTool && candidateTool.id === graded.selectedToolId) { picked = candidateTool; break; }
        }
        if (picked && picked.route) {
          decision.selectedToolId = picked.id;
          decision.selectedRoute = picked.route;
          decision.reroutedBy = afro.VERSION;
        }
      }
      return decision;
    } catch (error) {
      return decision;
    }
  }

  function buildToolCall(tool, decision) {
    var selected = tool || fallbackTool();
    if (!manifestApi || typeof manifestApi.buildToolInvocation !== "function") {
      return {
        type: "existing_tool_call",
        action: "open_existing_tool",
        toolId: selected.id,
        route: selected.route,
        title: selected.title,
        privacyMode: selected.privacyMode || "browser_local",
        sourcePolicy: selected.sourcePolicy || "reviewed",
        safetyDomain: selected.highStakesDomain || "none",
      };
    }
    return manifestApi.buildToolInvocation(selected, {
      providedInputNames: Object.keys(decision && decision.extractedInputs || {}),
      missingInputNames: array(decision && decision.missingInputs),
    });
  }

  function buildExecution(toolCall, decision) {
    if (!invocationRuntime || typeof invocationRuntime.buildExecution !== "function") {
      return {
        schemaVersion: 1,
        type: "afrotools_existing_tool_execution",
        toolCall: toolCall,
        toolId: toolCall.toolId,
        route: toolCall.route,
        launchUrl: toolCall.route,
        canLaunch: true,
        canPrefill: false,
        payloadReady: false,
        missingInputs: array(toolCall.missingInputNames),
        storagePolicy: "none",
        privacyMode: toolCall.privacyMode || "browser_local",
        sourcePolicy: toolCall.sourcePolicy || "reviewed",
        safetyDomain: toolCall.safetyDomain || "none",
      };
    }
    return invocationRuntime.buildExecution({
      toolCall: toolCall,
      toolId: toolCall.toolId,
      selectedRoute: decision && decision.selectedRoute || toolCall.route,
      extractedInputs: decision && decision.extractedInputs || {},
      missingInputs: decision && decision.missingInputs || [],
      privacyMode: toolCall.privacyMode,
      sourcePolicy: toolCall.sourcePolicy,
      safetyDomain: toolCall.safetyDomain,
    });
  }

  function sameSurface(left, right) {
    if (!left || !right) return true;
    var leftDomain = text(left.highStakesDomain || left.safetyDomain || "none");
    var rightDomain = text(right.highStakesDomain || right.safetyDomain || "none");
    if (leftDomain !== "none" && rightDomain !== "none" && leftDomain !== rightDomain) return false;
    var leftCategory = text(left.category);
    var leftSubcategory = text(left.subcategory);
    var rightCategory = text(right.category);
    var rightSubcategory = text(right.subcategory);
    if (leftSubcategory && rightSubcategory && leftSubcategory === rightSubcategory) return true;
    if (leftCategory && rightCategory && leftCategory === rightCategory) return true;
    if (leftDomain !== "none" && rightDomain !== "none" && leftDomain === rightDomain) return true;
    return leftDomain === "none" || rightDomain === "none";
  }

  function buildCandidates(query, decision, manifest, limit) {
    if (!manifestApi || typeof manifestApi.rankToolCandidates !== "function") return [];
    var selectedToolId = decision && decision.selectedToolId;
    var selectedTool = findTool(manifest, selectedToolId);
    var ranked = manifestApi.rankToolCandidates(query, manifest, {
      limit: Math.max(3, Math.min(safeNumber(limit, 5) + 3, 10)),
      minScore: 8,
      selectedToolId: selectedToolId,
    });
    return array(ranked.candidates).filter(function keep(candidate) {
      if (!candidate || !candidate.tool || !candidate.tool.id || candidate.tool.id === selectedToolId) return false;
      var strongTerms = array(candidate.matchedTerms).filter(function keepTerm(term) {
        return !WEAK_CANDIDATE_TERMS[String(term || "").toLowerCase()];
      });
      if (!sameSurface(selectedTool, candidate.tool)) return false;
      return strongTerms.length > 0;
    }).slice(0, Math.max(0, Math.min(safeNumber(limit, 5), 6))).map(function mapCandidate(candidate) {
      var call = buildToolCall(candidate.tool, {});
      return {
        type: "existing_tool_candidate",
        toolId: call.toolId,
        title: call.title,
        route: call.route,
        category: call.category,
        subcategory: call.subcategory,
        action: call.action,
        canPrefill: call.canPrefill,
        privacyMode: call.privacyMode,
        sourcePolicy: call.sourcePolicy,
        safetyDomain: call.safetyDomain,
        outputTypes: call.outputTypes,
        score: Math.round(safeNumber(candidate.score, 0) * 100) / 100,
      };
    });
  }

  function modelConsentState(options, decision) {
    var opts = options || {};
    var consented = opts.consentToModel === true;
    var confidence = safeNumber(decision && decision.confidence, 0);
    var obvious = Boolean(decision && decision.selectedToolId && decision.selectedToolId !== "tool-search" && confidence >= safeNumber(opts.obviousConfidence, 0.78));
    return {
      modelEligible: !obvious && decision && decision.selectedToolId !== "tool-search",
      consentToModel: consented,
      modelCallAllowed: consented && !obvious,
      modelCallRequired: false,
      reason: obvious ? "deterministic_obvious" : (consented ? "consent_granted" : "model_consent_not_provided"),
    };
  }

  function buildPlan(query, options) {
    var opts = options || {};
    var cleanQuery = text(query);
    var manifest = loadManifest(opts);
    var decision = safeDecision(cleanQuery, {
      manifest: manifest,
      locale: opts.locale || "en",
    });
    var validation = intentRouter && typeof intentRouter.validateRouterOutput === "function"
      ? intentRouter.validateRouterOutput(decision)
      : { valid: true, errors: [] };
    if (!validation.valid && intentRouter && typeof intentRouter.fallbackDecision === "function") {
      decision = intentRouter.fallbackDecision(cleanQuery, { locale: opts.locale || "en" });
    }
    var noMatch = !decision || !decision.selectedToolId || decision.selectedToolId === "tool-search" || safeNumber(decision.confidence, 0) <= 0;
    var tool = noMatch ? null : findTool(manifest, decision.selectedToolId);
    var selected = tool || fallbackTool();
    var toolCall = buildToolCall(selected, decision);
    var execution = buildExecution(toolCall, decision);
    var candidates = buildCandidates(cleanQuery, decision, manifest, opts.candidateLimit || 5);
    var consent = modelConsentState(opts, decision);

    return {
      schemaVersion: 1,
      type: "afrotools_ai_orchestration_plan",
      source: "deterministic_full_catalog",
      query: {
        length: cleanQuery.length,
        rawIncluded: false,
      },
      locale: opts.locale || "en",
      status: noMatch ? "no_match" : "success",
      manifest: {
        routerSafeToolCount: manifest.length,
      },
      decision: decision,
      selectedTool: {
        id: selected.id,
        title: selected.title,
        route: selected.route,
        category: selected.category,
        subcategory: selected.subcategory,
      },
      toolCall: toolCall,
      execution: execution,
      toolCandidates: candidates,
      consent: consent,
      handoffPlan: decision.handoffPlan || {},
      exportPlan: decision.exportPlan || {},
      safety: {
        privacyMode: toolCall.privacyMode || decision.privacyMode || "browser_local",
        sourcePolicy: toolCall.sourcePolicy || "reviewed",
        safetyDomain: toolCall.safetyDomain || decision.safetyDomain || "none",
        highStakesNotice: decision.highStakesNotice || "",
      },
    };
  }

  function publicPlanSummary(plan) {
    var item = plan || {};
    var execution = invocationRuntime && typeof invocationRuntime.publicExecutionSummary === "function"
      ? invocationRuntime.publicExecutionSummary(item.execution)
      : {};
    return {
      schemaVersion: 1,
      type: "afrotools_ai_orchestration_summary",
      status: item.status || "unknown",
      source: item.source || "",
      queryLength: item.query && item.query.length || 0,
      rawQueryIncluded: false,
      selectedToolId: item.selectedTool && item.selectedTool.id || "",
      selectedRoute: item.selectedTool && item.selectedTool.route || "",
      toolCallType: item.toolCall && item.toolCall.type || "",
      execution: execution,
      candidateCount: array(item.toolCandidates).length,
      routerSafeToolCount: item.manifest && item.manifest.routerSafeToolCount || 0,
      consent: item.consent || {},
      handoffPlan: item.handoffPlan || item.decision && item.decision.handoffPlan || {},
      exportPlan: item.exportPlan || item.decision && item.decision.exportPlan || {},
      safety: item.safety || {},
    };
  }

  return {
    buildPlan: buildPlan,
    buildCandidates: buildCandidates,
    publicPlanSummary: publicPlanSummary,
  };
});
