/**
 * Ask AfroTools AI saved projects.
 *
 * Local-first project history for workflow cards. Signed-in sync is explicit
 * and uses the existing AfroWorkspace bridge when available.
 */
(function initAiSavedProjects(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAISavedProjects = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiSavedProjects(root) {
  "use strict";

  var STORAGE_KEY = "afrotools.aiSavedProjects.v1";
  var ANON_KEY = "afrotools.aiSavedProjects.anonKey";
  var MAX_LOCAL_PROJECTS = 30;
  var MAX_SUMMARY = 220;
  var MAX_TITLE = 90;
  var SENSITIVE_KEY_PATTERN = /(raw|full|body|content|document|pdf|cv|resume|coverletter|cover_letter|profiletext|starterprofile|email|phone|address|clientname|customername|name|linkedin|portfolio|certificate|employer|company|identity|passport|nin|idnumber)/i;
  var ALLOWED_INPUT_KEYS = [
    "country", "countryCode", "destinationCountry", "originCountry", "targetCountry", "city", "currency",
    "studyLevel", "field", "gpa", "ieltsScore", "budget", "budgetAmount", "intakeTimeline",
    "targetRole", "careerStage", "sector", "experienceYears", "experienceLevel", "languagePreference", "skills",
    "itemCategory", "productCategory", "vehicleType", "make", "model", "year", "engineCc", "purchasePrice",
    "itemValue", "shippingCost", "insuranceCost", "fxRate", "port",
    "userType", "monthlyBill", "monthlyGeneratorSpend", "generatorSpend", "generatorSizeKva",
    "generatorHoursPerDay", "fuelType", "loadSizeKw", "outageHours", "backupHours", "budgetRange",
    "workflowKind", "numberOfEmployees", "employeeCount", "grossPay", "salaryBand", "payPeriod",
    "deductionsBenefits", "invoiceAmount", "amount", "vatTreatment", "vatRate", "taxRate",
    "lineItemDescription", "businessType", "businessTask", "pdfAction",
    "location", "targetCity", "homeCountry", "monthlyIncome", "monthlyBudget", "monthlyExpenses",
    "rent", "housingCost", "transportCost", "foodCost", "utilityCost", "utilitiesCost",
    "internetCost", "householdSize", "familySize", "dependents", "lifestyle", "incomeBand", "expenseBand"
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function storage() {
    try {
      return root && root.localStorage ? root.localStorage : null;
    } catch (err) {
      return null;
    }
  }

  function readJson(key, fallback, targetStorage) {
    var store = targetStorage || storage();
    if (!store) return fallback;
    try {
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value, targetStorage) {
    var store = targetStorage || storage();
    if (!store) return false;
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function text(value, limit) {
    var clean = String(value === undefined || value === null ? "" : value).replace(/\s+/g, " ").trim();
    var max = limit || MAX_SUMMARY;
    return clean.length > max ? clean.slice(0, max - 3).trim() + "..." : clean;
  }

  function slug(value) {
    return text(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
  }

  function makeId(seed) {
    var random = "";
    try {
      if (root && root.crypto && typeof root.crypto.getRandomValues === "function") {
        var bytes = new Uint32Array(2);
        root.crypto.getRandomValues(bytes);
        random = Array.prototype.map.call(bytes, function (item) { return item.toString(36); }).join("");
      }
    } catch (err) {}
    if (!random) random = Math.random().toString(36).slice(2, 10);
    return "ai-" + slug(seed || "project").slice(0, 36) + "-" + Date.now().toString(36) + "-" + random;
  }

  function getAnonymousKey(targetStorage) {
    var store = targetStorage || storage();
    if (!store) return "local-anonymous";
    var existing = "";
    try { existing = store.getItem(ANON_KEY) || ""; } catch (err) {}
    if (existing) return existing;
    var key = "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    try { store.setItem(ANON_KEY, key); } catch (err) {}
    return key;
  }

  function isSensitiveKey(key) {
    return SENSITIVE_KEY_PATTERN.test(String(key || ""));
  }

  function sanitizeValue(value, depth) {
    if (depth > 3) return undefined;
    if (value === undefined || value === null) return value;
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "string") return text(value, 160);
    if (Array.isArray(value)) {
      return value.slice(0, 8).map(function (item) { return sanitizeValue(item, depth + 1); }).filter(function (item) {
        return item !== undefined && item !== "";
      });
    }
    if (typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (key) {
        if (isSensitiveKey(key)) return;
        var sanitized = sanitizeValue(value[key], depth + 1);
        if (sanitized !== undefined && sanitized !== "") out[key] = sanitized;
      });
      return out;
    }
    return undefined;
  }

  function sanitizeInputs(inputs) {
    var source = inputs || {};
    var out = {};
    ALLOWED_INPUT_KEYS.forEach(function (key) {
      if (isSensitiveKey(key)) return;
      if (source[key] === undefined || source[key] === null || source[key] === "") return;
      var sanitized = sanitizeValue(source[key], 0);
      if (sanitized !== undefined && sanitized !== "") out[key] = sanitized;
    });
    return out;
  }

  function sanitizeLinks(links) {
    if (!Array.isArray(links)) return [];
    return links.slice(0, 6).map(function (link) {
      return {
        label: text(link && link.label || "Export", 48),
        href: safeHref(link && link.href || ""),
        type: text(link && link.type || "", 32),
      };
    }).filter(function (link) { return link.href || link.label; });
  }

  function safeHref(href) {
    var raw = String(href || "").trim();
    if (!raw) return "";
    if (/^(javascript|data):/i.test(raw)) return "";
    return raw.slice(0, 300);
  }

  function titleFor(state, options) {
    var workflow = text(options && options.workflowTitle || state && state.selectedToolId || "AI workflow", MAX_TITLE);
    var country = state && state.extractedInputs && (state.extractedInputs.country || state.extractedInputs.destinationCountry || state.extractedInputs.targetCountry);
    return text((country ? workflow + " - " + country : workflow), MAX_TITLE);
  }

  function resultSummaryFor(state, options) {
    var summaries = [];
    var panels = [
      state && state.educationPlan,
      state && state.careerWorkflow,
      state && state.importAdvisorPlan,
      state && state.energyAdvisorPlan,
      state && state.smeFinancePlan
    ];
    panels.forEach(function (plan) {
      if (!plan) return;
      if (plan.goalSummary) summaries.push(plan.goalSummary);
      if (plan.decision && plan.decision.headline) summaries.push(plan.decision.headline);
      if (plan.recommendedTool) summaries.push("Recommended: " + plan.recommendedTool);
      if (plan.estimate && plan.estimate.totalLandedCost) summaries.push("Estimate ready with landed-cost assumptions.");
    });
    if (options && options.resultSummary) summaries.push(options.resultSummary);
    return text(summaries.join(" "), MAX_SUMMARY) || "Saved AfroTools AI workflow. Reopen the command page to continue.";
  }

  function createProjectFromState(state, options) {
    var opts = options || {};
    var mergedInputs = Object.assign({}, state && state.extractedInputs || {}, state && state.clarificationAnswers || {});
    var created = opts.createdAt || nowIso();
    var workflowType = text(opts.workflowType || state && state.selectedToolId || "unknown", 80);
    var title = titleFor(state || {}, opts);
    return {
      projectId: opts.projectId || makeId(title),
      userId: opts.userId || "",
      localAnonymousStorageKey: opts.localAnonymousStorageKey || getAnonymousKey(opts.storage),
      workflowType: workflowType,
      title: title,
      nonSensitiveSummary: text(opts.nonSensitiveSummary || resultSummaryFor(state || {}, opts), MAX_SUMMARY),
      structuredInputs: sanitizeInputs(mergedInputs),
      resultSummary: sanitizeValue(opts.resultSummaryObject || {
        selectedToolId: state && state.selectedToolId || "",
        selectedToolRoute: safeHref(state && state.selectedToolRoute || ""),
        confidence: state && Number(state.confidence || 0) || 0,
        source: state && state.source || "",
        missingInputs: Array.isArray(state && state.missingInputs) ? state.missingInputs.slice(0, 8).map(text) : [],
      }, 0),
      exportLinks: sanitizeLinks(opts.exportLinks || []),
      continueUrl: safeHref(opts.continueUrl || (state && state.selectedToolRoute) || "/ai/"),
      createdAt: created,
      updatedAt: opts.updatedAt || created,
      storageMode: opts.storageMode || "local",
    };
  }

  function listLocal(options) {
    var opts = options || {};
    var items = readJson(STORAGE_KEY, [], opts.storage);
    return Array.isArray(items) ? items.slice().sort(function (a, b) {
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    }).slice(0, opts.limit || MAX_LOCAL_PROJECTS) : [];
  }

  function saveLocal(project, options) {
    var opts = options || {};
    var item = Object.assign({}, project || {});
    if (!item.projectId) item.projectId = makeId(item.title || item.workflowType);
    if (!item.localAnonymousStorageKey) item.localAnonymousStorageKey = getAnonymousKey(opts.storage);
    item.updatedAt = nowIso();
    if (!item.createdAt) item.createdAt = item.updatedAt;
    item.storageMode = item.storageMode || "local";
    var items = listLocal({ storage: opts.storage, limit: MAX_LOCAL_PROJECTS });
    var next = [item].concat(items.filter(function (candidate) { return candidate.projectId !== item.projectId; })).slice(0, MAX_LOCAL_PROJECTS);
    return writeJson(STORAGE_KEY, next, opts.storage) ? item : null;
  }

  function deleteLocal(projectId, options) {
    var opts = options || {};
    var id = String(projectId || "");
    var items = listLocal({ storage: opts.storage, limit: MAX_LOCAL_PROJECTS });
    var next = items.filter(function (project) { return project.projectId !== id; });
    return writeJson(STORAGE_KEY, next, opts.storage);
  }

  function isSignedIn() {
    try {
      return Boolean(root && root.AfroWorkspace && typeof root.AfroWorkspace.isSignedIn === "function" && root.AfroWorkspace.isSignedIn());
    } catch (err) {
      return false;
    }
  }

  async function syncProject(project, options) {
    var opts = options || {};
    var workspace = opts.workspace || root.AfroWorkspace;
    if (!opts.explicitConsent) return { synced: false, reason: "consent_required" };
    if (!workspace || typeof workspace.upsert !== "function" || !(typeof workspace.isSignedIn !== "function" || workspace.isSignedIn())) {
      return { synced: false, reason: "not_signed_in" };
    }
    var safeProject = createProjectFromState({}, {
      projectId: project.projectId,
      userId: project.userId || "",
      localAnonymousStorageKey: project.localAnonymousStorageKey || "",
      workflowType: project.workflowType,
      workflowTitle: project.title,
      nonSensitiveSummary: project.nonSensitiveSummary,
      resultSummaryObject: project.resultSummary,
      exportLinks: project.exportLinks,
      continueUrl: project.continueUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
    safeProject.structuredInputs = sanitizeInputs(project.structuredInputs || {});
    var item = await workspace.upsert({
      itemType: "ai-project",
      itemKey: safeProject.projectId,
      toolSlug: "ask-afrotools-ai",
      title: safeProject.title,
      summary: safeProject.nonSensitiveSummary,
      href: safeProject.continueUrl || "/ai/",
      payload: safeProject,
      meta: {
        workflowType: safeProject.workflowType,
        storageMode: "account",
        privacy: "sanitized-ai-project",
      },
    });
    safeProject.userId = item && item.user_id || safeProject.userId || "";
    safeProject.storageMode = "account";
    return { synced: true, item: item || null, project: safeProject };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    ANON_KEY: ANON_KEY,
    MAX_LOCAL_PROJECTS: MAX_LOCAL_PROJECTS,
    createProjectFromState: createProjectFromState,
    sanitizeInputs: sanitizeInputs,
    sanitizeValue: sanitizeValue,
    listLocal: listLocal,
    saveLocal: saveLocal,
    deleteLocal: deleteLocal,
    syncProject: syncProject,
    isSignedIn: isSignedIn,
    getAnonymousKey: getAnonymousKey,
  };
});
