/**
 * AfroTools AI agriculture workflow.
 *
 * Deterministic farm planning router for crop yield, livestock, poultry, fish,
 * fertilizer/input cost, irrigation, storage, and market-price calculators.
 */
(function initAgricultureWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIAgricultureWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAgricultureWorkflow(root) {
  "use strict";

  var sourceConfidence = root && root.AfroTools && root.AfroTools.sourceConfidence || null;
  if (!sourceConfidence && typeof require === "function") {
    try {
      sourceConfidence = require("../lib/source-confidence.js");
    } catch (err) {
      sourceConfidence = null;
    }
  }

  var COUNTRY_ALIASES = {
    nigeria: ["Nigeria", "NG", "NGN"],
    naija: ["Nigeria", "NG", "NGN"],
    ghana: ["Ghana", "GH", "GHS"],
    kenya: ["Kenya", "KE", "KES"],
    senegal: ["Senegal", "SN", "XOF"],
    "cote d'ivoire": ["Cote d'Ivoire", "CI", "XOF"],
    "cote divoire": ["Cote d'Ivoire", "CI", "XOF"],
    "ivory coast": ["Cote d'Ivoire", "CI", "XOF"],
    cameroon: ["Cameroon", "CM", "XAF"],
    uganda: ["Uganda", "UG", "UGX"],
    tanzania: ["Tanzania", "TZ", "TZS"],
    rwanda: ["Rwanda", "RW", "RWF"],
    "south africa": ["South Africa", "ZA", "ZAR"],
  };

  var CITY_COUNTRIES = {
    lagos: "nigeria",
    kano: "nigeria",
    kaduna: "nigeria",
    accra: "ghana",
    kumasi: "ghana",
    nairobi: "kenya",
    eldoret: "kenya",
    dakar: "senegal",
    kaolack: "senegal",
    abidjan: "cote d'ivoire",
    bouake: "cote d'ivoire",
  };

  var TOOL_ROUTES = {
    "crop-yield-estimator": "/agriculture/crop-yield/",
    "farm-profit-calculator": "/agriculture/farm-profit/",
    "farm-budget": "/agriculture/farm-budget/",
    "fertilizer-calculator": "/agriculture/fertilizer/",
    "input-prices": "/agriculture/input-prices/",
    "irrigation-calculator": "/agriculture/irrigation/",
    "storage-loss": "/agriculture/storage-loss/",
    "commodity-prices": "/agriculture/commodity-prices/",
    "poultry-roi-calculator": "/agriculture/poultry-roi/",
    "fish-farming-roi": "/agriculture/fish-farming/",
    "livestock-feed-calculator": "/agriculture/livestock-feed/",
    "cocoa-tracker": "/agriculture/cocoa-tracker/",
    "seed-rate-calculator": "/agriculture/seed-rate/",
    "planting-calendar": "/tools/planting-calendar/",
  };

  var CROPS = {
    maize: "maize",
    corn: "maize",
    rice: "rice",
    cassava: "cassava",
    cocoa: "cocoa",
    cacao: "cocoa",
    coffee: "coffee",
    sorghum: "sorghum",
    millet: "millet",
    tomato: "tomato",
    tomatoes: "tomato",
    onion: "onion",
    onions: "onion",
    soybeans: "soybean",
    soybean: "soybean",
    groundnut: "groundnut",
    peanuts: "groundnut",
  };

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function titleCase(value) {
    return text(value).replace(/\w\S*/g, function (word) {
      if (/^d'/.test(word.toLowerCase())) return "d'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    var parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positiveNumber(value) {
    var parsed = toNumber(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  }

  function firstAlias(clean, map) {
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(clean)) return { key: key, value: map[key] };
    }
    return null;
  }

  function parseMoney(raw) {
    var value = String(raw || "");
    var symbol = value.match(/(?<currency>\$|USD|NGN|KES|KSH|GHS|ZAR|RWF|XAF|XOF|R)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?/i);
    var word = value.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|cedis?|zar|rand|rwf|frw|xaf|xof)\b/i);
    return moneyFromGroups(symbol && symbol.groups || word && word.groups);
  }

  function moneyFromGroups(groups) {
    if (!groups) return { amount: null, currency: "" };
    var amount = Number(String(groups.amount || "").replace(/,/g, ""));
    if (!Number.isFinite(amount)) return { amount: null, currency: "" };
    var suffix = normalize(groups.suffix || "");
    if (suffix === "k") amount *= 1000;
    if (suffix === "m") amount *= 1000000;
    return { amount: amount, currency: normalizeCurrency(groups.currency || "") };
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      NGN: "NGN",
      NAIRA: "NGN",
      KES: "KES",
      KSH: "KES",
      GHS: "GHS",
      CEDI: "GHS",
      CEDIS: "GHS",
      ZAR: "ZAR",
      RAND: "ZAR",
      R: "ZAR",
      RWF: "RWF",
      FRW: "RWF",
      XAF: "XAF",
      XOF: "XOF",
    };
    return aliases[clean] || clean;
  }

  function normalizeCountryName(value) {
    var clean = normalize(value);
    var hit = COUNTRY_ALIASES[clean];
    return hit ? hit[0] : titleCase(value);
  }

  function normalizeCountryCode(value) {
    var clean = normalize(value);
    var hit = COUNTRY_ALIASES[clean];
    return hit ? hit[1] : "";
  }

  function normalizeInputs(query, inputs) {
    var raw = text(query);
    var clean = normalize(raw);
    var source = Object.assign({}, inputs || {});
    var countryHit = firstAlias(clean, COUNTRY_ALIASES);
    var cityHit = firstAlias(clean, CITY_COUNTRIES);
    if (cityHit) {
      source.city = source.city || titleCase(cityHit.key);
      var countryFromCity = COUNTRY_ALIASES[cityHit.value];
      if (countryFromCity) {
        source.country = source.country || countryFromCity[0];
        source.countryCode = source.countryCode || countryFromCity[1];
        source.currency = source.currency || countryFromCity[2];
      }
    }
    if (countryHit) {
      source.country = source.country || countryHit.value[0];
      source.countryCode = source.countryCode || countryHit.value[1];
      source.currency = source.currency || countryHit.value[2];
    }
    var cropHit = firstAlias(clean, CROPS);
    if (cropHit) source.crop = source.crop || cropHit.value;
    var farmSize = raw.match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(hectares?|ha|acres?|plots?)\b/i);
    if (farmSize) {
      source.farmSize = source.farmSize || Number(farmSize[1].replace(/,/g, ""));
      source.farmSizeUnit = source.farmSizeUnit || normalizeFarmSizeUnit(farmSize[2]);
    }
    var birds = raw.match(/\b([0-9][0-9,]*)\s?(broilers?|layers?|birds?|chickens?|hens?)\b/i);
    if (birds) source.birdCount = source.birdCount || Number(birds[1].replace(/,/g, ""));
    var fishCount = raw.match(/\b([0-9][0-9,]*)\s?(fish|fingerlings?|catfish|tilapia|trout)\b/i);
    if (fishCount) source.fishCount = source.fishCount || Number(fishCount[1].replace(/,/g, ""));
    var livestockCount = raw.match(/\b([0-9][0-9,]*)\s?(cattle|cows|goats|sheep)\b/i);
    if (livestockCount) source.livestockCount = source.livestockCount || Number(livestockCount[1].replace(/,/g, ""));
    var money = parseMoney(raw);
    if (money.amount !== null && !source.budget) source.budget = money.amount;
    source.currency = normalizeCurrency(source.currency || money.currency) || source.currency || "";
    source.enterpriseType = source.enterpriseType || detectEnterprise(clean);
    source.workflowKind = source.workflowKind || detectWorkflowKind(clean, source);
    return normalizeStructuredInputs(source);
  }

  function normalizeFarmSizeUnit(value) {
    var clean = normalize(value);
    if (/acre/.test(clean)) return "acre";
    if (/plot/.test(clean)) return "plot";
    return "hectare";
  }

  function detectEnterprise(clean) {
    if (/\bpoultry|broiler|layer|chicken|egg\b/.test(clean)) return "poultry";
    if (/\bfish|catfish|tilapia|trout|aquaculture|pond\b/.test(clean)) return "fish";
    if (/\bcattle|cow|goat|sheep|livestock|feed ration\b/.test(clean)) return "livestock";
    return "crop";
  }

  function detectWorkflowKind(clean, inputs) {
    if (inputs.enterpriseType === "poultry") return "poultry";
    if (inputs.enterpriseType === "fish") return "fish";
    if (inputs.enterpriseType === "livestock") return "livestock";
    if (/\bcocoa|cacao|farmgate|farm gate|export price|quality premium\b/.test(clean)) return "cocoa";
    if (/\birrigation|water|drip|pump|dry season|rainfall|weather\b/.test(clean)) return "irrigation";
    if (/\bfertilizer|fertiliser|npk|urea|input price|seed price|agrochemical|inputs?\b/.test(clean)) return "inputs";
    if (/\bstorage|post harvest|post-harvest|loss|silo|hermetic|warehouse\b/.test(clean)) return "storage";
    if (/\bmarket price|commodity|farm gate|farmgate|sell price|price tracker|seasonal price\b/.test(clean)) return "market";
    if (/\bprofit|roi|margin|break even|break-even|business|budget|cost\b/.test(clean)) return "profit";
    if (/\byield|harvest|tonnes?|tons?|produce\b/.test(clean)) return "crop_yield";
    return "crop_yield";
  }

  function normalizeStructuredInputs(inputs) {
    var source = Object.assign({}, inputs || {});
    source.country = source.country ? normalizeCountryName(source.country) : "";
    source.countryCode = source.countryCode || normalizeCountryCode(source.country);
    source.city = source.city ? titleCase(source.city) : "";
    source.crop = source.crop ? normalize(source.crop).replace(/\s+/g, "_") : "";
    source.farmSize = positiveNumber(source.farmSize);
    source.farmSizeUnit = normalizeFarmSizeUnit(source.farmSizeUnit || "hectare");
    source.birdCount = positiveNumber(source.birdCount);
    source.fishCount = positiveNumber(source.fishCount);
    source.livestockCount = positiveNumber(source.livestockCount);
    source.budget = positiveNumber(source.budget);
    source.currency = normalizeCurrency(source.currency) || source.currency || "";
    source.enterpriseType = source.enterpriseType || detectEnterprise("");
    source.workflowKind = source.workflowKind || detectWorkflowKind("", source);
    return source;
  }

  function getMissingInputs(inputs) {
    var values = normalizeStructuredInputs(inputs || {});
    var missing = [];
    if (!values.country) missing.push("country");
    if ((values.workflowKind === "crop_yield" || values.workflowKind === "profit" || values.workflowKind === "inputs" || values.workflowKind === "irrigation" || values.workflowKind === "storage" || values.workflowKind === "market") && !values.crop) missing.push("crop");
    if ((values.workflowKind === "crop_yield" || values.workflowKind === "profit" || values.workflowKind === "inputs" || values.workflowKind === "irrigation") && !values.farmSize) missing.push("farmSize");
    if (values.workflowKind === "poultry" && !values.birdCount) missing.push("birdCount");
    if (values.workflowKind === "fish" && !values.fishCount) missing.push("fishCount");
    return missing;
  }

  function selectedToolFor(inputs) {
    if (inputs.workflowKind === "poultry") return "poultry-roi-calculator";
    if (inputs.workflowKind === "fish") return "fish-farming-roi";
    if (inputs.workflowKind === "livestock") return "livestock-feed-calculator";
    if (inputs.workflowKind === "cocoa") return "cocoa-tracker";
    if (inputs.workflowKind === "irrigation") return "irrigation-calculator";
    if (inputs.workflowKind === "inputs") return "fertilizer-calculator";
    if (inputs.workflowKind === "storage") return "storage-loss";
    if (inputs.workflowKind === "market") return "commodity-prices";
    if (inputs.workflowKind === "profit") return "farm-profit-calculator";
    return "crop-yield-estimator";
  }

  function buildAgriculturePlan(inputs, options) {
    var normalized = normalizeInputs(options && options.query || "", inputs || {});
    var selectedToolId = selectedToolFor(normalized);
    var recommended = buildRecommendedTools(normalized, selectedToolId);
    var assumptions = buildAssumptions(normalized);
    return {
      kind: "agriculture_assistant",
      inputs: normalized,
      workflowKind: normalized.workflowKind,
      selectedToolId: selectedToolId,
      selectedRoute: TOOL_ROUTES[selectedToolId],
      farmGoalSummary: buildGoalSummary(normalized, selectedToolId),
      assumptions: assumptions,
      recommendedCalculators: recommended,
      sourceState: buildSourceState(normalized),
      riskChecklist: riskChecklist(normalized),
      missingInputs: getMissingInputs(normalized),
      prefillInputs: prefillInputs(normalized),
      warning: "Planning estimate only. Farm yields, livestock performance, input prices, market prices, weather, disease pressure, and seasonality can change quickly. Verify with local extension officers, buyers, suppliers, weather services, and current field conditions before spending money.",
    };
  }

  function buildGoalSummary(inputs, selectedToolId) {
    var place = [inputs.city, inputs.country].filter(Boolean).join(", ") || "your location";
    var subject = inputs.enterpriseType === "poultry" ? "poultry enterprise" : inputs.enterpriseType === "fish" ? "fish farming enterprise" : inputs.enterpriseType === "livestock" ? "livestock feed plan" : (inputs.crop ? inputs.crop.replace(/_/g, " ") + " farm" : "farm plan");
    if (selectedToolId === "cocoa-tracker") return "Plan cocoa yield, farm-gate pricing, quality premium, and market-risk checks for " + place + ".";
    if (selectedToolId === "irrigation-calculator") return "Check irrigation and seasonal water-planning needs for " + subject + " in " + place + ".";
    if (selectedToolId === "commodity-prices") return "Review market-price planning and selling-window assumptions for " + subject + " in " + place + ".";
    if (selectedToolId === "farm-profit-calculator") return "Estimate revenue, cost, margin, ROI, and break-even pressure for " + subject + " in " + place + ".";
    return "Route " + subject + " in " + place + " into the most relevant AfroTools agriculture calculators.";
  }

  function buildAssumptions(inputs) {
    var out = [];
    if (inputs.country || inputs.city) out.push("Location: " + [inputs.city, inputs.country].filter(Boolean).join(", ") + ".");
    if (inputs.crop) out.push("Crop: " + inputs.crop.replace(/_/g, " ") + ".");
    if (inputs.farmSize) out.push("Farm size: " + inputs.farmSize + " " + inputs.farmSizeUnit + (inputs.farmSize === 1 ? "" : "s") + ".");
    if (inputs.birdCount) out.push("Poultry count: " + inputs.birdCount + " birds.");
    if (inputs.fishCount) out.push("Fish/fingerling count: " + inputs.fishCount + ".");
    if (inputs.budget) out.push("Budget is user-entered and not checked against live supplier quotes.");
    out.push("Weather, pest/disease pressure, soil test results, water access, labour availability, and buyer contracts are not verified.");
    out.push("Use calculator outputs as planning estimates, then update with local prices and extension advice.");
    return out;
  }

  function buildRecommendedTools(inputs, selectedToolId) {
    var ids = [selectedToolId];
    if (inputs.enterpriseType === "crop") ids.push("crop-yield-estimator", "farm-profit-calculator", "fertilizer-calculator", "input-prices", "commodity-prices", "planting-calendar");
    if (inputs.workflowKind === "irrigation") ids.push("farm-budget", "crop-yield-estimator", "commodity-prices");
    if (inputs.workflowKind === "storage") ids.push("commodity-prices", "farm-profit-calculator");
    if (inputs.enterpriseType === "poultry") ids.push("farm-budget", "input-prices", "commodity-prices");
    if (inputs.enterpriseType === "fish") ids.push("farm-budget", "input-prices");
    if (inputs.enterpriseType === "livestock") ids.push("farm-profit-calculator", "input-prices");
    if (inputs.workflowKind === "cocoa") ids.push("commodity-prices", "farm-profit-calculator", "storage-loss");
    return unique(ids).map(function (id) {
      return {
        id: id,
        title: toolTitle(id),
        route: TOOL_ROUTES[id],
        reason: toolReason(id),
      };
    }).filter(function (tool) { return tool.route; }).slice(0, 7);
  }

  function toolTitle(id) {
    return {
      "crop-yield-estimator": "Crop Yield Estimator",
      "farm-profit-calculator": "Farm Profit/Loss Calculator",
      "farm-budget": "Farm Budget Planner",
      "fertilizer-calculator": "Fertilizer Calculator",
      "input-prices": "Agri-Input Price Comparator",
      "irrigation-calculator": "Irrigation Water Calculator",
      "storage-loss": "Storage Loss Calculator",
      "commodity-prices": "Commodity Price Tracker",
      "poultry-roi-calculator": "Poultry ROI Calculator",
      "fish-farming-roi": "Fish Farming ROI Calculator",
      "livestock-feed-calculator": "Livestock Feed Calculator",
      "cocoa-tracker": "Cocoa Yield and Export Price Tracker",
      "seed-rate-calculator": "Seed Rate Calculator",
      "planting-calendar": "Crop Planting Calendar",
    }[id] || id;
  }

  function toolReason(id) {
    return {
      "crop-yield-estimator": "Estimate harvest volume and yield gaps.",
      "farm-profit-calculator": "Model revenue, cost, margin, and break-even yield.",
      "farm-budget": "Plan seasonal cash needs before committing inputs.",
      "fertilizer-calculator": "Estimate NPK/urea needs and application timing.",
      "input-prices": "Compare seed, fertilizer, and agrochemical input prices.",
      "irrigation-calculator": "Estimate water needs and irrigation scheduling.",
      "storage-loss": "Estimate post-harvest loss and storage ROI.",
      "commodity-prices": "Review commodity price planning and seasonal patterns.",
      "poultry-roi-calculator": "Estimate broiler/layer cost, feed, selling price, and ROI.",
      "fish-farming-roi": "Estimate aquaculture feed, fingerlings, setup cost, and ROI.",
      "livestock-feed-calculator": "Build cattle, goat, or sheep feed-ration cost estimates.",
      "cocoa-tracker": "Estimate cocoa yield, farm-gate/export price gaps, and quality premiums.",
      "seed-rate-calculator": "Estimate seed quantity and spacing needs.",
      "planting-calendar": "Check seasonality and planting-window context.",
    }[id] || "Open the relevant AfroTools agriculture tool.";
  }

  function buildSourceState(inputs) {
    var sources = [
      sourceMeta("agriculture-static-datasets", "AfroTools agriculture static planning datasets", "reviewed_dataset", [inputs.countryCode || "ALL"], "acceptable", "reviewed", "Crop, livestock, input, and irrigation assumptions from repo datasets. Review local conditions before use."),
      sourceMeta("commodity-price-snapshot", "Commodity and input price snapshot", "third_party_snapshot", [inputs.countryCode || "ALL"], "stale", "estimated", "Market and input prices are snapshots and may not represent today's local quote."),
      sourceMeta("user-entered-farm-inputs", "User-entered farm inputs", "user_input", [inputs.countryCode || "ALL"], "unknown", "user_entered", "Prompt and clarification values supplied by the user."),
    ];
    return sources.map(function (item) {
      if (!sourceConfidence || typeof sourceConfidence.normalizeDataSourceMeta !== "function") return item;
      try {
        return sourceConfidence.normalizeDataSourceMeta(item);
      } catch (err) {
        return item;
      }
    });
  }

  function sourceMeta(id, name, type, countryCodes, freshness, confidence, notes) {
    return {
      id: id,
      sourceName: name,
      sourceType: type,
      countryCodes: countryCodes,
      effectiveFrom: null,
      effectiveTo: null,
      lastCheckedAt: type === "third_party_snapshot" ? "2026-03-01" : null,
      lastReviewedAt: "2026-06-16",
      freshnessStatus: freshness,
      confidence: confidence,
      notes: notes,
    };
  }

  function riskChecklist(inputs) {
    var risks = [
      "Verify current seed, feed, fertilizer, fuel, labour, transport, and buyer prices before committing cash.",
      "Check local weather forecast, planting window, irrigation water access, and flood/drought risk.",
      "Confirm pest, disease, vaccination, biosecurity, storage, and quality requirements for the enterprise.",
      "Run a low-yield and high-cost scenario before treating the plan as affordable.",
      "Talk to extension officers, farmer groups, buyers, and suppliers in the target market.",
    ];
    if (inputs.enterpriseType === "poultry") risks.unshift("Confirm feed conversion, mortality, vaccination schedule, heat stress, and market off-take.");
    if (inputs.enterpriseType === "fish") risks.unshift("Confirm pond/cage design, water quality, stocking density, feed conversion, and fingerling source.");
    if (inputs.workflowKind === "cocoa") risks.unshift("Confirm buyer grade, moisture, fermentation, certification, and farm-gate price rules.");
    if (inputs.workflowKind === "irrigation") risks.unshift("Confirm pump sizing, water rights/access, evapotranspiration assumptions, and dry-season energy cost.");
    return risks;
  }

  function prefillInputs(inputs) {
    return {
      country: inputs.country,
      countryCode: inputs.countryCode,
      city: inputs.city,
      crop: inputs.crop,
      farmSize: inputs.farmSize,
      farmSizeUnit: inputs.farmSizeUnit,
      birdCount: inputs.birdCount,
      fishCount: inputs.fishCount,
      livestockCount: inputs.livestockCount,
      budget: inputs.budget,
      currency: inputs.currency,
      enterpriseType: inputs.enterpriseType,
    };
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function list(items) {
    return '<ul class="ai-list">' + (items || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function renderAgriculturePanel(plan) {
    if (!plan) return "";
    var sourceRows = (plan.sourceState || []).map(function (source) {
      return '<span class="ai-source-pill">' + escapeHtml(source.sourceName || source.id) + " - " + escapeHtml(source.freshnessStatus || "unknown") + " - " + escapeHtml(source.confidence || "estimated") + "</span>";
    }).join("");
    var tools = (plan.recommendedCalculators || []).map(function (tool) {
      return '<a class="ai-small-button secondary" href="' + escapeHtml(tool.route) + '" data-agriculture-tool-link data-tool-id="' + escapeHtml(tool.id) + '">' + escapeHtml(tool.title) + '</a>';
    }).join("");
    return '<section class="ai-agriculture-panel" data-agriculture-workflow>' +
      '<div class="ai-workflow-panel-head"><div><span class="ai-kicker">Agriculture assistant</span><h4>Farm planning brief</h4></div><span class="ai-chip">Calculator-first</span></div>' +
      '<p>' + escapeHtml(plan.farmGoalSummary) + '</p>' +
      '<div class="ai-result-grid">' +
      '<div><strong>Primary route</strong><span>' + escapeHtml(toolTitle(plan.selectedToolId)) + '</span></div>' +
      '<div><strong>Enterprise</strong><span>' + escapeHtml(plan.inputs.enterpriseType || "crop") + '</span></div>' +
      '<div><strong>Crop</strong><span>' + escapeHtml((plan.inputs.crop || "Not set").replace(/_/g, " ")) + '</span></div>' +
      '<div><strong>Country</strong><span>' + escapeHtml(plan.inputs.country || "Not set") + '</span></div>' +
      '<div><strong>Size</strong><span>' + escapeHtml(plan.inputs.farmSize ? plan.inputs.farmSize + " " + plan.inputs.farmSizeUnit : "Not set") + '</span></div>' +
      '</div>' +
      '<div class="ai-mini-panel"><strong>Key assumptions</strong>' + list(plan.assumptions) + '</div>' +
      '<div class="ai-mini-panel"><strong>Risk checklist</strong>' + list(plan.riskChecklist) + '</div>' +
      '<div class="ai-source-row" aria-label="Source confidence">' + sourceRows + '</div>' +
      '<div class="ai-actions">' + tools + '</div>' +
      '<div class="ai-warning" role="note">' + escapeHtml(plan.warning) + '</div>' +
      '</section>';
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildAgriculturePlan: buildAgriculturePlan,
    renderAgriculturePanel: renderAgriculturePanel,
    TOOL_ROUTES: TOOL_ROUTES,
  };
});
