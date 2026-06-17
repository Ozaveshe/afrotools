#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const manifestApi = require("../assets/js/ai/tool-manifest.js");
const promptRegistry = require("../assets/js/ai/prompt-registry.js");
const corpusBuilder = require("./generate-ai-tool-call-corpus.js");
const splitBuilder = require("./build-ai-model-training-splits.js");
const evalRunner = require("./evaluate-ai-tool-call-corpus.js");
const catalogPackBuilder = require("./generate-ai-tool-catalog-pack.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "ai", "ai-system-readiness-report.json");
const MIN_MANIFEST_ENTRIES = 1000;
const MIN_CORPUS_RECORDS = 100;
const MIN_CATEGORY_COVERAGE = 20;
const MIN_HELD_OUT_CATEGORIES = 12;

function pass(label, passed, detail) {
  return { label, passed: Boolean(passed), detail: detail || "" };
}

function gateSummary(checks) {
  const failed = checks.filter((check) => !check.passed);
  return {
    passed: failed.length === 0,
    failedCount: failed.length,
    failedChecks: failed.map((check) => check.label),
  };
}

function categoryCountFromCorpus(records) {
  return new Set(records.map((record) => record.expected && record.expected.intentCategory || "unknown")).size;
}

function heldOutCategoryCount(records) {
  return new Set(records
    .filter((record) => record.split === "validation" || record.split === "test")
    .map((record) => record.expected && record.expected.intentCategory || "unknown")).size;
}

function productionPromptSummary() {
  const registryValidation = promptRegistry.validatePromptRegistry();
  const productionPrompts = promptRegistry.PROMPT_REGISTRY.map((prompt) => {
    const production = prompt.versions.find((version) => version.version === prompt.productionVersion && version.status === "production");
    return {
      id: prompt.id,
      owner: prompt.owner,
      method: prompt.method,
      productionVersion: prompt.productionVersion,
      evalDataset: prompt.evalDataset,
      minEvalPassRate: prompt.minEvalPassRate,
      hasProductionVersion: Boolean(production),
      forbiddenPayloads: prompt.forbiddenPayloads.slice(),
    };
  });
  return {
    valid: registryValidation.valid,
    errors: registryValidation.errors.slice(),
    productionPromptCount: productionPrompts.filter((prompt) => prompt.hasProductionVersion).length,
    prompts: productionPrompts,
  };
}

function buildReport() {
  const manifest = manifestApi.getToolManifestForRouter();
  const promptSummary = productionPromptSummary();
  const corpus = corpusBuilder.buildCorpus();
  if (corpus.errors.length) throw new Error("Cannot build readiness report from invalid corpus:\n" + corpus.errors.join("\n"));
  const splits = splitBuilder.buildSplits();
  if (splits.errors.length) throw new Error("Cannot build readiness report from invalid model splits:\n" + splits.errors.join("\n"));
  const evaluation = evalRunner.runEvaluation();
  const catalogPack = catalogPackBuilder.buildPack();
  const routerPrompt = promptRegistry.getProductionPrompt("router.classify-intent");
  const splitReport = splits.report;
  const evalReport = evaluation.report;
  const corpusCategories = categoryCountFromCorpus(corpus.records);
  const heldOutCategories = heldOutCategoryCount(splits.records);
  const readinessChecks = [
    pass("prompt_registry_valid", promptSummary.valid, promptSummary.errors.join("; ")),
    pass("router_prompt_production", Boolean(routerPrompt && routerPrompt.status === "production"), routerPrompt && routerPrompt.version),
    pass("manifest_large_enough", manifest.length >= MIN_MANIFEST_ENTRIES, manifest.length + " router-safe tools"),
    pass("tool_catalog_pack_complete", catalogPack.gate && catalogPack.gate.passed === true && catalogPack.toolCount === manifest.length, catalogPack.toolCount + " tools across " + catalogPack.chunkCount + " chunks"),
    pass("corpus_large_enough", corpus.records.length >= MIN_CORPUS_RECORDS, corpus.records.length + " synthetic records"),
    pass("category_coverage", corpusCategories >= MIN_CATEGORY_COVERAGE, corpusCategories + " categories"),
    pass("model_splits_present", splitReport.bySplit.train > 0 && splitReport.bySplit.validation > 0 && splitReport.bySplit.test > 0, JSON.stringify(splitReport.bySplit)),
    pass("held_out_category_coverage", heldOutCategories >= MIN_HELD_OUT_CATEGORIES, heldOutCategories + " held-out categories"),
    pass("tool_call_eval_gate", evalReport.gate && evalReport.gate.passed === true, "exact=" + evalReport.totals.exactToolPassRate + " executable=" + evalReport.totals.executablePassRate + " privacy=" + evalReport.totals.urlPrivacyPassRate),
    pass("synthetic_privacy_contract", corpus.report.privacy.syntheticOnly === true && splitReport.privacy.syntheticOnly === true && evalReport.corpus.containsRealUserData === false, "synthetic-only corpus and split artifacts"),
    pass("router_lab_available", fs.existsSync(path.join(ROOT, "ai", "router-lab.html")), "/ai/router-lab.html"),
  ];
  const gate = gateSummary(readinessChecks);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_ai_system_readiness",
    scope: "repo_artifacts_not_live_production",
    gate,
    checks: readinessChecks,
    promptRegistry: promptSummary,
    routerManifest: {
      routerSafeToolCount: manifest.length,
      minRequired: MIN_MANIFEST_ENTRIES,
      sampleToolIds: manifest.slice(0, 12).map((entry) => entry.id),
    },
    toolCatalogPack: {
      toolCount: catalogPack.toolCount,
      chunkCount: catalogPack.chunkCount,
      categoryCount: catalogPack.categoryCount,
      manifestHash: catalogPack.manifestHash,
      maxChunkChars: catalogPack.maxChunkChars,
      gate: catalogPack.gate,
      privacy: catalogPack.privacy,
    },
    corpus: {
      recordCount: corpus.records.length,
      categoryCount: corpusCategories,
      sourceCounts: corpus.report.bySource,
      splitCounts: corpus.report.bySplit,
      syntheticOnly: corpus.report.privacy.syntheticOnly,
    },
    modelTraining: {
      recordCount: splitReport.recordCount,
      splitCounts: splitReport.bySplit,
      heldOutCategoryCount: heldOutCategories,
      files: splitReport.files,
      privacy: splitReport.privacy,
    },
    evaluation: {
      prompt: evalReport.prompt,
      gate: evalReport.gate,
      totals: evalReport.totals,
      failureCount: evalReport.failures.length,
    },
    operations: {
      primaryRunbook: [
        "npm run ai:training-corpus",
        "npm run ai:model-splits",
        "npm run ai:tool-catalog-pack",
        "npm run eval:ai-tool-calls",
        "npm run ai:ops-report",
        "npm run test:ai",
      ],
      releaseGate: "Do not promote router prompt/model/provider changes unless this report gate and test:ai pass.",
      liveDataNote: "This report proves repo artifacts only. Live Supabase schema, provider keys, Netlify deploy health, and production traffic must be checked separately.",
    },
  };
}

function writeReport(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const json = args.includes("--json");
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT;
  const report = buildReport();
  if (write) writeReport(output, report);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("AfroTools AI system readiness: " + (report.gate.passed ? "passed" : "failed"));
    console.log("Checks: " + (report.checks.length - report.gate.failedCount) + "/" + report.checks.length + " passed");
    console.log("Manifest/corpus/splits: " + report.routerManifest.routerSafeToolCount + "/" + report.corpus.recordCount + "/" + report.modelTraining.splitCounts.train + "-" + report.modelTraining.splitCounts.validation + "-" + report.modelTraining.splitCounts.test);
    console.log("Output: " + output);
  }
  if (!report.gate.passed) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReport,
  gateSummary,
  heldOutCategoryCount,
};
