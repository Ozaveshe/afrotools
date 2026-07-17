#!/usr/bin/env node

const claims = require('./lib/public-claims');
const fs = require('fs');
const path = require('path');
const canonicalRegistry = require('./lib/canonical-registry');

function auditMoneySourceCoverage(root) {
  const sourceRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'source-registry.json'), 'utf8'));
  const sources = canonicalRegistry.loadSources();
  const registeredIds = new Set();
  const registeredRoutes = new Set();
  sourceRegistry.sources.forEach((source) => {
    (source.toolIds || []).forEach((id) => registeredIds.add(id));
    (source.routes || []).forEach((route) => registeredRoutes.add(canonicalRegistry.normalizeRoute(route)));
  });

  const moneyPattern = /(?:paye|vat|tax|salary|wage|pension|social-security|fuel|electricity|remittance|forex|currency|bank|loan|interest|mortgage|import-duty|customs-duty)/i;
  const moneyTools = sources.tools.filter((tool) => {
    if (!['live', 'new'].includes(tool.status)) return false;
    if (tool.category === 'financial') return true;
    return moneyPattern.test([tool.id, tool.href, tool.name, tool.category].join(' '));
  });
  const missing = moneyTools.filter((tool) => {
    return !registeredIds.has(tool.id) && !registeredRoutes.has(canonicalRegistry.normalizeRoute(tool.href));
  });
  return { total: moneyTools.length, registered: moneyTools.length - missing.length, missing };
}

const result = claims.buildRepository({ root: process.cwd(), write: false });
console.log('Public claim truth audit');
console.log(`Scanned files: ${result.scannedFiles}`);
console.log(`Detected claim phrases: ${result.rawHits}`);
console.log(`Approved claim hits: ${result.approvedHits}`);
console.log(`Failures: ${result.errors.length}`);

const sourceCoverage = auditMoneySourceCoverage(process.cwd());
console.log(`Money source coverage: ${sourceCoverage.registered}/${sourceCoverage.total} registered`);
if (sourceCoverage.missing.length) {
  console.warn(`Warnings: ${sourceCoverage.missing.length} money tools have no source-registry entry`);
  for (const tool of sourceCoverage.missing.slice(0, 100)) {
    console.warn(`WARN [SOURCE_REGISTRY_MISSING] ${tool.id} ${tool.href}`);
  }
  if (sourceCoverage.missing.length > 100) {
    console.warn(`WARN ${sourceCoverage.missing.length - 100} additional unregistered money tools omitted`);
  }
}

if (!result.ok) {
  for (const error of result.errors.slice(0, 100)) console.error(`- ${claims.formatIssue(error)}`);
  if (result.errors.length > 100) console.error(`- ${result.errors.length - 100} more failures omitted`);
  console.error('\nAudit failed. Use a registered approved variant or update the evidence-backed registry.');
  process.exit(1);
}

console.log('\nAudit passed. Public sensitive claims are registered and no prohibited absolute wording was found.');
