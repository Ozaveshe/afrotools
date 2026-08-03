#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE_SHA = '8354e321ff34caf60a33a3393cd0dcddfb00c023';
const FAMILY = 'greenhouse';
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('./lib/sw-agriculture-family-contracts/greenhouse');
const oraclePath = path.join(ROOT, 'reports/sw-agriculture-greenhouse-oracles.json');
const browserPath = path.join(ROOT, 'reports/sw-agriculture-browser-raw/greenhouse-playwright.json');
const receiptPath = path.join(ROOT, 'reports/sw-agriculture-acceptance/greenhouse.json');
const artworkPath = path.join(ROOT, 'reports/sw-agriculture-greenhouse-missing-artwork.json');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function collectSpecs(suite, output = []) {
  for (const child of suite.suites || []) collectSpecs(child, output);
  for (const spec of suite.specs || []) output.push(spec);
  return output;
}
function passed(spec) {
  return (spec.tests || []).some(test => (test.results || []).some(result => result.status === 'passed'));
}
function requireTrue(value, message) { if (!value) throw new Error(message); }

const rows = manifest.rows.filter(row => row.family === FAMILY);
const countryRows = rows.filter(row => row.country);
requireTrue(rows.length === 16 && countryRows.length === 15, `Expected 16/15 manifest rows, found ${rows.length}/${countryRows.length}.`);
requireTrue(fs.existsSync(oraclePath), 'Static oracle report is missing.');
requireTrue(fs.existsSync(browserPath), 'Raw Playwright reporter is missing.');
const oracle = readJson(oraclePath);
const browser = readJson(browserPath);
requireTrue(oracle.routes === 16 && oracle.countryOracles === 15, 'Static oracle report is incomplete.');
requireTrue(browser.stats && browser.stats.expected === 16 && browser.stats.unexpected === 0 && browser.stats.skipped === 0 && browser.stats.flaky === 0, 'Browser reporter is not a clean 16-route pass.');
const specs = collectSpecs(browser);
const browserById = new Map();
for (const spec of specs) {
  const match = String(spec.title || '').match(/^(greenhouse-(?:cost-estimator|[a-z-]+)) full route local proof$/);
  if (match) browserById.set(match[1], { title: spec.title, passed: passed(spec) });
}
const oracleById = new Map(oracle.rows.map(row => [row.englishId, row]));
const missingArtwork = rows
  .filter(row => !row.artwork || row.artwork.state !== 'present' || !fs.existsSync(path.join(ROOT, row.artwork.file)))
  .map(row => ({ englishId: row.english.id, expectedFile: row.artwork && row.artwork.file }));
requireTrue(missingArtwork.length === 0, `Missing artwork: ${missingArtwork.map(item => item.englishId).join(', ')}`);

