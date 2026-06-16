#!/usr/bin/env node

const assert = require("assert");
const schemas = require("../assets/js/ai/workflow-schemas.js");
const providerApi = require("../netlify/functions/_shared/ai-provider.js");

function source(overrides) {
  return Object.assign({
    sourceName: "AfroTools reviewed dataset",
    sourceUrl: "https://afrotools.com/data/source-registry",
    sourceType: "reviewed_dataset",
    countryCodes: ["NG"],
    lastCheckedAt: "2026-06-01",
    lastReviewedAt: "2026-06-01",
    freshnessStatus: "acceptable",
    confidence: "reviewed",
    notes: "Reviewed planning source for structured-output validation."
  }, overrides || {});
}

const sharedHighStakes = {
  sources: [source()],
  disclaimer: "Planning estimate only. Verify with official sources or a qualified professional before acting.",
};

const validExamples = {
  IntentRouteResult: Object.assign({
    schemaVersion: 1,
    intentCategory: "energy",
    selectedToolId: "solar-roi",
    selectedRoute: "/tools/solar-roi/",
    confidence: 0.82,
    reasonShort: "Matched solar and generator planning keywords.",
    extractedInputs: { country: "Nigeria", city: "Lagos" },
    missingInputs: ["monthlyBill"],
    clarificationQuestion: "What is your current monthly bill or generator spend?",
    safetyDomain: "energy",
    highStakesNotice: "Planning estimate only. Confirm tariffs and installation sizing with current suppliers.",
    privacyMode: "browser_local",
    canPrefill: true,
    suggestedNextActions: ["Answer missing load details", "Open Solar ROI"]
  }, { sources: [source({ sourceType: "estimate", confidence: "estimated" })] }),
  ClarificationQuestion: {
    schemaVersion: 1,
    workflowType: "import_advisor",
    fieldName: "purchasePrice",
    question: "What purchase price should AfroTools use?",
    inputType: "currency",
    options: [],
    required: true,
    helpText: "Use an editable planning value.",
    privacyMode: "browser_local",
    safetyDomain: "none"
  },
  ToolPrefillPayload: Object.assign({
    schemaVersion: 1,
    workflowType: "import_advisor",
    selectedToolId: "import-duty",
    selectedRoute: "/tools/import-duty/",
    fields: { destinationCountry: "Nigeria", productCategory: "vehicle" },
    missingInputs: ["shipping"],
    privacyMode: "browser_local",
    handoffMode: "session_storage",
    userReviewRequired: true,
    expiresAt: "2026-06-16T12:00:00.000Z",
    safetyDomain: "finance"
  }, sharedHighStakes),
  WorkflowBrief: Object.assign({
    schemaVersion: 1,
    workflowType: "education",
    title: "Study Abroad Planner",
    userGoal: "Study in Canada from Nigeria with USD 8,000.",
    summary: "Budget likely needs scholarship support and document planning.",
    inputsUsed: { originCountry: "Nigeria", targetCountry: "Canada" },
    assumptions: ["Tuition and living costs vary by province."],
    resultSummary: ["Scholarship search recommended."],
    nextSteps: ["Open Scholarship Finder"],
    safetyDomain: "education"
  }, sharedHighStakes),
  SourceAwareExplanation: Object.assign({
    schemaVersion: 1,
    answer: "The estimate is useful for planning, but not an official assessment.",
    keyPoints: ["CIF and FX assumptions drive the result."],
    assumptions: ["User-entered item value is not independently verified."],
    freshnessStatus: "acceptable",
    confidence: "reviewed",
    nextSteps: ["Check official customs guidance"],
    safetyDomain: "finance"
  }, sharedHighStakes),
  CVStarterDraft: Object.assign({
    schemaVersion: 1,
    country: "Ghana",
    targetRole: "Electrical Engineer",
    careerStage: "mid-career",
    sector: "engineering",
    profileSummary: "Electrical engineer starter summary based on the target role only.",
    skills: ["Electrical design", "Maintenance planning"],
    sections: { experience: [], education: [], projects: [] },
    atsGuidance: ["Use role-specific keywords only where true."],
    warnings: ["Do not fabricate degrees, employers, certifications, dates, or achievements."],
    privacyMode: "browser_local",
    safetyDomain: "employment"
  }, sharedHighStakes),
  ScholarshipPlan: Object.assign({
    schemaVersion: 1,
    originCountry: "Nigeria",
    targetCountry: "Canada",
    studyLevel: "masters",
    field: "engineering",
    budget: { amount: 8000, currency: "USD" },
    fitSummary: "Scholarship-first path recommended.",
    costGap: { estimatedGap: 12000, currency: "USD" },
    scholarshipMatches: [{ name: "Reviewed scholarship shortlist", fit: "medium" }],
    documents: ["Transcript", "Passport", "Statement of purpose"],
    deadlines: [{ label: "Fall intake", date: "2027-01-15" }],
    nextSteps: ["Open Scholarship Finder with this profile"],
    safetyDomain: "education"
  }, sharedHighStakes),
  ImportEstimateBrief: Object.assign({
    schemaVersion: 1,
    destinationCountry: "Nigeria",
    originCountry: "Japan",
    productCategory: "vehicle",
    vehicle: { make: "Toyota", model: "Axio", year: 2016 },
    cif: { amount: 9200, currency: "USD" },
    dutyTaxEstimate: { amount: 3200, currency: "USD" },
    clearingPortEstimate: { amount: 900, currency: "USD" },
    totalLandedCost: { amount: 13300, currency: "USD" },
    assumptions: ["Uses planning duty bands and user-entered price."],
    officialVerificationChecklist: ["Confirm HS classification", "Confirm customs value", "Confirm FX rate"],
    safetyDomain: "finance"
  }, sharedHighStakes),
  EnergyDecisionBrief: Object.assign({
    schemaVersion: 1,
    country: "Nigeria",
    city: "Lagos",
    userType: "shop",
    monthlyGeneratorCost: { amount: 80000, currency: "NGN" },
    annualFuelExposure: { amount: 960000, currency: "NGN" },
    roughSystemSize: { value: 5, unit: "kW" },
    paybackEstimate: "3-5 years before site-specific quote.",
    installerQuestions: ["What essential loads must stay on?"],
    risks: ["Fuel, tariff, and battery costs can change."],
    safetyDomain: "energy"
  }, sharedHighStakes),
  SMEFinanceBrief: Object.assign({
    schemaVersion: 1,
    country: "Kenya",
    financeWorkflowType: "payroll",
    inputsUsed: { numberOfEmployees: 5, payPeriod: "monthly" },
    resultSummary: ["Open PAYE calculator with editable salary rows."],
    complianceWarnings: ["Not tax, legal, payroll, or accounting advice."],
    exportOptions: ["json", "pdf"],
    partnerSurfaces: [{ label: "Accounting partner", sponsored: true }],
    nextSteps: ["Verify with KRA or a qualified accountant"],
    safetyDomain: "tax"
  }, sharedHighStakes),
  ConstructionPlanningBrief: Object.assign({
    schemaVersion: 1,
    country: "Nigeria",
    city: "Benin City",
    plot: { size: 450, unit: "sqm" },
    buildingType: "bungalow",
    rooms: { bedrooms: 2 },
    planningBrief: "Draft a simple two-bedroom planning layout.",
    assumptions: ["Planning sketch only; no engineering certification."],
    suggestedToolRoute: "/engineering/floor-planner/",
    materialEstimateRoute: "/tools/building-materials/",
    approvalWarning: "Confirm planning, structural, and local approval requirements with qualified professionals.",
    nextSteps: ["Open Floor Planner", "Open material estimator"],
    safetyDomain: "construction"
  }, sharedHighStakes),
  LocalLifeBudgetBrief: Object.assign({
    schemaVersion: 1,
    origin: { country: "Nigeria", city: "Lagos" },
    destination: { country: "Kenya", city: "Nairobi" },
    incomeOrBudget: { amount: 1200, currency: "USD" },
    affordabilityEstimate: "Possible with tight housing and transport assumptions.",
    budgetBreakdown: [{ category: "Rent", amount: 450, currency: "USD" }],
    missingCostsChecklist: ["Health insurance", "Deposits", "One-time setup"],
    fxAssumptions: ["Uses editable USD planning values."],
    nextTools: [{ toolId: "cost-of-living", route: "/tools/cost-of-living/" }],
    safetyDomain: "finance"
  }, sharedHighStakes)
};

