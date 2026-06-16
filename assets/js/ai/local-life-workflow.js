/**
 * AfroTools AI Local Life workflow.
 *
 * Deterministic cost-of-living, rent, savings, and relocation planning around
 * existing AfroTools tools. Estimates are intentionally cautious and can be
 * overridden by the user.
 */
(function initLocalLifeWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAILocalLifeWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createLocalLifeWorkflow(root) {
  "use strict";

  var sourceConfidence = root && root.AfroTools && root.AfroTools.sourceConfidence || null;
  if (!sourceConfidence && typeof require === "function") {
    try {
      sourceConfidence = require("../lib/source-confidence.js");
    } catch (err) {
      sourceConfidence = null;
    }
  }

  var CITY_PROFILES = {
    lagos: city("Lagos", "Nigeria", "NG", "NGN", {
      rent: 650000,
      food: 180000,
      transport: 85000,
      utilities: 65000,
      data: 25000,
      health: 45000,
      setup: 900000,
      depositMonths: 12,
      fxToUsd: 0.00063,
    }),
    accra: city("Accra", "Ghana", "GH", "GHS", {
      rent: 5200,
      food: 1900,
      transport: 850,
      utilities: 620,
      data: 180,
      health: 420,
      setup: 6500,
      depositMonths: 6,
      fxToUsd: 0.069,
    }),
    nairobi: city("Nairobi", "Kenya", "KE", "KES", {
      rent: 85000,
      food: 32000,
      transport: 13500,
      utilities: 8500,
      data: 3500,
      health: 9000,
      setup: 140000,
      depositMonths: 2,
      fxToUsd: 0.0077,
    }),
    johannesburg: city("Johannesburg", "South Africa", "ZA", "ZAR", {
      rent: 15500,
      food: 6500,
      transport: 2800,
      utilities: 2200,
      data: 650,
      health: 1800,
      setup: 24000,
      depositMonths: 2,
      fxToUsd: 0.055,
    }),
    kigali: city("Kigali", "Rwanda", "RW", "RWF", {
      rent: 900000,
      food: 300000,
      transport: 95000,
      utilities: 85000,
      data: 30000,
      health: 90000,
      setup: 1200000,
      depositMonths: 3,
      fxToUsd: 0.00071,
    }),
  };

  var COUNTRY_TO_CITY = {
    nigeria: "lagos",
    ghana: "accra",
    kenya: "nairobi",
    "south africa": "johannesburg",
    rwanda: "kigali",
  };

  var CITY_ALIASES = {
    lagos: "lagos",
    accra: "accra",
    nairobi: "nairobi",
    johannesburg: "johannesburg",
    joburg: "johannesburg",
    kigali: "kigali",
  };

  function city(cityName, countryName, code, currency, costs) {
    return Object.assign({
      city: cityName,
      country: countryName,
      code: code,
      currency: currency,
    }, costs);
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
    return parsed !== null && parsed >= 0 ? parsed : null;
  }

  function parseMoney(raw) {
    var value = String(raw || "");
    var symbol = value.match(/(?<currency>\$|USD|NGN|KES|KSH|GHS|ZAR|RWF|R)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?/i);
    var word = value.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|cedis?|zar|rand|rwf|frw)\b/i);
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
    };
    return aliases[clean] || clean;
  }

  function firstAlias(clean, map) {
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(clean)) return map[key];
    }
    return "";
  }

  function profileForCity(cityName, countryName) {
    var cityKey = CITY_ALIASES[normalize(cityName || "")] || "";
    if (!cityKey && countryName) cityKey = COUNTRY_TO_CITY[normalize(countryName)] || "";
    return cityKey ? CITY_PROFILES[cityKey] : null;
  }

  function detectWorkflowKind(raw) {
    var clean = normalize(raw);
    if (/\brent|housing|landlord|deposit|advance rent|afford rent\b/.test(clean)) return "rent";
    if (/\bmove|moving|relocat|japa|from .+ to|to .+ from|save before moving|moving from\b/.test(clean)) return "relocation";
    if (/\bsave|savings goal|emergency fund|how much should i save\b/.test(clean)) return "savings";
    return "cost_of_living";
  }

  function normalizeInputs(query, inputs) {
    var raw = text(query);
    var clean = normalize(raw);
    var source = Object.assign({}, inputs || {});
    var money = parseMoney(raw);
    var cityKey = firstAlias(clean, CITY_ALIASES);
    var countryKey = firstAlias(clean, COUNTRY_TO_CITY);
    var originMatch = raw.match(/\bfrom\s+([A-Za-z][A-Za-z\s'.-]{2,40})(?:\s+to\b|[?.!,]|$)/i);
    var destinationMatch = raw.match(/\b(?:to|in|into)\s+([A-Za-z][A-Za-z\s'.-]{2,40})(?:\s+from\b|[?.!,]|$)/i);
    var householdMatch = raw.match(/\b([1-9][0-9]?)\s+(?:people|persons|family members|household members|dependents|kids|children)\b/i);
    var timelineMatch = raw.match(/\b(?:in|within|over)\s+([1-9][0-9]?)\s+(?:months|month|mo)\b/i);
    var housingMatch = raw.match(/\b(shared|roommate|studio|single room|one bedroom|1 bedroom|two bedroom|2 bedroom|family|premium|basic|mid-range|mid range)\b/i);
    var transportMatch = raw.match(/\b(public transport|public|bus|matatu|tro tro|taxi|uber|bolt|rideshare|driving|car|own car|remote)\b/i);

    if (cityKey && CITY_PROFILES[cityKey]) {
      source.destinationCity = source.destinationCity || CITY_PROFILES[cityKey].city;
      source.destinationCountry = source.destinationCountry || CITY_PROFILES[cityKey].country;
      source.country = source.country || CITY_PROFILES[cityKey].country;
      source.city = source.city || CITY_PROFILES[cityKey].city;
    } else if (countryKey && CITY_PROFILES[countryKey]) {
      source.destinationCity = source.destinationCity || CITY_PROFILES[countryKey].city;
      source.destinationCountry = source.destinationCountry || CITY_PROFILES[countryKey].country;
      source.country = source.country || CITY_PROFILES[countryKey].country;
    }

    if (originMatch) {
      var originProfile = profileForCity(originMatch[1], originMatch[1]);
      source.originCity = source.originCity || originProfile && originProfile.city || titleCase(originMatch[1]);
      source.originCountry = source.originCountry || originProfile && originProfile.country || "";
    }
    if (destinationMatch) {
      var destProfile = profileForCity(destinationMatch[1], destinationMatch[1]);
      if (destProfile) {
        source.destinationCity = destProfile.city;
        source.destinationCountry = destProfile.country;
        source.country = source.country || destProfile.country;
        source.city = source.city || destProfile.city;
      }
    }

    if (money.amount !== null && !hasValue(source.income) && !hasValue(source.budget)) {
      if (/\bincome|earn|salary|make|paid\b/i.test(raw)) source.income = money.amount;
      else source.budget = money.amount;
    }
    source.currency = normalizeCurrency(source.currency || money.currency) || source.currency || "";
    if (householdMatch) source.householdSize = Number(householdMatch[1]);
    if (timelineMatch) source.timelineMonths = Number(timelineMatch[1]);
    if (housingMatch) source.housingPreference = normalizeHousing(housingMatch[1]);
    if (transportMatch) source.transportAssumption = normalizeTransport(transportMatch[1]);
    source.workflowKind = source.workflowKind || detectWorkflowKind(raw);
    return normalizeStructuredInputs(source);
  }

  function normalizeStructuredInputs(inputs) {
    var source = Object.assign({}, inputs || {});
    var profile = profileForCity(source.destinationCity || source.city, source.destinationCountry || source.country);
    var currency = normalizeCurrency(source.currency) || profile && profile.currency || "";
    var budget = positiveNumber(source.budget || source.monthlyBudget || source.availableBudget);
    var income = positiveNumber(source.income || source.monthlyIncome || source.salary || source.grossPay);
    var householdSize = positiveNumber(source.householdSize) || 1;
    var timelineMonths = positiveNumber(source.timelineMonths || source.savingsTimelineMonths) || null;
    return Object.assign({}, source, {
      destinationCity: source.destinationCity || source.city || profile && profile.city || "",
      destinationCountry: source.destinationCountry || source.country || profile && profile.country || "",
      country: source.country || source.destinationCountry || profile && profile.country || "",
      city: source.city || source.destinationCity || profile && profile.city || "",
      currency: currency,
      budget: budget,
      income: income,
      householdSize: householdSize,
      housingPreference: normalizeHousing(source.housingPreference || ""),
      transportAssumption: normalizeTransport(source.transportAssumption || ""),
      timelineMonths: timelineMonths,
      savingsGoal: positiveNumber(source.savingsGoal),
      rentOverride: positiveNumber(source.rentOverride || source.housingCost),
      foodOverride: positiveNumber(source.foodOverride || source.foodCost),
      transportOverride: positiveNumber(source.transportOverride || source.transportCost),
      utilitiesOverride: positiveNumber(source.utilitiesOverride || source.utilityCost),
      schoolFeesOverride: positiveNumber(source.schoolFeesOverride || source.schoolFees),
      movingCostOverride: positiveNumber(source.movingCostOverride || source.setupCost),
    });
  }

  function normalizeHousing(value) {
    var clean = normalize(value);
    if (/shared|roommate|single room/.test(clean)) return "shared";
    if (/studio|basic/.test(clean)) return "basic";
    if (/two|2|family/.test(clean)) return "family";
    if (/premium/.test(clean)) return "premium";
    if (/mid/.test(clean)) return "mid";
    if (/one|1/.test(clean)) return "mid";
    return clean || "mid";
  }

  function normalizeTransport(value) {
    var clean = normalize(value);
    if (/remote/.test(clean)) return "remote";
    if (/car|driving|own/.test(clean)) return "private";
    if (/taxi|uber|bolt|ride/.test(clean)) return "rideshare";
    if (/bus|matatu|tro|public/.test(clean)) return "public";
    return clean || "public";
  }

  function titleCase(value) {
    return text(value).replace(/\b[a-z]/gi, function (ch) { return ch.toUpperCase(); });
  }

  function hasValue(value) {
    return !(value === undefined || value === null || value === "" || Array.isArray(value) && value.length === 0);
  }

  function getMissingInputs(inputs) {
    var normalized = normalizeStructuredInputs(inputs || {});
    var missing = [];
    if (!normalized.destinationCity && !normalized.destinationCountry) missing.push("destinationCity");
    if (normalized.budget === null && normalized.income === null) missing.push("budget");
    if (!normalized.householdSize) missing.push("householdSize");
    if (normalized.workflowKind === "relocation" && !normalized.originCity && !normalized.originCountry) missing.push("originCity");
    return missing;
  }

  function buildLocalLifePlan(inputs, options) {
    var query = options && options.query || "";
    var normalized = normalizeInputs(query, inputs);
    var profile = profileForCity(normalized.destinationCity || normalized.city, normalized.destinationCountry || normalized.country);
    var budget = normalized.budget !== null ? normalized.budget : normalized.income;
    var breakdown = buildBudgetBreakdown(profile, normalized);
    var totalMonthly = sumBreakdown(breakdown);
    var affordability = buildAffordability(budget, totalMonthly, normalized.currency || profile && profile.currency || "");
    var relocation = buildRelocationEstimate(profile, normalized, totalMonthly);
    var sourceState = buildSourceState(profile);
    var tools = buildNextTools(profile, normalized);
    var missing = getMissingInputs(normalized);
    var missingCosts = buildMissingCosts(normalized);
    var overrides = buildOverrides(normalized);
    return {
      kind: "local_life",
      workflowKind: normalized.workflowKind || "cost_of_living",
      query: query,
      inputs: normalized,
      cityProfile: profile,
      affordability: affordability,
      budgetBreakdown: breakdown,
      monthlyTotal: totalMonthly,
      relocationEstimate: relocation,
      missingInputs: missing,
      missingCostsChecklist: missingCosts,
      fxAssumptions: buildFxAssumptions(profile, normalized),
      nextTools: tools,
      sourceState: sourceState,
      manualOverrides: overrides,
      warning: "Estimate only. Local prices, rent deposits, FX, taxes, school fees, insurance, and transport costs can change quickly. Verify current quotes before moving, signing a lease, or committing savings.",
      decisionBriefText: buildBriefText(profile, normalized, affordability, breakdown, relocation),
      costOfLivingPrefillInputs: localLifePrefill(normalized, "cost-of-living"),
      rentPrefillInputs: localLifePrefill(normalized, "rent-affordability"),
      relocationPrefillInputs: localLifePrefill(normalized, "japa-calculator"),
      budgetPrefillInputs: localLifePrefill(normalized, "budget-planner"),
      savingsPrefillInputs: localLifePrefill(normalized, "savings-goal"),
    };
  }

  function buildBudgetBreakdown(profile, inputs) {
    if (!profile) {
      return [
        item("Housing", inputs.rentOverride, "Add rent or housing override."),
        item("Food", inputs.foodOverride, "Add food override."),
        item("Transport", inputs.transportOverride, "Add transport override."),
        item("Utilities", inputs.utilitiesOverride, "Add utilities override."),
      ];
    }
    var household = Math.max(1, inputs.householdSize || 1);
    var housingMultiplier = { shared: 0.55, basic: 0.75, mid: 1, family: 1.45, premium: 1.85 }[inputs.housingPreference] || 1;
    var transportMultiplier = { remote: 0.45, public: 1, rideshare: 1.75, private: 2.35 }[inputs.transportAssumption] || 1;
    return [
      item("Housing", inputs.rentOverride !== null ? inputs.rentOverride : profile.rent * housingMultiplier, "Rent or mortgage estimate."),
      item("Food", inputs.foodOverride !== null ? inputs.foodOverride : profile.food * (0.65 + household * 0.35), "Groceries and everyday meals."),
      item("Transport", inputs.transportOverride !== null ? inputs.transportOverride : profile.transport * transportMultiplier, "Commute and local transport."),
      item("Utilities", inputs.utilitiesOverride !== null ? inputs.utilitiesOverride : profile.utilities * (0.75 + household * 0.25), "Power, water, cooking fuel, waste."),
      item("Data", profile.data * Math.min(2.8, 0.8 + household * 0.35), "Mobile data and internet."),
      item("Health buffer", profile.health * (0.8 + household * 0.3), "Routine health and medicine buffer."),
      item("School fees", inputs.schoolFeesOverride !== null ? inputs.schoolFeesOverride : 0, "Manual school or childcare override."),
    ];
  }

  function item(label, amount, note) {
    return { label: label, amount: Math.max(0, Math.round(Number(amount || 0))), note: note };
  }

  function sumBreakdown(items) {
    return (items || []).reduce(function (total, entry) {
      return total + Number(entry.amount || 0);
    }, 0);
  }

  function buildAffordability(budget, totalMonthly, currency) {
    if (budget === null || budget === undefined || !Number.isFinite(Number(budget))) {
      return {
        status: "budget_needed",
        label: "Add monthly budget or income",
        monthlySurplus: null,
        ratio: null,
        summary: "Add monthly budget or income to estimate affordability.",
      };
    }
    var ratio = totalMonthly > 0 ? budget / totalMonthly : 0;
    var surplus = budget - totalMonthly;
    var label = ratio >= 1.25 ? "Comfortable with buffer" : ratio >= 1 ? "Tight but possible" : ratio >= 0.75 ? "Likely shortfall" : "Not affordable on this budget";
    return {
      status: ratio >= 1 ? "affordable" : "shortfall",
      label: label,
      monthlySurplus: Math.round(surplus),
      ratio: Math.round(ratio * 100) / 100,
      summary: "Estimated monthly costs are " + formatMoney(totalMonthly, currency) + "; budget gap or buffer is " + formatMoney(surplus, currency) + ".",
    };
  }

  function buildRelocationEstimate(profile, inputs, totalMonthly) {
    if (!profile) {
      return {
        targetSavings: null,
        timelineMonthlySavings: null,
        depositMonths: 0,
        summary: "Add destination city to estimate relocation savings.",
      };
    }
    var depositMonths = profile.depositMonths || 2;
    var housing = (inputs.rentOverride !== null ? inputs.rentOverride : profile.rent);
    var setup = inputs.movingCostOverride !== null ? inputs.movingCostOverride : profile.setup;
    var emergencyMonths = inputs.workflowKind === "relocation" ? 2 : 1;
    var target = inputs.savingsGoal !== null ? inputs.savingsGoal : Math.round(housing * depositMonths + setup + totalMonthly * emergencyMonths);
    var monthly = inputs.timelineMonths ? Math.ceil(target / inputs.timelineMonths) : null;
    return {
      targetSavings: target,
      timelineMonthlySavings: monthly,
      depositMonths: depositMonths,
      setupCost: setup,
      emergencyMonths: emergencyMonths,
      summary: "Target savings estimate includes rent deposit, setup costs, and " + emergencyMonths + " month(s) of emergency buffer.",
    };
  }

  function buildFxAssumptions(profile, inputs) {
    var currency = inputs.currency || profile && profile.currency || "";
    var destinationCurrency = profile && profile.currency || currency;
    var needsConversion = Boolean(currency && destinationCurrency && currency !== destinationCurrency);
    return {
      inputCurrency: currency || "unknown",
      destinationCurrency: destinationCurrency || "unknown",
      needsConversion: needsConversion,
      sourceId: "forex-third-party-snapshot",
      status: needsConversion ? "conversion_needed" : "same_currency_or_unknown",
      note: needsConversion ? "Budget currency differs from the destination city profile. Use AfroFX or your bank before relying on the gap." : "No live FX conversion was applied in this deterministic estimate.",
    };
  }

  function buildMissingCosts(inputs) {
    var items = [
      "Current rent quote, deposit months, agent fees, and lease terms.",
      "Utilities: electricity, water, cooking fuel, waste, internet, and service charges.",
      "Transport: commute distance, rideshare frequency, parking, tolls, and fuel.",
      "Food pattern: home cooking vs eating out, household size, and dietary needs.",
      "Health insurance, medicines, school fees, childcare, and dependent support.",
      "Moving costs: flights, cargo, temporary housing, furniture, documents, and FX fees.",
      "Tax or payroll impact: PAYE, tax residency, pension, and employer deductions.",
    ];
    if (!inputs.schoolFeesOverride) items.push("School or childcare fees are not included unless you add a manual override.");
    return items;
  }

  function buildOverrides(inputs) {
    return [
      ["Rent", inputs.rentOverride],
      ["Food", inputs.foodOverride],
      ["Transport", inputs.transportOverride],
      ["Utilities", inputs.utilitiesOverride],
      ["School fees", inputs.schoolFeesOverride],
      ["Moving/setup", inputs.movingCostOverride],
      ["Savings goal", inputs.savingsGoal],
    ].filter(function (entry) { return entry[1] !== null && entry[1] !== undefined; }).map(function (entry) {
      return { label: entry[0], amount: entry[1] };
    });
  }

  function buildSourceState(profile) {
    return [
      normalizeSource({
        id: "local-life-planning-estimates",
        sourceName: "AfroTools local-life planning estimates",
        sourceType: "estimate",
        countryCodes: profile ? [profile.code] : ["ALL"],
        lastCheckedAt: null,
        lastReviewedAt: null,
        freshnessStatus: "unknown",
        confidence: "estimated",
        notes: "Cost profiles are deterministic planning estimates until city-level source metadata is reviewed.",
      }),
      normalizeSource(sourceById("forex-third-party-snapshot")),
      normalizeSource(sourceById("paye-tax-engine-country-packs")),
      normalizeSource(sourceById("country-profile-reviewed-dataset")),
    ].map(function (source) {
      return {
        id: source.id,
        sourceName: source.sourceName,
        freshnessStatus: source.freshnessStatus || "unknown",
        confidence: source.confidence || "estimated",
        lastReviewedAt: source.lastReviewedAt || "",
        notes: source.displayDisclaimer || source.notes || "",
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
    return {
      id: id,
      sourceName: id.replace(/-/g, " "),
      freshnessStatus: "unknown",
      confidence: "estimated",
      notes: "Source metadata unavailable in this runtime.",
    };
  }

  function normalizeSource(source) {
    if (sourceConfidence && typeof sourceConfidence.normalizeSourceMeta === "function") {
      return sourceConfidence.normalizeSourceMeta(source || {});
    }
    return Object.assign({}, source || {});
  }

  function buildNextTools(profile, inputs) {
    var country = profile && profile.country || inputs.destinationCountry || inputs.country || "";
    var cityName = profile && profile.city || inputs.destinationCity || inputs.city || "";
    return [
      tool("cost-of-living", "Open Cost of Living Planner", "/tools/cost-of-living/", "Compare rent, food, transport, and utilities for " + (cityName || "your city") + "."),
      tool("rent-affordability", "Open Rent Affordability", "/tools/rent-affordability/", "Check rent share, deposit, agent fees, and move-in pressure."),
      tool("japa-calculator", "Open Relocation Planner", "/tools/japa-calculator/", "Estimate moving, document, flight, setup, and first-month costs."),
      tool("savings-goal", "Open Savings Goal", "/tools/savings-goal/", "Turn the savings target into monthly milestones."),
      tool("budget-planner", "Open Budget Planner", "/tools/budget-planner/", "Build a monthly spending plan with manual categories."),
      tool("currency-converter", "Open AfroFX", "/tools/currency-converter/", "Verify FX before moving money or comparing currencies."),
      tool("paye-calculator", "Open PAYE Calculator", "/tools/paye-calculator/", "Check net income if salary or tax residency matters in " + (country || "the destination") + "."),
      tool("afroatlas", "Open Country Intelligence", profile ? "/tools/afroatlas/country/" + slug(profile.country) + "/" : "/tools/afroatlas/", "Review country-level context and source confidence."),
    ];
  }

  function tool(id, title, route, reason) {
    return { id: id, title: title, route: route, reason: reason };
  }

  function slug(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function localLifePrefill(inputs, toolId) {
    return {
      toolId: toolId,
      country: inputs.destinationCountry || inputs.country || "",
      city: inputs.destinationCity || inputs.city || "",
      originCountry: inputs.originCountry || "",
      originCity: inputs.originCity || "",
      monthlyBudget: inputs.budget,
      budget: inputs.budget,
      income: inputs.income,
      currency: inputs.currency || "",
      householdSize: inputs.householdSize,
      housingPreference: inputs.housingPreference,
      transportAssumption: inputs.transportAssumption,
      savingsGoal: inputs.savingsGoal,
      timelineMonths: inputs.timelineMonths,
    };
  }

  function buildBriefText(profile, inputs, affordability, breakdown, relocation) {
    var place = profile ? profile.city + ", " + profile.country : (inputs.destinationCity || inputs.destinationCountry || "destination");
    return [
      "LOCAL LIFE PLANNING BRIEF",
      "Destination: " + place,
      "Affordability: " + affordability.label,
      "Monthly estimate: " + formatMoney(sumBreakdown(breakdown), inputs.currency || profile && profile.currency || ""),
      "Relocation savings target: " + (relocation.targetSavings === null ? "Add destination city" : formatMoney(relocation.targetSavings, inputs.currency || profile && profile.currency || "")),
      "Warning: estimate only; verify current quotes and official requirements.",
    ].join("\n");
  }

  function renderLocalLifePanel(plan) {
    if (!plan) return "";
    var currency = plan.inputs.currency || plan.cityProfile && plan.cityProfile.currency || "";
    var place = plan.cityProfile ? plan.cityProfile.city + ", " + plan.cityProfile.country : "Destination needed";
    return '<section class="ai-local-life-plan" data-local-life-plan aria-label="Local life planning workflow">' +
      '<div class="ai-local-life-head"><div><h4>Local life planner</h4><p>' + escapeHtml(place + " - " + plan.affordability.summary) + '</p></div><span>' + escapeHtml(plan.affordability.label) + '</span></div>' +
      '<div class="ai-local-life-metrics">' +
      '<div><span>Monthly estimate</span><strong>' + escapeHtml(formatMoney(plan.monthlyTotal, currency)) + '</strong></div>' +
      '<div><span>Budget gap/buffer</span><strong>' + escapeHtml(plan.affordability.monthlySurplus === null ? "Add budget" : formatMoney(plan.affordability.monthlySurplus, currency)) + '</strong></div>' +
      '<div><span>Relocation target</span><strong>' + escapeHtml(plan.relocationEstimate.targetSavings === null ? "Add city" : formatMoney(plan.relocationEstimate.targetSavings, currency)) + '</strong></div>' +
      '<div><span>FX state</span><strong>' + escapeHtml(plan.fxAssumptions.status.replace(/_/g, " ")) + '</strong></div>' +
      '</div>' +
      '<div class="ai-local-life-grid"><div><strong>Budget breakdown</strong>' + renderBreakdown(plan.budgetBreakdown, currency) + '</div><div><strong>Missing costs checklist</strong>' + renderList(plan.missingCostsChecklist) + '</div></div>' +
      '<div class="ai-local-life-section"><strong>FX assumptions</strong><p>' + escapeHtml(plan.fxAssumptions.note) + '</p></div>' +
      (plan.manualOverrides.length ? '<div class="ai-local-life-section"><strong>Manual overrides used</strong>' + renderOverrideList(plan.manualOverrides, currency) + '</div>' : '<div class="ai-local-life-section"><strong>Manual overrides</strong><p>Add rent, food, transport, utilities, school fees, or moving-cost overrides in the detail fields, then update the plan.</p></div>') +
      '<div class="ai-local-life-tools">' + plan.nextTools.map(function (next) {
        return '<a class="ai-local-life-tool" href="' + escapeHtml(next.route) + '" data-local-life-tool-link data-tool-id="' + escapeHtml(next.id) + '"><strong>' + escapeHtml(next.title) + '</strong><span>' + escapeHtml(next.reason) + '</span></a>';
      }).join("") + '</div>' +
      '<div class="ai-local-life-section"><strong>Source and freshness</strong><div class="ai-local-life-source-grid">' + plan.sourceState.map(renderSourceCard).join("") + '</div></div>' +
      '<div class="ai-local-life-section ai-local-life-warning"><strong>Estimate only</strong><p>' + escapeHtml(plan.warning) + '</p></div>' +
      '</section>';
  }

  function renderBreakdown(items, currency) {
    return '<ul>' + (items || []).map(function (entry) {
      return '<li>' + escapeHtml(entry.label + ": " + formatMoney(entry.amount, currency) + " - " + entry.note) + '</li>';
    }).join("") + '</ul>';
  }

  function renderList(items) {
    return '<ul>' + (items || []).map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join("") + '</ul>';
  }

  function renderOverrideList(items, currency) {
    return '<ul>' + items.map(function (entry) {
      return '<li>' + escapeHtml(entry.label + ": " + formatMoney(entry.amount, currency)) + '</li>';
    }).join("") + '</ul>';
  }

  function renderSourceCard(source) {
    return '<div class="ai-local-life-source"><span>' + escapeHtml(source.freshnessStatus || "unknown") + '</span><strong>' + escapeHtml(source.sourceName || source.id) + '</strong><p>' + escapeHtml((source.confidence || "estimated").replace(/_/g, " ") + (source.lastReviewedAt ? " reviewed " + source.lastReviewedAt : "")) + '</p></div>';
  }

  function formatMoney(amount, currency) {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "Not available";
    var rounded = Math.round(Number(amount));
    var sign = rounded < 0 ? "-" : "";
    return sign + (currency ? currency + " " : "") + Math.abs(rounded).toLocaleString();
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildLocalLifePlan: buildLocalLifePlan,
    renderLocalLifePanel: renderLocalLifePanel,
    _private: {
      profileForCity: profileForCity,
      buildBudgetBreakdown: buildBudgetBreakdown,
      detectWorkflowKind: detectWorkflowKind,
    },
  };
});