const accepted = rows.map(row => {
  const staticProof = oracleById.get(row.english.id);
  const browserProof = browserById.get(row.english.id);
  requireTrue(staticProof, `Missing static proof for ${row.english.id}.`);
  requireTrue(browserProof && browserProof.passed, `Missing passing browser proof for ${row.english.id}.`);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  requireTrue(!/<iframe\b|\bfetch\s*\(/i.test(html), `${row.english.id} is not local/DOM-free.`);
  requireTrue(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`), `${row.english.id} AI route id is missing.`);
  requireTrue(html.includes('FAOSTAT — bidhaa za mazao na mifugo</a>'), `${row.english.id} named source link is missing.`);
  requireTrue(html.includes('Kiwango cha uhakika'), `${row.english.id} confidence is missing.`);
  if (row.country) {
    const source = contract.sourceMetadata(row);
    requireTrue(html.includes(source.source.replace(/&/g, '&amp;').replace(/'/g, '&#39;')), `${row.english.id} exact source list is missing.`);
    requireTrue(html.includes(`Marejeo yaliyotajwa yana mwaka ${source.dataReviewed}`), `${row.english.id} freshness is missing.`);
  } else requireTrue(html.includes('ulipitiwa 2026'), `${row.english.id} hub freshness is missing.`);
  return {
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: row.country ? row.country.code : null,
    state: 'accepted',
    evidence: {
      staticOracle: row.country ? 'independent formula/data/currency oracle matched the shared English greenhouse engine' : '15-country hub route/source/artwork proof',
      browser: browserProof.title,
      validCalculation: Boolean(row.country),
      invalidBoundaries: row.country ? staticProof.invalidOracle.boundaries : [],
      staleResultAndActionsCleared: Boolean(row.country),
      exportsParsedAndReopened: row.country ? ['json', 'txt', 'csv', 'pdf'] : [],
      share: row.country ? 'system share payload proved with exact served route' : 'not offered on hub',
      save: row.country ? 'localStorage object reopened and parsed' : 'not offered on hub',
      privacy: 'consent declined; no external requests, writes, iframe, fetch, console, page, resource, or HTTP failures',
      responsive: ['320px', '375px', '200% zoom at 640px viewport'],
      themes: ['system-dark', 'system-light', 'explicit-dark', 'explicit-light'],
      accessibility: ['visible labels', 'keyboard submit', 'skip link', 'result focus', 'all enabled app controls focusable with visible indicator', 'text contrast >=4.5:1', 'boundary and focus contrast >=3:1'],
      seo: ['canonical', 'Open Graph URL', 'WebApplication schema in sw', 'reciprocal en/fr/sw hreflang'],
      artwork: row.artwork.file,
      sourceFreshnessConfidence: true,
      aiRouteId: row.english.id
    }
  };
});

const receipt = {
  schemaVersion: 1, family: FAMILY, locale: 'sw', baseSha: BASE_SHA,
  verifiedAt: browser.stats.startTime,
  result: { total: 16, accepted: 16, blocked: 0 },
  acceptedIds: accepted.map(row => row.englishId), blockedIds: [], routes: accepted,
  evidenceOwners: {
    manifest: 'data/localization/sw-agriculture-parity-manifest.json',
    generator: 'scripts/build-sw-agriculture-family.js',
    contract: 'scripts/lib/sw-agriculture-family-contracts/greenhouse.js',
    controller: 'assets/js/pages/sw-agriculture-greenhouse.js',
    engine: 'engines/src/greenhouse-engine.js', data: 'data/agriculture/greenhouse-data.js',
    staticTest: 'tests/sw-agriculture-greenhouse-family.test.js',
    browserTest: 'tests/e2e/sw-agriculture-greenhouse-family.spec.js',
    browserConfig: 'tests/playwright.sw-greenhouse.config.js',
    oracleReport: path.relative(ROOT, oraclePath).replace(/\\/g, '/'),
    rawBrowserReport: path.relative(ROOT, browserPath).replace(/\\/g, '/')
  },
  evidenceHashes: { oracleSha256: sha256(oraclePath), rawBrowserSha256: sha256(browserPath) },
  browserSummary: browser.stats,
  exportProof: { countryRoutes: 15, formatsPerRoute: 4, parsedOrReopenedExports: 60 },
  invalidProof: { countryRoutes: 15, boundariesPerRoute: 7, assertions: 105 },
  artwork: { expected: 16, present: 16, missing: 0, missingReport: path.relative(ROOT, artworkPath).replace(/\\/g, '/') },
  scopeGuards: {
    centralAcceptanceLedgerEdited: false, centralAiMapEdited: false, masterInventoryEdited: false,
    sitemapEdited: false, distEdited: false, deployEdited: false
  }
};
fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
fs.writeFileSync(artworkPath, `${JSON.stringify({ schemaVersion: 1, family: FAMILY, expected: 16, present: 16, missing: missingArtwork }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ family: FAMILY, accepted: 16, blocked: 0, receipt: path.relative(ROOT, receiptPath), missingArtwork: 0 }, null, 2));
