/**
 * AfroTools AI solar and generator advisor workflow.
 *
 * Calculator-first: extracts practical energy inputs, uses the existing Solar
 * ROI assumptions/engine, and produces a planning decision brief without model
 * calls. Browser builds expose window.AfroToolsAIEnergyAdvisorWorkflow; tests
 * and scripts use CommonJS.
 */
(function initEnergyAdvisorWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIEnergyAdvisorWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createEnergyAdvisorWorkflow(root) {
  "use strict";

  var solarDataset = root && root.SOLAR_ROI_COUNTRY_DATA || null;
  var solarEngine = root && root.AfroTools && root.AfroTools.engines && root.AfroTools.engines.solarRoi || null;
  if (!solarDataset && typeof require === "function") {
    try {
      solarDataset = require("../../../data/energy/solar-roi-country-dataset.js");
    } catch (err) {
      solarDataset = null;
    }
  }
  if (!solarEngine && typeof require === "function") {
    try {
      solarEngine = require("../engines/solar-roi-engine.js");
    } catch (err) {
      solarEngine = null;
    }
  }

  var CITY_ALIASES = {
    lagos: { city: "Lagos", country: "Nigeria", code: "NG" },
    abuja: { city: "Abuja", country: "Nigeria", code: "NG" },
    kano: { city: "Kano", country: "Nigeria", code: "NG" },
    nairobi: { city: "Nairobi", country: "Kenya", code: "KE" },
    mombasa: { city: "Mombasa", country: "Kenya", code: "KE" },
    accra: { city: "Accra", country: "Ghana", code: "GH" },
    kumasi: { city: "Kumasi", country: "Ghana", code: "GH" },
    johannesburg: { city: "Johannesburg", country: "South Africa", code: "ZA" },
    joburg: { city: "Johannesburg", country: "South Africa", code: "ZA" },
    cape: { city: "Cape Town", country: "South Africa", code: "ZA" },
  };

  var COUNTRY_ALIASES = {
    nigeria: { country: "Nigeria", code: "NG" },
    kenya: { country: "Kenya", code: "KE" },
    ghana: { country: "Ghana", code: "GH" },
    "south africa": { country: "South Africa", code: "ZA" },
    cameroon: { country: "Cameroon", code: "CM" },
    uganda: { country: "Uganda", code: "UG" },
    tanzania: { country: "Tanzania", code: "TZ" },
    zambia: { country: "Zambia", code: "ZM" },
    rwanda: { country: "Rwanda", code: "RW" },
  };

  var USER_TYPES = [
    "household",
    "home",
    "shop",
    "office",
    "farm",
    "school",
    "clinic",
    "small business",
    "business",
  ];

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function titleCase(value) {
    var clean = text(value);
    return clean.replace(/\b[a-z]/gi, function (ch) { return ch.toUpperCase(); });
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

  function round(value, digits) {
    var factor = Math.pow(10, digits === undefined ? 2 : digits);
    return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
  }

  function firstAlias(clean, map) {
    var keys = Object.keys(map).sort(function byLength(a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(clean)) return map[key];
    }
    return null;
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

  function parseMoney(raw) {
    var textValue = String(raw || "");
    var symbol = textValue.match(/(?<currency>\$|USD|NGN|KES|KSH|GHS|ZAR|R)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?/i);
    var word = textValue.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|cedis?|zar|rand)\b/i);
    return moneyFromGroups(symbol && symbol.groups || word && word.groups);
  }

  function parseLabeledMoney(raw, labels) {
    var labelPattern = labels.join("|");
    var after = new RegExp("\\b(?:" + labelPattern + ")\\s*(?:is|of|costs?|:)?\\s*(\\$|USD|NGN|KES|KSH|GHS|ZAR|R)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km])?", "i");
    var before = new RegExp("(\\$|USD|NGN|KES|KSH|GHS|ZAR|R)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km])?\\s*(?:monthly\\s+)?(?:" + labelPattern + ")\\b", "i");
    var match = String(raw || "").match(after);
    if (match) return moneyFromGroups({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    match = String(raw || "").match(before);
    if (match) return moneyFromGroups({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    return { amount: null, currency: "" };
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      DOLLAR: "USD",
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
    };
    return aliases[clean] || (clean.length === 3 ? clean : "");
  }

  function detectUserType(raw, source) {
    var direct = normalize(source.userType || source.customerType || source.energyUserType || "");
    if (direct) return direct === "home" ? "household" : direct;
    var clean = normalize(raw);
    for (var i = 0; i < USER_TYPES.length; i += 1) {
      if (clean.indexOf(USER_TYPES[i]) !== -1) {
        return USER_TYPES[i] === "home" ? "household" : USER_TYPES[i];
      }
    }
    return "";
  }

  function countryByCode(code) {
    var countries = solarDataset && solarDataset.countries || {};
    return countries[String(code || "").toUpperCase()] || null;
  }

  function detectLocation(raw, source) {
    var clean = normalize(raw + " " + (source.city || source.location || "") + " " + (source.country || ""));
    var city = firstAlias(clean, CITY_ALIASES);
    var country = firstAlias(clean, COUNTRY_ALIASES);
    var countryName = text(source.country || source.destinationCountry || "") || (city && city.country) || (country && country.country) || "";
    var code = text(source.countryCode || "") || (city && city.code) || (country && country.code) || "";
    if (!code && countryName) {
      var countries = solarDataset && solarDataset.countries || {};
      Object.keys(countries).some(function (key) {
        if (normalize(countries[key].countryName) === normalize(countryName)) {
          code = key;
          return true;
        }
        return false;
      });
    }
    return {
      country: countryName,
      countryCode: code,
      city: titleCase(text(source.city || source.location || "") || (city && city.city) || ""),
    };
  }

  function normalizeInputs(query, inputs) {
    var raw = String(query || "");
    var source = inputs || {};
    var location = detectLocation(raw, source);
    var monthlyBill = positiveNumber(source.monthlyBill || source.electricityBill || source.powerBill);
    var monthlyGeneratorSpend = positiveNumber(source.monthlyGeneratorSpend || source.generatorSpend || source.fuelSpend);
    var budget = positiveNumber(source.budgetAmount || source.budget || source.budgetRange);
    var genericMoney = parseMoney(raw);
    var billMoney = parseLabeledMoney(raw, ["monthly bill", "electricity bill", "power bill", "grid bill", "monthly electricity", "bill"]);
    var fuelMoney = parseLabeledMoney(raw, ["generator spend", "fuel spend", "petrol spend", "diesel spend", "generator fuel", "fuel cost"]);
    var budgetMoney = parseLabeledMoney(raw, ["budget", "can spend", "available budget"]);
    if (monthlyBill === null && billMoney.amount !== null) monthlyBill = billMoney.amount;
    if (monthlyGeneratorSpend === null && fuelMoney.amount !== null) monthlyGeneratorSpend = fuelMoney.amount;
    if (budget === null && budgetMoney.amount !== null) budget = budgetMoney.amount;
    if (monthlyBill === null && monthlyGeneratorSpend === null && budget === null && genericMoney.amount !== null) {
      if (/\bbudget|can spend|afford\b/i.test(raw)) budget = genericMoney.amount;
      else monthlyBill = genericMoney.amount;
    }
    var hours = raw.match(/\b([0-9]{1,2}(?:\.\d+)?)\s*(?:hours|hrs|h)\s*(?:per|\/)?\s*(?:day|daily)?\b/i);
    var outage = raw.match(/\b(?:outage|blackout|power cut|no light|no grid)\w*\s*(?:for|is|of|:)?\s*([0-9]{1,2}(?:\.\d+)?)\s*(?:hours|hrs|h)?\b/i);
    var outageAfterHours = raw.match(/\b([0-9]{1,2}(?:\.\d+)?)\s*(?:hours|hrs|h)\s*(?:of\s+)?(?:outage|outages|blackout|blackouts|power cut|power cuts|no light|no grid)\b/i);
    var generatorSize = raw.match(/\b([0-9]{1,2}(?:\.\d+)?)\s*(?:kva|kva\.?)\s*(?:generator|gen)?\b/i);
    var load = raw.match(/\b([0-9]{1,2}(?:\.\d+)?)\s*(?:kw|kilowatt)\b/i);
    var fuel = raw.match(/\b(petrol|diesel|lpg|kerosene|gasoline)\b/i);
    var appliances = raw.match(/\b(fridge|freezer|lights?|fans?|pos|laptop|computers?|ac|air conditioner|pump|cold room|printer|router|tv)\b/gi);
    return {
      country: location.country,
      countryCode: location.countryCode,
      countrySlug: countryByCode(location.countryCode) && countryByCode(location.countryCode).slug || "",
      city: location.city,
      userType: detectUserType(raw, source),
      monthlyBill: monthlyBill,
      monthlyGeneratorSpend: monthlyGeneratorSpend,
      generatorSizeKva: positiveNumber(source.generatorSizeKva || source.generatorSize || source.kva) || (generatorSize ? Number(generatorSize[1]) : null),
      generatorHoursPerDay: positiveNumber(source.generatorHoursPerDay || source.generatorHours || source.hoursPerDay) || (hours ? Number(hours[1]) : null),
      fuelType: normalize(source.fuelType || source.fuel || (fuel && fuel[1]) || ""),
      loadSizeKw: positiveNumber(source.loadSizeKw || source.loadSize || source.systemKW || source.systemSizeKw) || (load ? Number(load[1]) : null),
      outageHours: positiveNumber(source.outageHours || source.backupHours || source.backupHoursPerDay) || (outage ? Number(outage[1]) : (outageAfterHours ? Number(outageAfterHours[1]) : null)),
      budgetAmount: budget,
      currency: normalizeCurrency(source.currency || billMoney.currency || fuelMoney.currency || budgetMoney.currency || genericMoney.currency || ""),
      appliances: Array.isArray(source.appliances) ? source.appliances : (appliances || []).map(function (item) { return normalize(item); }).filter(Boolean),
    };
  }

  function getMissingInputs(inputs) {
    var missing = [];
    if (!inputs.country) missing.push("country");
    if (!inputs.userType) missing.push("userType");
    if (inputs.monthlyBill === null && inputs.monthlyGeneratorSpend === null) missing.push("monthlyBill");
    if (inputs.generatorHoursPerDay === null && inputs.monthlyGeneratorSpend === null) missing.push("generatorHoursPerDay");
    if (inputs.loadSizeKw === null && inputs.generatorSizeKva === null && !inputs.appliances.length) missing.push("loadSizeKw");
    return missing.slice(0, 5);
  }

  function estimateLoadKw(inputs, countryData) {
    if (inputs.loadSizeKw !== null) return inputs.loadSizeKw;
    if (inputs.generatorSizeKva !== null) return round(inputs.generatorSizeKva * 0.7, 2);
    var minByType = {
      household: 1.5,
      shop: 3,
      office: 4,
      farm: 5,
      school: 5,
      clinic: 5,
      "small business": 4,
      business: 4,
    };
    var min = minByType[inputs.userType] || 2;
    var tariff = assumption(countryData, "electricityTariff", 1);
    if (inputs.monthlyBill !== null && tariff > 0) {
      var dailyKwh = inputs.monthlyBill / tariff / 30;
      var suggested = dailyKwh / (assumption(countryData, "solarYield", 5) * assumption(countryData, "performanceRatio", 0.78));
      return round(Math.max(min, suggested), 2);
    }
    return min;
  }

  function estimateGeneratorSpend(inputs, countryData) {
    if (inputs.monthlyGeneratorSpend !== null) return inputs.monthlyGeneratorSpend;
    var fuelPrice = assumption(countryData, "fuelPrice", 0);
    if (fuelPrice > 0 && inputs.generatorHoursPerDay !== null) {
      var size = inputs.generatorSizeKva !== null ? inputs.generatorSizeKva : Math.max(2.5, estimateLoadKw(inputs, countryData) / 0.7);
      var fuelFactor = inputs.fuelType === "diesel" ? 0.22 : 0.25;
      var litresPerHour = Math.max(0.45, size * fuelFactor);
      return round(litresPerHour * inputs.generatorHoursPerDay * 30 * fuelPrice, 0);
    }
    if (inputs.monthlyBill !== null) return round(inputs.monthlyBill * (inputs.userType === "shop" || inputs.userType === "business" || inputs.userType === "small business" ? 0.75 : 0.45), 0);
    return 0;
  }

  function assumption(countryData, key, fallback) {
    var item = countryData && countryData.assumptions && countryData.assumptions[key];
    var value = item && Number(item.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function batteryProfile(inputs) {
    var outage = inputs.outageHours !== null ? inputs.outageHours : (inputs.generatorHoursPerDay || 0);
    if (outage >= 6 || inputs.userType === "shop" || inputs.userType === "office" || inputs.userType === "small business") return "extended";
    if (outage >= 3) return "essential";
    if (outage > 0) return "starter";
    return "none";
  }

  function formatMoney(value, countryData) {
    var symbol = countryData && (countryData.currencySymbol || countryData.currency + " ") || "";
    return symbol + Math.round(Number(value || 0)).toLocaleString("en-US");
  }

  function formatYears(value) {
    if (!value || !Number.isFinite(Number(value)) || Number(value) > 25) return "No clear payback";
    var years = Number(value);
    return years >= 10 ? years.toFixed(0) + " years" : years.toFixed(1) + " years";
  }

  function standardSystemKw(value) {
    var size = Number(value || 0);
    var options = [1, 2, 3, 5, 10, 20];
    for (var i = 0; i < options.length; i += 1) {
      if (size <= options[i]) return options[i];
    }
    return options[options.length - 1];
  }

  function generatorFuelRoute(countryData) {
    var supported = {
      angola: true,
      cameroon: true,
      "cote-divoire": true,
      egypt: true,
      ethiopia: true,
      ghana: true,
      kenya: true,
      morocco: true,
      nigeria: true,
      rwanda: true,
      senegal: true,
      "south-africa": true,
      tanzania: true,
      tunisia: true,
      uganda: true,
    };
    var slug = countryData && countryData.slug || "";
    return slug && supported[slug] ? "/tools/generator-fuel/" + slug + "/" : "/tools/generator-fuel/";
  }

  function sourceLine(countryData, key) {
    var item = countryData && countryData.assumptions && countryData.assumptions[key] || {};
    return {
      label: item.sourceName || "AfroTools planning assumption",
      freshness: item.freshness || solarDataset && solarDataset.lastReviewed || "unknown",
      confidence: item.confidence || countryData && countryData.confidenceLevel || "Medium",
      notes: item.notes || "",
      sourceType: item.sourceType || "market_estimate",
    };
  }

  function buildAdvisorPlan(inputs, options) {
    var normalized = normalizeInputs(options && options.query || "", inputs || {});
    var countryData = countryByCode(normalized.countryCode) || countryByCode("NG") || {};
    if (!normalized.countryCode && normalized.country && countryData.code) normalized.countryCode = countryData.code;
    if (!normalized.countrySlug && normalized.country && countryData.slug) normalized.countrySlug = countryData.slug;
    var loadKw = estimateLoadKw(normalized, countryData);
    var generatorSpend = estimateGeneratorSpend(normalized, countryData);
    var outage = normalized.outageHours !== null ? normalized.outageHours : (normalized.generatorHoursPerDay || 0);
    var profile = batteryProfile(normalized);
    var batteryCost = assumption(countryData, "batteryCost", 0) * (profile === "none" ? 0 : profile === "starter" ? 0.7 : profile === "extended" ? 1.35 : 1);
    var engineInput = {
      systemKw: loadKw,
      avgSunHours: assumption(countryData, "solarYield", 5),
      monthlyElectricitySpend: normalized.monthlyBill || 0,
      monthlyGeneratorFuelSpend: generatorSpend || 0,
      tariffPerKwh: assumption(countryData, "electricityTariff", 0),
      fuelPricePerLitre: assumption(countryData, "fuelPrice", 0),
      fuelBaselinePerLitre: assumption(countryData, "fuelPrice", 1),
      installCostPerKw: assumption(countryData, "installCostPerKw", 0),
      batteryCostTotal: batteryCost,
      annualMaintenancePct: 2.5,
      batteryProfile: profile,
      outageHoursPerDay: outage,
      backupHours: outage,
      dailyLoadKwh: normalized.monthlyBill && assumption(countryData, "electricityTariff", 0) > 0 ? normalized.monthlyBill / assumption(countryData, "electricityTariff", 1) / 30 : loadKw * 4,
      peakLoadKw: loadKw,
      generatorSizeKva: normalized.generatorSizeKva || Math.max(1, loadKw / 0.7),
      systemEfficiencyPct: assumption(countryData, "performanceRatio", 0.78) * 100,
    };
    var result = solarEngine && typeof solarEngine.calculate === "function" ? solarEngine.calculate(engineInput) : {};
    var payback = result.simplePaybackYears || null;
    var annualFuelExposure = generatorSpend * 12;
    var decision = solarEngine && typeof solarEngine.decisionEngine === "function"
      ? solarEngine.decisionEngine({
        paybackYears: payback,
        outageHoursPerDay: outage,
        monthlyGeneratorFuelSpend: generatorSpend,
        monthlyElectricitySpend: normalized.monthlyBill || 0,
        netMonthlyAfterMaintenance: (result.firstYearProjectCashflow || 0) / 12,
        batteryNeed: profile,
        fuelAvoidedLitresPerMonth: (result.generatorLitresAvoided || 0) / 12,
      })
      : { label: "Quote needed before decision", headline: "Replace defaults with bills, receipts, and installer quotes.", reasons: [], nextSteps: [] };
    var sourceState = {
      tariff: sourceLine(countryData, "electricityTariff"),
      fuel: sourceLine(countryData, "fuelPrice"),
      solarYield: sourceLine(countryData, "solarYield"),
      install: sourceLine(countryData, "installCostPerKw"),
      datasetLastReviewed: solarDataset && solarDataset.lastReviewed || "unknown",
    };
    var questions = [
      "What are the exact essential loads: lights, POS, router, fridge/freezer, pumps, AC, or machinery?",
      "What is the inverter continuous rating and surge rating, especially for motors and compressors?",
      "How many usable battery kWh are quoted, and what warranty/depth-of-discharge applies?",
      "Does the quote include panels, inverter, batteries, protection devices, mounting, labour, and permits?",
      "How will roof shading, orientation, dust, and future maintenance affect production?",
    ];
    var risks = [
      "Fuel, tariff, FX, and installer prices can move before purchase.",
      "Country defaults are planning assumptions; replace them with recent bills, fuel receipts, and written quotes.",
      "Battery life, replacement timing, and usable kWh can change the payback materially.",
      "A site visit is needed for roof strength, shade, cable runs, protection devices, and load surge.",
    ];
    var briefLines = [
      "AFROTOOLS SOLAR AND GENERATOR DECISION BRIEF",
      "",
      "Goal: " + goalSummary(normalized),
      "Decision: " + decision.headline,
      "",
      "Key estimates",
      "Monthly generator exposure: " + formatMoney(generatorSpend, countryData),
      "Annual fuel exposure: " + formatMoney(annualFuelExposure, countryData),
      "Rough solar system size: " + loadKw + " kW",
      "Battery profile: " + profile,
      "Estimated system cost: " + formatMoney(result.systemCost || loadKw * assumption(countryData, "installCostPerKw", 0) + batteryCost, countryData),
      "Simple payback: " + formatYears(payback),
      "",
      "Installer questions",
      questions.map(function (item, index) { return (index + 1) + ". " + item; }).join("\n"),
      "",
      "Risks",
      risks.map(function (item, index) { return (index + 1) + ". " + item; }).join("\n"),
      "",
      "Sources and confidence",
      "Tariff: " + sourceState.tariff.label + " (" + sourceState.tariff.confidence + ", reviewed " + sourceState.tariff.freshness + ")",
      "Fuel: " + sourceState.fuel.label + " (" + sourceState.fuel.confidence + ", reviewed " + sourceState.fuel.freshness + ")",
      "Solar yield: " + sourceState.solarYield.label + " (" + sourceState.solarYield.confidence + ", reviewed " + sourceState.solarYield.freshness + ")",
      "",
      "Planning estimate only. Confirm with an installer, utility tariff schedule, and recent fuel receipts before purchase.",
    ];
    return {
      kind: "energy_advisor",
      inputs: normalized,
      missingInputs: getMissingInputs(normalized),
      goalSummary: goalSummary(normalized),
      countryData: {
        countryName: normalized.country ? (countryData.countryName || normalized.country) : "Country needed",
        code: normalized.country ? (countryData.code || normalized.countryCode || "") : "",
        slug: normalized.country ? (countryData.slug || normalized.countrySlug || "") : "",
        currency: countryData.currency || normalized.currency || "",
        currencySymbol: countryData.currencySymbol || "",
        confidenceLevel: countryData.confidenceLevel || "Medium",
      },
      estimates: {
        monthlyGeneratorCost: round(generatorSpend, 0),
        annualFuelExposure: round(annualFuelExposure, 0),
        roughSystemKw: loadKw,
        batteryProfile: profile,
        batteryCost: round(batteryCost, 0),
        systemCost: round(result.systemCost || 0, 0),
        paybackYears: payback,
        firstYearGrossSavings: round(result.firstYearGrossSavings || 0, 0),
        tenYearNetSavings: round(result.tenYearNetSavings || 0, 0),
        panelCount: result.panelCount || 0,
        roofAreaSqm: result.roofAreaSqm || 0,
        suggestedInverterKw: result.suggestedInverterKw || 0,
        suggestedBatteryUsableKwh: result.suggestedBatteryUsableKwh || 0,
      },
      formatted: {
        monthlyGeneratorCost: formatMoney(generatorSpend, countryData),
        annualFuelExposure: formatMoney(annualFuelExposure, countryData),
        systemCost: formatMoney(result.systemCost || 0, countryData),
        payback: formatYears(payback),
        tenYearNetSavings: formatMoney(result.tenYearNetSavings || 0, countryData),
      },
      decision: decision,
      installerQuestions: questions,
      risks: risks,
      sourceState: sourceState,
      warning: "Planning estimate only; final tariffs, fuel prices, quotes, site conditions, and installer design may differ.",
      solarPrefillInputs: Object.assign({}, normalized, {
        mode: "solar",
        monthlyBill: normalized.monthlyBill,
        monthlyGeneratorSpend: generatorSpend,
        backupHours: outage,
        outageHours: outage,
        loadSizeKw: standardSystemKw(loadKw),
        systemKW: standardSystemKw(loadKw),
        fuelPrice: assumption(countryData, "fuelPrice", null),
      }),
      generatorPrefillInputs: Object.assign({}, normalized, {
        mode: "generator",
        monthlyGeneratorSpend: generatorSpend,
        generatorHoursPerDay: normalized.generatorHoursPerDay,
        generatorSizeKva: normalized.generatorSizeKva,
        fuelType: normalized.fuelType || "petrol",
      }),
      solarRoute: normalized.countrySlug || normalized.country ? (countryData.slug ? "/tools/solar-roi/" + countryData.slug + "/" : "/tools/solar-roi/") : "/tools/solar-roi/",
      generatorRoute: "/tools/fuel-tracker/#generator-cost",
      generatorFuelRoute: generatorFuelRoute(countryData),
      decisionBriefText: briefLines.join("\n"),
    };
  }

  function goalSummary(inputs) {
    var parts = [];
    if (inputs.userType) parts.push(inputs.userType);
    if (inputs.city || inputs.country) parts.push("in " + [inputs.city, inputs.country].filter(Boolean).join(", "));
    if (inputs.monthlyBill !== null) parts.push("monthly bill " + inputs.monthlyBill);
    if (inputs.generatorHoursPerDay !== null) parts.push(inputs.generatorHoursPerDay + " generator hours/day");
    return parts.length ? "Assess solar and backup power for " + parts.join(" with ") + "." : "Assess solar and generator exposure with editable planning assumptions.";
  }

  function listHtml(items) {
    return "<ul>" + (items || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>";
  }

  function sourceHtml(sourceState) {
    return [
      ["Tariff", sourceState.tariff],
      ["Fuel", sourceState.fuel],
      ["Solar yield", sourceState.solarYield],
    ].map(function (row) {
      return "<li><strong>" + escapeHtml(row[0]) + ":</strong> " + escapeHtml(row[1].label) + " - " + escapeHtml(row[1].confidence) + " confidence - reviewed " + escapeHtml(row[1].freshness) + "</li>";
    }).join("");
  }

  function renderEnergyPanel(plan) {
    if (!plan) return "";
    return '<section class="ai-energy-plan" data-energy-advisor>' +
      '<div class="ai-energy-head"><div><span class="ai-panel-eyebrow">Solar and generator advisor</span><h4>' + escapeHtml(plan.decision.headline) + '</h4><p>' + escapeHtml(plan.goalSummary) + '</p></div><span class="ai-chip">' + escapeHtml(plan.countryData.countryName) + '</span></div>' +
      '<div class="ai-energy-metrics">' +
      '<div><span>Monthly generator cost</span><strong>' + escapeHtml(plan.formatted.monthlyGeneratorCost) + '</strong></div>' +
      '<div><span>Annual fuel exposure</span><strong>' + escapeHtml(plan.formatted.annualFuelExposure) + '</strong></div>' +
      '<div><span>Rough solar size</span><strong>' + escapeHtml(plan.estimates.roughSystemKw) + ' kW</strong></div>' +
      '<div><span>Payback estimate</span><strong>' + escapeHtml(plan.formatted.payback) + '</strong></div>' +
      '</div>' +
      '<div class="ai-energy-grid">' +
      '<div><strong>Why this match fits</strong>' + listHtml(plan.decision.reasons && plan.decision.reasons.length ? plan.decision.reasons : ["Solar ROI and generator-cost tools can compare bill relief, fuel exposure, backup hours, and quote assumptions."]) + '</div>' +
      '<div><strong>Questions to ask installer</strong>' + listHtml(plan.installerQuestions.slice(0, 4)) + '</div>' +
      '<div><strong>Risks to check</strong>' + listHtml(plan.risks) + '</div>' +
      '<div><strong>Source and confidence</strong><ul>' + sourceHtml(plan.sourceState) + '</ul><p>' + escapeHtml(plan.warning) + '</p></div>' +
      '</div>' +
      '<div class="ai-energy-actions">' +
      '<a class="ai-small-button primary" href="' + escapeHtml(plan.solarRoute) + '" data-energy-solar-link>Open Solar ROI with prefill</a>' +
      '<a class="ai-small-button" href="' + escapeHtml(plan.generatorRoute) + '" data-energy-generator-link>Open AfroFuel with prefill</a>' +
      '<a class="ai-small-button" href="' + escapeHtml(plan.generatorFuelRoute) + '">Open generator calculator</a>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="pdf" data-workflow-export-kind="energy" aria-label="Export energy advisor PDF brief">PDF brief</button>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="copy" data-workflow-export-kind="energy" aria-label="Copy energy advisor checklist">Copy checklist</button>' +
      '<a class="ai-small-button secondary" href="#" data-workflow-export="whatsapp" data-workflow-export-kind="energy" aria-label="Open WhatsApp-friendly energy advisor summary">WhatsApp summary</a>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="json" data-workflow-export-kind="energy" aria-label="Download energy advisor JSON report">JSON</button>' +
      '<a class="ai-small-button secondary" href="#" data-workflow-export="email" data-workflow-export-kind="energy" aria-label="Create email-ready energy advisor text">Email text</a>' +
      '<button class="ai-small-button secondary" type="button" data-energy-brief-download aria-label="Download energy advisor text brief">Download text brief</button>' +
      '<button class="ai-small-button secondary" type="button" data-energy-ai-brief aria-label="Use AI to improve energy decision brief after consent">Use AI to improve brief</button>' +
      '<span class="ai-panel-status" data-energy-brief-status data-workflow-export-status></span>' +
      '</div>' +
      '</section>';
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildAdvisorPlan: buildAdvisorPlan,
    renderEnergyPanel: renderEnergyPanel,
  };
});
