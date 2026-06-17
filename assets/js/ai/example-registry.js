/**
 * Central registry for Ask AfroTools AI example prompts.
 *
 * Keep this file data-first: pages, widgets, generators, and tests should read
 * from here instead of hardcoding their own prompt lists.
 */
(function initPromptExamples(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIPromptExamples = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createPromptExamplesApi() {
  "use strict";

  /**
   * @typedef {"education"|"career"|"sme"|"trade"|"energy"|"local-life"|"documents"|"construction"|"agriculture"|"country-intelligence"|"government"|"african"|"legal"|"telecom"} PromptCategory
   * @typedef {"homepage_command"|"homepage_legacy"|"ai_hub"|"ai_vertical"|"ai_widget"|"eval"} PromptDisplaySurface
   *
   * @typedef {Object} PromptExample
   * @property {string} id
   * @property {string} text
   * @property {PromptCategory} category
   * @property {string[]} countryTags
   * @property {string} language
   * @property {string} expectedToolId
   * @property {string} expectedRoute
   * @property {Object} toolCall
   * @property {PromptDisplaySurface[]} displaySurface
   * @property {number} priority
   */

  var VALID_CATEGORIES = [
    "education",
    "career",
    "sme",
    "trade",
    "energy",
    "local-life",
    "documents",
    "construction",
    "agriculture",
    "country-intelligence",
    "government",
    "african",
    "legal",
    "telecom",
  ];

  var VALID_SURFACES = [
    "homepage_command",
    "homepage_legacy",
    "ai_hub",
    "ai_vertical",
    "ai_widget",
    "eval",
  ];

  var PROMPT_EXAMPLE_SCHEMA = {
    schemaVersion: 1,
    requiredFields: [
      "id",
      "text",
      "category",
      "countryTags",
      "language",
      "expectedToolId",
      "expectedRoute",
      "toolCall",
      "displaySurface",
      "priority",
    ],
    enums: {
      category: VALID_CATEGORIES,
      displaySurface: VALID_SURFACES,
    },
  };

  var EXPECTED_TOOL_ROUTES = {
    "afroatlas": "/tools/afroatlas/",
    "afroplan-floor-planner": "/engineering/floor-planner/",
    "boq-generator": "/tools/boq-builder/",
    "building-materials": "/tools/building-materials/",
    "business-planner": "/tools/business-planner/",
    "cocoa-tracker": "/agriculture/cocoa-tracker/",
    "construction-budget": "/tools/construction-budget/",
    "cost-of-living": "/tools/cost-of-living/",
    "cover-letter": "/tools/cover-letter-generator/",
    "crop-yield-estimator": "/agriculture/crop-yield/",
    "cv-builder": "/tools/cv-builder/",
    "fish-farming-roi": "/agriculture/fish-farming/",
    "fuel-tracker": "/tools/fuel-tracker/",
    "import-duty": "/tools/import-duty/",
    "invoice-generator": "/tools/invoice-generator/",
    "irrigation-calculator": "/agriculture/irrigation/",
    "japa-calculator": "/tools/japa-calculator/",
    "land-title-check": "/tools/land-title-check/",
    "mobile-money-fees": "/tools/mobile-money-fees/",
    "nda-generator": "/tools/nda-generator/",
    "passport-checklist": "/tools/passport-checklist/",
    "paye-calculator": "/tools/paye-calculator",
    "pdf-workspace": "/tools/pdf-workspace/",
    "poultry-roi-calculator": "/agriculture/poultry-roi/",
    "rent-affordability": "/tools/rent-affordability/",
    "scholarship-finder": "/tools/scholarship-finder/",
    "solar-roi": "/tools/solar-roi/",
    "study-abroad-cost": "/tools/study-abroad-cost/",
    "telecom-starlink": "/telecom/starlink-compare/",
  };

  function buildToolCall(expectedToolId, category) {
    return {
      type: "existing_tool_call",
      action: "open_existing_tool",
      toolId: expectedToolId,
      route: EXPECTED_TOOL_ROUTES[expectedToolId] || "/search/",
      category: category,
      invocationMode: "route_only",
      canPrefill: false,
    };
  }

  /** @type {PromptExample[]} */
  var PROMPT_EXAMPLES = [
    prompt("passport-checklist-gh", "Get Ghana passport documents, fees to check, and next steps", "government", ["GH"], "passport-checklist", ["homepage_command", "ai_hub", "ai_vertical", "ai_widget", "eval"], 112),
    prompt("mobile-money-fees-ke", "Compare M-Pesa fees in Kenya and find the cheapest send option", "african", ["KE"], "mobile-money-fees", ["homepage_command", "ai_hub", "ai_vertical", "ai_widget", "eval"], 111),
    prompt("nda-client-gh", "Draft a Ghana client NDA and open the document generator", "legal", ["GH"], "nda-generator", ["homepage_command", "ai_hub", "ai_vertical", "eval"], 110),
    prompt("study-canada-ng-home", "Plan Nigeria to Canada study with USD 8,000, scholarships, and documents", "education", ["NG", "CA"], "study-abroad-cost", ["homepage_command"], 109),
    prompt("study-canada-ng", "I want to study in Canada from Nigeria with a budget of $8,000", "education", ["NG", "CA"], "study-abroad-cost", ["homepage_legacy", "ai_hub", "ai_vertical", "ai_widget", "eval"], 100),
    prompt("scholarships-gh-uk", "Find scholarships for a Ghanaian master's student in public health in the UK", "education", ["GH", "GB"], "scholarship-finder", ["ai_vertical", "eval"], 86),
    prompt("study-germany-cm", "Plan Germany study abroad from Cameroon with no IELTS yet", "education", ["CM", "DE"], "study-abroad-cost", ["ai_vertical", "eval"], 80),
    prompt("study-australia-ke", "Which documents should a Kenyan student prepare for Australia intake?", "education", ["KE", "AU"], "study-abroad-cost", ["ai_vertical"], 72),
    prompt("scholarships-cm", "Find scholarships for a Cameroonian student and save next steps", "education", ["CM"], "scholarship-finder", ["ai_vertical"], 64),

    prompt("cv-engineer-gh", "Build a Ghana electrical engineer CV and open the CV Builder", "career", ["GH"], "cv-builder", ["homepage_command", "homepage_legacy", "ai_hub", "ai_vertical", "ai_widget", "eval"], 108),
    prompt("cover-letter-accountant-ke", "Create a cover letter for a junior accountant role in Kenya", "career", ["KE"], "cover-letter", ["ai_vertical", "eval"], 82),
    prompt("ats-data-za", "Help me improve my ATS score for a South Africa data analyst CV", "career", ["ZA"], "cv-builder", ["ai_vertical", "eval"], 76),
    prompt("job-pack-ng", "Make a job application pack for a Nigerian graduate trainee role", "career", ["NG"], "cv-builder", ["ai_vertical"], 68),

    prompt("payroll-ke", "Run Kenya payroll for 5 employees and prepare a review checklist", "sme", ["KE"], "paye-calculator", ["homepage_command", "ai_hub", "ai_vertical", "ai_widget", "eval"], 99),
    prompt("vat-invoice-gh", "Create a VAT invoice in Ghana for GHS 12,000", "sme", ["GH"], "invoice-generator", ["ai_vertical", "eval"], 84),
    prompt("ghana-paye-monthly", "What PAYE should I estimate for a Ghana employee earning 6,000 monthly?", "sme", ["GH"], "paye-calculator", ["ai_vertical", "eval"], 78),
    prompt("business-registration-ng", "Help me register a small business and get a TIN in Nigeria", "sme", ["NG"], "business-planner", ["ai_vertical"], 66),

    prompt("import-axio-ng", "Estimate a 2016 Toyota Axio landed cost into Nigeria before clearing", "trade", ["NG"], "import-duty", ["homepage_command", "homepage_legacy", "ai_hub", "ai_vertical", "ai_widget", "eval"], 107),
    prompt("electronics-ghana", "Estimate landed cost for electronics from China to Ghana", "trade", ["GH", "CN"], "import-duty", ["ai_vertical", "eval"], 82),
    prompt("clothing-kenya", "What should I ask a clearing agent before importing clothing into Kenya?", "trade", ["KE"], "import-duty", ["ai_vertical", "eval"], 74),
    prompt("machinery-tanzania", "Help me compare CIF, duty and port charges for machinery into Tanzania", "trade", ["TZ"], "import-duty", ["ai_vertical"], 68),

    prompt("solar-shop-lagos", "Compare solar vs generator costs for a Lagos shop", "energy", ["NG"], "solar-roi", ["homepage_command", "ai_hub", "ai_vertical", "ai_widget", "eval"], 100),
    prompt("generator-nairobi", "Estimate generator cost for a Nairobi home running 4 hours daily", "energy", ["KE"], "fuel-tracker", ["ai_vertical", "eval"], 82),
    prompt("solar-accra-office", "Compare solar payback for an Accra office with a diesel generator", "energy", ["GH"], "solar-roi", ["ai_vertical", "eval"], 76),
    prompt("solar-johannesburg-small-business", "What questions should a Johannesburg small business ask a solar installer?", "energy", ["ZA"], "solar-roi", ["ai_vertical"], 68),

    prompt("live-nairobi-budget", "Can I live in Nairobi on a budget of $1,200 per month?", "local-life", ["KE"], "cost-of-living", ["ai_hub", "ai_vertical", "ai_widget", "eval"], 92),
    prompt("compare-lagos-accra", "Compare living costs between Lagos and Accra for a remote worker", "local-life", ["NG", "GH"], "cost-of-living", ["ai_vertical", "eval"], 78),
    prompt("relocation-ng-uk", "How much should I save before moving from Lagos to London?", "local-life", ["NG", "GB"], "japa-calculator", ["ai_vertical", "eval"], 72),
    prompt("rent-johannesburg", "What rent can I afford in Johannesburg on ZAR 28,000 monthly?", "local-life", ["ZA"], "rent-affordability", ["ai_vertical"], 64),

    prompt("compress-sign-pdf", "Compress, sign, and export a PDF locally without uploading it", "documents", [], "pdf-workspace", ["homepage_command", "ai_hub", "ai_widget", "eval"], 106),
    prompt("merge-pdf", "Merge three PDF files and keep the output local", "documents", [], "pdf-workspace", ["eval"], 70),
    prompt("watermark-pdf", "Add a watermark to a contract PDF", "documents", [], "pdf-workspace", ["eval"], 62),

    prompt("floor-plan-benin", "Design a simple 2-bedroom floor plan for a 450 sqm plot in Benin City", "construction", ["NG"], "afroplan-floor-planner", ["ai_vertical", "ai_widget", "eval"], 90),
    prompt("floor-plan-plot", "Plan a two-bedroom floor layout for a narrow plot", "construction", [], "afroplan-floor-planner", ["ai_vertical"], 76),
    prompt("renovation-lagos", "Estimate renovation costs for a small shop in Lagos", "construction", ["NG"], "construction-budget", ["ai_vertical", "eval"], 70),
    prompt("boq-kenya", "Create a BOQ checklist for a small house in Kenya", "construction", ["KE"], "boq-generator", ["ai_vertical", "eval"], 68),
    prompt("building-materials-room", "Estimate blocks and cement for a small room", "construction", [], "building-materials", ["eval"], 64),

    prompt("maize-yield-ng", "Estimate maize yield for a 2 hectare farm in Nigeria", "agriculture", ["NG"], "crop-yield-estimator", ["ai_widget", "eval"], 88),
    prompt("poultry-ghana", "Calculate poultry ROI for 500 broilers in Ghana", "agriculture", ["GH"], "poultry-roi-calculator", ["eval"], 78),
    prompt("fish-kenya", "Plan fish farming ROI for tilapia in Kenya", "agriculture", ["KE"], "fish-farming-roi", ["eval"], 74),
    prompt("cocoa-cdi", "Plan cocoa farm-gate price risk in Cote d'Ivoire", "agriculture", ["CI"], "cocoa-tracker", ["eval"], 70),
    prompt("irrigation-senegal", "Plan irrigation water needs for onions in Senegal", "agriculture", ["SN"], "irrigation-calculator", ["eval"], 66),

    prompt("rwanda-business", "What should I know before starting a business in Rwanda?", "country-intelligence", ["RW"], "afroatlas", ["ai_widget", "eval"], 86),
    prompt("compare-ghana-kenya", "Compare Ghana and Kenya for a remote worker", "country-intelligence", ["GH", "KE"], "afroatlas", ["eval"], 78),
    prompt("move-sa-ng", "What are the main costs of moving to South Africa from Nigeria?", "country-intelligence", ["ZA", "NG"], "afroatlas", ["eval"], 72),
    prompt("land-title-lagos", "Check land title before buying land in Lagos", "legal", ["NG"], "land-title-check", ["ai_vertical", "eval"], 84),
    prompt("starlink-ng", "Compare Starlink vs MTN or fibre internet for a Nigeria office", "telecom", ["NG"], "telecom-starlink", ["homepage_command", "ai_vertical", "eval"], 105),
  ];

  function prompt(id, text, category, countryTags, expectedToolId, displaySurface, priority) {
    return {
      id: id,
      text: text,
      category: category,
      countryTags: countryTags.slice(),
      language: "en",
      expectedToolId: expectedToolId,
      expectedRoute: EXPECTED_TOOL_ROUTES[expectedToolId] || "/search/",
      toolCall: buildToolCall(expectedToolId, category),
      displaySurface: displaySurface.slice(),
      priority: priority,
    };
  }

  function includesSurface(example, surface) {
    return !surface || example.displaySurface.indexOf(surface) !== -1;
  }

  function cloneExample(example) {
    return {
      id: example.id,
      text: example.text,
      category: example.category,
      countryTags: example.countryTags.slice(),
      language: example.language,
      expectedToolId: example.expectedToolId,
      expectedRoute: example.expectedRoute,
      toolCall: Object.assign({}, example.toolCall || {}),
      displaySurface: example.displaySurface.slice(),
      priority: example.priority,
    };
  }

  function sortExamples(a, b) {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }

  function getPromptExamples(options) {
    var opts = options || {};
    var category = opts.category || "";
    var language = opts.language || "en";
    var surface = opts.surface || "";
    var country = String(opts.countryTag || opts.country || "").toUpperCase();
    var limit = Number(opts.limit || 0);
    var items = PROMPT_EXAMPLES.filter(function (example) {
      if (category && example.category !== category) return false;
      if (language && example.language !== language) return false;
      if (!includesSurface(example, surface)) return false;
      if (country && example.countryTags.indexOf(country) === -1) return false;
      return true;
    }).sort(sortExamples).map(cloneExample);
    return limit > 0 ? items.slice(0, limit) : items;
  }

  function getPromptExampleById(id) {
    for (var i = 0; i < PROMPT_EXAMPLES.length; i += 1) {
      if (PROMPT_EXAMPLES[i].id === id) return cloneExample(PROMPT_EXAMPLES[i]);
    }
    return null;
  }

  function getPromptText(id, fallback) {
    var example = getPromptExampleById(id);
    return example ? example.text : String(fallback || "");
  }

  function getPromptExamplesForSurface(surface, options) {
    return getPromptExamples(Object.assign({}, options || {}, { surface: surface }));
  }

  function getPromptExamplesByCategory(category, options) {
    return getPromptExamples(Object.assign({}, options || {}, { category: category }));
  }

  function validatePromptExamples(examples, options) {
    var list = Array.isArray(examples) ? examples : PROMPT_EXAMPLES;
    var opts = options || {};
    var expectedToolIds = opts.expectedToolIds || null;
    var expectedToolMap = opts.expectedToolMap || null;
    var seen = {};
    var errors = [];
    list.forEach(function (example, index) {
      PROMPT_EXAMPLE_SCHEMA.requiredFields.forEach(function (field) {
        if (example[field] == null || example[field] === "") errors.push("Prompt example " + index + " is missing " + field + ".");
      });
      if (seen[example.id]) errors.push("Duplicate prompt example id: " + example.id);
      seen[example.id] = true;
      if (VALID_CATEGORIES.indexOf(example.category) === -1) errors.push("Invalid category for " + example.id + ": " + example.category);
      if (!Array.isArray(example.countryTags)) errors.push("countryTags must be an array for " + example.id);
      if (!Array.isArray(example.displaySurface) || !example.displaySurface.length) {
        errors.push("displaySurface must be a non-empty array for " + example.id);
      } else {
        example.displaySurface.forEach(function (surface) {
          if (VALID_SURFACES.indexOf(surface) === -1) errors.push("Invalid displaySurface for " + example.id + ": " + surface);
        });
      }
      if (typeof example.priority !== "number" || !isFinite(example.priority)) errors.push("priority must be a number for " + example.id);
      if (expectedToolIds && !expectedToolIds.has(example.expectedToolId)) {
        errors.push("Invalid expectedToolId for " + example.id + ": " + example.expectedToolId);
      }
      if (!example.expectedRoute || typeof example.expectedRoute !== "string" || example.expectedRoute.charAt(0) !== "/") {
        errors.push("expectedRoute must be root-relative for " + example.id);
      }
      if (!example.toolCall || example.toolCall.type !== "existing_tool_call") {
        errors.push("toolCall must describe an existing tool call for " + example.id);
      } else {
        if (example.toolCall.toolId !== example.expectedToolId) errors.push("toolCall.toolId must match expectedToolId for " + example.id);
        if (example.toolCall.route !== example.expectedRoute) errors.push("toolCall.route must match expectedRoute for " + example.id);
      }
      if (expectedToolMap && expectedToolMap.has(example.expectedToolId)) {
        var expectedTool = expectedToolMap.get(example.expectedToolId);
        if (expectedTool && expectedTool.route !== example.expectedRoute) {
          errors.push("expectedRoute for " + example.id + " must match manifest route " + expectedTool.route);
        }
      }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  return {
    PROMPT_EXAMPLE_SCHEMA: PROMPT_EXAMPLE_SCHEMA,
    PROMPT_EXAMPLES: PROMPT_EXAMPLES.map(cloneExample),
    VALID_CATEGORIES: VALID_CATEGORIES.slice(),
    VALID_SURFACES: VALID_SURFACES.slice(),
    getPromptExamples: getPromptExamples,
    getPromptExampleById: getPromptExampleById,
    getPromptText: getPromptText,
    getPromptExamplesForSurface: getPromptExamplesForSurface,
    getPromptExamplesByCategory: getPromptExamplesByCategory,
    validatePromptExamples: validatePromptExamples,
  };
});
