const assert = require("assert");

global.Blob = global.Blob || require("buffer").Blob;
global.AfroTools = {
  pdf: {
    async generate(config) {
      global.__capturedWorkflowPdf = config;
      return { fileName: "workflow-brief.pdf" };
    }
  }
};

const workflowExport = require("../assets/js/ai/workflow-export.js");

const importPlan = {
  goalSummary: "Plan 2016 Toyota Axio into Nigeria.",
  estimateStatus: "Planning estimate",
  inputs: {
    destinationCountry: "Nigeria",
    make: "Toyota",
    model: "Axio",
    year: "2016",
    purchasePrice: 8500,
    shippingCost: 1200,
    originalQuery: "How much duty for my exact private prompt?",
    providerToken: "secret-token",
    internalTraceId: "trace-123",
    requestId: "request-123",
    runId: "run-123",
    conversationId: "conversation-123",
    email: "person@example.com",
    phone: "+234000000000"
  },
  estimate: {
    cif: 9950,
    totalUSD: 14250,
    totalLocal: 22800000
  },
  metrics: [
    { label: "CIF", value: "USD 9,950" },
    { label: "Total landed cost", value: "USD 14,250 / NGN 22,800,000" }
  ],
  assumptions: [
    "CIF is purchase price plus shipping/freight plus insurance.",
    "No final customs assessment is implied."
  ],
  sourceConfidence: [
    "Reviewed AfroTools import-duty planning assumptions.",
    "User-entered price and FX are not independently verified."
  ],
  checklist: ["HS classification", "customs value", "customs FX rate"],
  warning: "Planning estimate only; final customs assessment may differ."
};

const energyPlan = {
  goalSummary: "Assess solar and backup power for shop in Lagos.",
  inputs: {
    country: "Nigeria",
    city: "Lagos",
    userType: "shop",
    monthlyBill: 120000,
    rawPrompt: "private raw energy prompt",
    debugDiagnostics: "hidden stack",
    sessionToken: "session-secret"
  },
  decision: {
    headline: "Quote needed before decision"
  },
  formatted: {
    monthlyGeneratorCost: "NGN 80,000",
    annualFuelExposure: "NGN 960,000",
    payback: "4.2 years"
  },
  estimates: {
    roughSystemKw: 5
  },
  sourceState: {
    tariff: { label: "Reviewed tariff snapshot", confidence: "Medium", freshness: "2026-05-01" },
    fuel: { label: "Fuel price monitor", confidence: "Medium", freshness: "2026-05-10" },
    solarYield: { label: "Solar yield model", confidence: "Medium", freshness: "2026-04-30" }
  },
  installerQuestions: ["What are the exact essential loads?", "What battery warranty applies?"],
  warning: "Planning estimate only; installer design may differ."
};

const importReport = workflowExport.fromImportAdvisorPlan(importPlan);
assert.strictEqual(importReport.title, "Import Advisor Decision Brief");
assert.strictEqual(importReport.workflowType, "import_advisor");
assert.strictEqual(importReport.inputsUsed.destinationCountry, "Nigeria");
assert.strictEqual(importReport.inputsUsed.purchasePrice, 8500);
assert.strictEqual(importReport.inputsUsed.originalQuery, undefined);
assert.strictEqual(importReport.inputsUsed.providerToken, undefined);
assert.strictEqual(importReport.inputsUsed.internalTraceId, undefined);
assert.strictEqual(importReport.inputsUsed.requestId, undefined);
assert.strictEqual(importReport.inputsUsed.runId, undefined);
assert.strictEqual(importReport.inputsUsed.conversationId, undefined);
assert.strictEqual(importReport.inputsUsed.email, undefined);
assert.strictEqual(importReport.inputsUsed.phone, undefined);
assert(importReport.resultSummary.some((line) => line.includes("Total landed cost")));
assert(importReport.nextSteps.includes("HS classification"));

