#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const corpusBuilder = require("./generate-ai-tool-call-corpus.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "data", "ai", "model-training");
const DEFAULT_REPORT = path.join(DEFAULT_OUTPUT_DIR, "router-tool-call-splits.report.json");
const SYSTEM_PROMPT = [
  "You are AfroTools AI's workflow router.",
  "Return compact JSON that chooses one existing AfroTools tool, a root-relative route, and a safe tool call.",
  "Use only known AfroTools tool ids and never invent calculators, official filings, guarantees, or live-data claims.",
  "Keep private content out of URLs; send sensitive details only through browser-local prefill contracts."
].join(" ");

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function groupByCategory(records) {
  return records.reduce((groups, record) => {
    const category = record.expected && record.expected.intentCategory || "unknown";
    groups[category] = groups[category] || [];
    groups[category].push(record);
    return groups;
  }, {});
}

function splitCategoryRecords(records) {
  const sorted = records.slice().sort((left, right) => {
    return stableHash(left.id) - stableHash(right.id) || left.id.localeCompare(right.id);
  });
  const total = sorted.length;
  return sorted.map((record, index) => {
    let split = "train";
    if (total >= 8) {
      if (index >= Math.floor(total * 0.85)) split = "test";
      else if (index >= Math.floor(total * 0.70)) split = "validation";
    } else if (total >= 4) {
      if (index === total - 1) split = "test";
      else if (index === total - 2) split = "validation";
    } else if (total >= 2 && index === total - 1) {
      split = "validation";
    }
    return Object.assign({}, record, { modelSplit: split });
  });
}

function assignSplits(records) {
  const groups = groupByCategory(records);
  return Object.keys(groups).sort().flatMap((category) => splitCategoryRecords(groups[category]));
}

function compactAssistantOutput(record) {
  const expected = record.expected || {};
  const toolCall = expected.toolCall || {};
  return {
    selectedToolId: expected.selectedToolId,
    selectedRoute: expected.selectedRoute,
    intentCategory: expected.intentCategory,
    privacyMode: expected.privacyMode,
    safetyDomain: expected.safetyDomain,
    extractedInputKeys: Array.isArray(expected.extractedInputKeys) ? expected.extractedInputKeys.slice().sort() : [],
    missingInputs: Array.isArray(expected.missingInputs) ? expected.missingInputs.slice().sort() : [],
    toolCall: {
      type: toolCall.type,
      toolId: toolCall.toolId,
      action: toolCall.action,
      route: toolCall.route,
      canPrefill: Boolean(toolCall.canPrefill),
      storagePolicy: toolCall.storagePolicy,
    },
  };
}

function toTrainingRecord(record) {
  const assistantOutput = compactAssistantOutput(record);
  return {
    schemaVersion: 1,
    id: record.id,
    split: record.modelSplit,
    task: "afrotools_tool_call_routing",
    format: "chat_jsonl",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: record.messages[0].content },
      { role: "assistant", content: JSON.stringify(assistantOutput) },
    ],
    expected: assistantOutput,
    metadata: {
      source: record.source,
      promptId: record.prompt && record.prompt.promptId,
      promptVersion: record.prompt && record.prompt.promptVersion,
      evalDataset: record.prompt && record.prompt.evalDataset,
      synthetic: true,
      containsRealUserData: false,
      storesRawPrivateContent: false,
    },
  };
}

