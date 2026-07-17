#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const corpusBuilder = require("./generate-ai-tool-call-corpus.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const promptRegistry = require("../assets/js/ai/prompt-registry.js");
const invocationRuntime = require("../assets/js/ai/tool-invocation-runtime.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_REPORT = path.join(ROOT, "data", "ai", "tool-call-eval-report.json");
const MIN_EXACT_TOOL_PASS_RATE = 0.98;
const MIN_EXECUTABLE_PASS_RATE = 1;
const MIN_URL_PRIVACY_PASS_RATE = 1;
const PUBLIC_ROUTE_FIELDS = new Set([
  "country",
  "countryCode",
  "destinationCountry",
  "originCountry",
  "targetCountry",
  "city",
  "currency",
  "year",
  "payPeriod",
  "studyLevel",
  "field",
  "productCategory",
  "enterpriseType",
  "crop",
  "pdfAction",
  "outputDesired",
  "vatTreatment",
]);

const CATEGORY_COMPATIBILITY = {
  education: ["education", "scholarships", "study-abroad"],
  career: ["career", "cv-jobs", "career-documents"],
  sme: ["business-tax", "salary-tax", "business-planning", "invoices", "finance"],
  trade: ["trade", "import-duty", "customs-duty", "vehicle-import"],
  energy: ["energy", "solar-energy", "fuel-energy", "solar-roi", "fuel-prices"],
  "local-life": ["local-life", "relocation-planning", "cost-of-living", "study-abroad", "immigration"],
  documents: ["documents", "pdf-tools"],
  construction: ["construction", "floor-planning", "construction-budget", "construction-boq", "construction-materials"],
  agriculture: ["agriculture", "crop-yield", "farm-profit", "market-prices"],
  "country-intelligence": ["country-intelligence"],
};

function rate(passed, total) {
  return total ? Number((passed / total).toFixed(4)) : 0;
}

function cleanCategory(value) {
  return String(value || "").toLowerCase();
}

function categoryCompatible(expected, actual) {
  const expectedClean = cleanCategory(expected);
  const actualClean = cleanCategory(actual);
  if (!expectedClean || !actualClean) return false;
  if (expectedClean === actualClean) return true;
  return (CATEGORY_COMPATIBILITY[expectedClean] || []).indexOf(actualClean) !== -1;
}

function byId(manifest) {
  return new Map(manifest.map((entry) => [entry.id, entry]));
}

function sorted(values) {
  return Array.from(values || []).map(String).sort();
}

function possibleSensitiveValues(inputs) {
  return Object.entries(inputs || {})
    .filter(([key, value]) => !PUBLIC_ROUTE_FIELDS.has(key) && value !== null && value !== undefined && value !== "")
    .map(([, value]) => String(value))
    .filter((value) => value.length >= 3 && !/^[A-Z]{2,3}$/.test(value));
}

function launchUrlKeepsInputsPrivate(execution, decision) {
  const url = String(execution && execution.launchUrl || "").toLowerCase();
  const leaked = possibleSensitiveValues(decision && decision.extractedInputs).filter((value) => {
    return url.indexOf(String(value).toLowerCase()) !== -1;
  });
  return { passed: leaked.length === 0, leaked };
}

function selectedToolCall(tool, decision) {
  return manifestApi.buildToolInvocation(tool, {
    providedInputNames: Object.keys(decision.extractedInputs || {}),
    missingInputNames: Array.isArray(decision.missingInputs) ? decision.missingInputs : [],
  });
}

function evaluateRecord(record, manifestMap, manifest) {
  const promptText = record.messages && record.messages[0] && record.messages[0].content || "";
  const decision = router.routeDeterministically(promptText, { manifest });
  const validation = router.validateRouterOutput(decision);
  const tool = manifestMap.get(decision.selectedToolId);
  const toolCall = tool ? selectedToolCall(tool, decision) : record.expected.toolCall;
  const execution = invocationRuntime.buildExecution({
    toolId: decision.selectedToolId,
    selectedRoute: decision.selectedRoute,
    extractedInputs: decision.extractedInputs || {},
    toolCall,
  });
  const privacy = launchUrlKeepsInputsPrivate(execution, decision);
  const exactTool = decision.selectedToolId === record.expected.selectedToolId;
  const categoryMatch = categoryCompatible(record.expected.intentCategory, decision.intentCategory);
  const executable = Boolean(execution && execution.canLaunch && String(execution.launchUrl || "").charAt(0) === "/");
  const runtimeContract = execution && execution.type === "afrotools_existing_tool_execution" && execution.toolCall && execution.toolCall.type === "existing_tool_call";
  const routingFixture = record.source === "routing_eval_fixture";
  const missingInputMatch = !routingFixture || JSON.stringify(sorted(decision.missingInputs)) === JSON.stringify(sorted(record.expected.missingInputs));
  const errors = [];
  if (!validation.valid) errors.push("router output invalid: " + validation.errors.join("; "));
  if (!exactTool) errors.push("selectedToolId expected " + record.expected.selectedToolId + " got " + decision.selectedToolId);
  if (!categoryMatch) errors.push("category expected compatible with " + record.expected.intentCategory + " got " + decision.intentCategory);
  if (!executable) errors.push("runtime execution did not produce a root-relative launch URL");
  if (!runtimeContract) errors.push("runtime execution contract is invalid");
  if (!privacy.passed) errors.push("launch URL leaked extracted values: " + privacy.leaked.join(", "));
  if (!missingInputMatch) errors.push("routing fixture missing inputs expected " + JSON.stringify(sorted(record.expected.missingInputs)) + " got " + JSON.stringify(sorted(decision.missingInputs)));
  return {
    id: record.id,
    source: record.source,
    split: record.split,
    category: record.expected.intentCategory,
    promptLength: promptText.length,
    expectedToolId: record.expected.selectedToolId,
    selectedToolId: decision.selectedToolId,
    selectedRoute: decision.selectedRoute,
    exactTool,
    categoryMatch,
    executable,
    runtimeContract,
    urlPrivacyPassed: privacy.passed,
    missingInputMatch,
    passed: errors.length === 0,
    errors,
  };
}

function bucketAdd(bucket, item) {
  bucket.total += 1;
  if (item.passed) bucket.passed += 1;
  if (item.exactTool) bucket.exactTool += 1;
  if (item.categoryMatch) bucket.categoryMatch += 1;
  if (item.executable && item.runtimeContract) bucket.executable += 1;
  if (item.urlPrivacyPassed) bucket.urlPrivacy += 1;
  if (item.missingInputMatch) bucket.missingInputMatch += 1;
}

function emptyBucket() {
  return {
    total: 0,
    passed: 0,
    exactTool: 0,
    categoryMatch: 0,
    executable: 0,
    urlPrivacy: 0,
    missingInputMatch: 0,
  };
}

function finalizeBucket(bucket) {
  return Object.assign({}, bucket, {
    passRate: rate(bucket.passed, bucket.total),
    exactToolPassRate: rate(bucket.exactTool, bucket.total),
    categoryPassRate: rate(bucket.categoryMatch, bucket.total),
    executablePassRate: rate(bucket.executable, bucket.total),
    urlPrivacyPassRate: rate(bucket.urlPrivacy, bucket.total),
    missingInputMatchRate: rate(bucket.missingInputMatch, bucket.total),
  });
}

function summarize(records, results) {
  const promptMeta = promptRegistry.getProductionPrompt("router.classify-intent");
  const totals = emptyBucket();
  const bySource = {};
  const bySplit = {};
  const byCategory = {};
  results.forEach((item) => {
    bucketAdd(totals, item);
    bySource[item.source] = bySource[item.source] || emptyBucket();
    bySplit[item.split] = bySplit[item.split] || emptyBucket();
    byCategory[item.category] = byCategory[item.category] || emptyBucket();
    bucketAdd(bySource[item.source], item);
    bucketAdd(bySplit[item.split], item);
    bucketAdd(byCategory[item.category], item);
  });
  const reportTotals = finalizeBucket(totals);
  const gate = {
    minExactToolPassRate: MIN_EXACT_TOOL_PASS_RATE,
    minExecutablePassRate: MIN_EXECUTABLE_PASS_RATE,
    minUrlPrivacyPassRate: MIN_URL_PRIVACY_PASS_RATE,
    passed: reportTotals.exactToolPassRate >= MIN_EXACT_TOOL_PASS_RATE &&
      reportTotals.executablePassRate >= MIN_EXECUTABLE_PASS_RATE &&
      reportTotals.urlPrivacyPassRate >= MIN_URL_PRIVACY_PASS_RATE,
  };
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_tool_call_routing_eval",
    prompt: {
      promptId: promptMeta.promptId,
      promptVersion: promptMeta.version,
      evalDataset: promptMeta.evalDataset,
      minEvalPassRate: promptMeta.minEvalPassRate,
    },
    corpus: {
      recordCount: records.length,
      syntheticOnly: true,
      containsRealUserData: false,
    },
    gate,
    totals: reportTotals,
    bySource: Object.fromEntries(Object.entries(bySource).map(([key, value]) => [key, finalizeBucket(value)])),
    bySplit: Object.fromEntries(Object.entries(bySplit).map(([key, value]) => [key, finalizeBucket(value)])),
    byCategory: Object.fromEntries(Object.entries(byCategory).sort().map(([key, value]) => [key, finalizeBucket(value)])),
    failures: results.filter((item) => !item.passed).slice(0, 30).map((item) => ({
      id: item.id,
      source: item.source,
      category: item.category,
      expectedToolId: item.expectedToolId,
      selectedToolId: item.selectedToolId,
      errors: item.errors.slice(),
    })),
  };
}

