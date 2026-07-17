/**
 * AfroTools AI country intelligence workflow.
 *
 * Deterministic and source-bound: uses AfroAtlas country data plus source
 * registry metadata, then routes users into existing country hubs and tools.
 */
(function initCountryWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAICountryWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCountryWorkflow(root) {
  "use strict";

  var atlas = root && root.AfroAtlas || loadAtlasEngine();
  var sourceConfidence = root && root.AfroTools && root.AfroTools.sourceConfidence || null;
  if (!sourceConfidence && typeof require === "function") {
    try {
      sourceConfidence = require("../lib/source-confidence.js");
    } catch (err) {
      sourceConfidence = null;
    }
  }

  var FALLBACK_SOURCES = [
    {
      id: "country-profile-reviewed-dataset",
      sourceName: "AfroAtlas reviewed country profile dataset",
      sourceType: "reviewed_dataset",
      countryCodes: ["ALL"],
      appliesTo: ["country_profile"],
      lastCheckedAt: "2026-06-16",
      lastReviewedAt: "2026-06-16",
      freshnessStatus: "acceptable",
      confidence: "reviewed",
      notes: "Country pages and statistics should migrate to country-specific official source entries as they are reviewed.",
      displayDisclaimer: "Country statistics are for planning context. Check official statistical agencies or current authority publications for high-stakes decisions.",
    },
    {
      id: "afrorates-policy-rate-pack",
      sourceName: "AfroRates central-bank policy and inflation dataset",
      sourceType: "reviewed_dataset",
      countryCodes: ["ALL"],
      appliesTo: ["fx", "business", "country_profile"],
      lastCheckedAt: "2026-04-08",
      lastReviewedAt: "2026-06-16",
      freshnessStatus: "acceptable",
      confidence: "reviewed",
      notes: "Rates and inflation are planning context and require central-bank verification.",
      displayDisclaimer: "Check the relevant central bank before pricing loans or financial products.",
    },
    {
      id: "forex-third-party-snapshot",
      sourceName: "Foreign-exchange third-party API snapshot",
      sourceType: "third_party_snapshot",
      countryCodes: ["ALL"],
      appliesTo: ["fx"],
      lastCheckedAt: "2026-03-15",
      lastReviewedAt: "2026-06-16",
      freshnessStatus: "stale",
      confidence: "estimated",
      notes: "Treat FX as stale until a live or snapshot pipeline refresh is confirmed.",
      displayDisclaimer: "Verify a current quote from your bank, broker, or payment provider before committing funds.",
    },
    {
      id: "afrofuel-static-snapshot",
      sourceName: "AfroFuel latest available fuel-price snapshot",
      sourceType: "third_party_snapshot",
      countryCodes: ["ALL"],
      appliesTo: ["fuel", "energy"],
      lastCheckedAt: "2026-04-15",
      lastReviewedAt: "2026-06-12",
      freshnessStatus: "acceptable",
      confidence: "estimated",
      notes: "Static fallback snapshot. City and supplier prices can differ.",
      displayDisclaimer: "Verify locally before buying fuel or quoting transport.",
    },
    {
      id: "paye-tax-engine-country-packs",
      sourceName: "AfroTools reviewed PAYE and salary-tax country packs",
      sourceType: "reviewed_dataset",
      countryCodes: ["ALL"],
      appliesTo: ["tax", "salary"],
      lastCheckedAt: "2026-06-14",
      lastReviewedAt: "2026-06-14",
      freshnessStatus: "acceptable",
      confidence: "reviewed",
      notes: "Planning tax packs may not reflect every deduction or filing treatment.",
      displayDisclaimer: "Confirm filing decisions with the revenue authority or qualified payroll professional.",
    },
    {
      id: "vat-country-rate-packs",
      sourceName: "AfroTools reviewed VAT country packs",
      sourceType: "reviewed_dataset",
      countryCodes: ["ALL"],
      appliesTo: ["tax", "business"],
      lastCheckedAt: "2026-06-14",
      lastReviewedAt: "2026-06-14",
      freshnessStatus: "acceptable",
      confidence: "reviewed",
      notes: "VAT treatment can differ by authority guidance, exemptions, and invoicing rules.",
      displayDisclaimer: "Confirm registration, invoicing, and filing treatment with the relevant authority or tax professional.",
    },
    {
      id: "unknown-source",
      sourceName: "Unknown or unavailable source",
      sourceType: "estimate",
      countryCodes: ["ALL"],
      appliesTo: ["other"],
      lastCheckedAt: null,
      lastReviewedAt: null,
      freshnessStatus: "unknown",
      confidence: "low_confidence",
      notes: "No source metadata has been added yet.",
      displayDisclaimer: "Treat this output as a planning estimate until metadata is reviewed.",
    },
  ];

  var CITY_ALIASES = {
    lagos: "Nigeria",
    abuja: "Nigeria",
    kano: "Nigeria",
    accra: "Ghana",
    kumasi: "Ghana",
    nairobi: "Kenya",
    mombasa: "Kenya",
    kigali: "Rwanda",
    kampala: "Uganda",
    dar: "Tanzania",
    "dar es salaam": "Tanzania",
    johannesburg: "South Africa",
    joburg: "South Africa",
    "cape town": "South Africa",
    pretoria: "South Africa",
    dakar: "Senegal",
    cairo: "Egypt",
    casablanca: "Morocco",
    yaounde: "Cameroon",
    douala: "Cameroon",
    lusaka: "Zambia",
  };

  var NAME_ALIASES = {
    naija: "Nigeria",
    "south africa": "South Africa",
    "cote d'ivoire": "Cote d'Ivoire",
    "cote divoire": "Cote d'Ivoire",
    "ivory coast": "Cote d'Ivoire",
    drc: "Democratic Republic of Congo",
    "dr congo": "Democratic Republic of Congo",
    congo: "Republic of Congo",
    eswatini: "Eswatini",
  };

  function loadAtlasEngine() {
    if (typeof require !== "function") return null;
    try {
      var fs = require("fs");
      var path = require("path");
      var vm = require("vm");
      var enginePath = path.join(__dirname, "..", "..", "..", "engines", "afroatlas-engine.js");
      var code = fs.readFileSync(enginePath, "utf8");
      var sandbox = {};
      vm.runInNewContext(code + "\nthis.AfroAtlas = AfroAtlas;", sandbox, { filename: enginePath });
      return sandbox.AfroAtlas || null;
    } catch (err) {
      return null;
    }
  }

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

  function atlasCountries() {
    if (!atlas || typeof atlas.getAllCountries !== "function") return [];
    return atlas.getAllCountries().map(function (country) {
      return Object.assign({ code: countryCode(country) }, country);
    });
  }

  function countryCode(country) {
    if (!atlas || !atlas.COUNTRIES || !country) return "";
    var codes = Object.keys(atlas.COUNTRIES);
    for (var i = 0; i < codes.length; i += 1) {
      if (atlas.COUNTRIES[codes[i]] === country) return codes[i];
    }
    return "";
  }

  function findCountry(value) {
    var raw = text(value);
    if (!raw || !atlas || typeof atlas.getCountry !== "function") return null;
    var aliased = NAME_ALIASES[normalize(raw)] || CITY_ALIASES[normalize(raw)] || raw;
    var found = atlas.getCountry(aliased) || atlas.getCountry(raw.toUpperCase());
    if (found) return Object.assign({ code: countryCode(found) }, found);
    var clean = normalize(aliased);
    var countries = atlasCountries();
    for (var i = 0; i < countries.length; i += 1) {
      var country = countries[i];
      if (normalize(country.name) === clean || normalize(country.slug) === clean || normalize(country.capital) === clean) return country;
    }
    return null;
  }

  function countryCandidates(query) {
    var clean = normalize(query);
    var candidates = [];
    var seen = {};
    var positions = {};

    function add(country, position) {
      if (!country || !country.code || seen[country.code]) return;
      seen[country.code] = true;
      positions[country.code] = position >= 0 ? position : clean.length + candidates.length;
      candidates.push(country);
    }

    Object.keys(NAME_ALIASES).sort(byLength).forEach(function (alias) {
      if (hasPhrase(clean, alias)) add(findCountry(NAME_ALIASES[alias]), clean.indexOf(normalize(alias)));
    });
    Object.keys(CITY_ALIASES).sort(byLength).forEach(function (alias) {
      if (hasPhrase(clean, alias)) add(findCountry(CITY_ALIASES[alias]), clean.indexOf(normalize(alias)));
    });
    atlasCountries().sort(function (a, b) { return b.name.length - a.name.length; }).forEach(function (country) {
      var indexes = [normalize(country.name), normalize(country.slug), normalize(country.capital)].map(function (phrase) {
        return phrase && hasPhrase(clean, phrase) ? clean.indexOf(phrase) : -1;
      }).filter(function (index) { return index >= 0; });
      if (indexes.length) add(country, Math.min.apply(Math, indexes));
    });
    return candidates.sort(function (a, b) {
      return (positions[a.code] || 0) - (positions[b.code] || 0);
    });
  }

  function hasPhrase(textValue, phrase) {
    var cleanPhrase = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|\\b)" + cleanPhrase + "(\\b|$)").test(textValue);
  }

  function byLength(a, b) {
    return b.length - a.length;
  }

  function detectWorkflowKind(query) {
    var clean = normalize(query);
    if (/\bcompare|versus| vs |better for|which country\b/.test(clean)) return "compare";
    if (/\bremote worker|digital nomad|work remotely|remote work\b/.test(clean)) return "remote_worker";
    if (/\bmove|moving|relocat|migration|from .+ to|to .+ from|costs of moving|main costs\b/.test(clean)) return "relocation";
    if (/\bstart(?:ing)? a business|register(?: a)? business|doing business|market entry|business in|company in|tin\b/.test(clean)) return "business";
    if (/\bmarket|exports?|imports?|sector|opportunity|invest|startup\b/.test(clean)) return "market";
    return "country_profile";
  }

  function normalizeInputs(query, inputs) {
    var merged = Object.assign({}, inputs || {});
    var original = text(query);
    var countries = countryCandidates(original);
    var kind = detectWorkflowKind(original);
    var originMatch = original.match(/\bfrom\s+([A-Za-z][A-Za-z\s'.-]{2,40})(?:\s+to\b|[?.!,]|$)/i);
    var targetMatch = original.match(/\b(?:to|in|into|for)\s+([A-Za-z][A-Za-z\s'.-]{2,40})(?:\s+from\b|[?.!,]|$)/i);
    var inputCountry = findCountry(merged.country || merged.destinationCountry || merged.targetCountry || merged.countryName || "");
    var inputComparison = findCountry(merged.comparisonCountry || merged.compareCountry || "");
    var originCountry = findCountry(merged.originCountry || "");
    var targetCountry = inputCountry;

    if (originMatch) originCountry = findCountry(originMatch[1]) || originCountry;
    if (targetMatch && !/\bstarting|business|remote|worker\b/i.test(targetMatch[1])) targetCountry = findCountry(targetMatch[1]) || targetCountry;
    if (!targetCountry && countries.length) targetCountry = countries[0];
    if (!originCountry && kind === "relocation" && countries.length > 1) originCountry = countries[countries.length - 1];
    if (kind === "compare" && countries.length > 1) {
      targetCountry = targetCountry || countries[0];
      inputComparison = inputComparison || countries.filter(function (country) {
        return !targetCountry || country.code !== targetCountry.code;
      })[0];
    }
    if (!inputComparison && countries.length > 1 && targetCountry) {
      inputComparison = countries.filter(function (country) { return country.code !== targetCountry.code; })[0];
    }

    if (targetCountry) {
      merged.country = targetCountry.name;
      merged.countryCode = targetCountry.code;
      merged.countrySlug = targetCountry.slug;
    }
    if (inputComparison) {
      merged.comparisonCountry = inputComparison.name;
      merged.comparisonCountryCode = inputComparison.code;
      merged.comparisonCountrySlug = inputComparison.slug;
    }
    if (originCountry) {
      merged.originCountry = originCountry.name;
      merged.originCountryCode = originCountry.code;
      merged.originCountrySlug = originCountry.slug;
    }
    merged.workflowKind = merged.workflowKind || kind;
    merged.topic = merged.topic || kind.replace(/_/g, " ");
    return merged;
  }

  function getMissingInputs(inputs) {
    var missing = [];
    if (!inputs || !inputs.countryCode) missing.push("country");
    if (inputs && inputs.workflowKind === "compare" && !inputs.comparisonCountryCode) missing.push("comparisonCountry");
    if (inputs && inputs.workflowKind === "relocation" && !inputs.originCountryCode) missing.push("originCountry");
    return missing;
  }

  function buildCountryPlan(inputs, options) {
    var query = options && options.query || "";
    var normalized = normalizeInputs(query, inputs);
    var country = findCountry(normalized.countryCode || normalized.country);
    var comparison = findCountry(normalized.comparisonCountryCode || normalized.comparisonCountry);
    var origin = findCountry(normalized.originCountryCode || normalized.originCountry);
    var kind = normalized.workflowKind || detectWorkflowKind(query);
    var missingInputs = getMissingInputs(normalized);
    var summary = country ? summarizeCountry(country) : missingCountrySummary(query);
    var comparisonSummary = comparison ? summarizeCountry(comparison) : null;
    var insights = buildInsights(country, comparison, kind);
    var sourceState = buildSourceState(kind);
    var relevantCalculators = buildRelevantTools(country, comparison, origin, kind);
    var nextSteps = buildNextSteps(country, comparison, origin, kind);
    var checklist = buildOfficialChecklist(kind);
    var missingData = buildMissingData(country, comparison, origin, kind, summary);

    if (!country) missingData.push("Primary country was not found in AfroAtlas. Use the country hub or search before relying on the plan.");
    if (kind === "compare" && !comparison) missingData.push("Comparison country is missing or not available in AfroAtlas.");
    if (kind === "relocation" && !origin) missingData.push("Origin country is missing. Add it before comparing moving costs.");

    return {
      kind: "country_intelligence",
      workflowKind: kind,
      query: query,
      inputs: normalized,
      country: country,
      comparisonCountry: comparison,
      originCountry: origin,
      countrySummary: summary,
      comparisonSummary: comparisonSummary,
      insights: insights,
      relevantCalculators: relevantCalculators,
      dataConfidence: sourceState,
      practicalNextSteps: nextSteps,
      officialVerificationChecklist: checklist,
      missingInputs: missingInputs,
      missingData: unique(missingData),
      warning: "Planning context only. AfroTools does not replace official registries, revenue authorities, central banks, immigration offices, or professional advice.",
      briefText: buildBriefText(summary, comparisonSummary, insights, nextSteps),
    };
  }

  function summarizeCountry(country) {
    var resources = (country.resources || []).slice(0, 4).map(function (item) {
      return resourceLabel(item);
    });
    return {
      name: country.name,
      code: country.code || countryCode(country),
      slug: country.slug,
      capital: country.capital || "Not available in AfroAtlas dataset",
      region: regionName(country.region),
      currency: country.currency && country.currency.code || "Not available in AfroAtlas dataset",
      currencyName: country.currency && country.currency.name || "Not available in AfroAtlas dataset",
      population: formatLarge(country.population),
      gdp: formatMoney(country.gdp),
      gdpPerCapita: formatMoney(country.gdpPC),
      inflation: formatPercent(country.inflation),
      unemployment: formatPercent(country.unemployment),
      electricity: formatPercent(country.electricity),
      internet: formatPercent(country.internet),
      tagline: country.tagline || "Country profile available in AfroAtlas.",
      resources: resources,
      topExports: (country.exports || []).slice(0, 3).map(function (item) { return item.p; }),
      topImports: (country.imports || []).slice(0, 3).map(function (item) { return item.p; }),
      sourceId: "country-profile-reviewed-dataset",
    };
  }

  function missingCountrySummary(query) {
    return {
      name: "Country not identified",
      code: "",
      slug: "",
      capital: "Missing",
      region: "Missing",
      currency: "Missing",
      currencyName: "Missing",
      population: "Missing",
      gdp: "Missing",
      gdpPerCapita: "Missing",
      inflation: "Missing",
      unemployment: "Missing",
      electricity: "Missing",
      internet: "Missing",
      tagline: query ? "No AfroAtlas country match was found for this prompt." : "Add a country to build a country intelligence plan.",
      resources: [],
      topExports: [],
      topImports: [],
      sourceId: "unknown-source",
    };
  }

  function resourceLabel(item) {
    if (!item) return "";
    var type = item.type || "resource";
    var label = type.charAt(0).toUpperCase() + type.slice(1);
    var production = item.prod ? " - " + item.prod : "";
    return label + production;
  }

  function regionName(code) {
    if (atlas && typeof atlas.getRegions === "function") {
      var regions = atlas.getRegions();
      if (regions && regions[code]) return regions[code].name || code;
    }
    return code || "Not available in AfroAtlas dataset";
  }

  function formatLarge(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
    if (Math.abs(value) >= 1000000000) return (value / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    return value.toLocaleString();
  }

  function formatMoney(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
    return "$" + formatLarge(value);
  }

  function formatPercent(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%";
  }

  function buildInsights(country, comparison, kind) {
    if (!country) return ["Add a country so AfroTools can use the AfroAtlas dataset instead of guessing."];
    if (comparison && atlas && typeof atlas.generateInsights === "function") {
      return atlas.generateInsights(country.code || country.name, comparison.code || comparison.name).slice(0, 5);
    }
    var insights = [
      country.name + " profile: " + (country.tagline || "AfroAtlas profile available."),
      "Currency: " + (country.currency && country.currency.code || "not available") + "; capital: " + (country.capital || "not available") + ".",
      "Electricity access is listed as " + formatPercent(country.electricity) + " and internet access as " + formatPercent(country.internet) + " in AfroAtlas.",
    ];
    if (country.exports && country.exports.length) insights.push("Top listed export: " + country.exports[0].p + ".");
    if (kind === "business") insights.push("Use the business registration, VAT, PAYE, FX, and country hub links before making filing or pricing decisions.");
    if (kind === "relocation") insights.push("Use cost-of-living, FX, fuel, and relocation tools as planning estimates, then verify official immigration and tax requirements.");
    return insights;
  }

  function buildRelevantTools(country, comparison, origin, kind) {
    var tools = [];
    var slug = country && country.slug || "";
    var code = country && country.code || "";
    var compareRoute = comparison && country ? "/tools/afroatlas/compare.html?a=" + encodeURIComponent(code) + "&b=" + encodeURIComponent(comparison.code) : "/tools/afroatlas/";
    addTool(tools, "afroatlas", comparison ? "Compare in AfroAtlas" : "Open AfroAtlas profile", comparison ? compareRoute : countryRoute(country), "Country facts and comparison context from AfroAtlas.", "country-profile-reviewed-dataset", "country_profile");
    if (slug) addTool(tools, "country-hub", country.name + " country hub", "/" + slug + "/", "Country page with local calculators and country-specific links.", "country-profile-reviewed-dataset", "country_profile");
    addTool(tools, "currency-converter", "AfroFX currency converter", "/tools/currency-converter/", "Check exchange-rate planning assumptions and live quote gaps.", "forex-third-party-snapshot", "fx");
    addTool(tools, "afrorates", "AfroRates central-bank tracker", "/tools/afrorates/", "Review policy-rate and inflation context before pricing finance decisions.", "afrorates-policy-rate-pack", "rates");
    addTool(tools, "fuel-tracker", "AfroFuel tracker", "/tools/fuel-tracker/" + (slug ? slug + "/" : ""), "Fuel and transport-cost pressure for businesses and movers.", "afrofuel-static-snapshot", "fuel");
    if (kind === "business" || kind === "market" || kind === "compare") {
      addTool(tools, "business-registration", "Business registration checklist", "/tools/business-registration/", "Plan registration, TIN, and document checks before official filing.", "unknown-source", "business");
      addTool(tools, "vat-calc-pan-african", "VAT calculator", "/tools/vat-calculator/", "Estimate VAT treatment and invoice pressure as a planning aid.", "vat-country-rate-packs", "tax");
      addTool(tools, "paye-calculator", "PAYE calculator", payeRoute(country), "Estimate payroll and salary-tax pressure for hiring plans.", "paye-tax-engine-country-packs", "tax");
    }
    if (kind === "relocation" || kind === "remote_worker" || kind === "compare") {
      addTool(tools, "cost-of-living", "Cost of Living Planner", "/tools/cost-of-living/", "Compare monthly budget pressure for housing, food, transport, and utilities.", "unknown-source", "costs");
      addTool(tools, "japa-calculator", "Relocation cost planner", "/tools/japa-calculator/", "Build a moving-cost checklist and budget estimate.", "unknown-source", "relocation");
    }
    if (origin && country) {
      addTool(tools, "country-origin-hub", origin.name + " origin country hub", "/" + origin.slug + "/", "Use origin-country tax, FX, and relocation context before moving funds.", "country-profile-reviewed-dataset", "country_profile");
    }
    return tools.slice(0, 9);
  }

  function addTool(list, id, title, route, reason, sourceId, category) {
    if (!route || list.some(function (item) { return item.id === id && item.route === route; })) return;
    list.push({ id: id, title: title, route: route, reason: reason, sourceId: sourceId, category: category });
  }

  function countryRoute(country) {
    if (!country || !country.slug) return "/tools/afroatlas/";
    return "/tools/afroatlas/country/" + country.slug + "/";
  }

  function payeRoute(country) {
    if (country && Array.isArray(country.tools)) {
      var paye = country.tools.filter(function (tool) { return /paye|salary|tax/i.test(tool.n || ""); })[0];
      if (paye && paye.p) return paye.p;
    }
    return "/tools/paye-calculator/";
  }

  function buildSourceState(kind) {
    var ids = ["country-profile-reviewed-dataset", "afrorates-policy-rate-pack", "forex-third-party-snapshot"];
    if (kind === "business" || kind === "market" || kind === "compare") ids.push("paye-tax-engine-country-packs", "vat-country-rate-packs");
    if (kind === "relocation" || kind === "remote_worker" || kind === "compare") ids.push("afrofuel-static-snapshot", "unknown-source");
    return unique(ids).map(sourceById).map(function (source) {
      var normalized = normalizeSource(source);
      return {
        id: normalized.id || source.id,
        sourceName: normalized.sourceName || source.sourceName,
        sourceType: normalized.sourceType || source.sourceType,
        freshnessStatus: normalized.freshnessStatus || source.freshnessStatus || "unknown",
        confidence: normalized.confidence || source.confidence || "low_confidence",
        lastCheckedAt: normalized.lastCheckedAt || source.lastCheckedAt || "",
        lastReviewedAt: normalized.lastReviewedAt || source.lastReviewedAt || "",
        notes: normalized.displayDisclaimer || normalized.notes || source.displayDisclaimer || source.notes || "",
      };
    });
  }

  function sourceById(id) {
    if (typeof require === "function") {
      try {
        var fs = require("fs");
        var path = require("path");
        var sourcePath = path.join(__dirname, "..", "..", "..", "data", "source-registry.json");
        var registry = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
        var found = (registry.sources || []).filter(function (source) { return source.id === id; })[0];
        if (found) return found;
      } catch (err) {}
    }
    return FALLBACK_SOURCES.filter(function (source) { return source.id === id; })[0] || FALLBACK_SOURCES[FALLBACK_SOURCES.length - 1];
  }

  function normalizeSource(source) {
    if (sourceConfidence && typeof sourceConfidence.normalizeSourceMeta === "function") {
      return sourceConfidence.normalizeSourceMeta(source || {});
    }
    return Object.assign({}, source || {});
  }

  function buildNextSteps(country, comparison, origin, kind) {
    var countryName = country && country.name || "the target country";
    if (kind === "business" || kind === "market") {
      return [
        "Open the " + countryName + " country hub and AfroAtlas profile to anchor the opportunity in available country data.",
        "Check business-registration, TIN, VAT, and PAYE workflows; treat them as planning aids until official portals confirm details.",
        "Check FX, central-bank rates, fuel, and payroll pressure before pricing products or hiring.",
        "List missing official sources and assign an owner to verify them before registration, hiring, import, or tax decisions.",
      ];
    }
    if (kind === "compare" || kind === "remote_worker") {
      var comparisonName = comparison && comparison.name || "the second country";
      return [
        "Compare " + countryName + " and " + comparisonName + " in AfroAtlas before choosing a base.",
        "Check internet, electricity, FX, fuel, PAYE, VAT, and cost-of-living workflows for the countries under review.",
        "Verify immigration, work authorization, tax residency, banking, and local registration rules with official sources.",
        "Create a short risk table: missing sources, stale data, cost uncertainty, and professional advice needed.",
      ];
    }
    if (kind === "relocation") {
      return [
        "Use the relocation and cost-of-living tools to estimate moving, housing, setup, transport, and utility pressure.",
        "Check FX routes from " + (origin && origin.name || "your origin country") + " to " + countryName + " before moving funds.",
        "Verify immigration, tax residency, school, work, health insurance, and local registration requirements on official portals.",
        "Build a 30/60/90-day moving checklist with confirmed documents, budget ranges, and backup plans.",
      ];
    }
    return [
      "Open the country hub and AfroAtlas profile for available country data.",
      "Use FX, rates, fuel, PAYE, VAT, and cost-of-living tools only where they match your decision.",
      "Mark any missing or stale source as a verification task before acting.",
      "Confirm high-stakes decisions with official sources or qualified professionals.",
    ];
  }

  function buildOfficialChecklist(kind) {
    var checklist = [
      "National statistics agency or official data portal for population, GDP, labor, and sector data.",
      "Central bank for current policy rates, inflation publications, exchange controls, and financial-sector guidance.",
      "Revenue authority for PAYE, VAT, withholding, filing, invoice, and registration treatment.",
      "Business-registration authority or investment-promotion agency for company setup, TIN, licensing, fees, and timelines.",
      "Fuel/energy regulator, utility, or current supplier for fuel prices, tariffs, outages, and connection costs.",
    ];
    if (kind === "relocation" || kind === "remote_worker" || kind === "compare") {
      checklist.push("Immigration or home-affairs authority for visa, residence, work authorization, and entry rules.");
      checklist.push("City/local authority, reputable housing sources, and service providers for current rent, deposits, utilities, and transport costs.");
    }
    return checklist;
  }

  function buildMissingData(country, comparison, origin, kind, summary) {
    var missing = [];
    var summaries = [summary];
    if (comparison) summaries.push(summarizeCountry(comparison));
    summaries.forEach(function (item) {
      ["gdp", "gdpPerCapita", "inflation", "unemployment", "electricity", "internet"].forEach(function (key) {
        if (!item || item[key] === "Not available" || item[key] === "Missing") missing.push((item && item.name || "Country") + " missing " + key + " in AfroAtlas dataset.");
      });
    });
    if (kind === "relocation" && !origin) missing.push("Origin-country costs and document rules are not known until origin country is supplied.");
    return missing;
  }

  function buildBriefText(summary, comparisonSummary, insights, nextSteps) {
    var lines = [
      "COUNTRY INTELLIGENCE BRIEF",
      "Primary country: " + summary.name,
      comparisonSummary ? "Comparison country: " + comparisonSummary.name : "",
      "Key context: " + (insights[0] || "Use available AfroAtlas data and source metadata only."),
      "Next step: " + (nextSteps[0] || "Verify official sources before acting."),
    ];
    return lines.filter(Boolean).join("\n");
  }

  function renderCountryPanel(plan) {
    if (!plan) return "";
    var summary = plan.countrySummary || missingCountrySummary("");
    var comparison = plan.comparisonSummary;
    var stats = [
      ["Capital", summary.capital],
      ["Currency", summary.currency],
      ["Population", summary.population],
      ["GDP", summary.gdp],
      ["Inflation", summary.inflation],
      ["Internet", summary.internet],
    ];
    return '<section class="ai-country-plan" data-country-intelligence aria-label="Country intelligence workflow">' +
      '<div class="ai-country-head"><div><h4>Country intelligence plan</h4><p>' + escapeHtml(summary.tagline || "Use AfroAtlas data and verified source metadata before acting.") + '</p></div><span>' + escapeHtml(plan.workflowKind.replace(/_/g, " ")) + '</span></div>' +
      '<div class="ai-country-grid">' + stats.map(function (item) {
        return '<div><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong></div>';
      }).join("") + '</div>' +
      (comparison ? '<div class="ai-country-section"><strong>Comparison country</strong><p>' + escapeHtml(comparison.name + ": " + comparison.gdp + " GDP, " + comparison.internet + " internet access, " + comparison.electricity + " electricity access.") + '</p></div>' : '') +
      '<div class="ai-country-section"><strong>Available data summary</strong>' + renderList(plan.insights) + '</div>' +
      '<div class="ai-country-tools">' + (plan.relevantCalculators || []).map(function (tool) {
        return '<a class="ai-country-tool" href="' + escapeHtml(tool.route) + '" data-country-tool-link data-tool-id="' + escapeHtml(tool.id) + '"><strong>' + escapeHtml(tool.title) + '</strong><span>' + escapeHtml(tool.reason) + '</span></a>';
      }).join("") + '</div>' +
      '<div class="ai-country-section"><strong>Data confidence and freshness</strong><div class="ai-country-source-grid">' + (plan.dataConfidence || []).map(renderSourceCard).join("") + '</div></div>' +
      '<div class="ai-country-section"><strong>Practical next steps</strong>' + renderList(plan.practicalNextSteps, true) + '</div>' +
      '<div class="ai-country-section"><strong>Official-source verification checklist</strong>' + renderList(plan.officialVerificationChecklist, true) + '</div>' +
      (plan.missingData && plan.missingData.length ? '<div class="ai-country-section ai-country-warning"><strong>Missing or low-confidence data</strong>' + renderList(plan.missingData) + '</div>' : '') +
      '<div class="ai-country-section ai-country-warning"><strong>Planning warning</strong><p>' + escapeHtml(plan.warning) + '</p></div>' +
      '</section>';
  }

  function renderSourceCard(source) {
    return '<div class="ai-country-source"><span>' + escapeHtml(source.freshnessStatus || "unknown") + '</span><strong>' + escapeHtml(source.sourceName || source.id) + '</strong><p>' + escapeHtml((source.confidence || "low_confidence").replace(/_/g, " ") + (source.lastReviewedAt ? " reviewed " + source.lastReviewedAt : "")) + '</p></div>';
  }

  function renderList(items, ordered) {
    var values = (items || []).filter(Boolean);
    if (!values.length) return '<p>Not available in the current dataset.</p>';
    var tag = ordered ? "ol" : "ul";
    return "<" + tag + ">" + values.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</" + tag + ">";
  }

  function unique(items) {
    var seen = {};
    return (items || []).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildCountryPlan: buildCountryPlan,
    renderCountryPanel: renderCountryPanel,
    _private: {
      findCountry: findCountry,
      countryCandidates: countryCandidates,
      detectWorkflowKind: detectWorkflowKind,
    },
  };
});
