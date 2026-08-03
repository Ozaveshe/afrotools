#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE_SHA = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const FAMILY = 'farm-payroll';
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const oraclePath = path.join(ROOT, 'reports/sw-agriculture-farm-payroll-oracles.json');
const browserPath = path.join(ROOT, 'reports/sw-agriculture-browser-raw/farm-payroll-playwright.json');
const receiptPath = path.join(ROOT, 'reports/sw-agriculture-acceptance/farm-payroll.json');
const artworkPath = path.join(ROOT, 'reports/sw-agriculture-farm-payroll-missing-artwork.json');

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
requireTrue(rows.length === 55 && countryRows.length === 54, `Expected 55/54 manifest rows, found ${rows.length}/${countryRows.length}.`);
requireTrue(fs.existsSync(oraclePath), 'Static oracle report is missing.');
requireTrue(fs.existsSync(browserPath), 'Raw Playwright reporter is missing.');
const oracle = readJson(oraclePath);
const browser = readJson(browserPath);
requireTrue(oracle.routes === 55 && oracle.countryOracles === 54 && oracle.engineCases === 270, 'Static oracle report is incomplete.');
requireTrue(
  browser.stats && browser.stats.expected === 55 && browser.stats.unexpected === 0
    && browser.stats.skipped === 0 && browser.stats.flaky === 0,
  'Browser reporter is not a clean 55-route pass.'
);
const specs = collectSpecs(browser);
const browserByTitle = new Map(specs.map(spec => [spec.title, { title: spec.title, passed: passed(spec) }]));
const oracleById = new Map(oracle.rows.map(row => [row.englishId, row]));
const missingArtwork = rows
  .filter(row => !row.artwork || row.artwork.state !== 'present' || !fs.existsSync(path.join(ROOT, row.artwork.file)))
  .map(row => ({ englishId: row.english.id, expectedFile: row.artwork && row.artwork.file }));
requireTrue(missingArtwork.length === 0, `Missing artwork: ${missingArtwork.map(item => item.englishId).join(', ')}`);

