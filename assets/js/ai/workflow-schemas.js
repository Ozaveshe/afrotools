/**
 * Structured output schemas for AfroTools AI workflows.
 *
 * The module is intentionally dependency-free so it can run in browser pages,
 * Netlify functions, and Node tests. It validates model-assisted JSON before
 * UI rendering and enforces disclaimer/source metadata for high-stakes domains.
 */
(function initWorkflowSchemas(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIWorkflowSchemas = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorkflowSchemas() {
  "use strict";

  var SCHEMA_VERSION = 1;
  var SAFETY_DOMAINS = ["none", "tax", "immigration", "legal", "health", "finance", "employment", "education", "energy", "construction"];
  var HIGH_STAKES_DOMAINS = ["tax", "immigration", "legal", "health", "finance", "employment", "education", "energy", "construction"];
  var PRIVACY_MODES = ["browser_local", "server_required", "ai_optional", "account_optional"];
  var FRESHNESS_STATUSES = ["fresh", "acceptable", "stale", "unknown", "unavailable"];
  var SOURCE_TYPES = ["official", "regulator", "central_bank", "university", "foundation", "reviewed_dataset", "third_party_snapshot", "user_input", "estimate"];
  var SOURCE_CONFIDENCE = ["official_verified", "reviewed", "estimated", "low_confidence", "user_entered"];
  var ROUTE_RESULT_CONFIDENCE = ["high", "medium", "low"];

  function field(type, options) {
    return Object.assign({ type: type }, options || {});
  }

  var BASE_SOURCE_FIELDS = {
    sourceName: field("string", { required: true }),
    sourceUrl: field("string"),
    sourceType: field("enum", { enum: SOURCE_TYPES }),
    countryCodes: field("array"),
    effectiveFrom: field("string"),
    effectiveTo: field("string"),
    lastCheckedAt: field("string"),
    lastReviewedAt: field("string"),
    freshnessStatus: field("enum", { required: true, enum: FRESHNESS_STATUSES }),
    confidence: field("enum", { required: true, enum: SOURCE_CONFIDENCE }),
    notes: field("string"),
  };

  var SCHEMAS = {
    IntentRouteResult: {
      description: "Validated route decision from Ask AfroTools AI.",
      fields: {
        schemaVersion: field("number"),
        intentCategory: field("string", { required: true }),
        selectedToolId: field("string", { required: true }),
        selectedRoute: field("route", { required: true }),
        category: field("string"),
        confidence: field("confidence", { required: true }),
        reasonShort: field("string"),
        extractedInputs: field("object", { required: true }),
        missingInputs: field("array", { required: true }),
        clarificationQuestion: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
        highStakesNotice: field("string"),
        privacyMode: field("enum", { required: true, enum: PRIVACY_MODES }),
        canPrefill: field("boolean"),
        suggestedNextActions: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
      },
    },
    ClarificationQuestion: {
      description: "A single missing-input question shown before tool launch.",
      fields: {
        schemaVersion: field("number"),
        workflowType: field("string", { required: true }),
        fieldName: field("string", { required: true }),
        question: field("string", { required: true }),
        inputType: field("enum", { required: true, enum: ["text", "number", "currency", "select", "multi_select", "date", "country", "boolean"] }),
        options: field("array"),
        required: field("boolean", { required: true }),
        helpText: field("string"),
        privacyMode: field("enum", { required: true, enum: PRIVACY_MODES }),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    ToolPrefillPayload: {
      description: "Safe reviewed handoff payload for opening an existing tool.",
      fields: {
        schemaVersion: field("number"),
        workflowType: field("string", { required: true }),
        selectedToolId: field("string", { required: true }),
        selectedRoute: field("route", { required: true }),
        fields: field("object", { required: true }),
        missingInputs: field("array"),
        privacyMode: field("enum", { required: true, enum: PRIVACY_MODES }),
        handoffMode: field("enum", { enum: ["session_storage", "local_storage", "query_safe", "route_only"] }),
        userReviewRequired: field("boolean", { required: true }),
        expiresAt: field("string"),
        disclaimer: field("string"),
        sources: field("sources"),
        safetyDomain: field("enum", { enum: SAFETY_DOMAINS }),
      },
    },
    WorkflowBrief: {
      description: "Generic practical workflow brief used by exports and result panels.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        workflowType: field("string", { required: true }),
        title: field("string", { required: true }),
        userGoal: field("string", { required: true }),
        summary: field("string", { required: true }),
        inputsUsed: field("object", { required: true }),
        assumptions: field("array", { required: true }),
        resultSummary: field("array"),
        nextSteps: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    SourceAwareExplanation: {
      description: "Source-aware explanation of a calculation or workflow result.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        answer: field("string", { required: true }),
        keyPoints: field("array", { required: true, minItems: 1 }),
        assumptions: field("array", { required: true }),
        sources: field("sources"),
        freshnessStatus: field("enum", { required: true, enum: FRESHNESS_STATUSES }),
        confidence: field("enum", { required: true, enum: SOURCE_CONFIDENCE }),
        nextSteps: field("array"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    CVStarterDraft: {
      description: "Career-safe CV starter draft that avoids fabricated credentials.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        country: field("string", { required: true }),
        targetRole: field("string", { required: true }),
        careerStage: field("string", { required: true }),
        sector: field("string"),
        profileSummary: field("string", { required: true }),
        skills: field("array", { required: true, minItems: 1 }),
        sections: field("object", { required: true }),
        atsGuidance: field("array", { required: true }),
        warnings: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        privacyMode: field("enum", { required: true, enum: PRIVACY_MODES }),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    ScholarshipPlan: {
      description: "Scholarship and study-abroad plan with cost gaps and deadlines.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        originCountry: field("string", { required: true }),
        targetCountry: field("string", { required: true }),
        studyLevel: field("string", { required: true }),
        field: field("string"),
        budget: field("object", { required: true }),
        fitSummary: field("string", { required: true }),
        costGap: field("object", { required: true }),
        scholarshipMatches: field("array", { required: true }),
        documents: field("array", { required: true, minItems: 1 }),
        deadlines: field("array", { required: true }),
        nextSteps: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    ImportEstimateBrief: {
      description: "Import-duty planning estimate with source confidence.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        destinationCountry: field("string", { required: true }),
        originCountry: field("string"),
        productCategory: field("string", { required: true }),
        vehicle: field("object"),
        cif: field("object", { required: true }),
        dutyTaxEstimate: field("object", { required: true }),
        clearingPortEstimate: field("object", { required: true }),
        totalLandedCost: field("object", { required: true }),
        assumptions: field("array", { required: true, minItems: 1 }),
        officialVerificationChecklist: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    EnergyDecisionBrief: {
      description: "Solar/generator decision brief with tariff and fuel assumptions.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        country: field("string", { required: true }),
        city: field("string"),
        userType: field("string", { required: true }),
        monthlyGeneratorCost: field("object", { required: true }),
        annualFuelExposure: field("object", { required: true }),
        roughSystemSize: field("object", { required: true }),
        paybackEstimate: field("string", { required: true }),
        installerQuestions: field("array", { required: true, minItems: 1 }),
        risks: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    SMEFinanceBrief: {
      description: "Payroll, PAYE, VAT, invoice, or SME finance workflow brief.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        country: field("string", { required: true }),
        financeWorkflowType: field("enum", { required: true, enum: ["payroll", "paye", "vat", "invoice", "cashflow", "business_registration"] }),
        inputsUsed: field("object", { required: true }),
        resultSummary: field("array", { required: true, minItems: 1 }),
        complianceWarnings: field("array", { required: true, minItems: 1 }),
        exportOptions: field("array"),
        partnerSurfaces: field("array"),
        nextSteps: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    ConstructionPlanningBrief: {
      description: "Construction, floor-planning, or AfroDraft planning brief.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        country: field("string"),
        city: field("string"),
        plot: field("object"),
        buildingType: field("string", { required: true }),
        rooms: field("object"),
        planningBrief: field("string", { required: true }),
        assumptions: field("array", { required: true, minItems: 1 }),
        suggestedToolRoute: field("route", { required: true }),
        materialEstimateRoute: field("route"),
        approvalWarning: field("string", { required: true }),
        nextSteps: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
    LocalLifeBudgetBrief: {
      description: "Cost-of-living, rent affordability, savings, or relocation brief.",
      requiresHighStakesFields: true,
      fields: {
        schemaVersion: field("number"),
        origin: field("object"),
        destination: field("object", { required: true }),
        incomeOrBudget: field("object", { required: true }),
        affordabilityEstimate: field("string", { required: true }),
        budgetBreakdown: field("array", { required: true, minItems: 1 }),
        missingCostsChecklist: field("array", { required: true, minItems: 1 }),
        fxAssumptions: field("array", { required: true }),
        nextTools: field("array", { required: true, minItems: 1 }),
        sources: field("sources"),
        disclaimer: field("string"),
        safetyDomain: field("enum", { required: true, enum: SAFETY_DOMAINS }),
      },
    },
  };

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function normalizeSchemaName(name) {
    return Object.prototype.hasOwnProperty.call(SCHEMAS, name) ? name : "";
  }

  function addError(errors, path, message) {
    errors.push(path + " " + message);
  }

  function validateSource(source, index, options, errors) {
    var path = "sources[" + index + "]";
    if (!isPlainObject(source)) {
      addError(errors, path, "must be an object");
      return;
    }
    validateFields(BASE_SOURCE_FIELDS, source, path, options, errors);
    if (source.sourceUrl) {
      if (!/^https?:\/\//i.test(String(source.sourceUrl))) addError(errors, path + ".sourceUrl", "must be http(s)");
      if (options && Array.isArray(options.allowedSourceUrls) && options.allowedSourceUrls.length && options.allowedSourceUrls.indexOf(source.sourceUrl) === -1) {
        addError(errors, path + ".sourceUrl", "must come from allowed source metadata");
      }
    }
  }

  function validateValue(spec, value, path, options, errors) {
    if (value === undefined || value === null || value === "") {
      if (spec.required) addError(errors, path, "is required");
      return;
    }
    if (spec.type === "string") {
      if (typeof value !== "string" || (spec.required && !value.trim())) addError(errors, path, "must be a non-empty string");
      return;
    }
    if (spec.type === "number") {
      if (!Number.isFinite(Number(value))) addError(errors, path, "must be a number");
      return;
    }
    if (spec.type === "boolean") {
      if (typeof value !== "boolean") addError(errors, path, "must be a boolean");
      return;
    }
    if (spec.type === "array") {
      if (!Array.isArray(value)) {
        addError(errors, path, "must be an array");
      } else if (spec.minItems && value.length < spec.minItems) {
        addError(errors, path, "must include at least " + spec.minItems + " item(s)");
      }
      return;
    }
    if (spec.type === "object") {
      if (!isPlainObject(value)) addError(errors, path, "must be an object");
      return;
    }
    if (spec.type === "enum") {
      if (spec.enum.indexOf(value) === -1) addError(errors, path, "must be one of: " + spec.enum.join(", "));
      return;
    }
    if (spec.type === "route") {
      if (!isNonEmptyString(value) || value.charAt(0) !== "/" || /^\/\//.test(value)) addError(errors, path, "must be a root-relative route");
      return;
    }
    if (spec.type === "confidence") {
      if (typeof value === "number" || typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
        var numeric = Number(value);
        if (numeric < 0 || numeric > 1) addError(errors, path, "must be between 0 and 1");
      } else if (ROUTE_RESULT_CONFIDENCE.indexOf(value) === -1) {
        addError(errors, path, "must be numeric 0-1 or high, medium, low");
      }
      return;
    }
    if (spec.type === "sources") {
      if (!Array.isArray(value)) {
        addError(errors, path, "must be an array");
      } else {
        value.forEach(function eachSource(source, index) {
          validateSource(source, index, options, errors);
        });
      }
    }
  }

  function validateFields(fields, payload, basePath, options, errors) {
    Object.keys(fields).forEach(function eachField(name) {
      validateValue(fields[name], payload[name], basePath ? basePath + "." + name : name, options, errors);
    });
  }

  function isHighStakesDomain(domain) {
    return HIGH_STAKES_DOMAINS.indexOf(domain) !== -1;
  }

  function requiresHighStakesFields(schema, payload) {
    if (!payload) return false;
    return Boolean(schema && schema.requiresHighStakesFields) || isHighStakesDomain(payload.safetyDomain);
  }

  function validateHighStakes(schema, payload, errors) {
    if (!requiresHighStakesFields(schema, payload)) return;
    if (!isNonEmptyString(payload.disclaimer) && !isNonEmptyString(payload.highStakesNotice) && !isNonEmptyString(payload.approvalWarning)) {
      errors.push("high-stakes outputs require disclaimer, highStakesNotice, or approvalWarning");
    }
    if (!Array.isArray(payload.sources) || payload.sources.length === 0) {
      errors.push("high-stakes outputs require at least one source metadata entry");
    }
  }

  function validateStructuredOutput(schemaName, payload, options) {
    var normalizedName = normalizeSchemaName(schemaName);
    var errors = [];
    if (!normalizedName) {
      return { valid: false, schemaName: schemaName || "", errors: ["unknown schema: " + String(schemaName || "")] };
    }
    if (!isPlainObject(payload)) {
      return { valid: false, schemaName: normalizedName, errors: ["payload must be an object"] };
    }
    var schema = SCHEMAS[normalizedName];
    validateFields(schema.fields, payload, "", options || {}, errors);
    validateHighStakes(schema, payload, errors);
    return { valid: errors.length === 0, schemaName: normalizedName, errors: errors };
  }

  function jsonTextFromMarkdown(value) {
    return String(value === undefined || value === null ? "" : value).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  }

  function parseStructuredOutput(schemaName, value, options) {
    var payload = value;
    var errors = [];
    if (typeof value === "string") {
      try {
        payload = JSON.parse(jsonTextFromMarkdown(value));
      } catch (err) {
        return { ok: false, schemaName: schemaName || "", value: null, errors: ["invalid JSON"] };
      }
    }
    var validation = validateStructuredOutput(schemaName, payload, options || {});
    if (!validation.valid) errors = validation.errors;
    return { ok: validation.valid, schemaName: validation.schemaName, value: validation.valid ? payload : null, errors: errors };
  }

  function getSchema(schemaName) {
    var normalizedName = normalizeSchemaName(schemaName);
    return normalizedName ? SCHEMAS[normalizedName] : null;
  }

  function listSchemas() {
    return Object.keys(SCHEMAS);
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    SAFETY_DOMAINS: SAFETY_DOMAINS,
    HIGH_STAKES_DOMAINS: HIGH_STAKES_DOMAINS,
    PRIVACY_MODES: PRIVACY_MODES,
    FRESHNESS_STATUSES: FRESHNESS_STATUSES,
    SOURCE_TYPES: SOURCE_TYPES,
    SOURCE_CONFIDENCE: SOURCE_CONFIDENCE,
    SCHEMAS: SCHEMAS,
    listSchemas: listSchemas,
    getSchema: getSchema,
    validateStructuredOutput: validateStructuredOutput,
    parseStructuredOutput: parseStructuredOutput,
    jsonTextFromMarkdown: jsonTextFromMarkdown,
    isHighStakesDomain: isHighStakesDomain,
  };
});
