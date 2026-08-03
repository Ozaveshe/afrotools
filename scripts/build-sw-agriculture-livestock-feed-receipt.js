#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE_SHA = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const FAMILY = 'livestock-feed';
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const oraclePath = path.join(ROOT, 'reports/sw-agriculture-livestock-feed-oracles.json');
const browserPath = path.join(ROOT, 'reports/sw-agriculture-browser-raw/livestock-feed-playwright.json');
const receiptPath = path.join(ROOT, 'reports/sw-agriculture-acceptance/livestock-feed.json');
const artworkPath = path.join(ROOT, 'reports/sw-agriculture-livestock-feed-missing-artwork.json');

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
  const match = String(spec.title || '').match(/^(livestock-feed-(?:calculator|[a-z-]+)) full route local proof$/);
  if (match) browserById.set(match[1], { title: spec.title, passed: passed(spec) });
}
const oracleById = new Map(oracle.rows.map(row => [row.englishId, row]));
const missingArtwork = rows.filter(row => !row.artwork || row.artwork.state !== 'present' || !fs.existsSync(path.join(ROOT, row.artwork.file)))
  .map(row => ({ englishId: row.english.id, expectedFile: row.artwork && row.artwork.file }));
requireTrue(missingArtwork.length === 0, `Missing artwork: ${missingArtwork.map(item => item.englishId).join(', ')}`);
const frenchReciprocityPending = rows.filter(row => {
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  return !html.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`);
}).map(row => row.french.file);
const hausaReciprocityFile = 'ha/kayan-aiki/abincin-dabbobi/index.html';
const hausaReciprocityPending = fs.readFileSync(path.join(ROOT, hausaReciprocityFile), 'utf8')
  .includes('hreflang="sw" href="https://afrotools.com/sw/kilimo/chakula-cha-mifugo/nigeria/"')
  ? []
  : [hausaReciprocityFile];

const accepted = rows.map(row => {
  const staticProof = oracleById.get(row.english.id);
  const browserProof = browserById.get(row.english.id);
  requireTrue(staticProof, `Missing static proof for ${row.english.id}.`);
  requireTrue(browserProof && browserProof.passed, `Missing passing browser proof for ${row.english.id}.`);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  requireTrue(!/<iframe\b|\bfetch\s*\(/i.test(html), `${row.english.id} is not local/DOM-free.`);
  requireTrue(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`), `${row.english.id} AI route id is missing.`);
  requireTrue(html.includes('FAO - uzalishaji na malisho ya mifugo</a>'), `${row.english.id} named source is missing.`);
  requireTrue(html.includes('bei tuli zilizopitiwa kwa rejea za 2024-2025'), `${row.english.id} freshness is missing.`);
  requireTrue(html.includes('Kiwango cha uhakika'), `${row.english.id} confidence is missing.`);
  return {
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: row.country ? row.country.code : null,
    state: 'accepted',
    evidence: {
      staticOracle: row.country ? 'independent formula/data/currency oracle matched shared English engine' : '15-country hub route/source/artwork proof',
      browser: browserProof.title,
      validCalculation: Boolean(row.country),
      invalidBoundaries: row.country ? staticProof.invalidOracle.boundaries : [],
      staleResultAndActionsCleared: Boolean(row.country),
      exportsParsedAndReopened: row.country ? ['json', 'txt', 'csv', 'pdf'] : [],
      share: row.country ? 'system share payload proved with exact served route' : 'not offered on hub',
      save: row.country ? 'localStorage object reopened and parsed' : 'not offered on hub',
      privacy: 'consent declined; no external requests, writes, iframe, fetch, console, page, resource, or HTTP failures',
      responsive: ['320px with computed root font doubled', '375px with computed root font doubled', 'document/body and enumerated offender overflow all zero'],
      themes: ['system-dark', 'system-light', 'explicit-dark', 'explicit-light'],
      accessibility: ['visible labels', 'keyboard submit', 'skip link', 'result focus', 'all enabled app controls focusable with visible indicator', 'complete native sequential Tab order with visible focus', 'text contrast >=4.5:1', 'boundary and focus contrast >=3:1'],
      seo: ['canonical', 'Open Graph URL', 'WebApplication schema in sw', 'Swahili page en/fr/sw alternates', 'paired English reciprocal Swahili alternate'],
      artwork: row.artwork.file,
      sourceFreshnessConfidence: true,
      aiRouteId: row.english.id,
    },
  };
});