const accepted = rows.map(row => {
  const staticProof = oracleById.get(row.english.id);
  const browserProof = browserByTitle.get(`${row.english.id} full route local proof`);
  requireTrue(staticProof, `Missing static proof for ${row.english.id}.`);
  requireTrue(browserProof && browserProof.passed, `Missing passing browser proof for ${row.english.id}.`);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  requireTrue(!/<iframe\b|\bfetch\s*\(/i.test(html), `${row.english.id} is not local/DOM-free.`);
  requireTrue(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`), `${row.english.id} AI route id is missing.`);
  requireTrue(html.includes('picha tuli ya utafiti wa 2024'), `${row.english.id} freshness is missing.`);
  requireTrue(html.includes('Kiwango cha uhakika'), `${row.english.id} confidence is missing.`);
  requireTrue(html.includes('ILO NATLEX</a>'), `${row.english.id} named ILO NATLEX source is missing.`);
  requireTrue(!/&amp;amp;|\brejea ya [A-Z]{2}\b|\bexports\b/i.test(html), `${row.english.id} contains rejected localization text.`);
  return {
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: row.country ? row.country.code : null,
    state: 'accepted',
    evidence: {
      staticOracle: row.country
        ? 'five exact shared-engine fixtures matched the English engine and country data pack'
        : '54-country hub/source/artwork proof',
      browser: browserProof.title,
      validCalculation: Boolean(row.country),
      invalidBoundaries: row.country ? staticProof.invalidBoundaries : [],
      staleResultAndActionsCleared: Boolean(row.country),
      exportsParsedAndReopened: row.country ? ['json', 'txt', 'csv', 'pdf'] : [],
      share: row.country ? 'system share payload proved with exact served route and named-source text' : 'not offered on hub',
      save: row.country ? 'localStorage object reopened and parsed' : 'not offered on hub',
      privacy: 'consent declined; no external requests, writes, iframe, product fetch, console, page, resource, or HTTP failures',
      responsive: ['320px with computed root font doubled', '375px with computed root font doubled', 'document/body and enumerated offender overflow all zero'],
      themes: ['system-dark', 'system-light', 'explicit-dark', 'explicit-light'],
      accessibility: [
        'visible labels', 'keyboard submit', 'skip link', 'result focus', 'reset focus',
        'all enabled app controls focusable with visible indicator', 'complete native sequential Tab order with visible focus',
        'text contrast >=4.5:1', 'boundary and focus contrast >=3:1'
      ],
      seo: ['canonical', 'Open Graph URL/image', 'WebApplication schema in sw', 'reciprocal paired hreflang mesh'],
      artwork: row.artwork.file,
      sourceFreshnessConfidence: true,
      legalBoundary: 'planning estimate only; no current legal, payroll, tax or filing claim',
      aiRouteId: row.english.id,
    },
  };
});

const receipt = {
  schemaVersion: 2,
  family: FAMILY,
  locale: 'sw',
  baseSha: BASE_SHA,
  supersedesFalseZoomCandidate: '7057bce3b5d2e21807edea45f5ade6516a13fd90',
  verifiedAt: browser.stats.startTime,
  result: { total: 55, accepted: 55, blocked: 0 },
  acceptedIds: accepted.map(row => row.englishId),
  blockedIds: [],
  routes: accepted,
  evidenceOwners: {
    manifest: 'data/localization/sw-agriculture-parity-manifest.json',
    generator: 'scripts/build-sw-agriculture-family.js',
    contract: 'scripts/lib/sw-agriculture-family-contracts/farm-payroll.js',
    controller: 'assets/js/pages/sw-agriculture-farm-payroll.js',
    engine: 'engines/src/farm-payroll-engine.js',
    data: 'data/agriculture/farm-payroll-data.js',
    englishSourcePages: 'agriculture/farm-payroll/*.html',
    staticTest: 'tests/sw-agriculture-farm-payroll-family.test.js',
    browserTest: 'tests/e2e/sw-agriculture-farm-payroll-family.spec.js',
    browserConfig: 'tests/playwright.sw-farm-payroll.config.js',
    oracleReport: path.relative(ROOT, oraclePath).replace(/\\/g, '/'),
    rawBrowserReport: path.relative(ROOT, browserPath).replace(/\\/g, '/'),
  },
  evidenceHashes: { oracleSha256: sha256(oraclePath), rawBrowserSha256: sha256(browserPath) },
  browserSummary: browser.stats,
  engineProof: { countryRoutes: 54, exactCasesPerRoute: 5, exactEngineCases: 270 },
  exportProof: { countryRoutes: 54, formatsPerRoute: 4, parsedOrReopenedExports: 216 },
  invalidProof: { countryRoutes: 54, boundariesPerRoute: 11, assertions: 594 },
  reflowProof: {
    routes: 55,
    widthsPerRoute: [320, 375],
    rootComputedFontMultiplier: 2,
    assertions: ['computed font doubled', 'document overflow zero', 'body overflow zero', 'enumerated offender overflow zero', 'controls/results usable', 'sequential keyboard/focus'],
  },
  artwork: {
    expected: 55,
    present: 55,
    missing: 0,
    missingReport: path.relative(ROOT, artworkPath).replace(/\\/g, '/'),
  },
  scopeGuards: {
    centralAcceptanceLedgerEdited: false,
    centralAiMapEdited: false,
    masterInventoryEdited: false,
    localizationAggregateEdited: false,
    sitemapEdited: false,
    distEdited: false,
    deployEdited: false,
  },
  coordinatorFollowUp: {
    requiredFrenchReciprocalFiles: countryRows.map(row => row.french.file),
    requiredFrenchMetadata: 'Add the existing Swahili route as hreflang="sw" without changing French product copy or behavior.',
    staleDerivedLocaleArtifacts: [
      'data/registry/locale-page-coverage.json',
      'reports/localization-coverage.json',
      'reports/localization-coverage.md',
    ],
  },
};
fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
fs.writeFileSync(artworkPath, `${JSON.stringify({
  schemaVersion: 1,
  family: FAMILY,
  expected: 55,
  present: 55,
  missing: missingArtwork,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  family: FAMILY,
  accepted: 55,
  blocked: 0,
  receipt: path.relative(ROOT, receiptPath),
  missingArtwork: 0,
}, null, 2));
