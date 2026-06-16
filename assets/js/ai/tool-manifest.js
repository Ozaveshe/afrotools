/**
 * AfroTools AI tool manifest.
 *
 * Normalizes the existing generated tool directory into a router-safe manifest
 * without changing public routes. CommonJS is used for tests/server tooling;
 * the browser build exposes window.AfroToolsAIToolManifest when loaded after
 * the existing registry.
 */
(function initToolManifest(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIToolManifest = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createApi(root) {
  "use strict";

  /**
   * @typedef {"browser_local"|"server_required"|"ai_optional"|"account_optional"} PrivacyMode
   * @typedef {"route_only"|"prefill"|"explain"|"generate_document"|"compare"|"export"} AICapability
   * @typedef {"number"|"table"|"shortlist"|"cv"|"pdf"|"checklist"|"json"|"report"|"image"|"map"} OutputType
   * @typedef {"official"|"reviewed"|"estimated"|"user_input"|"mixed"} SourcePolicy
   * @typedef {"tax"|"immigration"|"legal"|"health"|"finance"|"employment"|"education"|"energy"|"none"} HighStakesDomain
   * @typedef {"sponsored_slot"|"pro_export"|"api"|"widget"|"lead_opt_in"} MonetizationSurface
   *
   * @typedef {Object} ToolManifestEntry
   * @property {string} id
   * @property {string} slug
   * @property {string} route
   * @property {string} title
   * @property {string} shortDescription
   * @property {string} category
   * @property {string} subcategory
   * @property {string[]} countriesSupported
   * @property {string[]} languagesSupported
   * @property {string[]} currencySupport
   * @property {string[]} userIntents
   * @property {string[]} exampleQueries
   * @property {Array<{name:string,label:string,type:string,required?:boolean,sensitive?:boolean}>} requiredInputs
   * @property {Array<{name:string,label:string,type:string,required?:boolean,sensitive?:boolean}>} optionalInputs
   * @property {PrivacyMode} privacyMode
   * @property {AICapability[]} aiCapabilities
   * @property {OutputType[]} outputTypes
   * @property {SourcePolicy} sourcePolicy
   * @property {HighStakesDomain} highStakesDomain
   * @property {MonetizationSurface[]} monetizationSurfaces
   */

  var ALLOWED_VALUES = {
    privacyMode: ["browser_local", "server_required", "ai_optional", "account_optional"],
    aiCapabilities: ["route_only", "prefill", "explain", "generate_document", "compare", "export"],
    outputTypes: ["number", "table", "shortlist", "cv", "pdf", "checklist", "json", "report", "image", "map"],
    sourcePolicy: ["official", "reviewed", "estimated", "user_input", "mixed"],
    highStakesDomain: ["tax", "immigration", "legal", "health", "finance", "employment", "education", "energy", "none"],
    monetizationSurfaces: ["sponsored_slot", "pro_export", "api", "widget", "lead_opt_in"],
  };

  var TOOL_MANIFEST_SCHEMA = {
    schemaVersion: 1,
    requiredFields: [
      "id",
      "slug",
      "route",
      "title",
      "shortDescription",
      "category",
      "subcategory",
      "countriesSupported",
      "languagesSupported",
      "currencySupport",
      "userIntents",
      "exampleQueries",
      "requiredInputs",
      "optionalInputs",
      "privacyMode",
      "aiCapabilities",
      "outputTypes",
      "sourcePolicy",
      "highStakesDomain",
      "monetizationSurfaces",
    ],
    enums: ALLOWED_VALUES,
  };

  function input(name, label, type, options) {
    return Object.assign({ name: name, label: label, type: type }, options || {});
  }

  var INPUTS = {
    country: input("country", "Country", "country", { required: true }),
    targetCountry: input("targetCountry", "Target country", "country", { required: true }),
    destinationCountry: input("destinationCountry", "Destination country", "country", { required: true }),
    originCountry: input("originCountry", "Origin country", "country"),
    grossPay: input("grossPay", "Gross pay", "number", { required: true, sensitive: true }),
    payPeriod: input("payPeriod", "Pay period", "select", { required: true }),
    itemCategory: input("itemCategory", "Item category", "text", { required: true }),
    itemValue: input("itemValue", "Item value", "number", { required: true, sensitive: true }),
    purchasePrice: input("purchasePrice", "Purchase price", "number", { required: true, sensitive: true }),
    shippingCost: input("shippingCost", "Shipping or freight", "number", { sensitive: true }),
    fxRate: input("fxRate", "FX rate", "number", { sensitive: true }),
    vehicleMake: input("make", "Vehicle make", "text"),
    vehicleModel: input("model", "Vehicle model", "text"),
    vehicleYear: input("year", "Vehicle year", "text"),
    invoiceAmount: input("amount", "Invoice amount", "number", { sensitive: true }),
    vatTreatment: input("vatTreatment", "VAT treatment", "select"),
    studyLevel: input("studyLevel", "Study level", "select", { required: true }),
    budget: input("budget", "Budget", "number", { sensitive: true }),
    monthlyBudget: input("monthlyBudget", "Monthly budget", "number", { sensitive: true }),
    householdSize: input("householdSize", "Household size", "number"),
    city: input("city", "City", "text"),
    targetRole: input("targetRole", "Target role", "text"),
    documentFile: input("documentFile", "Document", "file", { sensitive: true }),
    pdfAction: input("pdfAction", "PDF action", "select"),
    monthlyBill: input("monthlyBill", "Monthly power bill", "number", { required: true, sensitive: true }),
    generatorSize: input("generatorSizeKva", "Generator size", "number"),
    generatorHours: input("generatorHoursPerDay", "Generator hours per day", "number"),
    clientName: input("clientName", "Client name", "text", { sensitive: true }),
    gradeBand: input("gradeBand", "Grade band", "text"),
    gpaScale: input("gpaScale", "GPA scale", "select"),
    examSubjects: input("subjects", "Subjects", "text"),
    ieltsScore: input("ieltsScore", "IELTS score", "number"),
    roomSize: input("roomSize", "Room size", "text"),
    plotSize: input("plotSize", "Plot size", "text"),
    buildingType: input("buildingType", "Building type", "text"),
    materialPreference: input("materialPreference", "Material preference", "text"),
    outputDesired: input("outputDesired", "Output desired", "select"),
    crop: input("crop", "Crop", "text"),
    farmSize: input("farmSize", "Farm size", "number"),
    birdCount: input("birdCount", "Bird count", "number"),
    fishCount: input("fishCount", "Fish or fingerling count", "number"),
    livestockCount: input("livestockCount", "Livestock count", "number"),
    creatorName: input("creatorName", "Creator name", "text"),
  };

  var MAJOR_TOOL_OVERRIDES = {
    "cv-builder": major("career-documents", ["write cv", "build resume", "improve cv", "ats cv"], ["Help me build a CV for a finance role in Kenya"], [], [INPUTS.targetRole], "browser_local", ["route_only", "prefill", "explain", "generate_document", "export"], ["cv", "pdf", "json"], "user_input", "employment", ["pro_export"]),
    "cover-letter": major("career-documents", ["write cover letter", "job application letter", "application pack"], ["Write a cover letter for an NGO program officer role"], [], [INPUTS.targetRole], "browser_local", ["route_only", "generate_document", "export"], ["report", "pdf", "json"], "user_input", "employment", ["pro_export"]),
    "scholarship-finder": major("scholarships", ["find scholarships", "scholarship eligibility", "study funding"], ["Find scholarships for a Nigerian master's student in Canada"], [INPUTS.country, INPUTS.studyLevel], [INPUTS.targetCountry], "account_optional", ["route_only", "prefill", "explain", "compare", "export"], ["shortlist", "checklist", "json"], "mixed", "education", ["lead_opt_in"]),
    "study-abroad-cost": major("study-abroad", ["study abroad cost", "student budget abroad"], ["Estimate study abroad costs from Ghana to the UK"], [INPUTS.country, INPUTS.targetCountry, INPUTS.studyLevel], [INPUTS.budget], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["number", "table", "checklist", "report"], "estimated", "education", ["lead_opt_in"]),
    "import-duty": major("customs-duty", ["import duty", "customs duty", "landed cost"], ["Estimate import duty for phones shipped to Nigeria"], [INPUTS.destinationCountry, INPUTS.itemCategory, INPUTS.itemValue], [INPUTS.originCountry], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["api", "lead_opt_in"]),
    "car-import-cost": major("vehicle-import", ["car import cost", "vehicle import duty", "landed car cost"], ["How much duty will I pay to import a 2016 Toyota Axio into Nigeria?"], [INPUTS.destinationCountry, INPUTS.itemCategory], [INPUTS.purchasePrice, INPUTS.shippingCost, INPUTS.fxRate, INPUTS.vehicleMake, INPUTS.vehicleModel, INPUTS.vehicleYear, INPUTS.originCountry], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["number", "table", "report"], "mixed", "finance", ["api", "lead_opt_in"]),
    "vat-calc-pan-african": major("vat-business-tax", ["vat calculator", "vat invoice", "sales tax africa"], ["Create a VAT invoice in Ghana"], [INPUTS.country], [INPUTS.invoiceAmount, INPUTS.vatTreatment], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "pdf"], "mixed", "tax", ["api", "widget", "lead_opt_in"]),
    "solar-roi": major("solar-roi", ["solar roi", "solar payback", "replace generator"], ["Will solar pay back for a shop in Lagos?"], [INPUTS.country, INPUTS.monthlyBill], [], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["number", "table", "report"], "mixed", "energy", ["lead_opt_in"]),
    "fuel-tracker": major("fuel-prices", ["fuel price", "petrol price", "diesel price"], ["Show current petrol price context for Kenya"], [], [INPUTS.country], "browser_local", ["route_only", "prefill", "explain", "compare"], ["table", "report"], "mixed", "energy", ["api", "widget"]),
    "generator-fuel": major("generator-cost", ["generator fuel cost", "diesel generator cost", "petrol generator spend"], ["Estimate generator fuel cost for a shop in Lagos"], [INPUTS.country], [INPUTS.generatorSize, INPUTS.generatorHours], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "energy", ["widget", "lead_opt_in"]),
    "cost-of-living": major("cost-of-living", ["cost of living", "rent affordability", "monthly budget"], ["Can I live in Accra on GHS 8000 per month?"], [INPUTS.country], [INPUTS.city, INPUTS.monthlyBudget, INPUTS.householdSize], "browser_local", ["route_only", "explain", "compare", "export"], ["number", "table", "checklist", "report"], "estimated", "finance", ["api", "lead_opt_in"]),
    "japa-calculator": major("relocation-planning", ["japa cost", "relocation budget", "move abroad cost"], ["How much should I save before moving from Lagos to Nairobi?"], [INPUTS.country, INPUTS.targetCountry], [INPUTS.budget, INPUTS.householdSize], "browser_local", ["route_only", "explain", "export"], ["number", "checklist", "report"], "estimated", "immigration", ["lead_opt_in"]),
    "invoice-generator": major("invoices", ["create invoice", "download invoice", "bill client"], ["Create an invoice for a design project in Ghana cedis"], [], [INPUTS.clientName], "browser_local", ["route_only", "prefill", "generate_document", "export"], ["pdf", "json", "report"], "user_input", "finance", ["pro_export"]),
    "paye-calculator": major("salary-tax", ["calculate paye", "salary tax", "net pay"], ["Calculate monthly PAYE for a salary in Nigeria"], [INPUTS.country, INPUTS.grossPay, INPUTS.payPeriod], [], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "pdf"], "mixed", "tax", ["pro_export"]),
    "pdf-workspace": major("pdf-tools", ["merge pdf", "split pdf", "compress pdf"], ["Merge these PDFs without uploading them"], [], [INPUTS.pdfAction, INPUTS.documentFile], "browser_local", ["route_only", "prefill", "export"], ["pdf", "json"], "user_input", "none", ["pro_export"]),
    "gpa-calculator": major("academic-grades", ["gpa calculator", "cgpa calculator", "convert grades"], ["Calculate my GPA from university grades"], [INPUTS.country], [INPUTS.gradeBand, INPUTS.gpaScale], "browser_local", ["route_only", "explain", "export"], ["number", "table"], "estimated", "education", []),
    "waec-calculator": major("waec-neco-grades", ["waec calculator", "neco grade calculator", "o level grades"], ["Calculate WAEC grade points for my subjects"], [INPUTS.country], [INPUTS.examSubjects], "browser_local", ["route_only", "explain", "export"], ["number", "table"], "estimated", "education", []),
    "ielts-calculator": major("ielts-pathway", ["ielts score", "english test score", "study visa english"], ["Check whether IELTS 7 is enough for Canada study plans"], [INPUTS.country], [INPUTS.ieltsScore, INPUTS.targetCountry, INPUTS.studyLevel], "browser_local", ["route_only", "explain", "export"], ["number", "checklist"], "estimated", "education", ["lead_opt_in"]),
    "business-planner": major("business-planning", ["business plan", "start a business", "registration checklist"], ["Build a market-entry plan for a salon in Accra"], [INPUTS.country], [], "ai_optional", ["route_only", "prefill", "explain", "generate_document", "export"], ["checklist", "report", "pdf"], "mixed", "finance", ["pro_export", "lead_opt_in"]),
    "medical-report": major("health-explainer", ["explain lab report", "medical report"], ["Explain what these CBC results mean"], [], [INPUTS.documentFile], "ai_optional", ["route_only", "explain", "export"], ["report", "pdf"], "user_input", "health", ["pro_export"]),
    "afroplan-floor-planner": major("floor-planning", ["floor plan", "room layout", "house plan"], ["Draft a two-bedroom layout for a narrow plot"], [], [INPUTS.plotSize, INPUTS.roomSize, INPUTS.buildingType], "ai_optional", ["route_only", "explain", "export"], ["image", "json", "report"], "user_input", "none", ["pro_export", "lead_opt_in"]),
    afrodraft: major("cad-drafting", ["cad plan", "technical drawing", "afrodraft"], ["Create a CAD-like concept plan for a shop"], [], [INPUTS.plotSize, INPUTS.buildingType, INPUTS.outputDesired], "browser_local", ["route_only", "explain", "export"], ["image", "json", "pdf"], "user_input", "none", ["pro_export"]),
    "building-materials": major("construction-materials", ["estimate blocks", "cement bags", "building materials"], ["Estimate blocks and cement for a small room"], [], [INPUTS.country, INPUTS.roomSize, INPUTS.materialPreference], "browser_local", ["route_only", "explain", "export"], ["number", "table", "report"], "estimated", "legal", ["lead_opt_in", "pro_export"]),
    "boq-generator": major("construction-boq", ["boq", "bill of quantities", "quantity takeoff"], ["Prepare a BOQ for a 3 bedroom bungalow"], [], [INPUTS.country, INPUTS.plotSize, INPUTS.buildingType], "browser_local", ["route_only", "explain", "export"], ["table", "pdf", "json"], "estimated", "legal", ["pro_export", "lead_opt_in"]),
    "land-size": major("land-measurement", ["land size", "plot size", "plot conversion"], ["Convert a 50 by 100 plot"], [], [INPUTS.country, INPUTS.plotSize], "browser_local", ["route_only", "prefill", "explain"], ["number", "table"], "estimated", "none", []),
    "construction-budget": major("construction-budget", ["building cost", "construction budget", "house budget"], ["Estimate construction budget for a bungalow"], [], [INPUTS.country, INPUTS.plotSize, INPUTS.buildingType], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "estimated", "finance", ["pro_export", "lead_opt_in"]),
    "crop-yield-estimator": major("crop-yield", ["crop yield", "maize farm", "harvest estimate"], ["Estimate maize yield for 2 hectares in Nigeria"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], "browser_local", ["route_only", "explain", "export"], ["number", "table", "report"], "mixed", "none", ["lead_opt_in"]),
    "farm-profit-calculator": major("farm-profit", ["farm profit", "farm roi", "farm margin"], ["Is a maize farm profitable in Nigeria?"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize, INPUTS.budget], "browser_local", ["route_only", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in", "pro_export"]),
    "poultry-roi-calculator": major("poultry-roi", ["poultry roi", "broiler profit", "layer farm"], ["Calculate poultry ROI for 500 broilers in Ghana"], [], [INPUTS.country, INPUTS.birdCount, INPUTS.budget], "browser_local", ["route_only", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in", "pro_export"]),
    "fish-farming-roi": major("fish-farming-roi", ["fish farming roi", "catfish profit", "tilapia farm"], ["Plan fish farming ROI for tilapia in Kenya"], [], [INPUTS.country, INPUTS.fishCount, INPUTS.budget], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in", "pro_export"]),
    "livestock-feed-calculator": major("livestock-feed", ["livestock feed", "feed ration", "cattle feed"], ["Estimate livestock feed cost for goats"], [], [INPUTS.country, INPUTS.livestockCount, INPUTS.budget], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in"]),
    "fertilizer-calculator": major("fertilizer-inputs", ["fertilizer", "npk", "urea"], ["Estimate fertilizer needs for maize"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in"]),
    "input-prices": major("agri-input-prices", ["input prices", "seed prices", "fertilizer prices"], ["Compare fertilizer and seed prices in Ghana"], [], [INPUTS.country, INPUTS.crop], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["table", "report"], "mixed", "finance", ["api", "lead_opt_in"]),
    "irrigation-calculator": major("irrigation-planning", ["irrigation", "water pump", "drip irrigation"], ["Plan irrigation for onions in Senegal"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "none", ["lead_opt_in"]),
    "storage-loss": major("post-harvest-storage", ["storage loss", "post harvest", "grain storage"], ["Estimate maize storage losses"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], "browser_local", ["route_only", "prefill", "explain", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in"]),
    "commodity-prices": major("market-prices", ["commodity prices", "market price", "farm gate price"], ["Check maize market price planning"], [], [INPUTS.country, INPUTS.crop], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["table", "report"], "mixed", "finance", ["api", "lead_opt_in"]),
    "cocoa-tracker": major("cocoa-market", ["cocoa", "farm gate cocoa", "cocoa export"], ["Plan cocoa farm-gate pricing in Cote d'Ivoire"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], "browser_local", ["route_only", "prefill", "explain", "compare", "export"], ["number", "table", "report"], "mixed", "finance", ["lead_opt_in"]),
    afroatlas: major("country-intelligence", ["compare countries", "africa data", "country profile"], ["Compare Kenya and Ghana for a small ecommerce launch"], [], [INPUTS.country], "browser_local", ["route_only", "explain", "compare", "export"], ["map", "table", "report"], "mixed", "none", ["api", "lead_opt_in"]),
    afrostream: major("creator-intelligence", ["find streamers", "creator news", "african streamers"], ["Find Nigerian streamers with recent creator news"], [], [INPUTS.country, INPUTS.creatorName], "browser_local", ["route_only", "explain", "compare", "export"], ["shortlist", "table", "report"], "mixed", "none", ["sponsored_slot", "lead_opt_in"]),
  };

  function major(subcategory, intents, examples, required, optional, privacy, capabilities, outputs, source, stakes, monetization) {
    return {
      subcategory: subcategory,
      userIntents: intents,
      exampleQueries: examples,
      requiredInputs: required,
      optionalInputs: optional,
      privacyMode: privacy,
      aiCapabilities: capabilities,
      outputTypes: outputs,
      sourcePolicy: source,
      highStakesDomain: stakes,
      monetizationSurfaces: monetization,
    };
  }

  function text(value, fallback) {
    return String(value || fallback || "").trim();
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function normalizeRoute(route, id) {
    var clean = text(route, id ? "/tools/" + id + "/" : "/").split(/[?#]/)[0];
    if (!clean.startsWith("/")) clean = "/" + clean;
    return clean.replace(/\/index\.html$/i, "/");
  }

  function routeKey(route) {
    var clean = normalizeRoute(route);
    return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1).toLowerCase() : clean.toLowerCase();
  }

  function slugFromRoute(route, id) {
    var parts = routeKey(route).replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    return parts[0] === "tools" && parts[1] ? parts[1] : parts[parts.length - 1] || id;
  }

  function normalizeCountries(countries) {
    var values = Array.isArray(countries) ? countries : [countries];
    var normalized = values.map(function mapCountry(country) {
      var value = text(country);
      return value === "All African countries" || value === "Pan-African" ? "ALL" : value.toUpperCase();
    }).filter(Boolean);
    return unique(normalized.length ? normalized : ["ALL"]);
  }

  function registryToDirectory(tool) {
    return {
      id: tool.id,
      name: tool.name,
      description: tool.desc || tool.description || "",
      category_key: tool.category || "uncategorized",
      category: tool.category || "Uncategorized",
      countries: tool.countries || tool.country || ["ALL"],
      language: tool.lang || "en",
      url: tool.href || "/tools/" + tool.id + "/",
      priority: Number(tool.priority || 0),
      status: tool.status || "Live",
    };
  }

  function haystack(record) {
    return [record.id, record.name, record.description, record.category_key, record.category].join(" ").toLowerCase();
  }

  function inferHighStakes(record) {
    var h = haystack(record);
    if (/paye|tax|vat|irs|firs|sars|withholding|wht/.test(h)) return "tax";
    if (/immigration|visa|japa|passport|study abroad/.test(h)) return "immigration";
    if (/legal|contract|compliance|permit|cac|privacy policy|data protection/.test(h)) return "legal";
    if (/health|medical|hospital|genotype|sickle|drug|medicine|hiv|mental/.test(h)) return "health";
    if (/cv|resume|cover letter|job|career|employment|payroll|minimum wage|leave|overtime/.test(h)) return "employment";
    if (/scholarship|school|student|jamb|gpa|study/.test(h)) return "education";
    if (/solar|fuel|electric|power|energy|generator/.test(h)) return "energy";
    if (/finance|loan|mortgage|insurance|bank|fee|import duty|cost|price|fx|currency/.test(h)) return "finance";
    return "none";
  }

  function inferPrivacy(record, stakes) {
    var h = haystack(record);
    if (/files never leave|browser|local-only|pdf|cv|resume|cover letter|invoice|document/.test(h)) return "browser_local";
    if (/ai|advisor|interpreter|planner|chat/.test(h) || stakes === "health") return "ai_optional";
    if (/workspace|save|account|pro|subscription/.test(h)) return "account_optional";
    return "browser_local";
  }

  function inferSource(record, stakes) {
    var h = haystack(record);
    if (/cv|resume|cover letter|pdf|invoice|document|floor plan/.test(h)) return "user_input";
    if (/official|government|source|verified|gazette/.test(h)) return "official";
    if (stakes === "tax" || stakes === "legal" || stakes === "energy") return "mixed";
    if (/estimate|calculator|cost|price|roi|budget/.test(h)) return "estimated";
    return "reviewed";
  }

  function inferCapabilities(record) {
    var h = haystack(record);
    var out = ["route_only"];
    if (/calculator|estimate|cost|paye|tax|vat|invoice|scholarship|study|solar|fuel|import|planner|cv|resume|cover/.test(h)) out.push("prefill");
    if (/ai|advisor|explain|interpreter|calculator|estimate|tracker|finder|compare|atlas|stream/.test(h)) out.push("explain");
    if (/cv|resume|cover|invoice|plan|letter|document|pdf|generator/.test(h)) out.push("generate_document");
    if (/compare|versus|vs|finder|tracker|atlas|market|directory|scholarship/.test(h)) out.push("compare");
    if (/pdf|export|download|report|invoice|cv|resume|checklist|generator|calculator/.test(h)) out.push("export");
    return unique(out);
  }

  function inferOutputs(record, stakes) {
    var h = haystack(record);
    var out = [];
    if (/calculator|cost|price|roi|tax|vat|paye|fee|loan|mortgage|salary|fuel/.test(h)) out.push("number");
    if (/tracker|compare|directory|finder|atlas|market|rates|scholarship/.test(h)) out.push("table");
    if (/finder|scholarship|directory|stream|creator/.test(h)) out.push("shortlist");
    if (/cv|resume/.test(h)) out.push("cv");
    if (/pdf|invoice|cv|resume|cover|report|planner|generator/.test(h)) out.push("pdf");
    if (/checklist|permit|registration|compliance|setup/.test(h)) out.push("checklist");
    if (/api|data|atlas|workspace|export/.test(h)) out.push("json");
    if (/report|advisor|interpreter|planner|business/.test(h)) out.push("report");
    if (/image|design|floor|map/.test(h)) out.push("image");
    if (/atlas|map|route/.test(h)) out.push("map");
    return unique(out.length ? out : [stakes === "none" ? "report" : "checklist"]);
  }

  function inferRequired(record, stakes) {
    var h = haystack(record);
    if (/paye|salary tax|take home pay/.test(h)) return [INPUTS.country, INPUTS.grossPay, INPUTS.payPeriod];
    if (/import duty|customs|landed cost/.test(h)) return [INPUTS.destinationCountry, INPUTS.itemCategory, INPUTS.itemValue];
    if (/solar|power cost|generator|study abroad|scholarship/.test(h)) return [INPUTS.country];
    if (stakes === "tax" || stakes === "legal" || stakes === "education") return [INPUTS.country];
    return [];
  }

  function inferMonetization(record) {
    var h = haystack(record);
    var out = [];
    if (/sponsor|partner|affiliate/.test(h)) out.push("sponsored_slot");
    if (/premium|pro|pdf|export|download/.test(h)) out.push("pro_export");
    if (/api|data|rates|forex|market/.test(h)) out.push("api");
    if (/widget|embed/.test(h)) out.push("widget");
    if (/quote|partner|business|lead|service|supplier/.test(h)) out.push("lead_opt_in");
    return unique(out);
  }

  function makeInput(raw) {
    return {
      name: text(raw && raw.name),
      label: text(raw && raw.label, raw && raw.name),
      type: text(raw && raw.type, "text"),
      required: Boolean(raw && raw.required),
      sensitive: Boolean(raw && raw.sensitive),
    };
  }

  function makeEntry(record, overrides) {
    var id = text(record.id);
    var route = normalizeRoute(record.url || record.href, id);
    var countries = normalizeCountries(record.countries);
    var stakes = inferHighStakes(record);
    var base = {
      id: id,
      slug: slugFromRoute(route, id),
      route: route,
      title: text(record.name, id),
      shortDescription: text(record.description || record.desc, "AfroTools workflow"),
      category: text(record.category_key || record.category, "uncategorized"),
      subcategory: text(record.category_key || record.category, "general"),
      countriesSupported: countries,
      languagesSupported: unique([text(record.language || record.lang, "en").toLowerCase()]),
      currencySupport: unique(countries.indexOf("ALL") !== -1 || /forex|currency|fx|import|remittance|japa|study|travel|crypto/.test(haystack(record)) ? ["local", "USD"] : ["local"]),
      userIntents: unique([text(record.name, id).toLowerCase(), id.replace(/-/g, " "), "open " + text(record.name, id).toLowerCase(), text(record.category_key, "tools").replace(/-/g, " ") + " tool"]),
      exampleQueries: ["Open " + text(record.name, id), "Help me use " + text(record.name, id)],
      requiredInputs: inferRequired(record, stakes),
      optionalInputs: [],
      privacyMode: inferPrivacy(record, stakes),
      aiCapabilities: inferCapabilities(record),
      outputTypes: inferOutputs(record, stakes),
      sourcePolicy: inferSource(record, stakes),
      highStakesDomain: stakes,
      monetizationSurfaces: inferMonetization(record),
      aliases: [],
      status: text(record.status, "Live"),
      priority: Number(record.priority || 0),
    };
    return normalizeEntry(Object.assign({}, base, overrides[id] || {}));
  }

  function normalizeEntry(entry) {
    entry.countriesSupported = unique(entry.countriesSupported);
    entry.languagesSupported = unique(entry.languagesSupported);
    entry.currencySupport = unique(entry.currencySupport);
    entry.userIntents = unique(entry.userIntents);
    entry.exampleQueries = unique(entry.exampleQueries);
    entry.requiredInputs = array(entry.requiredInputs).map(makeInput);
    entry.optionalInputs = array(entry.optionalInputs).map(makeInput);
    entry.aiCapabilities = unique(entry.aiCapabilities);
    entry.outputTypes = unique(entry.outputTypes);
    entry.monetizationSurfaces = unique(entry.monetizationSurfaces);
    entry.aliases = unique(entry.aliases);
    return entry;
  }

  function mergeByRoute(existing, incoming) {
    var winner = incoming.priority > existing.priority ? incoming : existing;
    var alias = winner === incoming ? existing : incoming;
    winner.aliases = unique(array(winner.aliases).concat(alias.id, array(alias.aliases)));
    winner.userIntents = unique(array(winner.userIntents).concat(alias.userIntents));
    winner.exampleQueries = unique(array(winner.exampleQueries).concat(alias.exampleQueries));
    return normalizeEntry(winner);
  }

  function buildToolManifest(directoryEntries, options) {
    var overrides = Object.assign({}, MAJOR_TOOL_OVERRIDES, options && options.overrides);
    var byRoute = new Map();
    array(directoryEntries).forEach(function addRecord(raw) {
      if (!raw || !raw.id) return;
      var record = raw.href ? registryToDirectory(raw) : raw;
      var entry = makeEntry(record, overrides);
      var key = routeKey(entry.route);
      byRoute.set(key, byRoute.has(key) ? mergeByRoute(byRoute.get(key), entry) : entry);
    });
    return Array.from(byRoute.values()).sort(function sortTools(left, right) {
      return (right.priority - left.priority) || left.id.localeCompare(right.id);
    });
  }

  function validateInputList(entry, field, errors) {
    if (!Array.isArray(entry[field])) {
      errors.push(entry.id + "." + field + " must be an array");
      return;
    }
    entry[field].forEach(function validateInput(inputItem, index) {
      ["name", "label", "type"].forEach(function requireInputField(inputField) {
        if (!text(inputItem && inputItem[inputField])) {
          errors.push(entry.id + "." + field + "[" + index + "]." + inputField + " is required");
        }
      });
    });
  }

  function allAllowed(values, allowed) {
    return Array.isArray(values) && values.every(function isAllowed(value) {
      return allowed.indexOf(value) !== -1;
    });
  }

  function validateToolManifest(manifest) {
    var errors = [];
    var routes = new Map();
    if (!Array.isArray(manifest)) errors.push("manifest must be an array");
    array(manifest).forEach(function validateEntry(entry, index) {
      if (!entry || typeof entry !== "object") {
        errors.push("entry[" + index + "] must be an object");
        return;
      }
      TOOL_MANIFEST_SCHEMA.requiredFields.forEach(function requireField(field) {
        if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
          errors.push((entry.id || "entry[" + index + "]") + "." + field + " is required");
        }
      });
      ["id", "slug", "route", "title", "shortDescription", "category", "subcategory"].forEach(function requireString(field) {
        if (!text(entry[field])) errors.push((entry.id || "entry[" + index + "]") + "." + field + " must be a non-empty string");
      });
      if (!String(entry.route || "").startsWith("/")) errors.push(entry.id + ".route must start with /");
      var key = routeKey(entry.route);
      if (routes.has(key)) errors.push("duplicate route " + key + " for " + routes.get(key) + " and " + entry.id);
      routes.set(key, entry.id);
      ["countriesSupported", "languagesSupported", "currencySupport", "userIntents", "exampleQueries"].forEach(function requireArray(field) {
        if (!Array.isArray(entry[field]) || !entry[field].length) errors.push(entry.id + "." + field + " must be a non-empty array");
      });
      validateInputList(entry, "requiredInputs", errors);
      validateInputList(entry, "optionalInputs", errors);
      if (ALLOWED_VALUES.privacyMode.indexOf(entry.privacyMode) === -1) errors.push(entry.id + ".privacyMode is invalid");
      if (!allAllowed(entry.aiCapabilities, ALLOWED_VALUES.aiCapabilities)) errors.push(entry.id + ".aiCapabilities contains invalid values");
      if (!allAllowed(entry.outputTypes, ALLOWED_VALUES.outputTypes)) errors.push(entry.id + ".outputTypes contains invalid values");
      if (ALLOWED_VALUES.sourcePolicy.indexOf(entry.sourcePolicy) === -1) errors.push(entry.id + ".sourcePolicy is invalid");
      if (ALLOWED_VALUES.highStakesDomain.indexOf(entry.highStakesDomain) === -1) errors.push(entry.id + ".highStakesDomain is invalid");
      if (!allAllowed(entry.monetizationSurfaces, ALLOWED_VALUES.monetizationSurfaces)) errors.push(entry.id + ".monetizationSurfaces contains invalid values");
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function loadDefaultDirectoryEntries() {
    if (root && Array.isArray(root.AFROTOOLS_TOOL_DIRECTORY)) return root.AFROTOOLS_TOOL_DIRECTORY;
    if (root && Array.isArray(root.AFRO_TOOLS)) return root.AFRO_TOOLS.map(registryToDirectory);
    if (typeof require !== "function") return [];
    var fs = require("fs");
    var path = require("path");
    return JSON.parse(fs.readFileSync(path.join(path.resolve(__dirname, "../../.."), "data", "tool-directory.json"), "utf8"));
  }

  function loadDefaultToolManifest(options) {
    return buildToolManifest(loadDefaultDirectoryEntries(), options);
  }

  function getToolManifestForRouter(manifest) {
    return array(Array.isArray(manifest) ? manifest : loadDefaultToolManifest()).map(function pick(entry) {
      return {
        id: entry.id,
        slug: entry.slug,
        route: entry.route,
        title: entry.title,
        shortDescription: entry.shortDescription,
        category: entry.category,
        subcategory: entry.subcategory,
        countriesSupported: array(entry.countriesSupported),
        languagesSupported: array(entry.languagesSupported),
        currencySupport: array(entry.currencySupport),
        userIntents: array(entry.userIntents),
        exampleQueries: array(entry.exampleQueries),
        requiredInputs: array(entry.requiredInputs).map(makeInput),
        optionalInputs: array(entry.optionalInputs).map(makeInput),
        privacyMode: entry.privacyMode,
        aiCapabilities: array(entry.aiCapabilities),
        outputTypes: array(entry.outputTypes),
        sourcePolicy: entry.sourcePolicy,
        highStakesDomain: entry.highStakesDomain,
        aliases: array(entry.aliases),
      };
    });
  }

  return {
    ALLOWED_VALUES: ALLOWED_VALUES,
    TOOL_MANIFEST_SCHEMA: TOOL_MANIFEST_SCHEMA,
    MAJOR_TOOL_OVERRIDES: MAJOR_TOOL_OVERRIDES,
    buildToolManifest: buildToolManifest,
    validateToolManifest: validateToolManifest,
    loadDefaultToolManifest: loadDefaultToolManifest,
    getToolManifestForRouter: getToolManifestForRouter,
  };
});