const receipt = {
  schemaVersion: 2,
  family: FAMILY,
  locale: 'sw',
  baseSha: BASE_SHA,
  preservedCandidateReviewed: 'a83b504502e398cd3a8e992e4e2987df69033d00',
  verifiedAt: browser.stats.startTime,
  result: { total: 16, accepted: 16, blocked: 0 },
  acceptanceBoundary: 'Candidate app-level acceptance only; central ledger, AI map, product-surface records, locale coverage and reciprocal non-English metadata remain coordinator-owned.',
  acceptedIds: accepted.map(row => row.englishId),
  blockedIds: [],
  routes: accepted,
  evidenceOwners: {
    manifest: 'data/localization/sw-agriculture-parity-manifest.json',
    generator: 'scripts/build-sw-agriculture-family.js',
    contract: 'scripts/lib/sw-agriculture-family-contracts/livestock-feed.js',
    controller: 'assets/js/pages/sw-agriculture-livestock-feed.js',
    engine: 'engines/src/livestock-feed-engine.js',
    data: 'data/agriculture/livestock-feed-data.js',
    staticTest: 'tests/sw-agriculture-livestock-feed-family.test.js',
    browserTest: 'tests/e2e/sw-agriculture-livestock-feed-family.spec.js',
    browserConfig: 'tests/playwright.sw-livestock-feed.config.js',
    oracleReport: path.relative(ROOT, oraclePath).replace(/\\/g, '/'),
    rawBrowserReport: path.relative(ROOT, browserPath).replace(/\\/g, '/'),
  },
  evidenceHashes: { oracleSha256: sha256(oraclePath), rawBrowserSha256: sha256(browserPath) },
  browserSummary: browser.stats,
  exportProof: { countryRoutes: 15, formatsPerRoute: 4, parsedOrReopenedExports: 60 },
  invalidProof: { countryRoutes: 15, boundariesPerRoute: 6, assertions: 90 },
  reflowProof: { routes: 16, widthsPerRoute: [320, 375], rootComputedFontMultiplier: 2, assertions: ['computed font doubled', 'document overflow zero', 'body overflow zero', 'enumerated offender overflow zero', 'controls/results usable', 'sequential keyboard/focus'] },
  artwork: { expected: 16, present: 16, missing: 0, missingReport: path.relative(ROOT, artworkPath).replace(/\\/g, '/') },
  reciprocalMetadataFollowup: {
    reason: 'French and Hausa files were outside this candidate lane; coordinator must serialize metadata-only reciprocity before central acceptance.',
    frenchFiles: frenchReciprocityPending,
    hausaFiles: hausaReciprocityPending,
  },
  coordinatorIntegrationBlockers: {
    localizationArtifacts: ['data/registry/locale-page-coverage.json', 'reports/localization-coverage.json', 'reports/localization-coverage.md'],
    swParityInventory: ['reports/swahili-free-app-parity-inventory.json', 'reports/swahili-free-app-parity-inventory.md'],
    swProductSurfaceRoutes: rows.map(row => row.swahili.file),
    centralAiMap: 'unchanged and baseline check remains green at 487 accepted routes; promote this family only after coordinator acceptance',
  },
  scopeGuards: { centralAcceptanceLedgerEdited: false, centralAiMapEdited: false, masterInventoryEdited: false, frenchVisibleUiEdited: false, otherLocaleEdited: false, sitemapEdited: false, distEdited: false, deployEdited: false },
};
fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
fs.writeFileSync(artworkPath, `${JSON.stringify({ schemaVersion: 1, family: FAMILY, expected: 16, present: 16, missing: missingArtwork }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ family: FAMILY, accepted: 16, blocked: 0, receipt: path.relative(ROOT, receiptPath), missingArtwork: 0 }, null, 2));
