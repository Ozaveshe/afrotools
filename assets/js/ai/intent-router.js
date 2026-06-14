/**
 * Ask AfroTools AI intent router.
 *
 * Server-safe CommonJS module with deterministic routing and strict output
 * validation. A provider can suggest a decision, but this module validates and
 * normalizes the payload before the API returns it.
 */
(function initIntentRouter(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIIntentRouter = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createIntentRouter() {
  "use strict";

  var manifestApi = null;
  if (typeof require === "function") {
    try {
      manifestApi = require("./tool-manifest.js");
    } catch (err) {
      manifestApi = null;
    }
  }

  var OUTPUT_SCHEMA = {
    schemaVersion: 1,
    requiredFields: [
      "intentCategory",
      "selectedToolId",
      "selectedRoute",
      "confidence",
      "reasonShort",
      "extractedInputs",
      "missingInputs",
      "clarificationQuestion",
      "safetyDomain",
      "highStakesNotice",
      "privacyMode",
      "canPrefill",
      "suggestedNextActions",
    ],
    enums: {
      safetyDomain: ["tax", "immigration", "legal", "health", "finance", "employment", "education", "energy", "none"],
      privacyMode: ["browser_local", "server_required", "ai_optional", "account_optional"],
    },
  };

  var SEARCH_FALLBACK = {
    id: "tool-search",
    route: "/search/",
    title: "Search AfroTools",
    category: "search",
    subcategory: "search",
    privacyMode: "browser_local",
    highStakesDomain: "none",
    requiredInputs: [],
    aiCapabilities: ["route_only"],
  };

  var ROUTING_RULES = [
    rule("cv-jobs", "cv-builder", ["cv", "resume", "curriculum vitae", "ats", "linkedin profile"], ["employment", "career"]),
    rule("scholarships", "scholarship-finder", ["scholarship", "scholarships", "bursary", "funding", "grant for school"], ["education"]),
    rule("salary-tax", "paye-calculator", ["paye", "payroll", "salary tax", "income tax", "net pay", "gross pay"], ["tax"]),
    rule("import-duty", "import-duty", ["import duty", "customs duty", "car import", "vehicle import", "landed cost", "toyota", "honda", "mazda", "nissan"], ["finance"]),
    rule("solar-energy", "solar-roi", ["solar", "inverter", "battery", "backup power", "payback"], ["energy"]),
    rule("fuel-energy", "fuel-tracker", ["generator", "fuel", "petrol", "diesel", "kerosene"], ["energy"]),
    rule("business-tax", "invoice-generator", ["invoice", "receipt", "bill client"], ["finance"]),
    rule("business-tax", "vat-calc-pan-african", ["vat", "value added tax", "sales tax"], ["tax"]),
    rule("documents", "pdf-workspace", ["pdf", "merge pdf", "split pdf", "compress pdf", "document"], ["none"]),
    rule("education", "gpa-calculator", ["gpa", "cgpa", "grade point"], ["education"]),
    rule("education", "ielts-calculator", ["ielts", "band score", "english test"], ["education"]),
    rule("study-abroad", "study-abroad-cost", ["study abroad", "study in", "study from", "student visa", "tuition abroad", "school abroad"], ["education", "immigration"]),
    rule("study-abroad", "japa-calculator", ["japa", "relocate", "migration cost", "move to canada", "move to uk"], ["immigration"]),
    rule("construction", "afroplan-floor-planner", ["floor planner", "floor plan", "house plan", "room layout", "construction layout"], ["none"]),
  ];

  var COUNTRY_ALIASES = {
    nigeria: "Nigeria",
    naija: "Nigeria",
    ghana: "Ghana",
    kenya: "Kenya",
    cameroon: "Cameroon",
    "south africa": "South Africa",
    uganda: "Uganda",
    tanzania: "Tanzania",
    rwanda: "Rwanda",
    zambia: "Zambia",
    zimbabwe: "Zimbabwe",
    ethiopia: "Ethiopia",
    egypt: "Egypt",
    morocco: "Morocco",
    senegal: "Senegal",
    "cote d'ivoire": "Cote d'Ivoire",
    "cote divoire": "Cote d'Ivoire",
    "ivory coast": "Cote d'Ivoire",
  };

  var DESTINATION_COUNTRIES = {
    canada: "Canada",
    "united kingdom": "United Kingdom",
    uk: "United Kingdom",
    usa: "United States",
    "united states": "United States",
    germany: "Germany",
    france: "France",
    australia: "Australia",
    ireland: "Ireland",
    netherlands: "Netherlands",
  };

  function rule(intentCategory, toolId, keywords, safetyHints) {
    return {
      intentCategory: intentCategory,
      toolId: toolId,
      keywords: keywords,
      safetyHints: safetyHints || [],
    };
  }

  function getRouterManifest(manifest) {
    if (Array.isArray(manifest)) return manifest;
    if (manifestApi && typeof manifestApi.getToolManifestForRouter === "function") {
      try {
        return manifestApi.getToolManifestForRouter();
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s$,.:'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clampConfidence(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(1, number));
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function findTool(manifest, id) {
    var tools = array(manifest);
    for (var i = 0; i < tools.length; i += 1) {
      var entry = tools[i];
      if (!entry) continue;
      if (entry.id === id || entry.slug === id || array(entry.aliases).indexOf(id) !== -1) return entry;
    }
    return null;
  }

  function routeUrl(route, query) {
    var clean = String(route || "/search/");
    if (!query) return clean;
    return clean + (clean.indexOf("?") === -1 ? "?" : "&") + "source=ask";
  }

  function keywordScore(text, keywords) {
    var score = 0;
    array(keywords).forEach(function countKeyword(keyword) {
      if (text.indexOf(keyword) !== -1) score += keyword.split(/\s+/).length > 1 ? 3 : 2;
    });
    return score;
  }

  function findBestRule(query) {
    var text = normalizeText(query);
    var best = null;
    ROUTING_RULES.forEach(function scoreRule(candidate) {
      var score = keywordScore(text, candidate.keywords);
      if (score > 0 && (!best || score > best.score)) {
        best = Object.assign({ score: score }, candidate);
      }
    });
    return best;
  }

  function extractCountryFromMap(text, map) {
    var keys = Object.keys(map).sort(function byLength(left, right) {
      return right.length - left.length;
    });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(text)) return map[key];
    }
    return "";
  }

  function extractMoney(query) {
    var match = String(query || "").match(/(?:\$|usd\s*)\s?([0-9][0-9,]*(?:\.\d+)?)(?:\s?(k|m))?/i) ||
      String(query || "").match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(usd|dollars|naira|ngn|kes|ghs|zar|xaf|xof)\b/i);
    if (!match) return "";
    var amount = Number(String(match[1]).replace(/,/g, ""));
    if (!Number.isFinite(amount)) return "";
    if (match[2] && String(match[2]).toLowerCase() === "k") amount *= 1000;
    if (match[2] && String(match[2]).toLowerCase() === "m") amount *= 1000000;
    return amount;
  }

  function extractInputs(query, ruleMatch) {
    var original = String(query || "");
    var text = normalizeText(original);
    var extracted = {};
    var country = extractCountryFromMap(text, COUNTRY_ALIASES);
    var targetCountry = extractCountryFromMap(text, DESTINATION_COUNTRIES);
    var money = extractMoney(original);
    var year = original.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
    var employees = original.match(/\b([1-9][0-9]?)\s+(?:employees|staff|workers)\b/i);
    var studyLevel = original.match(/\b(undergraduate|bachelor'?s?|masters?|master'?s?|phd|doctorate|diploma|mba)\b/i);
    var role = original.match(/\b(?:for|as|role|job)\s+(?:an?\s+)?([a-z][a-z\s-]{2,60})(?:\s+in\s+|\s+with\s+|$)/i);
    var vehicle = original.match(/\b(toyota|honda|mazda|nissan|hyundai|kia|mercedes|bmw|volkswagen|vw|ford|lexus)\s+([a-z0-9 -]{2,40}?)(?:\s+(?:worth|valued|costing|into|to|in|for)\b|[?.!,]|$)/i);

    if (country) extracted.country = country;
    if (targetCountry) extracted.targetCountry = targetCountry;
    if (money) extracted.budget = money;
    if (year) extracted.year = year[1];
    if (employees) extracted.employeeCount = Number(employees[1]);
    if (studyLevel) extracted.studyLevel = studyLevel[1].replace(/'?s$/i, "").toLowerCase();
    if (role) extracted.targetRole = role[1].trim();
    if (vehicle) extracted.itemCategory = (vehicle[1] + " " + vehicle[2]).trim();

    if (ruleMatch && ruleMatch.toolId === "import-duty") {
      if (country) extracted.destinationCountry = country;
      if (money) extracted.itemValue = money;
    }
    if (ruleMatch && ruleMatch.toolId === "paye-calculator") {
      if (money) extracted.grossPay = money;
      if (!extracted.payPeriod) extracted.payPeriod = /\bannual|yearly|per year\b/i.test(original) ? "annual" : "monthly";
    }
    if (ruleMatch && ruleMatch.toolId === "solar-roi" && money) {
      extracted.monthlyBill = money;
    }

    return extracted;
  }

  function requiredInputNames(tool) {
    return array(tool && tool.requiredInputs).map(function getName(input) {
      return input && input.name;
    }).filter(Boolean);
  }

  function findMissingInputs(tool, extracted) {
    var values = extracted || {};
    return requiredInputNames(tool).filter(function isMissing(name) {
      return values[name] === undefined || values[name] === null || values[name] === "";
    });
  }

  function highStakesNotice(domain) {
    if (domain === "tax") return "Planning estimate only. Confirm tax, PAYE, VAT, filing, and compliance decisions with official revenue authority guidance or a qualified professional.";
    if (domain === "immigration") return "Planning estimate only. Confirm visa, immigration, and relocation decisions with official government sources or a qualified adviser.";
    if (domain === "legal") return "Planning estimate only. This is not legal advice; confirm with official sources or a qualified legal professional.";
    if (domain === "health") return "Informational only. Do not use this as medical advice; consult a qualified health professional.";
    if (domain === "finance") return "Planning estimate only. Confirm financial, customs, lending, and business decisions with official sources or a qualified professional.";
    if (domain === "employment") return "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.";
    if (domain === "education") return "Planning estimate only. Confirm eligibility, fees, deadlines, and admissions details with official school or scholarship sources.";
    if (domain === "energy") return "Planning estimate only. Confirm tariffs, fuel prices, installation sizing, and safety requirements with current local suppliers or qualified installers.";
    return "";
  }

  function clarificationQuestion(missingInputs) {
    var missing = array(missingInputs);
    if (!missing.length) return "";
    if (missing.indexOf("country") !== -1) return "Which country should AfroTools use for this workflow?";
    if (missing.indexOf("destinationCountry") !== -1) return "Which destination country should AfroTools calculate for?";
    if (missing.indexOf("targetCountry") !== -1) return "Which destination country are you considering?";
    if (missing.indexOf("grossPay") !== -1) return "What gross pay amount should be used for the PAYE estimate?";
    if (missing.indexOf("itemValue") !== -1) return "What item or vehicle value should AfroTools use for the import estimate?";
    if (missing.indexOf("itemCategory") !== -1) return "What item or vehicle are you importing?";
    if (missing.indexOf("studyLevel") !== -1) return "What study level are you targeting?";
    if (missing.indexOf("monthlyBill") !== -1) return "What is the current monthly power bill or generator fuel spend?";
    return "Can you add the missing detail so AfroTools can prepare the workflow?";
  }

  function nextActions(tool, missingInputs) {
    var actions = ["Open the recommended AfroTools workflow"];
    if (array(missingInputs).length) actions.unshift("Answer the clarification question");
    if (tool && array(tool.aiCapabilities).indexOf("prefill") !== -1) actions.push("Use extracted fields as prefill candidates after user review");
    actions.push("Search AfroTools if the match is not right");
    return actions;
  }

  function buildDecision(query, tool, ruleMatch, extracted, source) {
    var safeTool = tool || SEARCH_FALLBACK;
    var missing = findMissingInputs(safeTool, extracted);
    var confidence = source === "model" ? 0.72 : (ruleMatch ? Math.min(0.95, 0.58 + ruleMatch.score * 0.08) : 0.2);
    var privacyMode = safeTool.privacyMode || "browser_local";
    var safetyDomain = safeTool.highStakesDomain || "none";
    return {
      intentCategory: ruleMatch ? ruleMatch.intentCategory : (safeTool.subcategory || safeTool.category || "search"),
      selectedToolId: safeTool.id,
      selectedRoute: routeUrl(safeTool.route, query),
      confidence: clampConfidence(confidence),
      reasonShort: ruleMatch ? "Matched obvious AfroTools workflow keywords." : "No strong workflow match; falling back to AfroTools search.",
      extractedInputs: extracted || {},
      missingInputs: missing,
      clarificationQuestion: clarificationQuestion(missing),
      safetyDomain: safetyDomain,
      highStakesNotice: highStakesNotice(safetyDomain),
      privacyMode: privacyMode,
      canPrefill: safeTool.id !== SEARCH_FALLBACK.id && array(safeTool.aiCapabilities).indexOf("prefill") !== -1,
      suggestedNextActions: nextActions(safeTool, missing),
      _meta: {
        router: "deterministic",
        providerUsed: false,
      },
    };
  }

  function fallbackDecision(query) {
    return buildDecision(query, SEARCH_FALLBACK, null, {}, "fallback");
  }

  function routeDeterministically(query, options) {
    var manifest = getRouterManifest(options && options.manifest);
    var match = findBestRule(query);
    if (!match) return fallbackDecision(query);
    var tool = findTool(manifest, match.toolId) || SEARCH_FALLBACK;
    return buildDecision(query, tool, match, extractInputs(query, match), "deterministic");
  }

  function normalizeDecision(decision, query, options) {
    var manifest = getRouterManifest(options && options.manifest);
    var base = decision && typeof decision === "object" ? Object.assign({}, decision) : {};
    var tool = findTool(manifest, base.selectedToolId) || findTool(manifest, base.selectedToolId || base.toolId) || SEARCH_FALLBACK;
    var deterministic = routeDeterministically(query, options);
    var extracted = Object.assign({}, deterministic.extractedInputs || {}, base.extractedInputs || {});
    var missing = Array.isArray(base.missingInputs) ? base.missingInputs : findMissingInputs(tool, extracted);
    var safetyDomain = OUTPUT_SCHEMA.enums.safetyDomain.indexOf(base.safetyDomain) !== -1 ? base.safetyDomain : (tool.highStakesDomain || "none");
    var privacyMode = OUTPUT_SCHEMA.enums.privacyMode.indexOf(base.privacyMode) !== -1 ? base.privacyMode : (tool.privacyMode || "browser_local");

    return {
      intentCategory: String(base.intentCategory || deterministic.intentCategory || tool.subcategory || "search"),
      selectedToolId: tool.id,
      selectedRoute: routeUrl(tool.route, query),
      confidence: clampConfidence(base.confidence || deterministic.confidence || 0.2),
      reasonShort: String(base.reasonShort || deterministic.reasonShort || "Matched against AfroTools tool registry.").slice(0, 240),
      extractedInputs: extracted,
      missingInputs: missing.filter(Boolean),
      clarificationQuestion: String(base.clarificationQuestion || clarificationQuestion(missing) || ""),
      safetyDomain: safetyDomain,
      highStakesNotice: String(base.highStakesNotice || highStakesNotice(safetyDomain) || ""),
      privacyMode: privacyMode,
      canPrefill: Boolean(base.canPrefill !== undefined ? base.canPrefill : array(tool.aiCapabilities).indexOf("prefill") !== -1),
      suggestedNextActions: array(base.suggestedNextActions).length ? array(base.suggestedNextActions).map(String).slice(0, 5) : nextActions(tool, missing),
      _meta: {
        router: base._meta && base._meta.router ? String(base._meta.router) : "validated",
        providerUsed: Boolean(base._meta && base._meta.providerUsed),
      },
    };
  }

  function validateRouterOutput(decision) {
    var errors = [];
    if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
      return { valid: false, errors: ["output must be an object"] };
    }

    OUTPUT_SCHEMA.requiredFields.forEach(function requireField(field) {
      if (decision[field] === undefined || decision[field] === null) errors.push(field + " is required");
    });
    ["intentCategory", "selectedToolId", "selectedRoute", "reasonShort", "safetyDomain", "privacyMode"].forEach(function requireString(field) {
      if (typeof decision[field] !== "string" || !decision[field].trim()) errors.push(field + " must be a non-empty string");
    });
    if (typeof decision.highStakesNotice !== "string") errors.push("highStakesNotice must be a string");
    if (!decision.selectedRoute || decision.selectedRoute.charAt(0) !== "/") errors.push("selectedRoute must be root-relative");
    if (!Number.isFinite(Number(decision.confidence)) || decision.confidence < 0 || decision.confidence > 1) errors.push("confidence must be between 0 and 1");
    if (!decision.extractedInputs || typeof decision.extractedInputs !== "object" || Array.isArray(decision.extractedInputs)) errors.push("extractedInputs must be an object");
    if (!Array.isArray(decision.missingInputs)) errors.push("missingInputs must be an array");
    if (!Array.isArray(decision.suggestedNextActions) || !decision.suggestedNextActions.length) errors.push("suggestedNextActions must be a non-empty array");
    if (typeof decision.clarificationQuestion !== "string") errors.push("clarificationQuestion must be a string");
    if (typeof decision.canPrefill !== "boolean") errors.push("canPrefill must be a boolean");
    if (OUTPUT_SCHEMA.enums.safetyDomain.indexOf(decision.safetyDomain) === -1) errors.push("safetyDomain is invalid");
    if (OUTPUT_SCHEMA.enums.privacyMode.indexOf(decision.privacyMode) === -1) errors.push("privacyMode is invalid");

    return { valid: errors.length === 0, errors: errors };
  }

  return {
    OUTPUT_SCHEMA: OUTPUT_SCHEMA,
    ROUTING_RULES: ROUTING_RULES,
    routeDeterministically: routeDeterministically,
    normalizeDecision: normalizeDecision,
    validateRouterOutput: validateRouterOutput,
    fallbackDecision: fallbackDecision,
    highStakesNotice: highStakesNotice,
  };
});
