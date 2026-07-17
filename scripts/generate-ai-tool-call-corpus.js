#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const evalRunner = require("./evaluate-ai-routing.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const promptExamples = require("../assets/js/ai/example-registry.js");
const promptRegistry = require("../assets/js/ai/prompt-registry.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "ai", "tool-call-training-corpus.jsonl");
const DEFAULT_REPORT = path.join(ROOT, "data", "ai", "tool-call-training-corpus.report.json");
const SECRET_VALUE = /(?:\bmy\s+password\s+is\b|\bpassword\s*[:=]|\bsecret\s*[:=]|\bapi[_ -]?key\s*[:=]|\btoken\s*[:=]|\bbearer\s+[A-Za-z0-9._-]{8,}|\bauthorization\s*[:=])/i;
const SENSITIVE_TEXT = /\b(?:phone|email|my passport|passport (?:number|no\.?|details?)|national id|bank account|credit card|cv text|resume text|raw pdf|document text)\b/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;

function manifestById(manifest) {
  return new Map(manifest.map((entry) => [entry.id, entry]));
}

function selectedTool(manifestMap, id) {
  return manifestMap.get(id) || manifestMap.get("tool-search");
}

function compactExpected(decision, tool, sourceId) {
  const extractedInputs = Object.assign({}, decision.extractedInputs || {});
  const missingInputs = Array.isArray(decision.missingInputs) ? decision.missingInputs.slice() : [];
  const toolCall = manifestApi.buildToolInvocation(tool, {
    providedInputNames: Object.keys(extractedInputs),
    missingInputNames: missingInputs,
  });
  return {
    sourceId,
    intentCategory: decision.category || decision.intentCategory || tool.subcategory || tool.category,
    selectedToolId: tool.id,
    selectedRoute: tool.route,
    safetyDomain: decision.safetyDomain || tool.highStakesDomain,
    privacyMode: decision.privacyMode || tool.privacyMode,
    extractedInputKeys: Object.keys(extractedInputs).sort(),
    missingInputs: missingInputs.sort(),
    toolCall,
  };
}

function trainingRecord(id, source, split, promptText, expected, promptMeta) {
  return {
    schemaVersion: 1,
    id,
    source,
    split,
    task: "afrotools_tool_call_routing",
    prompt: {
      promptId: promptMeta.promptId,
      promptVersion: promptMeta.version,
      evalDataset: promptMeta.evalDataset,
      minEvalPassRate: promptMeta.minEvalPassRate,
    },
    messages: [
      {
        role: "user",
        content: promptText,
      },
    ],
    expected,
    privacy: {
      synthetic: true,
      containsRealUserData: false,
      storesRawPrivateContent: false,
      forbiddenPayloadClasses: [],
    },
  };
}

function fromRoutingFixtures(fixtures, manifestMap, promptMeta) {
  return fixtures.map((fixture) => {
    const expected = fixture.expected || {};
    const tool = selectedTool(manifestMap, expected.selectedToolId);
    return trainingRecord(
      "routing-fixture:" + fixture.id,
      "routing_eval_fixture",
      "eval",
      fixture.prompt,
      compactExpected(expected, tool, fixture.id),
      promptMeta
    );
  });
}

function fromPromptExamples(examples, manifestMap, promptMeta) {
  return examples.map((example) => {
    const tool = selectedTool(manifestMap, example.expectedToolId);
    return trainingRecord(
      "prompt-example:" + example.id,
      "prompt_example_registry",
      example.displaySurface.indexOf("eval") !== -1 ? "eval" : "train",
      example.text,
      compactExpected({
        category: example.category,
        selectedToolId: example.expectedToolId,
        safetyDomain: tool.highStakesDomain,
        privacyMode: tool.privacyMode,
        extractedInputs: {},
        missingInputs: [],
      }, tool, example.id),
      promptMeta
    );
  });
}

function validateRecord(record, manifestIds) {
  const errors = [];
  if (!record.id) errors.push("id is required");
  if (!record.source) errors.push(record.id + " source is required");
  if (!["train", "eval"].includes(record.split)) errors.push(record.id + " split must be train or eval");
  if (!record.messages || !record.messages[0] || record.messages[0].role !== "user") errors.push(record.id + " must include one user message");
  const content = record.messages && record.messages[0] && record.messages[0].content || "";
  if (!content || typeof content !== "string") errors.push(record.id + " user content must be text");
  if (SECRET_VALUE.test(content) || SENSITIVE_TEXT.test(content) || EMAIL.test(content) || PHONE.test(content)) errors.push(record.id + " contains sensitive-looking content");
  if (!record.expected || !manifestIds.has(record.expected.selectedToolId)) errors.push(record.id + " expected selectedToolId is not in manifest");
  if (!record.expected || !record.expected.toolCall || record.expected.toolCall.type !== "existing_tool_call") errors.push(record.id + " must include an existing_tool_call expected output");
  if (record.expected && record.expected.selectedRoute && !String(record.expected.selectedRoute).startsWith("/")) errors.push(record.id + " selectedRoute must be root-relative");
  if (!record.privacy || record.privacy.containsRealUserData !== false || record.privacy.storesRawPrivateContent !== false) errors.push(record.id + " privacy flags must mark synthetic non-private data");
  return errors;
}

function summarize(records) {
  const byCategory = {};
  const byTool = {};
  const bySource = {};
  const bySplit = {};
  records.forEach((record) => {
    const category = record.expected.intentCategory || "unknown";
    const tool = record.expected.selectedToolId || "unknown";
    byCategory[category] = (byCategory[category] || 0) + 1;
    byTool[tool] = (byTool[tool] || 0) + 1;
    bySource[record.source] = (bySource[record.source] || 0) + 1;
    bySplit[record.split] = (bySplit[record.split] || 0) + 1;
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    recordCount: records.length,
    bySplit,
    bySource,
    byCategory,
    topTools: Object.entries(byTool)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 20)
      .map(([toolId, count]) => ({ toolId, count })),
    privacy: {
      syntheticOnly: true,
      containsRealUserData: false,
      sourceUserData: "none",
    },
  };
}

function buildCorpus() {
  const manifest = manifestApi.getToolManifestForRouter();
  const manifestMap = manifestById(manifest);
  const promptMeta = promptRegistry.getProductionPrompt("router.classify-intent");
  const fixtures = evalRunner.loadFixtures();
  const fixtureErrors = evalRunner.validateFixtures(fixtures, manifest);
  if (fixtureErrors.length) throw new Error("Cannot generate corpus from invalid fixtures:\n" + fixtureErrors.join("\n"));
  const records = fromRoutingFixtures(fixtures, manifestMap, promptMeta)
    .concat(fromPromptExamples(promptExamples.PROMPT_EXAMPLES, manifestMap, promptMeta));
  const manifestIds = new Set(manifest.map((entry) => entry.id));
  const errors = [];
  const ids = new Set();
  records.forEach((record) => {
    if (ids.has(record.id)) errors.push("Duplicate record id: " + record.id);
    ids.add(record.id);
    errors.push(...validateRecord(record, manifestIds));
  });
  return { records, report: summarize(records), errors };
}

function writeJsonl(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, records.map((record) => JSON.stringify(record)).join("\n") + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const json = args.includes("--json");
  const outputIndex = args.indexOf("--output");
  const reportIndex = args.indexOf("--report");
  const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT;
  const reportPath = reportIndex >= 0 && args[reportIndex + 1] ? path.resolve(args[reportIndex + 1]) : DEFAULT_REPORT;
  const result = buildCorpus();
  if (result.errors.length) {
    console.error("AI tool-call corpus validation failed:");
    result.errors.forEach((error) => console.error("- " + error));
    process.exitCode = 1;
    return;
  }
  if (write) {
    writeJsonl(output, result.records);
    fs.writeFileSync(reportPath, JSON.stringify(result.report, null, 2) + "\n");
  }
  if (json) {
    console.log(JSON.stringify(result.report, null, 2));
  } else {
    console.log("AI tool-call corpus ready: " + result.report.recordCount + " synthetic records");
    console.log("Output: " + output);
    console.log("Report: " + reportPath);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCorpus,
  validateRecord,
  summarize,
};
