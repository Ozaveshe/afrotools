(function initAfroToolsAIProMonetization(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root || {}, require("./usage-limits.js"));
  } else {
    root.AfroToolsAIProMonetization = factory(root || {}, root.AfroToolsAIUsageLimits);
  }
})(typeof window !== "undefined" ? window : globalThis, function createAfroToolsAIProMonetization(root, usageLimits) {
  "use strict";

  if (!usageLimits || typeof usageLimits.getAiBriefsPerDay !== "function") {
    throw new Error("AfroTools AI usage limits must load before Pro monetization.");
  }

  var STORAGE_KEY = "afrotools.aiProUsage.v1";
  var PLAN_OVERRIDE_KEY = "afrotools.aiProPlanOverride";
  var PRICE_FLAG_KEY = "AFROTOOLS_AI_PRO_PRICING_DISPLAY";
  var PUBLIC_PRICE_FLAG_KEY = "NEXT_PUBLIC_AFROTOOLS_AI_PRO_PRICING_DISPLAY";
  var PLAN_ORDER = { free: 0, pro: 1, team: 2 };

  var PLAN_CAPABILITIES = {
    free: {
      id: "free",
      label: "Free",
      summary: "Basic routing, calculators, limited AI briefs, limited exports, and sponsor-supported workflows.",
      aiBriefsPerDay: usageLimits.getAiBriefsPerDay("free"),
      aiDocumentsPerMonth: 0,
      exportsPerDay: 3,
      savedProjects: 6,
      pdfRichness: "basic",
      adsAndSponsors: true,
      advancedPlanning: false,
      widgets: false,
      apiAccess: false,
      sponsorDataWorkflow: false,
      whiteLabel: false,
      priorityFeatures: false
    },
    pro: {
      id: "pro",
      label: "Pro",
      summary: "More AI documents, saved project depth, richer PDF exports, no ads, and advanced planning workflows.",
      aiBriefsPerDay: usageLimits.getAiBriefsPerDay("pro"),
      aiDocumentsPerMonth: 60,
      exportsPerDay: -1,
      savedProjects: -1,
      pdfRichness: "rich",
      adsAndSponsors: false,
      advancedPlanning: true,
      widgets: false,
      apiAccess: false,
      sponsorDataWorkflow: false,
      whiteLabel: false,
      priorityFeatures: true
    },
    team: {
      id: "team",
      label: "Team / B2B",
      summary: "Widgets, API access, sponsor/data workflows, team seats, and white-label implementation paths.",
      aiBriefsPerDay: usageLimits.getAiBriefsPerDay("team"),
      aiDocumentsPerMonth: -1,
      exportsPerDay: -1,
      savedProjects: -1,
      pdfRichness: "white_label_ready",
      adsAndSponsors: false,
      advancedPlanning: true,
      widgets: true,
      apiAccess: true,
      sponsorDataWorkflow: true,
      whiteLabel: true,
      priorityFeatures: true
    }
  };

  var FEATURE_GATES = {
    basic_routing: {
      id: "basic_routing",
      label: "Basic AI routing",
      minPlan: "free",
      hardBlock: false,
      existingFree: true,
      value: "Turn a plain-language request into the right AfroTools workflow."
    },
    core_calculator: {
      id: "core_calculator",
      label: "Core calculators",
      minPlan: "free",
      hardBlock: false,
      existingFree: true,
      value: "Public calculators and existing free tools remain reachable."
    },
    ai_brief_basic: {
      id: "ai_brief_basic",
      label: "Basic AI brief",
      minPlan: "free",
      limitKey: "aiBriefsPerDay",
      usageBucket: "ai_brief_basic",
      hardBlock: false,
      value: "A short deterministic or consented AI brief for the current workflow."
    },
    workflow_export_basic: {
      id: "workflow_export_basic",
      label: "Basic workflow export",
      minPlan: "free",
      limitKey: "exportsPerDay",
      usageBucket: "workflow_export_basic",
      hardBlock: false,
      value: "Copy, JSON, WhatsApp, email, and basic PDF exports where supported."
    },
    saved_project_local: {
      id: "saved_project_local",
      label: "Local saved projects",
      minPlan: "free",
      limitKey: "savedProjects",
      usageBucket: "saved_project_local",
      hardBlock: false,
      value: "Save non-sensitive workflow summaries on this device."
    },
    ai_document_advanced: {
      id: "ai_document_advanced",
      label: "Advanced AI documents",
      minPlan: "pro",
      hardBlock: true,
      value: "Longer CV, scholarship, import, finance, and planning documents with richer structure."
    },
    workflow_export_rich_pdf: {
      id: "workflow_export_rich_pdf",
      label: "Richer PDF exports",
      minPlan: "pro",
      hardBlock: true,
      value: "Branded, multi-section PDF decision briefs with source and assumption appendices."
    },
    saved_project_sync_pro: {
      id: "saved_project_sync_pro",
      label: "Pro project history",
      minPlan: "pro",
      hardBlock: true,
      value: "Deeper saved history, account-backed project continuity, and professional workspace views."
    },
    no_ads: {
      id: "no_ads",
      label: "No ads",
      minPlan: "pro",
      hardBlock: true,
      value: "Hide sponsor surfaces and ads in supported Pro workflows."
    },
    advanced_planning: {
      id: "advanced_planning",
      label: "Advanced planning",
      minPlan: "pro",
      hardBlock: true,
      value: "Richer scenario planning, next actions, and professional decision briefs."
    },
    widget_embed: {
      id: "widget_embed",
      label: "Widget embeds",
      minPlan: "team",
      hardBlock: true,
      value: "Embed AfroTools workflows in partner, employer, or publisher products."
    },
    api_access: {
      id: "api_access",
      label: "API access",
      minPlan: "team",
      hardBlock: true,
      value: "Use AfroTools data and workflow APIs at business volume."
    },
    sponsor_data_workflow: {
      id: "sponsor_data_workflow",
      label: "Sponsor/data workflow",
      minPlan: "team",
      hardBlock: true,
      value: "Run sponsor-safe lead, data review, and source-confidence workflows."
    },
    white_label: {
      id: "white_label",
      label: "White-label paths",
      minPlan: "team",
      hardBlock: true,
      value: "Deploy white-label or co-branded workflow paths with partner controls."
    }
  };

  function normalizePlan(plan) {
    return usageLimits.normalizePlan(plan);
  }

  function isPlanAtLeast(currentPlan, requiredPlan) {
    return (PLAN_ORDER[normalizePlan(currentPlan)] || 0) >= (PLAN_ORDER[normalizePlan(requiredPlan)] || 0);
  }

  function truthyFlag(value) {
    return /^(1|true|yes|on|enabled|show)$/i.test(String(value || "").trim());
  }

  function getStorage() {
    try {
      return root && root.localStorage ? root.localStorage : null;
    } catch (error) {
      return null;
    }
  }

  function pricingDisplayEnabled(options) {
    var env = options && options.env || {};
    var host = options && options.root || root || {};
    var flags = host.AFROTOOLS_FLAGS || {};
    var storage = getStorage();
    return truthyFlag(env[PRICE_FLAG_KEY]) ||
      truthyFlag(env[PUBLIC_PRICE_FLAG_KEY]) ||
      truthyFlag(host[PRICE_FLAG_KEY]) ||
      truthyFlag(host[PUBLIC_PRICE_FLAG_KEY]) ||
      truthyFlag(flags.aiProPricingDisplay) ||
      truthyFlag(flags[PRICE_FLAG_KEY]) ||
      truthyFlag(storage && storage.getItem && storage.getItem(PRICE_FLAG_KEY));
  }

  function getPlanOverride() {
    var storage = getStorage();
    if (!storage || !storage.getItem) return "";
    return normalizePlan(storage.getItem(PLAN_OVERRIDE_KEY));
  }

  function planFromProfile(profile) {
    if (!profile) return "";
    return normalizePlan(profile.subscription_tier || profile.plan || profile.planId || profile.subscriptionPlan || profile.tier || profile.accountType);
  }

  function getPlanCapabilities(plan) {
    return PLAN_CAPABILITIES[normalizePlan(plan)];
  }

  function usageDateKey(date) {
    var source = date ? new Date(date) : new Date();
    if (Number.isNaN(source.getTime())) source = new Date();
    return source.toISOString().slice(0, 10);
  }

  function getUsage(date) {
    var key = usageDateKey(date);
    var storage = getStorage();
    if (!storage || !storage.getItem) return { date: key, counts: {} };
    try {
      var parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      if (!parsed || parsed.date !== key || typeof parsed.counts !== "object") {
        return { date: key, counts: {} };
      }
      return { date: key, counts: parsed.counts || {} };
    } catch (error) {
      return { date: key, counts: {} };
    }
  }

  function saveUsage(usage) {
    var storage = getStorage();
    if (!storage || !storage.setItem) return false;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(usage));
      return true;
    } catch (error) {
      return false;
    }
  }

  function recordUsage(featureId, date) {
    var feature = FEATURE_GATES[featureId];
    var bucket = feature && feature.usageBucket || featureId;
    var usage = getUsage(date);
    usage.counts[bucket] = Number(usage.counts[bucket] || 0) + 1;
    saveUsage(usage);
    return usage;
  }

  function resetUsage() {
    var storage = getStorage();
    if (!storage || !storage.removeItem) return false;
    storage.removeItem(STORAGE_KEY);
    return true;
  }

  function currentUsageCount(feature, usage) {
    if (!feature || !feature.limitKey) return 0;
    var bucket = feature.usageBucket || feature.id;
    return Number(usage && usage.counts && usage.counts[bucket] || 0);
  }

  function evaluateFeature(featureId, options) {
    var feature = FEATURE_GATES[featureId] || FEATURE_GATES.advanced_planning;
    var plan = normalizePlan(options && (options.currentPlan || planFromProfile(options.profile)) || getPlanOverride() || "free");
    var requiredPlan = normalizePlan(feature.minPlan || "free");
    var capability = getPlanCapabilities(plan);
    var meetsPlan = isPlanAtLeast(plan, requiredPlan);
    var usage = options && options.usage || getUsage(options && options.date);
    var limit = feature.limitKey ? Number(capability[feature.limitKey]) : -1;
    var used = currentUsageCount(feature, usage);
    var limited = meetsPlan && limit >= 0 && used >= limit;
    var allowed = meetsPlan && !limited;
    var reason = allowed ? "allowed" : (!meetsPlan ? "plan_required" : "limit_reached");
    return {
      allowed: allowed,
      shouldBlock: !allowed && !meetsPlan && Boolean(feature.hardBlock),
      shouldPrompt: !allowed || (!feature.existingFree && plan === "free"),
      reason: reason,
      featureId: feature.id,
      featureLabel: feature.label,
      value: feature.value,
      currentPlan: plan,
      requiredPlan: requiredPlan,
      usage: used,
      limit: limit,
      existingFree: Boolean(feature.existingFree),
      message: allowed
        ? feature.label + " is available on " + capability.label + "."
        : feature.label + " is a " + getPlanCapabilities(requiredPlan).label + " feature."
    };
  }

  function safeContext(context) {
    context = context || {};
    return {
      workflowType: String(context.workflowType || context.selectedToolId || "").slice(0, 80),
      selectedToolId: String(context.selectedToolId || "").slice(0, 80),
      country: String(context.country || "").slice(0, 40),
      category: String(context.category || "").slice(0, 40),
      confidence: context.confidence == null ? "" : String(context.confidence).slice(0, 16)
    };
  }

  function buildUpgradePrompt(featureId, context, options) {
    var evaluation = evaluateFeature(featureId, options || {});
    var required = getPlanCapabilities(evaluation.requiredPlan);
    var pricingLine = pricingDisplayEnabled(options)
      ? (evaluation.requiredPlan === "team" ? "Team/B2B pricing is quote-based." : "Pro pricing is shown on the upgrade page when available.")
      : "";
    var safe = safeContext(context);
    return {
      featureId: evaluation.featureId,
      title: evaluation.requiredPlan === "team" ? "Built for teams and partners" : "Optional Pro upgrade",
      body: evaluation.value || required.summary,
      planLabel: required.label,
      pricingLine: pricingLine,
      href: "/pro/?source=ai-pro&feature=" + encodeURIComponent(evaluation.featureId),
      cta: evaluation.requiredPlan === "team" ? "Explore Team options" : "See Pro options",
      dismissLabel: "Keep using free flow",
      context: safe,
      evaluation: evaluation
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildUpgradeMarkup(featureId, context, options) {
    var prompt = buildUpgradePrompt(featureId, context, options);
    return '<div class="ai-pro-upsell" data-ai-pro-upsell="' + escapeHtml(prompt.featureId) + '">' +
      '<div><strong>' + escapeHtml(prompt.title) + '</strong><p>' + escapeHtml(prompt.body) + '</p>' +
      (prompt.pricingLine ? '<small>' + escapeHtml(prompt.pricingLine) + '</small>' : '') + '</div>' +
      '<div class="ai-pro-upsell-actions"><a href="' + escapeHtml(prompt.href) + '" data-ai-pro-upgrade-click>' + escapeHtml(prompt.cta) + '</a>' +
      '<button type="button" data-ai-pro-dismiss>' + escapeHtml(prompt.dismissLabel) + '</button></div></div>';
  }

  function ensureStyles() {
    if (!root || !root.document || root.document.getElementById("afrotools-ai-pro-styles")) return;
    var style = root.document.createElement("style");
    style.id = "afrotools-ai-pro-styles";
    style.textContent = ".ai-pro-upsell{display:flex;gap:16px;align-items:center;justify-content:space-between;margin:14px 0 0;padding:12px 14px;border:1px solid rgba(15,23,42,.12);border-radius:8px;background:#f8fafc;color:#0f172a}.ai-pro-upsell strong{display:block;font-size:.95rem}.ai-pro-upsell p{margin:4px 0 0;color:#475569;font-size:.9rem;line-height:1.45}.ai-pro-upsell small{display:block;margin-top:4px;color:#64748b}.ai-pro-upsell-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ai-pro-upsell-actions a,.ai-pro-upsell-actions button{border-radius:999px;padding:8px 11px;font-weight:700;font-size:.85rem;text-decoration:none;white-space:nowrap}.ai-pro-upsell-actions a{background:#0f172a;color:#fff}.ai-pro-upsell-actions button{border:1px solid rgba(15,23,42,.16);background:#fff;color:#334155;cursor:pointer}@media(max-width:640px){.ai-pro-upsell{display:block}.ai-pro-upsell-actions{margin-top:10px}}";
    root.document.head.appendChild(style);
  }

  function track(eventName, payload) {
    var safe = Object.assign({}, payload || {});
    delete safe.rawPrompt;
    delete safe.prompt;
    delete safe.query;
    try {
      if (root.AfroTools && root.AfroTools.analytics && typeof root.AfroTools.analytics.track === "function") {
        root.AfroTools.analytics.track(eventName, safe);
      }
      if (root.AfroToolsAIIntentAnalytics && typeof root.AfroToolsAIIntentAnalytics.record === "function") {
        root.AfroToolsAIIntentAnalytics.record(eventName, safe);
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function renderUpgradePrompt(container, options) {
    if (!container || !container.setAttribute) return null;
    var featureId = options && options.featureId || container.getAttribute("data-feature-id") || "advanced_planning";
    var context = safeContext(options && options.context || {});
    if (!context.workflowType) context.workflowType = container.getAttribute("data-workflow-type") || "";
    if (!context.selectedToolId) context.selectedToolId = container.getAttribute("data-tool-id") || "";
    ensureStyles();
    container.innerHTML = buildUpgradeMarkup(featureId, context, options || {});
    container.setAttribute("data-ai-pro-upgrade-rendered", "true");
    track("ai_pro_upgrade_prompt_shown", Object.assign({ featureId: featureId }, context));
    var click = container.querySelector("[data-ai-pro-upgrade-click]");
    if (click) {
      click.addEventListener("click", function () {
        track("ai_pro_upgrade_clicked", Object.assign({ featureId: featureId }, context));
      });
    }
    var dismiss = container.querySelector("[data-ai-pro-dismiss]");
    if (dismiss) {
      dismiss.addEventListener("click", function () {
        container.innerHTML = "";
        container.setAttribute("hidden", "hidden");
      });
    }
    return container;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    PRICE_FLAG_KEY: PRICE_FLAG_KEY,
    PUBLIC_PRICE_FLAG_KEY: PUBLIC_PRICE_FLAG_KEY,
    PLAN_CAPABILITIES: PLAN_CAPABILITIES,
    FEATURE_GATES: FEATURE_GATES,
    normalizePlan: normalizePlan,
    isPlanAtLeast: isPlanAtLeast,
    pricingDisplayEnabled: pricingDisplayEnabled,
    planFromProfile: planFromProfile,
    getPlanCapabilities: getPlanCapabilities,
    getUsage: getUsage,
    recordUsage: recordUsage,
    resetUsage: resetUsage,
    evaluateFeature: evaluateFeature,
    buildUpgradePrompt: buildUpgradePrompt,
    buildUpgradeMarkup: buildUpgradeMarkup,
    renderUpgradePrompt: renderUpgradePrompt
  };
});