assert.deepStrictEqual(schemas.listSchemas(), [
  "IntentRouteResult",
  "ClarificationQuestion",
  "ToolPrefillPayload",
  "WorkflowBrief",
  "SourceAwareExplanation",
  "CVStarterDraft",
  "ScholarshipPlan",
  "ImportEstimateBrief",
  "EnergyDecisionBrief",
  "SMEFinanceBrief",
  "ConstructionPlanningBrief",
  "LocalLifeBudgetBrief"
]);

Object.entries(validExamples).forEach(([schemaName, example]) => {
  const result = schemas.validateStructuredOutput(schemaName, example);
  assert.strictEqual(result.valid, true, schemaName + " should be valid: " + result.errors.join("; "));
});

{
  const invalid = schemas.validateStructuredOutput("ImportEstimateBrief", Object.assign({}, validExamples.ImportEstimateBrief, {
    sources: [],
    disclaimer: "",
  }));
  assert.strictEqual(invalid.valid, false);
  assert(invalid.errors.some((error) => error.includes("high-stakes outputs require")));
}

{
  const invalid = schemas.validateStructuredOutput("IntentRouteResult", Object.assign({}, validExamples.IntentRouteResult, {
    selectedRoute: "https://evil.example/tool",
  }));
  assert.strictEqual(invalid.valid, false);
  assert(invalid.errors.some((error) => error.includes("selectedRoute")));
}

