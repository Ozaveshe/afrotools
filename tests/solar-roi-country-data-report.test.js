"use strict";

const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const script = path.join(ROOT, "scripts", "validate-solar-roi-country-data.js");
const reportModule = require(script);

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} missing from Solar ROI country data report`);
}

const requiredRows = [
  "All 54 countries exist",
  "Currency present",
  "Tariff/fuel/install/battery/yield assumptions",
  "Freshness dates present",
  "Source confidence present",
  "No duplicate slugs",
  "No missing country pages",
  "Metadata unique",
  "Forbidden generic copy absent",
  "Solar resource adapter metadata"
];

const output = execFileSync(process.execPath, [script], {
  cwd: ROOT,
  encoding: "utf8"
});

assertIncludes(output, "Solar ROI country data report", "report heading");
assertIncludes(output, "| Check", "report table header");
assertIncludes(output, "| Status", "report status column");
assertIncludes(output, "| Details", "report details column");
assertIncludes(output, "Solar ROI country data report: PASS (54 countries)", "pass summary");
assert.ok(!/\|\s*FAIL\s*\|/.test(output), "Solar ROI country data report should not contain failing rows.");

for (const row of requiredRows) {
  assertIncludes(output, row, row);
  const rowPattern = new RegExp(`\\| ${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\| PASS\\s*\\|`);
  assert.ok(rowPattern.test(output), `${row} should pass in the terminal report`);
}

const report = reportModule.buildReport();
assert.strictEqual(report.passed, true, "buildReport() should pass for current Solar ROI country data.");
assert.strictEqual(report.errors.length, 0, "buildReport() should not expose errors for current Solar ROI country data.");
for (const row of requiredRows) {
  assert.ok(report.checks.some(check => check.name === row && check.passed), `${row} should pass in buildReport().`);
}

console.log(`Solar ROI country data report test verified: ${requiredRows.length} checks`);
