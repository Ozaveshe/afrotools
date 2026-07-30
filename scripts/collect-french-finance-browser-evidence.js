'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/registry/french-finance-tax-market-data.json');
const PART_DIR = path.join(ROOT, 'artifacts', 'french-finance-browser-parts');
const OUTPUT = path.join(ROOT, 'reports', 'french-finance-tax-market-data-browser-evidence.json');
const EXPECTED_PARTS = 22;
const RUN_ID = process.env.FRENCH_FINANCE_BROWSER_RUN_ID || manifest.generatedAt;

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  return route === '/' ? route : `/${route.replace(/^\/+|\/+$/g, '')}`;
}

const parts = [];
for (let part = 1; part <= EXPECTED_PARTS; part += 1) {
  const file = path.join(PART_DIR, `part-${part}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing browser evidence part ${part}`);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (payload.runId !== RUN_ID) throw new Error(`Stale browser evidence part ${part}: ${payload.runId}`);
  parts.push(payload);
}
const rows = parts.flatMap(part => part.rows).sort((a, b) => a.englishRoute.localeCompare(b.englishRoute));
if (rows.length !== 132) throw new Error(`Expected 132 browser rows; found ${rows.length}`);
if (new Set(rows.map(row => row.englishRoute)).size !== 132) throw new Error('Browser evidence contains duplicate English routes');
const expectedRoutes = new Set(manifest.rows.map(row => normalizeRoute(row.englishRoute)));
const missing = [...expectedRoutes].filter(route => !rows.some(row => normalizeRoute(row.englishRoute) === route));
if (missing.length) throw new Error(`Browser evidence misses ${missing.join(', ')}`);
const failed = rows.filter(row => !row.passed);
if (failed.length) throw new Error(`Browser evidence has ${failed.length} failing rows`);
rows.forEach(row => { row.exportsParsed = false; });

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  runId: RUN_ID,
  scope: 'Finance, Tax & Market Data',
  expectedRows: 132,
  testedRows: rows.length,
  passedRows: rows.filter(row => row.passed).length,
  exportsParsedRows: rows.filter(row => row.exportsParsed).length,
  notes: 'Every route was loaded at 320px and 375px, checked at 200% root-font reflow, alternated between system light/dark, forced manual dark, keyboard-focused, and checked for local console/resource failures plus canonical and OG identity. Export status intentionally fails closed here; run collect-french-finance-export-evidence.js with one current parsed receipt per physical app before rebuilding acceptance evidence.',
  rows
};
fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  testedRows: report.testedRows,
  passedRows: report.passedRows,
  exportsParsedRows: report.exportsParsedRows
}, null, 2));