{
  const invalid = schemas.validateStructuredOutput("SourceAwareExplanation", Object.assign({}, validExamples.SourceAwareExplanation, {
    sources: [source({ sourceUrl: "https://fabricated.example/source" })],
  }), {
    allowedSourceUrls: ["https://afrotools.com/data/source-registry"],
  });
  assert.strictEqual(invalid.valid, false);
  assert(invalid.errors.some((error) => error.includes("allowed source metadata")));
}

{
  const parsed = schemas.parseStructuredOutput("WorkflowBrief", "```json\n" + JSON.stringify(validExamples.WorkflowBrief) + "\n```");
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.value.title, "Study Abroad Planner");
}

{
  const parsed = schemas.parseStructuredOutput("WorkflowBrief", "not json");
  assert.strictEqual(parsed.ok, false);
  assert(parsed.errors.includes("invalid JSON"));
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async function () {
      return body;
    },
  };
}

function anthropicText(text) {
  return {
    content: [{ text }],
    usage: { input_tokens: 9, output_tokens: 7 },
  };
}

async function runProviderSchemaChecks() {
  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "generateWorkflowBrief",
      fetch: async function () {
        return response(200, anthropicText(JSON.stringify(validExamples.WorkflowBrief)));
      },
    });
    const result = await provider.generateWorkflowBrief({
      system: "Return WorkflowBrief JSON.",
      prompt: "Use structured output.",
      schemaName: "WorkflowBrief",
      allowedSourceUrls: ["https://afrotools.com/data/source-registry"],
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.schemaName, "WorkflowBrief");
    assert.strictEqual(result.data.title, "Study Abroad Planner");
    assert.strictEqual(result.text, "");
  }

  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "generateWorkflowBrief",
      fetch: async function () {
        return response(200, anthropicText(JSON.stringify(Object.assign({}, validExamples.WorkflowBrief, {
          sources: [],
          disclaimer: "",
        }))));
      },
    });
    const result = await provider.generateWorkflowBrief({
      system: "Return WorkflowBrief JSON.",
      prompt: "Use structured output.",
      schemaName: "WorkflowBrief",
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorReason, "response_schema_validation_failed");
    assert(result.validationErrors.some((error) => error.includes("high-stakes outputs require")));
  }
}

runProviderSchemaChecks().then(() => {
  console.log("AI workflow schema tests passed.");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