const importText = workflowExport.toText(importReport);
assert(importText.includes("Inputs used"));
assert(importText.includes("Source, freshness, and confidence"));
assert(!importText.includes("secret-token"));
assert(!importText.includes("trace-123"));
assert(!importText.includes("request-123"));
assert(!importText.includes("run-123"));
assert(!importText.includes("conversation-123"));
assert(!importText.includes("person@example.com"));
assert(!importText.includes("How much duty for my exact private prompt"));

const importJson = workflowExport.toJson(importReport);
assert(importJson.includes('"title": "Import Advisor Decision Brief"'));
assert(!importJson.includes("secret-token"));
assert(!importJson.includes("request-123"));
assert(!importJson.includes("conversation-123"));

const checklist = workflowExport.toChecklistText(importReport);
assert(checklist.includes("Checklist"));
assert(checklist.includes("HS classification"));

const whatsApp = workflowExport.toWhatsAppText(importReport);
assert(whatsApp.length < importText.length);
assert(!whatsApp.includes("secret-token"));
assert(workflowExport.buildWhatsAppUrl(importReport).startsWith("https://wa.me/?text="));

const email = workflowExport.toEmailText(importReport);
assert.strictEqual(email.subject, "Import Advisor Decision Brief");
assert(email.body.includes("Planning estimate only"));
assert(workflowExport.buildEmailUrl(importReport).startsWith("mailto:?subject="));

const energyReport = workflowExport.fromEnergyAdvisorPlan(energyPlan);
assert.strictEqual(energyReport.title, "Solar and Generator Decision Brief");
assert.strictEqual(energyReport.workflowType, "energy_advisor");
assert.strictEqual(energyReport.inputsUsed.country, "Nigeria");
assert.strictEqual(energyReport.inputsUsed.rawPrompt, undefined);
assert.strictEqual(energyReport.inputsUsed.debugDiagnostics, undefined);
assert.strictEqual(energyReport.inputsUsed.sessionToken, undefined);
assert(energyReport.resultSummary.some((line) => line.includes("Monthly generator cost")));
assert(energyReport.sourceConfidence.some((line) => line.includes("Fuel price monitor")));

const normalized = workflowExport.normalizeReport({
  title: "Unsafe report",
  userGoal: "Goal",
  inputsUsed: {
    _internal: "hidden",
    authorization: "Bearer secret",
    userId: "user-1",
    requestId: "request-1",
    traceId: "trace-1",
    runId: "run-1",
    conversationId: "conversation-1",
    country: "Kenya"
  },
  resultSummary: "Ready"
});
assert.deepStrictEqual(normalized.inputsUsed, { country: "Kenya" });
assert.strictEqual(normalized.resultSummary[0], "Ready");

workflowExport.copyToClipboard(importReport, { mode: "checklist" }).then((copyResult) => {
  assert.strictEqual(copyResult.copied, false);
  assert.strictEqual(copyResult.reason, "clipboard_unavailable");
  assert(copyResult.text.includes("Checklist"));
  assert(!copyResult.text.includes("secret-token"));
  return workflowExport.downloadPdfReport(importReport, {
    toolId: "import-duty",
    category: "trade"
  });
}).then((pdfResult) => {
  assert.strictEqual(pdfResult.fileName, "workflow-brief.pdf");
  const captured = global.__capturedWorkflowPdf;
  assert.strictEqual(captured.title, "Import Advisor Decision Brief");
  assert.strictEqual(captured.toolId, "import-duty");
  assert.strictEqual(captured.category, "trade");
  assert(captured.sections.some((section) => section.title === "Inputs used"));
  assert(captured.sections.some((section) => section.title === "Source and confidence"));
  const serialized = JSON.stringify(captured);
  assert(!serialized.includes("secret-token"));
  assert(!serialized.includes("request-123"));
  assert(!serialized.includes("conversation-123"));
  assert(!serialized.includes("How much duty for my exact private prompt"));
}).then(() => {
  console.log("ai-workflow-export tests passed");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
