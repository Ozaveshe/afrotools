/* global URLSearchParams */
(function initAskAiMiniRouter(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroWidgets = root.AfroWidgets || {};
    root.AfroWidgets.askAiRouter = factory(root);
    root.AfroWidgets.ask_ai_router = root.AfroWidgets.askAiRouter.render;
    root.AfroWidgets.askAiMiniRouter = root.AfroWidgets.askAiRouter.render;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAskAiMiniRouter(root) {
  "use strict";

  var THEMES = ["light", "dark", "minimal"];
  var CATEGORY_ALIASES = { business: "sme" };
  var promptExamples = loadPromptExamples(root);
  var categories = [
    category("education", "Education", "Scholarship and Study Abroad Planner", "/ai/education/", "scholarship-finder", "/tools/scholarship-finder/", ["scholarship", "study", "abroad", "canada", "uk", "university", "gpa", "ielts", "student", "school"], "Find scholarships to study in Canada"),
    category("career", "Career", "CV and Career Agent", "/ai/career/", "cv-builder", "/tools/cv-builder/", ["cv", "resume", "cover letter", "job", "career", "linkedin", "ats", "interview", "engineer", "developer"], "Write a CV for an engineer in Ghana"),
    category("business", "Business", "SME Finance Assistant", "/ai/business/", "invoice-generator", "/tools/invoice-generator/", ["paye", "payroll", "vat", "invoice", "tax", "salary", "employees", "receipt", "tin", "business"], "Calculate payroll for 5 employees"),
    category("trade", "Trade", "Import Duty and Trade Advisor", "/ai/trade/", "import-duty", "/tools/import-duty/", ["import", "duty", "customs", "landed", "shipping", "car", "toyota", "electronics", "clothing", "machinery"], "Estimate import duty for a Toyota Axio"),
    category("energy", "Energy", "Solar and Generator Advisor", "/ai/energy/", "solar-roi", "/tools/solar-roi/", ["solar", "generator", "fuel", "diesel", "petrol", "inverter", "battery", "outage", "electricity", "shop"], "Should I install solar for my shop?"),
    category("local-life", "Local life", "Cost of Living and Relocation Planner", "/ai/local-life/", "japa-calculator", "/tools/japa-calculator/", ["rent", "cost of living", "relocation", "moving", "budget", "japa", "apartment", "city", "expenses"], "Plan my monthly cost of living"),
    category("construction", "Construction", "Floor Planner and Construction Cost Assistant", "/ai/construction/", "floor-planner", "/engineering/floor-planner/", ["floor plan", "building", "construction", "boq", "renovation", "materials", "house plan", "room"], "Plan a two-bedroom floor layout"),
    category("documents", "Documents", "PDF and Document Tools", "/document-pdf/", "pdf-compress", "/tools/pdf-compress/", ["pdf", "document", "compress", "merge", "split", "sign", "redact", "word", "scan"], "Compress and sign a PDF"),
    category("agriculture", "Agriculture", "Agriculture Tools", "/agriculture/", "fertilizer-rate", "/agriculture/fertilizer/", ["farm", "crop", "seed", "fertilizer", "yield", "poultry", "livestock", "irrigation", "harvest"], "Estimate fertilizer for a farm"),
    category("country-intelligence", "Country data", "Country Intelligence", "/tools/afroatlas/", "afroatlas", "/tools/afroatlas/", ["country", "market", "compare countries", "africa data", "population", "economy", "business climate"], "Compare Ghana and Kenya")
  ];

  function loadPromptExamples(scope) {
    if (scope && scope.AfroToolsAIPromptExamples) return scope.AfroToolsAIPromptExamples;
    if (typeof require === "function") {
      try {
        return require("../../assets/js/ai/example-registry.js");
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  function category(id, label, toolName, href, primaryToolId, primaryToolRoute, keywords, example) {
    return {
      id: id,
      label: label,
      toolName: toolName,
      href: href,
      primaryToolId: primaryToolId,
      primaryToolRoute: primaryToolRoute,
      keywords: keywords.slice(),
      example: exampleFor(id, example)
    };
  }

  function exampleFor(categoryId, fallback) {
    var registryCategory = CATEGORY_ALIASES[categoryId] || categoryId;
    if (promptExamples && typeof promptExamples.getPromptExamples === "function") {
      var examples = promptExamples.getPromptExamples({
        category: registryCategory,
        surface: "ai_widget",
        language: "en",
        limit: 1
      });
      if (examples.length) return examples[0].text;
    }
    return fallback;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function replace(char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function slug(value, fallback) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80) || fallback || "";
  }

  function sanitizeText(value, limit) {
    return String(value || "").replace(/[<>\r\n]/g, "").trim().slice(0, limit || 90);
  }

  function findCategory(id) {
    for (var index = 0; index < categories.length; index += 1) {
      if (categories[index].id === id) return categories[index];
    }
    return null;
  }

  function sanitizeConfig(config) {
    var input = config || {};
    var allowedSource = input.allowedCategories || input.allowedCategory;
    var allowedCategories = (Array.isArray(allowedSource) ? allowedSource : String(allowedSource || "").split(","))
      .map(function mapAllowed(item) { return slug(item); })
      .filter(function keepAllowed(item) { return Boolean(findCategory(item)); });
    if (!allowedCategories.length) {
      allowedCategories = categories.map(function mapCategory(item) { return item.id; });
    }
    var theme = slug(input.theme, "light");
    if (THEMES.indexOf(theme) === -1) theme = "light";
    var defaultCategory = slug(input.defaultCategory || input.category || "", "");
    if (!findCategory(defaultCategory) || allowedCategories.indexOf(defaultCategory) === -1) {
      defaultCategory = allowedCategories[0] || "education";
    }
    return {
      defaultCountry: String(input.defaultCountry || input.country || "").replace(/[^a-zA-Z\s'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 80),
      defaultCategory: defaultCategory,
      partnerId: slug(input.partnerId || input.partner || "", ""),
      theme: theme,
      allowedCategories: allowedCategories,
      sponsorLabel: sanitizeText(input.sponsorLabel || input.sponsor || "", 90),
      title: sanitizeText(input.title || "Ask AfroTools AI", 80) || "Ask AfroTools AI",
      footerHTML: String(input.footerHTML || "")
    };
  }

  function allowedCategoryList(config) {
    return sanitizeConfig(config).allowedCategories.map(findCategory).filter(Boolean);
  }

  function categoryForTool(tool) {
    var id = slug(tool && (tool.id || tool.slug), "");
    var route = String(tool && tool.route || "").toLowerCase();
    var categoryText = [tool && tool.category, tool && tool.subcategory, route].join(" ").toLowerCase();
    var exact = categories.filter(function matchCategory(item) {
      return item.primaryToolId === id;
    })[0];
    if (exact) return exact;
    if (/scholar|study|education|school|gpa|ielts|waec|university/.test(categoryText)) return findCategory("education");
    if (/career|cv|resume|cover-letter|job|linkedin|interview/.test(categoryText)) return findCategory("career");
    if (/trade|custom|import|shipping|landed|afcfta|export/.test(categoryText)) return findCategory("trade");
    if (/energy|solar|fuel|generator|electricity|power/.test(categoryText)) return findCategory("energy");
    if (/pdf|document|file|invoice|receipt/.test(categoryText)) return findCategory(/invoice|receipt/.test(categoryText) ? "business" : "documents");
    if (/tax|paye|vat|business|sme|cash|payroll|salary/.test(categoryText)) return findCategory("business");
    if (/construction|floor|boq|building|materials|land/.test(categoryText)) return findCategory("construction");
    if (/agriculture|farm|crop|poultry|fish|fertilizer|irrigation|livestock/.test(categoryText)) return findCategory("agriculture");
    if (/passport|national-id|voter|birth|death|certificate|government|public-service/.test(categoryText)) return findCategory("country-intelligence");
    if (/country|market|afroatlas|relocation|cost-of-living/.test(categoryText)) return findCategory("country-intelligence");
    return null;
  }

  function loadRouterManifest() {
    var manifestApi = root && root.AfroToolsAIToolManifest;
    if (!manifestApi || typeof manifestApi.getToolManifestForRouter !== "function") return [];
    var base = [];
    if (typeof manifestApi.loadDefaultToolManifest === "function") {
      try { base = manifestApi.loadDefaultToolManifest(); } catch (err) { base = []; }
    }
    return manifestApi.getToolManifestForRouter(base);
  }

  function orchestratedDecision(query, safeConfig, allowed) {
    var orchestrator = root && root.AfroToolsAIOrchestrator;
    if (!orchestrator || typeof orchestrator.buildPlan !== "function") return null;
    var manifest = loadRouterManifest();
    if (!manifest.length) return null;
    var allowedIds = allowed.map(function mapAllowed(item) { return item.id; });
    try {
      var plan = orchestrator.buildPlan(query, {
        manifest: manifest,
        locale: "en",
        consentToModel: false,
        candidateLimit: 3
      });
      var selected = plan && plan.selectedTool || {};
      if (!plan || plan.status === "no_match" || !selected.id || selected.id === "tool-search") return null;
      var categoryItem = categoryForTool(selected);
      if (!categoryItem || allowedIds.indexOf(categoryItem.id) === -1) return null;
      var params = {
        source: "ai_widget",
        partner: safeConfig.partnerId,
        country: safeConfig.defaultCountry,
        category: categoryItem.id
      };
      return {
        category: categoryItem.id,
        label: categoryItem.label,
        toolName: selected.title || categoryItem.toolName,
        primaryToolId: selected.id,
        primaryToolRoute: selected.route || categoryItem.primaryToolRoute,
        directToolHref: appendParams(selected.route || categoryItem.primaryToolRoute, {
          source: "ai_widget",
          partner: safeConfig.partnerId
        }),
        href: appendParams(categoryItem.href, params),
        confidence: "high",
        confidencePercent: Math.max(61, Math.min(96, Math.round(Number(plan.decision && plan.decision.confidence || 0.8) * 100))),
        reason: "Matched the full AfroTools catalog in this browser.",
        toolCall: plan.toolCall || {
          type: "existing_tool_call",
          action: "open_existing_tool",
          toolId: selected.id,
          route: selected.route || categoryItem.primaryToolRoute,
          title: selected.title || categoryItem.toolName,
          category: categoryItem.id,
          invocationMode: "route_only",
          canPrefill: false,
          privacyMode: "browser_local",
          sourcePolicy: "reviewed",
          missingInputNames: []
        }
      };
    } catch (err) {
      return null;
    }
  }

  function queryScore(query, categoryItem) {
    var normalized = String(query || "").toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
    if (!normalized) return 0;
    var score = 0;
    categoryItem.keywords.forEach(function countKeyword(keyword) {
      if (normalized.indexOf(keyword) !== -1) score += keyword.indexOf(" ") === -1 ? 2 : 4;
    });
    return score;
  }

  function confidenceLabel(score) {
    if (score > 5) return "high";
    if (score > 0) return "medium";
    return "fallback";
  }

  function confidencePercent(score) {
    if (score > 8) return 92;
    if (score > 5) return 84;
    if (score > 2) return 72;
    if (score > 0) return 61;
    return 44;
  }

  function appendParams(route, params) {
    var query = Object.keys(params).filter(function keep(key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== "";
    }).map(function encode(key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
    }).join("&");
    return route + (route.indexOf("?") === -1 ? "?" : "&") + query;
  }

  function routePrompt(query, config) {
    var safeConfig = sanitizeConfig(config);
    var allowed = allowedCategoryList(safeConfig);
    var orchestrated = orchestratedDecision(query, safeConfig, allowed);
    if (orchestrated) return orchestrated;
    var selected = findCategory(safeConfig.defaultCategory) || allowed[0] || categories[0];
    var bestScore = queryScore(query, selected);
    allowed.forEach(function rank(item) {
      var score = queryScore(query, item);
      if (score > bestScore) {
        selected = item;
        bestScore = score;
      }
    });
    var params = {
      source: "ai_widget",
      partner: safeConfig.partnerId,
      country: safeConfig.defaultCountry,
      category: selected.id
    };
    var href = appendParams(selected.href, params);
    return {
      category: selected.id,
      label: selected.label,
      toolName: selected.toolName,
      primaryToolId: selected.primaryToolId,
      primaryToolRoute: selected.primaryToolRoute,
      directToolHref: appendParams(selected.primaryToolRoute, {
        source: "ai_widget",
        partner: safeConfig.partnerId
      }),
      href: href,
      confidence: confidenceLabel(bestScore),
      confidencePercent: confidencePercent(bestScore),
      reason: bestScore > 0 ? "Matched topic words in the prompt." : "Showing the default AfroTools tool.",
      toolCall: {
        type: "existing_tool_call",
        action: "open_existing_tool",
        toolId: selected.primaryToolId,
        route: selected.primaryToolRoute,
        title: selected.toolName,
        category: selected.id,
        invocationMode: "route_only",
        canPrefill: false,
        privacyMode: "browser_local",
        sourcePolicy: "reviewed",
        missingInputNames: []
      }
    };
  }

  function pill(label, value) {
    return '<span class="aw-ai-pill"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></span>';
  }

  function externalLink(className, href, label) {
    return '<a class="' + escapeHtml(className) + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(label) + "</a>";
  }

  function recordWidgetIntent(eventName, query, decision, safeConfig) {
    var analytics = root && root.AfroToolsAIIntentAnalytics;
    if (!analytics || typeof analytics.record !== "function") return;
    var clean = String(query || "").trim();
    analytics.record(eventName, {}, {
      surface: "ai_widget",
      source: "direct_ai",
      queryLength: clean.length,
      selectedToolId: decision && decision.primaryToolId || "unknown",
      intentCategory: decision && decision.category || "unknown",
      workflowType: decision && decision.primaryToolId || "ai_widget",
      confidence: decision && Number(decision.confidencePercent || 0) / 100 || 0,
      routerSource: "ai_widget_full_catalog",
      safePromptExample: decision && decision.primaryToolId ? decision.primaryToolId + " / " + decision.category + " / widget" : ""
    });
  }

  function render(rootElement, config) {
    if (!rootElement) return null;
    var safeConfig = sanitizeConfig(config || {});
    var state = {
      selectedCategory: safeConfig.defaultCategory,
      decision: routePrompt("", safeConfig),
      analytics: Object.create(null)
    };

    function draw() {
      var selectedCategory = findCategory(state.selectedCategory) || findCategory(safeConfig.defaultCategory) || categories[0];
      var chips = allowedCategoryList(safeConfig).map(function renderChip(item) {
        return '<button class="aw-ai-chip" type="button" data-category="' + item.id + '" aria-pressed="' + (item.id === state.selectedCategory ? "true" : "false") + '">' + escapeHtml(item.label) + "</button>";
      }).join("");
      var sponsor = safeConfig.sponsorLabel ? '<div class="aw-ai-sponsor" aria-label="Sponsor label">' + escapeHtml(safeConfig.sponsorLabel) + "</div>" : "";
      var country = safeConfig.defaultCountry ? '<span class="aw-ai-context">' + escapeHtml(safeConfig.defaultCountry) + "</span>" : "";
      var decision = state.decision;
      rootElement.innerHTML = [
        '<div class="aw-ai-head">',
        '<div><div class="aw-title">' + escapeHtml(safeConfig.title) + '</div><p class="aw-ai-copy">Describe the task and continue in the right AfroTools tool.</p></div>',
        '<span class="aw-ai-state">Find a tool</span>',
        '</div>',
        sponsor,
        '<label class="aw-label" for="aw-ai-prompt">What do you need to do?</label>',
        '<textarea class="aw-input aw-ai-textarea" id="aw-ai-prompt" rows="3" placeholder="' + escapeHtml(selectedCategory.example) + '"></textarea>',
        '<div class="aw-ai-chip-row" aria-label="Choose a category">' + chips + '</div>',
        '<button class="aw-btn aw-btn--primary aw-ai-submit" type="button">Find tool</button>',
        '<div class="aw-result-box aw-ai-result" aria-live="polite">',
        '<div class="aw-result-label">Recommended tool ' + country + '</div>',
        '<div class="aw-ai-result-top"><div class="aw-result-main">' + escapeHtml(decision.toolName) + '</div><span class="aw-ai-score">' + escapeHtml(decision.confidencePercent + "% match") + '</span></div>',
        '<p class="aw-ai-reason">' + escapeHtml(decision.reason) + '</p>',
        '<div class="aw-ai-callout" aria-label="Where to continue">',
        '<div class="aw-ai-callout-title">Where to continue</div>',
        '<div class="aw-ai-callout-route">' + escapeHtml(decision.primaryToolId) + ' -> ' + escapeHtml(decision.primaryToolRoute) + '</div>',
        '<div class="aw-ai-pills">' + pill("Mode", "Open tool") + pill("Privacy", "No raw prompt in URL") + pill("Source", "Reviewed tool") + '</div>',
        '</div>',
        '<div class="aw-ai-actions">',
        externalLink("aw-ai-link", "https://afrotools.com" + decision.href, "Open on AfroTools"),
        externalLink("aw-ai-link aw-ai-link--secondary", "https://afrotools.com" + decision.directToolHref, "Open tool directly"),
        '</div>',
        '</div>',
        safeConfig.footerHTML
      ].join("");
    }

    function recompute() {
      var prompt = rootElement.querySelector("#aw-ai-prompt");
      var promptValue = prompt ? prompt.value : "";
      state.decision = routePrompt(promptValue, Object.assign({}, safeConfig, { defaultCategory: state.selectedCategory }));
      var analyticsKey = String(promptValue || "").trim().toLowerCase().replace(/\s+/g, " ") + "|" + state.decision.primaryToolId;
      if (promptValue.trim() && !state.analytics[analyticsKey]) {
        state.analytics[analyticsKey] = true;
        recordWidgetIntent("ai_prompt_submitted", promptValue, state.decision, safeConfig);
        recordWidgetIntent("ai_intent_detected", promptValue, state.decision, safeConfig);
      }
      draw();
      var nextPrompt = rootElement.querySelector("#aw-ai-prompt");
      if (nextPrompt) {
        nextPrompt.value = promptValue;
        nextPrompt.focus();
      }
    }

    rootElement.className = (rootElement.className ? rootElement.className + " " : "") + "aw-ai-router";
    if (safeConfig.theme === "minimal") rootElement.className += " aw-ai-router--minimal";
    draw();
    rootElement.addEventListener("click", function handleClick(event) {
      var categoryButton = event.target.closest && event.target.closest("[data-category]");
      var submitButton = event.target.closest && event.target.closest(".aw-ai-submit");
      if (categoryButton) {
        state.selectedCategory = categoryButton.getAttribute("data-category") || safeConfig.defaultCategory;
        recompute();
      }
      if (submitButton) recompute();
    });
    rootElement.addEventListener("keydown", function handleKeydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") recompute();
    });
    return { config: safeConfig, state: state };
  }

  return {
    CATEGORIES: categories,
    sanitizeConfig: sanitizeConfig,
    routePrompt: routePrompt,
    render: render
  };
});
