/**
 * Ask AfroTools AI prefill adapters.
 *
 * Converts a validated routing decision into a short-lived browser payload.
 * Launch URLs must never contain extracted private or financial values.
 *
 * ToolPrefillAdapter contract:
 * - supports(toolId)
 * - normalizeInputs(extractedInputs)
 * - validateInputs(normalizedInputs)
 * - toSafeLaunchPayload(normalizedInputs)
 * - getMissingInputs(normalizedInputs)
 * - getUserFacingSummary(normalizedInputs)
 */
(function initPrefillAdapters(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIPrefillAdapters = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createPrefillAdapters() {
  "use strict";

  var PREFILL_STORAGE_KEY = "afrotools.aiPrefillDraft";
  var PREFILL_TTL_MS = 20 * 60 * 1000;
  var PAY_PERIODS = ["monthly", "annual", "weekly", "daily"];
  var SME_COUNTRY_META = {
    nigeria: { country: "Nigeria", code: "NG", currency: "NGN", payeRoute: "/nigeria/ng-salary-tax", vatRate: 7.5 },
    ng: { country: "Nigeria", code: "NG", currency: "NGN", payeRoute: "/nigeria/ng-salary-tax", vatRate: 7.5 },
    lagos: { country: "Nigeria", code: "NG", currency: "NGN", payeRoute: "/nigeria/ng-salary-tax", vatRate: 7.5 },
    kenya: { country: "Kenya", code: "KE", currency: "KES", payeRoute: "/kenya/ke-paye", vatRate: 16 },
    ke: { country: "Kenya", code: "KE", currency: "KES", payeRoute: "/kenya/ke-paye", vatRate: 16 },
    nairobi: { country: "Kenya", code: "KE", currency: "KES", payeRoute: "/kenya/ke-paye", vatRate: 16 },
    ghana: { country: "Ghana", code: "GH", currency: "GHS", payeRoute: "/ghana/gh-paye", vatRate: 20 },
    gh: { country: "Ghana", code: "GH", currency: "GHS", payeRoute: "/ghana/gh-paye", vatRate: 20 },
    accra: { country: "Ghana", code: "GH", currency: "GHS", payeRoute: "/ghana/gh-paye", vatRate: 20 },
    "south africa": { country: "South Africa", code: "ZA", currency: "ZAR", payeRoute: "/south-africa/za-paye", vatRate: 15 },
    za: { country: "South Africa", code: "ZA", currency: "ZAR", payeRoute: "/south-africa/za-paye", vatRate: 15 },
    johannesburg: { country: "South Africa", code: "ZA", currency: "ZAR", payeRoute: "/south-africa/za-paye", vatRate: 15 },
    joburg: { country: "South Africa", code: "ZA", currency: "ZAR", payeRoute: "/south-africa/za-paye", vatRate: 15 },
    angola: { country: "Angola", code: "AO", currency: "AOA", payeRoute: "/angola/ao-paye", vatRate: 14 },
    angoa: { country: "Angola", code: "AO", currency: "AOA", payeRoute: "/angola/ao-paye", vatRate: 14 },
    ao: { country: "Angola", code: "AO", currency: "AOA", payeRoute: "/angola/ao-paye", vatRate: 14 },
    luanda: { country: "Angola", code: "AO", currency: "AOA", payeRoute: "/angola/ao-paye", vatRate: 14 },
  };

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return text(value).toLowerCase();
  }

  function number(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var cleaned = String(value).replace(/[, ]/g, "");
    var match = cleaned.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    var parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positiveNumber(value) {
    var parsed = number(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
  }

  function array(value) {
    if (Array.isArray(value)) return value.map(text).filter(Boolean);
    if (typeof value === "string") {
      return value.split(/[,;]/).map(text).filter(Boolean);
    }
    return [];
  }

  function firstValue(inputs, names) {
    var source = inputs || {};
    for (var i = 0; i < names.length; i += 1) {
      var value = source[names[i]];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  }

  function countryMeta(countryValue, codeValue) {
    var raw = lower(countryValue || codeValue);
    var code = lower(codeValue);
    if (SME_COUNTRY_META[raw]) return SME_COUNTRY_META[raw];
    if (SME_COUNTRY_META[code]) return SME_COUNTRY_META[code];
    var keys = Object.keys(SME_COUNTRY_META);
    for (var i = 0; i < keys.length; i += 1) {
      var meta = SME_COUNTRY_META[keys[i]];
      if (lower(meta.country) === raw || lower(meta.code) === raw || lower(meta.code) === code) return meta;
    }
    return {};
  }

  function currency(value, fallback) {
    var clean = text(value || fallback || "").toUpperCase();
    if (!clean) return "";
    var aliases = {
      NAIRA: "NGN",
      NIGERIANNAIRA: "NGN",
      DOLLARS: "USD",
      DOLLAR: "USD",
      USD: "USD",
      KES: "KES",
      GHS: "GHS",
      ZAR: "ZAR",
      AOA: "AOA",
      KWANZA: "AOA",
      KWANZAS: "AOA",
      KZ: "AOA",
      NGN: "NGN",
      XAF: "XAF",
      XOF: "XOF",
    };
    return aliases[clean.replace(/[^A-Z]/g, "")] || clean.slice(0, 3);
  }

  function studyLevel(value) {
    var clean = lower(value);
    if (!clean) return "";
    if (clean.indexOf("phd") !== -1 || clean.indexOf("doctor") !== -1) return "phd";
    if (clean.indexOf("master") !== -1 || clean.indexOf("mba") !== -1) return "masters";
    if (clean.indexOf("bachelor") !== -1 || clean.indexOf("undergrad") !== -1) return "undergrad";
    if (clean.indexOf("diploma") !== -1) return "diploma";
    return clean;
  }

  function payPeriod(value) {
    var clean = lower(value);
    if (!clean) return "";
    if (clean.indexOf("year") !== -1 || clean.indexOf("annual") !== -1) return "annual";
    if (clean.indexOf("week") !== -1) return "weekly";
    if (clean.indexOf("day") !== -1) return "daily";
    if (clean.indexOf("month") !== -1) return "monthly";
    return PAY_PERIODS.indexOf(clean) !== -1 ? clean : "";
  }

  function pdfAction(value) {
    var clean = lower(value);
    if (!clean) return "";
    if (clean.indexOf("page number") !== -1 || clean.indexOf("number pages") !== -1) return "page_numbers";
    if (clean.indexOf("merge") !== -1 || clean.indexOf("combine") !== -1) return "merge";
    if (clean.indexOf("compress") !== -1 || clean.indexOf("reduce") !== -1) return "compress";
    if (clean.indexOf("convert") !== -1 || clean.indexOf("image") !== -1 || clean.indexOf("word") !== -1) return "convert";
    if (clean.indexOf("split") !== -1 || clean.indexOf("extract") !== -1) return "split";
    if (clean.indexOf("sign") !== -1 || clean.indexOf("signature") !== -1) return "sign";
    if (clean.indexOf("protect") !== -1 || clean.indexOf("password") !== -1 || clean.indexOf("lock") !== -1 || clean.indexOf("encrypt") !== -1) return "protect";
    if (clean.indexOf("watermark") !== -1) return "watermark";
    if (clean.indexOf("organize") !== -1 || clean.indexOf("reorder") !== -1 || clean.indexOf("page") !== -1) return "organize";
    return clean;
  }

  function scholarshipField(value) {
    var clean = lower(value);
    if (!clean) return "";
    if (/\b(stem|engineering|engineer|computer|software|data|science|technology|tech)\b/.test(clean)) return "stem";
    if (/\b(business|economics|finance|accounting|management|commerce)\b/.test(clean)) return "business";
    if (/\b(health|medicine|medical|nursing|public health|pharmacy)\b/.test(clean)) return "health";
    if (/\b(law|legal|governance|public policy)\b/.test(clean)) return "law";
    if (/\b(art|arts|humanities|social science|literature|media)\b/.test(clean)) return "arts";
    if (/\b(agric|agriculture|environment|climate|sustainability)\b/.test(clean)) return "agric";
    return clean;
  }

  function scholarshipDestination(value) {
    var clean = lower(value);
    if (!clean) return "";
    var aliases = {
      uk: "uk",
      "united kingdom": "uk",
      britain: "uk",
      england: "uk",
      us: "us",
      usa: "us",
      "u.s.": "us",
      "united states": "us",
      america: "us",
      canada: "canada",
      australia: "australia",
      europe: "eu",
      eu: "eu",
      germany: "eu",
      france: "eu",
      netherlands: "eu",
      africa: "africa",
      "within africa": "africa",
      global: "global",
      worldwide: "global",
    };
    return aliases[clean] || clean;
  }

  function missing(normalized, fields) {
    return fields.filter(function isMissing(name) {
      var value = normalized ? normalized[name] : null;
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === "";
    });
  }

  function validateNumbers(normalized, fields) {
    var errors = [];
    fields.forEach(function validateField(name) {
      if (normalized[name] !== null && normalized[name] !== undefined && normalized[name] !== "" && !Number.isFinite(Number(normalized[name]))) {
        errors.push(name + " must be a valid number");
      }
      if (Number(normalized[name]) < 0) errors.push(name + " cannot be negative");
    });
    return errors;
  }

  function makeValidation(errors) {
    return { valid: errors.length === 0, errors: errors };
  }

  function appendLaunchParams(route) {
    var raw = text(route) || "/tools/";
    var hashIndex = raw.indexOf("#");
    var hash = hashIndex === -1 ? "" : raw.slice(hashIndex);
    var base = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    var queryIndex = base.indexOf("?");
    var path = queryIndex === -1 ? base : base.slice(0, queryIndex);
    var query = queryIndex === -1 ? "" : base.slice(queryIndex + 1);
    var params = query ? query.split("&").filter(function keepParam(pair) {
      var key = pair.split("=")[0] || "";
      try { key = decodeURIComponent(key); } catch (err) {}
      key = key.toLowerCase();
      return key !== "source" && key !== "prefill";
    }) : [];
    params.push("source=ask", "prefill=1");
    return path + "?" + params.join("&") + hash;
  }

  function summaryList(items) {
    return items.filter(Boolean).join("; ");
  }

  function createPayload(adapter, normalized) {
    var now = Date.now();
    return {
      version: 1,
      type: "afrotools_ai_prefill",
      adapterId: adapter.id,
      toolId: adapter.primaryToolId,
      route: adapter.routeFor(normalized),
      createdAt: now,
      expiresAt: now + PREFILL_TTL_MS,
      storage: "sessionStorage",
      privacyNote: adapter.privacyNote,
      normalizedInputs: normalized,
      missingInputs: adapter.getMissingInputs(normalized),
      userFacingSummary: adapter.getUserFacingSummary(normalized),
    };
  }

  function createAdapter(config) {
    return {
      id: config.id,
      primaryToolId: config.primaryToolId,
      aliases: config.aliases || [],
      privacyNote: config.privacyNote || "Prefill data is stored briefly in this browser session and is not placed in the URL.",
      supports: function supports(toolId) {
        var id = text(toolId);
        return id === config.primaryToolId || this.aliases.indexOf(id) !== -1;
      },
      normalizeInputs: config.normalizeInputs,
      validateInputs: config.validateInputs,
      getMissingInputs: config.getMissingInputs,
      getUserFacingSummary: config.getUserFacingSummary,
      routeFor: config.routeFor || function routeFor() {
        return config.route;
      },
      toSafeLaunchPayload: function toSafeLaunchPayload(normalizedInputs) {
        return createPayload(this, normalizedInputs || {});
      },
    };
  }

  var cvBuilderAdapter = createAdapter({
    id: "cv-builder-prefill",
    primaryToolId: "cv-builder",
    aliases: ["cv-jobs", "resume-builder"],
    route: "/tools/cv-builder/",
    privacyNote: "CV details are stored only in this browser session. Do not send full CV text to AI unless you explicitly choose an AI action.",
    normalizeInputs: function normalizeCv(inputs) {
      return {
        country: text(firstValue(inputs, ["country", "market"])),
        targetRole: text(firstValue(inputs, ["targetRole", "role", "jobTitle"])),
        careerStage: text(firstValue(inputs, ["careerStage", "stage"])),
        experienceYears: positiveNumber(firstValue(inputs, ["experienceYears", "yearsExperience", "yearsOfExperience"])),
        experienceLevel: text(firstValue(inputs, ["experienceLevel", "seniority"])),
        sector: text(firstValue(inputs, ["sector", "industry"])),
        industry: text(firstValue(inputs, ["industry", "sector"])),
        skills: array(firstValue(inputs, ["skills", "keywords"])),
        education: text(firstValue(inputs, ["education", "qualification", "degree"])),
        languagePreference: text(firstValue(inputs, ["languagePreference", "language", "locale"])),
        templateId: text(firstValue(inputs, ["templateId", "template"])),
        starterId: text(firstValue(inputs, ["starterId", "starterPath"])),
        starterProfile: firstValue(inputs, ["starterProfile", "profileStarter"]) || null,
      };
    },
    validateInputs: function validateCv(normalized) {
      var errors = validateNumbers(normalized, ["experienceYears"]);
      if (normalized.targetRole && normalized.targetRole.length > 100) errors.push("targetRole is too long");
      if (normalized.country && normalized.country.length > 80) errors.push("country is too long");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingCv(normalized) {
      return missing(normalized, ["targetRole", "country"]);
    },
    getUserFacingSummary: function summarizeCv(normalized) {
      return summaryList([
        normalized.targetRole ? "CV target role: " + normalized.targetRole : "",
        normalized.country ? "Market: " + normalized.country : "",
        normalized.careerStage ? "Career stage: " + normalized.careerStage : "",
        normalized.experienceYears !== null ? "Experience: " + normalized.experienceYears + " years" : "",
        normalized.experienceLevel ? "Experience: " + normalized.experienceLevel : "",
        normalized.sector ? "Sector: " + normalized.sector : "",
        normalized.templateId ? "Suggested template: " + normalized.templateId : "",
        normalized.starterId ? "Starter path: " + normalized.starterId : "",
      ]) || "Open CV Builder and choose a template.";
    },
  });

  var scholarshipAdapter = createAdapter({
    id: "scholarship-finder-prefill",
    primaryToolId: "scholarship-finder",
    aliases: ["scholarships", "scholarship"],
    route: "/tools/scholarship-finder/",
    normalizeInputs: function normalizeScholarship(inputs) {
      return {
        country: text(firstValue(inputs, ["country", "homeCountry", "originCountry", "nationality"])),
        studyLevel: studyLevel(firstValue(inputs, ["studyLevel", "level"])),
        field: scholarshipField(firstValue(inputs, ["field", "course", "discipline"])),
        targetCountry: scholarshipDestination(firstValue(inputs, ["targetCountry", "destinationCountry", "destination"])),
        gpa: positiveNumber(firstValue(inputs, ["gpa", "gradePointAverage", "score"])),
        budget: positiveNumber(firstValue(inputs, ["budget", "availableBudget"])),
      };
    },
    validateInputs: function validateScholarship(normalized) {
      return makeValidation(validateNumbers(normalized, ["budget", "gpa"]));
    },
    getMissingInputs: function getMissingScholarship(normalized) {
      return missing(normalized, ["country", "studyLevel"]);
    },
    getUserFacingSummary: function summarizeScholarship(normalized) {
      return summaryList([
        normalized.country ? "Home country: " + normalized.country : "",
        normalized.studyLevel ? "Level: " + normalized.studyLevel : "",
        normalized.targetCountry ? "Destination: " + normalized.targetCountry : "",
        normalized.field ? "Field: " + normalized.field : "",
        normalized.gpa !== null ? "GPA/score captured for local prefill" : "",
      ]) || "Open Scholarship Finder and add a student profile.";
    },
  });

  var studyAbroadAdapter = createAdapter({
    id: "study-abroad-cost-prefill",
    primaryToolId: "study-abroad-cost",
    aliases: ["education-planner", "study-abroad", "study-plan", "study-abroad-planner"],
    route: "/tools/study-abroad-cost/",
    privacyNote: "Study-abroad prefill is stored briefly in this browser session. Budget and profile details stay out of the URL.",
    normalizeInputs: function normalizeStudyAbroad(inputs) {
      return {
        country: text(firstValue(inputs, ["country", "homeCountry", "originCountry", "nationality"])),
        originCountry: text(firstValue(inputs, ["originCountry", "homeCountry", "country", "nationality"])),
        targetCountry: text(firstValue(inputs, ["targetCountry", "destinationCountry", "destination"])),
        studyLevel: studyLevel(firstValue(inputs, ["studyLevel", "level"])),
        field: scholarshipField(firstValue(inputs, ["field", "course", "discipline"])),
        gpa: positiveNumber(firstValue(inputs, ["gpa", "gradePointAverage", "score"])),
        gradeBand: text(firstValue(inputs, ["gradeBand", "grade", "academicRecord"])),
        ieltsScore: positiveNumber(firstValue(inputs, ["ieltsScore", "ielts", "englishScore"])),
        budget: positiveNumber(firstValue(inputs, ["budget", "budgetAmount", "availableBudget"])),
        budgetAmount: positiveNumber(firstValue(inputs, ["budgetAmount", "budget", "availableBudget"])),
        currency: currency(firstValue(inputs, ["currency", "budgetCurrency"]), "USD"),
        intakeTimeline: text(firstValue(inputs, ["intakeTimeline", "intake", "timeline"])),
      };
    },
    validateInputs: function validateStudyAbroad(normalized) {
      return makeValidation(validateNumbers(normalized, ["budget", "budgetAmount", "gpa", "ieltsScore"]));
    },
    getMissingInputs: function getMissingStudyAbroad(normalized) {
      var missingFields = missing(normalized, ["country", "targetCountry", "studyLevel"]);
      if (!normalized.budget && normalized.budget !== 0) missingFields.push("budget");
      return missingFields;
    },
    getUserFacingSummary: function summarizeStudyAbroad(normalized) {
      return summaryList([
        normalized.country ? "Origin: " + normalized.country : "",
        normalized.targetCountry ? "Destination: " + normalized.targetCountry : "",
        normalized.studyLevel ? "Level: " + normalized.studyLevel : "",
        normalized.field ? "Field: " + normalized.field : "",
        normalized.budget !== null ? "Budget captured for local prefill" : "",
        normalized.intakeTimeline ? "Intake: " + normalized.intakeTimeline : "",
      ]) || "Open Study Abroad Cost Planner and add route details.";
    },
  });

  var importDutyAdapter = createAdapter({
    id: "import-duty-prefill",
    primaryToolId: "import-duty",
    aliases: ["vehicle-import"],
    route: "/tools/import-duty/",
    privacyNote: "Import prefill is stored briefly in this browser session. Item values stay out of the URL.",
    normalizeInputs: function normalizeImport(inputs) {
      var productCategory = lower(firstValue(inputs, ["productCategory", "goodsCategory", "category"]));
      var itemCategory = text(firstValue(inputs, ["itemCategory", "vehicle", "item", "goodsCategory", "productName"]));
      var vehicleMake = text(firstValue(inputs, ["make", "vehicleMake"]));
      var vehicleModel = text(firstValue(inputs, ["model", "vehicleModel"]));
      var vehicleFromCategory = itemCategory.match(/^(toyota|honda|mazda|nissan|hyundai|kia|lexus|bmw|mercedes|ford|volkswagen|vw)\s+(.+)$/i);
      if (vehicleFromCategory) {
        if (!vehicleMake) vehicleMake = vehicleFromCategory[1];
        if (!vehicleModel && !/^(?:vehicle|car|auto|automobile)$/i.test(vehicleFromCategory[2])) vehicleModel = vehicleFromCategory[2];
      }
      var itemValue = positiveNumber(firstValue(inputs, ["itemValue", "value", "purchasePrice", "purchasePriceUsd", "budget", "cifValue", "cifUsd", "fobValue"]));
      var shippingCost = positiveNumber(firstValue(inputs, ["shippingCost", "freight", "freightUsd", "shipping", "shippingUsd"]));
      var insuranceCost = positiveNumber(firstValue(inputs, ["insuranceCost", "insurance", "insuranceUsd"]));
      var engineCc = positiveNumber(firstValue(inputs, ["engineCc", "engineSize", "engineSizeCc"]));
      var fxRate = positiveNumber(firstValue(inputs, ["fxRate", "userFxRate", "exchangeRate"]));
      var mode = lower(firstValue(inputs, ["mode", "importMode"]));
      if (!mode && (productCategory === "vehicle" || vehicleMake || vehicleModel || /\b(toyota|honda|mazda|nissan|hyundai|kia|lexus|bmw|mercedes|ford)\b/i.test(itemCategory))) {
        mode = "car";
      }
      if (!productCategory && (mode === "car" || mode === "vehicle")) productCategory = "vehicle";
      return {
        mode: mode === "car" || mode === "vehicle" ? "car" : "goods",
        destinationCountry: text(firstValue(inputs, ["destinationCountry", "country"])),
        productCategory: productCategory || "other",
        itemCategory: itemCategory || summaryList([vehicleMake, vehicleModel]),
        itemValue: itemValue,
        purchasePrice: itemValue,
        currency: currency(firstValue(inputs, ["currency", "itemCurrency", "purchaseCurrency"]), ""),
        year: text(firstValue(inputs, ["year", "vehicleYear"])),
        make: vehicleMake,
        model: vehicleModel,
        vehicleType: lower(firstValue(inputs, ["vehicleType", "bodyType"])) || "",
        engineCc: engineCc,
        shippingCost: shippingCost,
        insuranceCost: insuranceCost,
        originCountry: text(firstValue(inputs, ["originCountry", "origin", "sourceCountry"])),
        port: lower(firstValue(inputs, ["port", "arrivalPort", "destinationPort"])),
        fxRate: fxRate,
      };
    },
    validateInputs: function validateImport(normalized) {
      var errors = validateNumbers(normalized, ["itemValue", "purchasePrice", "engineCc", "shippingCost", "insuranceCost", "fxRate"]);
      if (normalized.year && !/^(19[8-9]\d|20[0-3]\d)$/.test(String(normalized.year))) errors.push("year is outside the supported vehicle range");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingImport(normalized) {
      return missing(normalized, ["destinationCountry", "itemCategory", "purchasePrice", "shippingCost", "fxRate"]);
    },
    getUserFacingSummary: function summarizeImport(normalized) {
      return summaryList([
        normalized.destinationCountry ? "Destination: " + normalized.destinationCountry : "",
        normalized.productCategory ? "Category: " + normalized.productCategory : "",
        normalized.itemCategory ? "Item: " + normalized.itemCategory : "",
        normalized.year ? "Year: " + normalized.year : "",
        normalized.engineCc !== null ? "Engine: " + normalized.engineCc + " cc" : "",
        normalized.itemValue !== null ? "Value captured for local prefill" : "",
        normalized.shippingCost !== null ? "Shipping captured for local prefill" : "",
        normalized.insuranceCost !== null ? "Insurance captured for local prefill" : "",
        normalized.fxRate !== null ? "FX rate captured for local prefill" : "",
        normalized.originCountry ? "Origin: " + normalized.originCountry : "",
        normalized.port ? "Arrival: " + normalized.port : "",
      ]) || "Open Import Duty Calculator and add item details.";
    },
  });

  function importCountryCode(country) {
    var clean = lower(country);
    var aliases = {
      nigeria: "NG",
      ng: "NG",
      ghana: "GH",
      gh: "GH",
      kenya: "KE",
      ke: "KE",
      uganda: "UG",
      ug: "UG",
      zambia: "ZM",
      zm: "ZM",
      tanzania: "TZ",
      tz: "TZ",
    };
    return aliases[clean] || "";
  }

  function sourceMarketSlug(originCountry) {
    var clean = lower(originCountry);
    if (!clean) return "";
    if (clean.indexOf("japan") !== -1) return "japan";
    if (clean.indexOf("uae") !== -1 || clean.indexOf("dubai") !== -1 || clean.indexOf("emirates") !== -1) return "uae";
    if (clean.indexOf("uk") !== -1 || clean.indexOf("united kingdom") !== -1) return "uk";
    if (clean.indexOf("south africa") !== -1) return "south-africa";
    if (clean.indexOf("local") !== -1) return "local-dealer";
    return "";
  }

  function carImportRoute(normalized) {
    var country = importCountryCode(normalized.destinationCountry || normalized.countryCode);
    var routes = {
      NG: "/tools/car-import-cost/nigeria/",
      KE: "/tools/car-import-cost/kenya/",
      GH: "/tools/car-import-cost/ghana/",
      UG: "/tools/car-import-cost/uganda/",
      ZM: "/tools/car-import-cost/zambia/",
      TZ: "/tools/car-import-cost/tanzania/",
    };
    return routes[country] || "/tools/car-import-cost/";
  }

  var carImportCostAdapter = createAdapter({
    id: "car-import-cost-prefill",
    primaryToolId: "car-import-cost",
    aliases: ["car-import", "vehicle-import-cost", "car-import-workspace"],
    route: "/tools/car-import-cost/",
    privacyNote: "Car import prefill is stored briefly in this browser session. Vehicle value, freight, insurance, and FX stay out of the URL.",
    normalizeInputs: function normalizeCarImport(inputs) {
      var base = importDutyAdapter.normalizeInputs(inputs || {});
      var countryCode = importCountryCode(base.destinationCountry);
      return Object.assign({}, base, {
        mode: "car",
        productCategory: "vehicle",
        countryCode: countryCode,
        sourceMarket: sourceMarketSlug(base.originCountry) || "japan",
        inputMode: base.purchasePrice !== null ? "purchase" : "make-model-year",
        outputMode: "practical",
        bodyType: base.vehicleType || "",
        purchasePriceUsd: base.purchasePrice,
        freightUsd: base.shippingCost,
        insuranceUsd: base.insuranceCost,
        portCode: base.port,
      });
    },
    validateInputs: function validateCarImport(normalized) {
      var errors = validateNumbers(normalized, ["itemValue", "purchasePrice", "purchasePriceUsd", "engineCc", "shippingCost", "freightUsd", "insuranceCost", "insuranceUsd", "fxRate"]);
      if (normalized.year && !/^(19[8-9]\d|20[0-3]\d)$/.test(String(normalized.year))) errors.push("year is outside the supported vehicle range");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingCarImport(normalized) {
      return missing(normalized, ["destinationCountry", "itemCategory", "purchasePrice", "shippingCost", "fxRate"]);
    },
    getUserFacingSummary: function summarizeCarImport(normalized) {
      return summaryList([
        normalized.destinationCountry ? "Destination: " + normalized.destinationCountry : "",
        normalized.itemCategory ? "Vehicle: " + normalized.itemCategory : "",
        normalized.year ? "Year: " + normalized.year : "",
        normalized.engineCc !== null ? "Engine: " + normalized.engineCc + " cc" : "",
        normalized.purchasePrice !== null ? "Purchase price captured for local prefill" : "",
        normalized.shippingCost !== null ? "Shipping captured for local prefill" : "",
        normalized.insuranceCost !== null ? "Insurance captured for local prefill" : "",
        normalized.fxRate !== null ? "FX rate captured for planning context" : "",
        normalized.originCountry ? "Source market: " + normalized.originCountry : "",
        normalized.port ? "Arrival: " + normalized.port : "",
      ]) || "Open Car Import Cost and add vehicle details.";
    },
    routeFor: carImportRoute,
  });

  var energyAdapter = createAdapter({
    id: "energy-prefill",
    primaryToolId: "solar-roi",
    aliases: ["solar-energy", "fuel-tracker", "generator-cost", "generator-fuel"],
    route: "/tools/solar-roi/",
    normalizeInputs: function normalizeEnergy(inputs) {
      var fuelType = lower(firstValue(inputs, ["fuelType", "fuel"]));
      var generatorHours = positiveNumber(firstValue(inputs, ["generatorHoursPerDay", "generatorHours", "hoursPerDay"]));
      var generatorSize = positiveNumber(firstValue(inputs, ["generatorSizeKva", "generatorSize", "kva"]));
      var monthlyBill = positiveNumber(firstValue(inputs, ["monthlyBill", "powerBill", "budget", "electricityBill"]));
      var monthlyGeneratorSpend = positiveNumber(firstValue(inputs, ["monthlyGeneratorSpend", "generatorSpend", "fuelSpend"]));
      var loadSizeKw = positiveNumber(firstValue(inputs, ["loadSizeKw", "loadSize", "systemKW", "systemSizeKw"]));
      var outageHours = positiveNumber(firstValue(inputs, ["outageHours", "backupHours", "backupHoursPerDay"]));
      var budgetAmount = positiveNumber(firstValue(inputs, ["budgetAmount", "budgetRange", "budget"]));
      var mode = lower(firstValue(inputs, ["mode", "energyMode"]));
      if (!mode && (fuelType || generatorHours !== null || generatorSize !== null) && monthlyBill === null) mode = "generator";
      return {
        mode: mode === "generator" || mode === "fuel" ? "generator" : "solar",
        country: text(firstValue(inputs, ["country"])),
        countryCode: text(firstValue(inputs, ["countryCode"])),
        countrySlug: text(firstValue(inputs, ["countrySlug"])),
        city: text(firstValue(inputs, ["city", "location"])),
        userType: lower(firstValue(inputs, ["userType", "customerType"])),
        monthlyBill: monthlyBill,
        monthlyGeneratorSpend: monthlyGeneratorSpend,
        loadSizeKw: loadSizeKw,
        backupHours: outageHours,
        outageHours: outageHours,
        budgetAmount: budgetAmount,
        currency: currency(firstValue(inputs, ["currency"]), ""),
        fuelPrice: positiveNumber(firstValue(inputs, ["fuelPrice", "fuelPricePerLitre"])),
        fuelType: fuelType,
        generatorHoursPerDay: generatorHours,
        generatorSizeKva: generatorSize,
      };
    },
    validateInputs: function validateEnergy(normalized) {
      return makeValidation(validateNumbers(normalized, ["monthlyBill", "monthlyGeneratorSpend", "loadSizeKw", "backupHours", "outageHours", "budgetAmount", "fuelPrice", "generatorHoursPerDay", "generatorSizeKva"]));
    },
    getMissingInputs: function getMissingEnergy(normalized) {
      if (normalized.mode === "generator") return missing(normalized, ["country"]);
      var required = ["country"];
      if (normalized.monthlyBill === null && normalized.monthlyGeneratorSpend === null) required.push("monthlyBill");
      if (normalized.loadSizeKw === null && normalized.generatorSizeKva === null) required.push("loadSizeKw");
      return missing(normalized, required);
    },
    getUserFacingSummary: function summarizeEnergy(normalized) {
      return summaryList([
        normalized.mode === "generator" ? "Generator/fuel workflow" : "Solar ROI workflow",
        normalized.country ? "Country: " + normalized.country : "",
        normalized.city ? "City: " + normalized.city : "",
        normalized.userType ? "Use case: " + normalized.userType : "",
        normalized.monthlyBill !== null ? "Monthly spend captured for local prefill" : "",
        normalized.monthlyGeneratorSpend !== null ? "Generator spend captured for local prefill" : "",
        normalized.loadSizeKw !== null ? "Load/system size: " + normalized.loadSizeKw + " kW" : "",
        normalized.backupHours !== null ? "Backup target: " + normalized.backupHours + " hours" : "",
        normalized.generatorHoursPerDay !== null ? "Generator use: " + normalized.generatorHoursPerDay + " hours/day" : "",
      ]);
    },
    routeFor: function routeForEnergy(normalized) {
      if (normalized && normalized.mode === "generator") return "/tools/fuel-tracker/#generator-cost";
      return normalized && normalized.countrySlug ? "/tools/solar-roi/" + normalized.countrySlug + "/" : "/tools/solar-roi/";
    },
  });

  var invoiceAdapter = createAdapter({
    id: "invoice-generator-prefill",
    primaryToolId: "invoice-generator",
    aliases: ["invoice", "business-invoice"],
    route: "/tools/invoice-generator/",
    privacyNote: "Invoice prefill is stored briefly in this browser session. Client names and amounts stay out of the URL.",
    normalizeInputs: function normalizeInvoice(inputs) {
      var meta = countryMeta(firstValue(inputs, ["country"]), firstValue(inputs, ["countryCode"]));
      return {
        clientName: text(firstValue(inputs, ["clientName", "client", "customerName"])),
        clientCompany: text(firstValue(inputs, ["clientCompany", "company"])),
        country: meta.country || text(firstValue(inputs, ["country"])),
        countryCode: meta.code || text(firstValue(inputs, ["countryCode"])),
        currency: currency(firstValue(inputs, ["currency"]), meta.currency || ""),
        amount: positiveNumber(firstValue(inputs, ["amount", "invoiceAmount", "itemValue", "total", "budget"])),
        taxRate: positiveNumber(firstValue(inputs, ["taxRate", "vatRate"])) !== null ? positiveNumber(firstValue(inputs, ["taxRate", "vatRate"])) : (meta.vatRate !== undefined ? meta.vatRate : null),
        vatTreatment: text(firstValue(inputs, ["vatTreatment", "taxTreatment"])),
        lineItemDescription: text(firstValue(inputs, ["lineItemDescription", "description", "service"])),
      };
    },
    validateInputs: function validateInvoice(normalized) {
      var errors = validateNumbers(normalized, ["amount", "taxRate"]);
      if (normalized.taxRate !== null && normalized.taxRate > 100) errors.push("taxRate cannot exceed 100");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingInvoice(normalized) {
      var required = normalized.vatTreatment || normalized.taxRate !== null
        ? ["country", "amount"]
        : ["amount"];
      return missing(normalized, required);
    },
    getUserFacingSummary: function summarizeInvoice(normalized) {
      return summaryList([
        normalized.clientName ? "Client captured for local prefill" : "",
        normalized.currency ? "Currency: " + normalized.currency : "",
        normalized.amount !== null ? "Amount captured for local prefill" : "",
      ]) || "Open Invoice Generator and add invoice details.";
    },
  });

  var payeAdapter = createAdapter({
    id: "paye-calculator-prefill",
    primaryToolId: "paye-calculator",
    aliases: ["payroll-tax", "salary-tax", "paye", "payroll", "afropayroll", "ao-paye"],
    route: "/tools/paye-calculator/",
    privacyNote: "PAYE prefill is stored briefly in this browser session. Salary amounts stay out of the URL.",
    normalizeInputs: function normalizePaye(inputs) {
      var meta = countryMeta(firstValue(inputs, ["country"]), firstValue(inputs, ["countryCode"]));
      var gross = positiveNumber(firstValue(inputs, ["grossPay", "salary", "income", "budget", "grossSalary"]));
      var period = payPeriod(firstValue(inputs, ["payPeriod", "period"]));
      var monthly = period === "annual" && gross !== null ? gross / 12 : gross;
      var annual = period === "annual" ? gross : (gross !== null ? gross * 12 : null);
      return {
        country: meta.country || text(firstValue(inputs, ["country"])),
        countryCode: meta.code || text(firstValue(inputs, ["countryCode"])),
        grossPay: gross,
        grossPayMonthly: monthly,
        grossPayAnnual: annual,
        payPeriod: period,
        employeeCount: positiveNumber(firstValue(inputs, ["employeeCount", "numberOfEmployees", "employees", "staffCount"])),
        numberOfEmployees: positiveNumber(firstValue(inputs, ["numberOfEmployees", "employeeCount", "employees", "staffCount"])),
        currency: currency(firstValue(inputs, ["currency"]), meta.currency || ""),
        deductionsBenefits: text(firstValue(inputs, ["deductionsBenefits", "deductions", "benefits"])),
      };
    },
    validateInputs: function validatePaye(normalized) {
      var errors = validateNumbers(normalized, ["grossPay", "employeeCount"]);
      if (normalized.payPeriod && PAY_PERIODS.indexOf(normalized.payPeriod) === -1) errors.push("payPeriod is invalid");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingPaye(normalized) {
      return missing(normalized, ["country", "grossPay", "payPeriod"]);
    },
    getUserFacingSummary: function summarizePaye(normalized) {
      return summaryList([
        normalized.country ? "Country: " + normalized.country : "",
        normalized.grossPay !== null ? "Gross pay captured for local prefill" : "",
        normalized.payPeriod ? "Period: " + normalized.payPeriod : "",
        normalized.employeeCount !== null ? "Employees: " + normalized.employeeCount : "",
      ]) || "Open PAYE calculator and add payroll details.";
    },
    routeFor: function routeForPaye(normalized) {
      return countryMeta(normalized && normalized.country, normalized && normalized.countryCode).payeRoute || "/tools/paye-calculator/";
    },
  });

  var vatAdapter = createAdapter({
    id: "vat-calculator-prefill",
    primaryToolId: "vat-calc-pan-african",
    aliases: ["vat-calculator", "vat", "business-vat"],
    route: "/tools/vat-calculator/",
    privacyNote: "VAT prefill is stored briefly in this browser session. Invoice amounts and descriptions stay out of the URL.",
    normalizeInputs: function normalizeVat(inputs) {
      var meta = countryMeta(firstValue(inputs, ["country"]), firstValue(inputs, ["countryCode"]));
      return {
        country: meta.country || text(firstValue(inputs, ["country"])),
        countryCode: meta.code || text(firstValue(inputs, ["countryCode"])),
        amount: positiveNumber(firstValue(inputs, ["amount", "invoiceAmount", "itemValue", "total", "budget"])),
        invoiceAmount: positiveNumber(firstValue(inputs, ["invoiceAmount", "amount", "itemValue", "total", "budget"])),
        currency: currency(firstValue(inputs, ["currency"]), meta.currency || ""),
        vatRate: positiveNumber(firstValue(inputs, ["vatRate", "taxRate"])) !== null ? positiveNumber(firstValue(inputs, ["vatRate", "taxRate"])) : (meta.vatRate !== undefined ? meta.vatRate : null),
        vatTreatment: text(firstValue(inputs, ["vatTreatment", "taxTreatment"])) || "standard",
        lineItemDescription: text(firstValue(inputs, ["lineItemDescription", "description", "service"])),
        workflowKind: text(firstValue(inputs, ["workflowKind", "businessTask"])),
      };
    },
    validateInputs: function validateVat(normalized) {
      var errors = validateNumbers(normalized, ["amount", "invoiceAmount", "vatRate"]);
      if (normalized.vatRate !== null && normalized.vatRate > 100) errors.push("vatRate cannot exceed 100");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingVat(normalized) {
      return missing(normalized, ["country", "amount", "vatTreatment"]);
    },
    getUserFacingSummary: function summarizeVat(normalized) {
      return summaryList([
        normalized.country ? "Country: " + normalized.country : "",
        normalized.amount !== null ? "Amount captured for local prefill" : "",
        normalized.vatTreatment ? "VAT treatment: " + normalized.vatTreatment : "",
      ]) || "Open VAT Calculator and add business tax details.";
    },
  });

  var cashflowAdapter = createAdapter({
    id: "cash-flow-forecast-prefill",
    primaryToolId: "cash-flow-forecast",
    aliases: ["cashflow", "cash-flow", "cash-flow-planner", "cashflow-planner"],
    route: "/tools/cash-flow-forecast/",
    privacyNote: "Cashflow prefill is stored briefly in this browser session. Revenue, payroll, and cost assumptions stay out of the URL.",
    normalizeInputs: function normalizeCashflow(inputs) {
      var meta = countryMeta(firstValue(inputs, ["country"]), firstValue(inputs, ["countryCode"]));
      var monthlyRevenue = positiveNumber(firstValue(inputs, ["monthlyRevenue", "revenue", "invoiceAmount", "amount", "openingBalance"]));
      var fixedMonthlyCosts = positiveNumber(firstValue(inputs, ["fixedMonthlyCosts", "fixedCosts", "grossPayrollPerPeriod", "grossPayroll", "payrollCost"]));
      return {
        country: meta.country || text(firstValue(inputs, ["country"])),
        countryCode: meta.code || text(firstValue(inputs, ["countryCode"])),
        currency: currency(firstValue(inputs, ["currency"]), meta.currency || ""),
        openingBalance: positiveNumber(firstValue(inputs, ["openingBalance", "cashOnHand", "startingBalance", "invoiceAmount", "amount"])),
        monthlyRevenue: monthlyRevenue,
        fixedMonthlyCosts: fixedMonthlyCosts,
        cogsPercent: positiveNumber(firstValue(inputs, ["cogsPercent", "cogsPct"])) !== null ? positiveNumber(firstValue(inputs, ["cogsPercent", "cogsPct"])) : null,
        taxRate: positiveNumber(firstValue(inputs, ["taxRate", "vatRate"])) !== null ? positiveNumber(firstValue(inputs, ["taxRate", "vatRate"])) : null,
        employeeCount: positiveNumber(firstValue(inputs, ["employeeCount", "numberOfEmployees", "employees", "staffCount"])),
        payPeriod: payPeriod(firstValue(inputs, ["payPeriod", "period"])) || "",
        businessType: text(firstValue(inputs, ["businessType", "sector"])),
      };
    },
    validateInputs: function validateCashflow(normalized) {
      var errors = validateNumbers(normalized, ["openingBalance", "monthlyRevenue", "fixedMonthlyCosts", "cogsPercent", "taxRate", "employeeCount"]);
      if (normalized.cogsPercent !== null && normalized.cogsPercent > 100) errors.push("cogsPercent cannot exceed 100");
      if (normalized.taxRate !== null && normalized.taxRate > 100) errors.push("taxRate cannot exceed 100");
      return makeValidation(errors);
    },
    getMissingInputs: function getMissingCashflow(normalized) {
      return missing(normalized, ["currency"]);
    },
    getUserFacingSummary: function summarizeCashflow(normalized) {
      return summaryList([
        normalized.country ? "Country: " + normalized.country : "",
        normalized.currency ? "Currency: " + normalized.currency : "",
        normalized.monthlyRevenue !== null ? "Revenue assumption captured for local prefill" : "",
        normalized.fixedMonthlyCosts !== null ? "Cost assumption captured for local prefill" : "",
      ]) || "Open Cash Flow Forecast and add business assumptions.";
    },
  });

  var pdfWorkspaceAdapter = createAdapter({
    id: "pdf-workspace-prefill",
    primaryToolId: "pdf-workspace",
    aliases: ["document-pdf", "pdf", "pdf-tools"],
    route: "/tools/pdf-workspace/",
    privacyNote: "PDF workflow prefill stores only the intended action in this browser session. Files and document content are never placed in the URL.",
    normalizeInputs: function normalizePdf(inputs) {
      return {
        pdfAction: pdfAction(firstValue(inputs, ["pdfAction", "documentTask", "action", "task"])),
      };
    },
    validateInputs: function validatePdf(normalized) {
      var action = normalized.pdfAction;
      var allowed = ["organize", "merge", "compress", "convert", "split", "sign", "protect", "watermark", "page_numbers"];
      return makeValidation(action && allowed.indexOf(action) === -1 ? ["pdfAction is invalid"] : []);
    },
    getMissingInputs: function getMissingPdf(normalized) {
      return missing(normalized, ["pdfAction"]);
    },
    getUserFacingSummary: function summarizePdf(normalized) {
      return normalized.pdfAction ? "PDF action: " + normalized.pdfAction : "Open PDF Workspace and choose a browser-local document action.";
    },
  });

  var ADAPTERS = [
    cvBuilderAdapter,
    scholarshipAdapter,
    studyAbroadAdapter,
    carImportCostAdapter,
    importDutyAdapter,
    energyAdapter,
    vatAdapter,
    invoiceAdapter,
    payeAdapter,
    cashflowAdapter,
    pdfWorkspaceAdapter,
  ];

  function getPrefillAdapter(toolId) {
    for (var i = 0; i < ADAPTERS.length; i += 1) {
      if (ADAPTERS[i].supports(toolId)) return ADAPTERS[i];
    }
    return null;
  }

  function routeOnlyLaunch(toolId, route, summary) {
    return {
      supported: false,
      toolId: text(toolId),
      route: text(route) || "/tools/",
      launchUrl: appendLaunchParams(text(route) || "/tools/"),
      payload: null,
      missingInputs: [],
      validation: makeValidation([]),
      userFacingSummary: text(summary) || "Open the selected AfroTools workflow.",
      privacyNote: "This route-only workflow does not create a prefill payload.",
    };
  }

  function buildSafeLaunch(toolId, extractedInputs, options) {
    var adapter = getPrefillAdapter(toolId);
    var route = options && options.selectedRoute ? options.selectedRoute : "";
    if (!adapter) return routeOnlyLaunch(toolId, route || "/tools/", "");
    var normalized = adapter.normalizeInputs(extractedInputs || {});
    var validation = adapter.validateInputs(normalized);
    var payload = adapter.toSafeLaunchPayload(normalized);
    if (adapter.id === "energy-prefill" && String(payload.route || "").indexOf("/tools/fuel-tracker/") === 0) {
      payload.toolId = "fuel-tracker";
    }
    var launchUrl = appendLaunchParams(payload.route || route || adapter.routeFor(normalized));
    return {
      supported: true,
      toolId: payload.toolId,
      route: payload.route,
      launchUrl: launchUrl,
      payload: payload,
      missingInputs: payload.missingInputs,
      validation: validation,
      userFacingSummary: payload.userFacingSummary,
      privacyNote: payload.privacyNote,
    };
  }

  function storeLaunchPayload(launchOrPayload, storage) {
    var target = storage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
    var payload = launchOrPayload && launchOrPayload.payload ? launchOrPayload.payload : launchOrPayload;
    if (!target || !payload) return false;
    try {
      target.setItem(PREFILL_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  function readLaunchPayload(storage) {
    var target = storage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
    if (!target) return null;
    var raw = target.getItem(PREFILL_STORAGE_KEY);
    if (!raw) return null;
    try {
      var payload = JSON.parse(raw);
      if (!payload || payload.type !== "afrotools_ai_prefill") return null;
      if (payload.expiresAt && Date.now() > Number(payload.expiresAt)) {
        target.removeItem(PREFILL_STORAGE_KEY);
        return null;
      }
      return payload;
    } catch (err) {
      target.removeItem(PREFILL_STORAGE_KEY);
      return null;
    }
  }

  function clearExpiredLaunchPayload(storage) {
    return readLaunchPayload(storage) === null;
  }

  return {
    PREFILL_STORAGE_KEY: PREFILL_STORAGE_KEY,
    PREFILL_TTL_MS: PREFILL_TTL_MS,
    ADAPTERS: ADAPTERS,
    getPrefillAdapter: getPrefillAdapter,
    buildSafeLaunch: buildSafeLaunch,
    routeOnlyLaunch: routeOnlyLaunch,
    storeLaunchPayload: storeLaunchPayload,
    readLaunchPayload: readLaunchPayload,
    clearExpiredLaunchPayload: clearExpiredLaunchPayload,
    appendLaunchParams: appendLaunchParams,
  };
});