function runEvaluation() {
  const corpus = corpusBuilder.buildCorpus();
  if (corpus.errors.length) {
    throw new Error("Cannot evaluate invalid tool-call corpus:\n" + corpus.errors.join("\n"));
  }
  const manifest = manifestApi.getToolManifestForRouter();
  const manifestMap = byId(manifest);
  const results = corpus.records.map((record) => evaluateRecord(record, manifestMap, manifest));
  return {
    records: corpus.records,
    results,
    report: summarize(corpus.records, results),
  };
}

function writeReport(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const write = args.includes("--write");
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0 && args[reportIndex + 1] ? path.resolve(args[reportIndex + 1]) : DEFAULT_REPORT;
  const result = runEvaluation();
  if (write) writeReport(reportPath, result.report);
  if (json) {
    console.log(JSON.stringify(result.report, null, 2));
  } else {
    console.log("AI tool-call corpus eval: " + result.report.totals.passed + "/" + result.report.totals.total + " records passed");
    console.log("Exact tool pass rate: " + result.report.totals.exactToolPassRate);
    console.log("Executable pass rate: " + result.report.totals.executablePassRate);
    console.log("URL privacy pass rate: " + result.report.totals.urlPrivacyPassRate);
    console.log("Gate: " + (result.report.gate.passed ? "passed" : "failed"));
  }
  if (!result.report.gate.passed) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  runEvaluation,
  evaluateRecord,
  summarize,
};
