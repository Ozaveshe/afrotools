#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const api = require('./lib/content-integrity');

const WRITE = process.argv.includes('--write');
const NO_FAIL = process.argv.includes('--no-fail');
const JSON_PATH = path.join(api.ROOT, 'reports/content-integrity-report.json');
const MD_PATH = path.join(api.ROOT, 'reports/content-integrity-report.md');

function markdown(report) {
  const lines = [
    '# Content Integrity Report', '',
    `Generated: ${report.generatedAt}`, '',
    `- HTML pages scanned: ${report.scanned.html}`,
    `- Generated pages with provenance: ${report.scanned.generatedPages}`,
    `- Stable content IDs: ${report.scanned.stableContentIds}`,
    `- Generated source owners: ${report.scanned.generatedSourceOwners.length}`,
    `- Blocking findings: ${report.summary.blockers}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Reviewed exceptions: ${report.summary.reviewedExceptions}`, '',
    '## Findings', ''
  ];
  if (!report.findings.length) lines.push('No active content-integrity findings.');
  else report.findings.forEach((row) => lines.push(`- \`${row.ruleId}\` ${row.file}:${row.line} — ${row.message} Editable source: \`${row.editableSource}\`. Block: ${JSON.stringify(row.content)}`));
  lines.push('', '## Rule counts', '');
  if (!Object.keys(report.summary.byRule).length) lines.push('No active rules fired.');
  else Object.entries(report.summary.byRule).sort(([a], [b]) => a.localeCompare(b)).forEach(([rule, count]) => lines.push(`- ${rule}: ${count}`));
  return `${lines.join('\n')}\n`;
}

function main() {
  const report = api.runRepositoryAudit();
  if (WRITE) {
    fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
    fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    fs.writeFileSync(MD_PATH, markdown(report), 'utf8');
  }
  console.log(`Content integrity: ${report.scanned.html} HTML pages; ${report.summary.blockers} blocker(s), ${report.summary.warnings} warning(s), ${report.summary.reviewedExceptions} reviewed exception(s).`);
  Object.entries(report.summary.byRule).sort(([a], [b]) => a.localeCompare(b)).forEach(([rule, count]) => console.log(`  ${rule}: ${count}`));
  report.findings.slice(0, 80).forEach((row) => console.error(api.formatFinding(row)));
  if (report.findings.length > 80) console.error(`... ${report.findings.length - 80} more finding(s); run with --write for the record-level report.`);
  if (!NO_FAIL && report.summary.blockers) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { markdown };
