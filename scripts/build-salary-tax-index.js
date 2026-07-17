#!/usr/bin/env node
'use strict';

/** Build the compact Salary & Tax discovery feed from canonical records. */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const registryApi = require('./lib/canonical-registry');

const ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'data/salary-tax-index.json');

function countriesFor(tool) {
  return tool.applicability.scope === 'pan-african' ? ['ALL'] : tool.applicability.countryIds.slice();
}

function toRecord(tool) {
  return [
    tool.id,
    tool.title,
    tool.description,
    tool.categoryId,
    countriesFor(tool),
    'live',
    tool.route,
    tool.source.icon || '',
    Number(tool.source.priority || 0),
    tool.localeCoverage[0] || 'en'
  ];
}

const registry = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(registry);
if (!validation.ok) throw new Error(validation.errors.map(registryApi.formatIssue).join('\n'));
const records = registry.tools
  .filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated && tool.categoryId === 'financial')
  .map(toRecord);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSyncWithRetry(OUTPUT_PATH, `${JSON.stringify(records)}\n`, 'utf8');
console.log(`Built ${records.length} canonical salary-tax rows (${Math.round(fs.statSync(OUTPUT_PATH).size / 1024)} KB)`);
