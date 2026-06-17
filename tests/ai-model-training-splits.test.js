#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const splitBuilder = require("../scripts/build-ai-model-training-splits.js");

const result = splitBuilder.buildSplits();
assert.deepStrictEqual(result.errors, [], "generated model training splits should validate cleanly");

const records = result.records;
const report = result.report;

assert.ok(records.length >= 100, "model split pack should have production-scale synthetic coverage");
assert.strictEqual(report.privacy.syntheticOnly, true);
assert.strictEqual(report.privacy.containsRealUserData, false);
assert.strictEqual(report.privacy.storesRawPrivateContent, false);
assert.ok(report.bySplit.train > report.bySplit.validation, "train split should be the largest split");
assert.ok(report.bySplit.validation > 0, "validation split should not be empty");
assert.ok(report.bySplit.test > 0, "test split should not be empty");

const ids = new Set();
const splitCounts = { train: 0, validation: 0, test: 0 };
const categories = new Set();
const heldOutCategories = new Set();

for (const record of records) {
  assert.ok(!ids.has(record.id), `${record.id} should be unique`);
  ids.add(record.id);
  splitCounts[record.split] += 1;
  categories.add(record.expected.intentCategory);
  if (record.split !== "train") heldOutCategories.add(record.expected.intentCategory);

  assert.strictEqual(record.schemaVersion, 1);
  assert.strictEqual(record.task, "afrotools_tool_call_routing");
  assert.strictEqual(record.format, "chat_jsonl");
  assert.ok(["train", "validation", "test"].includes(record.split), `${record.id} split should be model-ready`);
  assert.strictEqual(record.messages.length, 3);
  assert.strictEqual(record.messages[0].role, "system");
  assert.strictEqual(record.messages[1].role, "user");
  assert.strictEqual(record.messages[2].role, "assistant");
  assert.ok(record.messages[0].content.includes("existing AfroTools tool"), `${record.id} system prompt should constrain tools`);
  assert.ok(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(record.messages[1].content), `${record.id} should not include emails`);
  assert.ok(!/\+?\d[\d\s().-]{7,}\d/.test(record.messages[1].content), `${record.id} should not include phone-like strings`);

  const assistantJson = JSON.parse(record.messages[2].content);
  assert.strictEqual(assistantJson.selectedToolId, record.expected.selectedToolId);
  assert.strictEqual(assistantJson.selectedRoute, record.expected.selectedRoute);
  assert.strictEqual(assistantJson.toolCall.type, "existing_tool_call");
  assert.strictEqual(assistantJson.toolCall.toolId, record.expected.selectedToolId);
  assert.ok(assistantJson.selectedRoute.startsWith("/"), `${record.id} selected route should be root-relative`);
  assert.ok(assistantJson.toolCall.route.startsWith("/"), `${record.id} tool call route should be root-relative`);

  assert.strictEqual(record.metadata.synthetic, true);
  assert.strictEqual(record.metadata.containsRealUserData, false);
  assert.strictEqual(record.metadata.storesRawPrivateContent, false);
  assert.strictEqual(record.metadata.promptId, "router.classify-intent");
}

assert.deepStrictEqual(splitCounts, report.bySplit, "report split counts should match generated records");
assert.ok(categories.size >= 20, "split pack should cover broad AfroTools categories");
assert.ok(heldOutCategories.size >= 12, "validation/test splits should cover many categories");

const outputDir = path.join(__dirname, "..", "data", "ai", "model-training");
const reportPath = path.join(outputDir, "router-tool-call-splits.report.json");
const files = [
  ["train", "router-tool-call-train.jsonl"],
  ["validation", "router-tool-call-validation.jsonl"],
  ["test", "router-tool-call-test.jsonl"],
];

if (fs.existsSync(reportPath)) {
  const checkedReport = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.strictEqual(checkedReport.recordCount, records.length, "checked-in split report should match generated record count");
  assert.deepStrictEqual(checkedReport.bySplit, report.bySplit, "checked-in split report should match generated split counts");
}

for (const [split, fileName] of files) {
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) continue;
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  assert.strictEqual(lines.length, splitCounts[split], `${fileName} should contain the generated ${split} split`);
  lines.forEach((line) => {
    const parsed = JSON.parse(line);
    assert.strictEqual(parsed.split, split);
  });
}

console.log(`AI model training splits validated: ${records.length} synthetic records across ${categories.size} categories.`);