function countBy(records, keyFn) {
  return records.reduce((counts, record) => {
    const key = keyFn(record);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function summarize(records) {
  const bySplit = countBy(records, (record) => record.split);
  const byCategory = {};
  records.forEach((record) => {
    const category = record.expected.intentCategory || "unknown";
    byCategory[category] = byCategory[category] || { total: 0, train: 0, validation: 0, test: 0 };
    byCategory[category].total += 1;
    byCategory[category][record.split] = (byCategory[category][record.split] || 0) + 1;
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_tool_call_routing_model_splits",
    recordCount: records.length,
    files: {
      train: "router-tool-call-train.jsonl",
      validation: "router-tool-call-validation.jsonl",
      test: "router-tool-call-test.jsonl",
    },
    bySplit,
    bySource: countBy(records, (record) => record.metadata.source),
    byCategory,
    privacy: {
      syntheticOnly: true,
      containsRealUserData: false,
      storesRawPrivateContent: false,
      urlPrivacyContract: "sensitive fields must use browser-local prefill storage, not route query strings",
    },
    usage: {
      train: "fine-tuning or router prompt development",
      validation: "prompt/model selection before promotion",
      test: "held-out regression gate after model or prompt changes",
    },
  };
}

function validateTrainingRecord(record) {
  const errors = [];
  if (!record.id) errors.push("id is required");
  if (!["train", "validation", "test"].includes(record.split)) errors.push(record.id + " has invalid split");
  if (!record.messages || record.messages.length !== 3) errors.push(record.id + " must use system/user/assistant messages");
  if (record.messages && record.messages[0] && record.messages[0].role !== "system") errors.push(record.id + " first message must be system");
  if (record.messages && record.messages[1] && record.messages[1].role !== "user") errors.push(record.id + " second message must be user");
  if (record.messages && record.messages[2] && record.messages[2].role !== "assistant") errors.push(record.id + " third message must be assistant");
  try {
    const parsed = JSON.parse(record.messages[2].content || "");
    if (!parsed.selectedToolId || !parsed.selectedRoute || !parsed.toolCall) errors.push(record.id + " assistant JSON missing route/toolCall");
    if (parsed.selectedRoute && !String(parsed.selectedRoute).startsWith("/")) errors.push(record.id + " selectedRoute must be root-relative");
    if (parsed.toolCall && parsed.toolCall.type !== "existing_tool_call") errors.push(record.id + " toolCall must target an existing tool");
  } catch (error) {
    errors.push(record.id + " assistant message must be parseable JSON");
  }
  if (!record.metadata || record.metadata.synthetic !== true || record.metadata.containsRealUserData !== false) {
    errors.push(record.id + " metadata must mark synthetic non-user data");
  }
  return errors;
}

function buildSplits() {
  const corpus = corpusBuilder.buildCorpus();
  if (corpus.errors.length) throw new Error("Cannot build model splits from invalid corpus:\n" + corpus.errors.join("\n"));
  const records = assignSplits(corpus.records).map(toTrainingRecord);
  const errors = records.flatMap(validateTrainingRecord);
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
  const outputIndex = args.indexOf("--output-dir");
  const reportIndex = args.indexOf("--report");
  const outputDir = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT_DIR;
  const reportPath = reportIndex >= 0 && args[reportIndex + 1] ? path.resolve(args[reportIndex + 1]) : DEFAULT_REPORT;
  const result = buildSplits();
  if (result.errors.length) {
    console.error("AI model training split validation failed:");
    result.errors.forEach((error) => console.error("- " + error));
    process.exitCode = 1;
    return;
  }
  if (write) {
    writeJsonl(path.join(outputDir, "router-tool-call-train.jsonl"), result.records.filter((record) => record.split === "train"));
    writeJsonl(path.join(outputDir, "router-tool-call-validation.jsonl"), result.records.filter((record) => record.split === "validation"));
    writeJsonl(path.join(outputDir, "router-tool-call-test.jsonl"), result.records.filter((record) => record.split === "test"));
    fs.writeFileSync(reportPath, JSON.stringify(result.report, null, 2) + "\n");
  }
  if (json) {
    console.log(JSON.stringify(result.report, null, 2));
  } else {
    console.log("AI model training splits ready: " + result.report.recordCount + " synthetic records");
    console.log("Train/validation/test: " + (result.report.bySplit.train || 0) + "/" + (result.report.bySplit.validation || 0) + "/" + (result.report.bySplit.test || 0));
    console.log("Output: " + outputDir);
    console.log("Report: " + reportPath);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSplits,
  validateTrainingRecord,
  summarize,
  stableHash,
};
