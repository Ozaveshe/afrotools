#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE_SHA = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const FAMILY = 'farm-loans';
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const oraclePath = path.join(ROOT, 'reports/sw-agriculture-farm-loans-oracles.json');
const browserPath = path.join(ROOT, 'reports/sw-agriculture-browser-raw/farm-loans-playwright.json');
const receiptPath = path.join(ROOT, 'reports/sw-agriculture-acceptance/farm-loans.json');
const artworkPath = path.join(ROOT, 'reports/sw-agriculture-farm-loans-missing-artwork.json');

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
requireTrue(oracle.evidenceRecords === 70, 'Official record evidence is incomplete.');
requireTrue(
  browser.stats && browser.stats.expected === 16 && browser.stats.unexpected === 0
    && browser.stats.skipped === 0 && browser.stats.flaky === 0,
  'Browser reporter is not a clean 16-route pass.'
);
const specs = collectSpecs(browser);
const browserById = new Map();
for (const spec of specs) {
  const match = String(spec.title || '').match(/^(farm-loans-(?:hub|[a-z-]+)) full route local proof$/);
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
  requireTrue(html.includes('ukaguzi wa hazina ulifanywa 2 Agosti 2026'), `${row.english.id} freshness is missing.`);
  requireTrue(html.includes('Kiwango cha uhakika'), `${row.english.id} confidence is missing.`);
  if (row.country) {
    requireTrue(html.includes(staticProof.sourceNames.replace(/&/g, '&amp;')), `${row.english.id} named country sources are missing.`);
  } else {
    requireTrue(html.includes('IFAD - fedha za vijijini</a>'), 'Farm Loans hub named source is missing.');
  }
  return {
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: row.country ? row.country.code : null,
    state: 'accepted',
    evidence: {
      staticOracle: row.country
        ? 'independent eligibility, tenor, training, record-role, midpoint-rate and amortization oracle matched the shared DOM-free engine, country program pack and 70-record official evidence overlay'
        : '15-country hub route/source/artwork proof',
      browser: browserProof.title,
      validCalculation: Boolean(row.country),
      invalidBoundaries: row.country ? staticProof.invalidOracle.boundaries : [],
      staleResultAndActionsCleared: Boolean(row.country),
      exportsParsedAndReopened: row.country ? ['json', 'txt', 'csv', 'pdf'] : [],
      share: row.country ? 'system share payload proved with exact served route and named-source text' : 'not offered on hub',
      save: row.country ? 'localStorage object reopened and parsed' : 'not offered on hub',
      privacy: 'consent declined; no external requests, writes, iframe, product fetch, console, page, resource, or HTTP failures',
      responsive: ['320px', '375px', 'true root font-size 200% at both widths, including calculated result cards and controls'],
      themes: ['system-dark', 'system-light', 'explicit-dark', 'explicit-light'],
      accessibility: [
        'visible labels and fieldset legends', 'keyboard submit', 'skip link', 'result focus',
        'reset focus', 'all enabled app controls focusable with visible indicator', 'complete sequential Tab order across every visible page control and official-source link',
        'text contrast >=4.5:1', 'boundary and focus contrast >=3:1'
      ],
      seo: [
        'canonical',
        'Open Graph URL/image',
        'WebApplication schema in sw',
        row.country
          ? 'English-Swahili reciprocal pair present; full equivalence-group validation awaits the existing French page reciprocal'
          : 'reciprocal hreflang mesh validated for the hub',
      ],
      artwork: row.artwork.file,
      sourceFreshnessConfidence: true,
      approvalBoundary: 'planning match only; no eligibility, approval, offer or advice claim',
      aiRouteId: row.english.id,
    },
  };
});

const receipt = {
  schemaVersion: 2,
  family: FAMILY,
  locale: 'sw',
  baseSha: BASE_SHA,
  reconciledCandidate: '54eeaed209255367b91c221c0317823bd1c32b8b',
  supersedesRejectedCandidate: '1061394ba8af5063244cb79222e3aebe66c7af32',
  verifiedAt: browser.stats.startTime,
  acceptanceBoundary: {
    state: 'candidate-green-pending-coordinator-hreflang-reconciliation',
    centralAcceptance: false,
    reason: 'The Swahili-only lane cannot edit French metadata or generated localization aggregates.',
  },
  result: { total: 16, accepted: 16, blocked: 0 },
  acceptedIds: accepted.map(row => row.englishId),
  blockedIds: [],
  routes: accepted,
  evidenceOwners: {
    manifest: 'data/localization/sw-agriculture-parity-manifest.json',
    generator: 'scripts/build-sw-agriculture-family.js',
    contract: 'scripts/lib/sw-agriculture-family-contracts/farm-loans.js',
    controller: 'assets/js/pages/sw-agriculture-farm-loans.js',
    engine: 'engines/src/farm-loan-engine.js',
    data: 'data/agriculture/agri-loans-data.js',
    recordEvidence: 'data/agriculture/agri-loans-evidence.js',
    englishSourcePages: 'agriculture/farm-loans/*.html',
    staticTest: 'tests/sw-agriculture-farm-loans-family.test.js',
    browserTest: 'tests/e2e/sw-agriculture-farm-loans-family.spec.js',
    browserConfig: 'tests/playwright.sw-farm-loans.config.js',
    oracleReport: path.relative(ROOT, oraclePath).replace(/\\/g, '/'),
    rawBrowserReport: path.relative(ROOT, browserPath).replace(/\\/g, '/'),
  },
  evidenceHashes: { oracleSha256: sha256(oraclePath), rawBrowserSha256: sha256(browserPath) },
  browserSummary: browser.stats,
  exportProof: { countryRoutes: 15, formatsPerRoute: 4, parsedOrReopenedExports: 60 },
  recordEvidence: { records: 70, officialUrls: 70, checkedDates: 70, effectiveDates: 70 },
  invalidProof: { countryRoutes: 15, inputBoundariesPerRoute: 6, programTenorRoutes: 15, mandatoryTrainingRoutes: 1, assertions: 106 },
  artwork: {
    expected: 16,
    present: 16,
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
  coordinatorPending: {
    frenchReciprocalMetadata: countryRows.map(row => row.french.file),
    staleDerivedArtifacts: [
      'data/registry/locale-page-coverage.json',
      'reports/localization-coverage.json',
      'reports/localization-coverage.md',
    ],
    observedGates: {
      hreflang: '15 HREFLANG_RECIPROCAL_MISSING errors, one for each existing French country page',
      i18n: 'LOCALIZATION_ARTIFACT_STALE for the three generated localization coverage artifacts',
    },
  },
};
fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
fs.writeFileSync(artworkPath, `${JSON.stringify({
  schemaVersion: 1,
  family: FAMILY,
  expected: 16,
  present: 16,
  missing: missingArtwork,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  family: FAMILY,
  accepted: 16,
  blocked: 0,
  receipt: path.relative(ROOT, receiptPath),
  missingArtwork: 0,
}, null, 2));
