#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const BASE_SHA = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';
const INVENTORY_FILE = 'reports/swahili-free-app-parity-inventory.json';
const ACCEPTANCE_FILE = 'data/audits/swahili-free-app-acceptance.json';
const MANIFEST_FILE = 'data/localization/sw-financial-shard-b-manifest.json';
const RECEIPT_FILE = 'reports/swahili-financial-shard-b-candidate-receipt.json';
const HUMAN_FILE = 'reports/swahili-financial-shard-b-candidate-receipt.md';
const ARTWORK_FILE = 'reports/swahili-financial-shard-b-missing-artwork.json';

const ACCEPTED = new Set([
  'lr-paye',
  'microfinance-calc',
  'mortgage-affordability',
  'mortgage-calculator',
  'mr-paye',
  'ng-cgt',
  'ng-cit',
  'ng-wht',
  'payslip-generator',
  'pension-proj',
  'property-roi',
  'property-transfer-cost',
  'rent-vs-buy',
  'retirement-planner',
  'route-fares',
  'salary-compare',
  'salary-intelligence',
  'side-hustle-tax',
  'so-paye',
  'ss-paye',
  'st-paye',
  'staff-cost',
  'startup-valuation',
  'student-loan',
  'tg-paye',
  'transfer-pricing',
  'za-cgt',
  'za-dividend-tax',
  'za-gepf',
  'za-transfer-duty',
  'za-uif',
]);

const PROOF = {
  'lr-paye': ['tests/engines/lr-paye-browser-parity.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'microfinance-calc': ['tests/microfinance-offer-engine.test.js', 'tests/e2e/microfinance-offer-vip.spec.js'],
  'mortgage-affordability': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/mortgage-budget-boundary.spec.js'],
  'mortgage-calculator': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/day3-finance-mortgage-vip.spec.js'],
  'mr-paye': ['tests/engines/mr-paye-browser-parity.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'ng-cgt': ['tests/engines/ng-cgt.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'ng-cit': ['tests/engines/ng-cit.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'ng-wht': ['tests/engines/ng-wht.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'payslip-generator': ['tests/payslip-unicode-roundtrip.test.js', 'tests/e2e/day3-finance-payslip-vip.spec.js'],
  'pension-proj': ['tests/pension-projection-planner.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'property-roi': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/property-roi-vip.spec.js'],
  'property-transfer-cost': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/property-transfer-cost-vip.spec.js'],
  'rent-vs-buy': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/rent-vs-buy-vip.spec.js'],
  'retirement-planner': ['tests/retirement-scenario-planner.test.js', 'tests/e2e/day3-finance-retirement-planner-vip.spec.js'],
  'route-fares': ['tests/engines/route-fares.test.js', 'tests/e2e/day3-finance-route-fares-locales-vip.spec.js'],
  'salary-compare': ['tests/salary-offer-compare.test.js', 'tests/e2e/day3-finance-salary-compare-vip.spec.js'],
  'salary-intelligence': ['tests/salary-evidence-notebook.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'side-hustle-tax': ['tests/side-income-tax-reserve.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'so-paye': ['tests/engines/so-paye.test.js', 'tests/e2e/day3-finance-somalia-vip.spec.js'],
  'ss-paye': ['tests/engines/ss-paye.test.js', 'tests/e2e/day3-finance-south-sudan-vip.spec.js'],
  'st-paye': ['tests/engines/st-paye.test.js', 'tests/e2e/day3-finance-sao-tome-vip.spec.js'],
  'staff-cost': ['tests/staff-cost-planner.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'startup-valuation': ['tests/startup-valuation-engine.test.js', 'tests/e2e/startup-valuation-vip.spec.js'],
  'student-loan': ['tests/student-loan-plan.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'tg-paye': ['tests/engines/tg-paye.test.js', 'tests/e2e/day3-finance-togo-vip.spec.js'],
  'transfer-pricing': ['tests/engines/transfer-pricing-planner.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'za-cgt': ['tests/engines/za-cgt.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'za-dividend-tax': ['tests/engines/za-dividend-tax.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'za-gepf': ['tests/za-gepf-engine.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'za-transfer-duty': ['tests/za-transfer-duty-engine.test.js', 'tests/e2e/za-transfer-duty-vip.spec.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'za-uif': ['tests/za-uif-engine.test.js', 'tests/e2e/za-uif-vip.spec.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
};

const SWAHILI_OVERRIDES = {
  'ng-cgt': { primarySwahiliFile: 'sw/zana/kikokotoo-cgt-nigeria/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-cgt-nigeria/' },
  'ng-cit': { primarySwahiliFile: 'sw/zana/kikokotoo-cit-nigeria/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-cit-nigeria/' },
  'ng-wht': { primarySwahiliFile: 'sw/zana/kikokotoo-wht-nigeria/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-wht-nigeria/' },
  'za-cgt': { primarySwahiliFile: 'sw/zana/kikokotoo-cgt-afrika-kusini/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-cgt-afrika-kusini/' },
  'za-dividend-tax': { primarySwahiliFile: 'sw/zana/kikokotoo-kodi-gawio-afrika-kusini/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-kodi-gawio-afrika-kusini/' },
  'za-gepf': { primarySwahiliFile: 'sw/zana/kikokotoo-gepf-afrika-kusini/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-gepf-afrika-kusini/' },
  'za-transfer-duty': { primarySwahiliFile: 'sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/' },
  'za-uif': { primarySwahiliFile: 'sw/zana/kikokotoo-uif-afrika-kusini/index.html', primarySwahiliRoute: '/sw/zana/kikokotoo-uif-afrika-kusini/' },
  'salary-intelligence': { primarySwahiliFile: 'sw/zana/daftari-la-ushahidi-wa-mishahara/index.html', primarySwahiliRoute: '/sw/zana/daftari-la-ushahidi-wa-mishahara/' },
  'side-hustle-tax': { primarySwahiliFile: 'sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada/index.html', primarySwahiliRoute: '/sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada/' },
  'transfer-pricing': {
    primarySwahiliFile: 'sw/zana/ulinganisho-wa-bei-za-uhamisho/index.html',
    primarySwahiliRoute: '/sw/zana/ulinganisho-wa-bei-za-uhamisho/',
  },
  'pension-proj': {
    primarySwahiliFile: 'sw/zana/makadirio-ya-pensheni/index.html',
    primarySwahiliRoute: '/sw/zana/makadirio-ya-pensheni/',
  },
  'staff-cost': {
    primarySwahiliFile: 'sw/zana/bajeti-ya-gharama-za-wafanyakazi/index.html',
    primarySwahiliRoute: '/sw/zana/bajeti-ya-gharama-za-wafanyakazi/',
  },
  'student-loan': {
    primarySwahiliFile: 'sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi/index.html',
    primarySwahiliRoute: '/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi/',
  },
};

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  if (!route || route === '/') return '/';
  return `/${route.replace(/^\/+|\/+$/g, '')}`;
}

function resolveEnglishFile(route) {
  const relative = normalizeRoute(route).replace(/^\//, '');
  const candidates = [`${relative}.html`, path.join(relative, 'index.html')];
  return candidates.find((file) => fs.existsSync(path.join(ROOT, file))) || null;
}

function visibleText(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function extract(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : null;
}

function inspectAccepted(row) {
  const localized = { ...row, ...(SWAHILI_OVERRIDES[row.englishId] || {}) };
  const swFile = localized.primarySwahiliFile;
  const swPath = swFile && path.join(ROOT, swFile);
  const englishFile = resolveEnglishFile(row.englishRoute);
  const englishPath = englishFile && path.join(ROOT, englishFile);
  const swExists = Boolean(swPath && fs.existsSync(swPath));
  const enExists = Boolean(englishPath && fs.existsSync(englishPath));
  const html = swExists ? fs.readFileSync(swPath, 'utf8') : '';
  const english = enExists ? fs.readFileSync(englishPath, 'utf8') : '';
  const route = normalizeRoute(localized.primarySwahiliRoute);
  const canonical = normalizeRoute(extract(html, /<link\b(?=[^>]*rel=["'][^"']*canonical)[^>]*href=["']([^"']+)/i));
  const ogUrl = normalizeRoute(extract(html, /<meta\b(?=[^>]*property=["']og:url["'])[^>]*content=["']([^"']+)/i));
  const ogImage = extract(html, /<meta\b(?=[^>]*property=["']og:image["'])[^>]*content=["']([^"']+)/i);
  const artwork = ogImage && ogImage.replace(/^https?:\/\/[^/]+\//i, '');
  const scripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)/gi)]
    .map((match) => match[1].split(/[?#]/)[0])
    .filter((source) => /\/(?:engines?|pages|lib)\//.test(source));
  const implementationOwners = scripts.slice();
  if (['ng-cgt', 'ng-cit', 'ng-wht', 'za-dividend-tax', 'za-gepf', 'za-transfer-duty', 'za-uif'].includes(row.englishId)) implementationOwners.push('data/tool-verification.json', 'data/source-registry.json');
  const text = visibleText(html);
  const checks = {
    swahiliFile: swExists,
    englishFile: enExists,
    nativeDocument: /<html\b[^>]*lang=["']sw["']/i.test(html)
      && !/<iframe\b/i.test(html)
      && !/afrotools-language-fallback|generated-bridge|fetch\s*\(\s*["']\/tools\//i.test(html),
    dedicatedEngineOrController: scripts.length > 0,
    practicalUi: /<(?:form|input|select|textarea|button)\b/i.test(html),
    selfCanonical: canonical === route,
    selfOgUrl: ogUrl === route,
    swahiliSchema: /["']inLanguage["']\s*:\s*["']sw["']/i.test(html),
    hreflangEnglish: /<link\b(?=[^>]*hreflang=["']en["'])/i.test(html),
    hreflangSwahili: /<link\b(?=[^>]*hreflang=["']sw["'])/i.test(html),
    hreflangDefault: /<link\b(?=[^>]*hreflang=["']x-default["'])/i.test(html),
    reciprocalEnglish: enExists && new RegExp(`hreflang=["']sw["'][^>]*href=["']https://afrotools\\.com${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?`, 'i').test(english),
    sourceBoundary: /(?:Chanzo|Vyanzo|Mamlaka|Imekaguliwa|vilikaguliwa|zilikaguliwa|kikomo|makadirio|kupanga|Thibitisha|Hakuna forecast|Hakuna kiwango)/i.test(text),
    privacyBoundary: /(?:faragha|hubaki|hazitumwi|hakuna kinachohifadhiwa|kifaa|kivinjari)/i.test(text),
    artworkDeclared: Boolean(ogImage),
    artworkExists: Boolean(artwork && fs.existsSync(path.join(ROOT, artwork))),
    resetOrInvalidAction: /(?:Futa|Weka upya|Anza upya|Badilisha|novalidate|validationError|changed:|id=["'][^"']*(?:clear|reset)[^"']*["'])/i.test(html),
    exportOrExplicitNone: /(?:Pakua|Nakili|Shiriki|Chapisha|PDF|CSV|JSON|TXT)/i.test(text),
    noLeadGate: !/pdf-leads|pdfEmail|openPdfModal|auto-email-gate/i.test(html),
    noRawInputUrlShare: !/(?:location|window\.location)\.href\s*\+\s*["'][?&]|URLSearchParams\s*\([^)]*(?:gross|salary|income|amount)/i.test(html),
    proofFiles: (PROOF[row.englishId] || []).every((file) => fs.existsSync(path.join(ROOT, file))),
  };
  const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return { englishFile, swahiliFile: swFile, swahiliRoute: route, implementationOwners, ogImage, artwork, checks, failedChecks };
}

function blockReason(row) {
  if (row.state === 'missing') return 'No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane.';
  if (row.englishId === 'paye-calculator') return 'The candidate is a PAYE directory hub, not a native equivalent of the English calculator app.';
  if (row.englishId === 'salary-intelligence') return 'The candidate is the broad salary category hub, not a native equivalent of the English salary-intelligence app.';
  if (row.englishId === 'za-paye') return 'Skipped fail-closed at position 90: only a minified legacy engine exists, the page and source contract still target 2025/26, and no maintained readable engine owner can safely support native parity.';
  return 'The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt.';
}

const inventory = readJson(INVENTORY_FILE);
const acceptance = readJson(ACCEPTANCE_FILE);
const alreadyAccepted = new Set(acceptance.entries.filter((entry) => entry.status === 'accepted').map((entry) => entry.englishId));
// The programme was partitioned against BASE_SHA. Coordinator acceptance grows
// during integration, so deriving shards from today's unaccepted rows silently
// reassigns the lane. Resolve the frozen 46+46 IDs from their owned manifests.
const financialById = new Map(inventory.rows
  .filter((row) => row.categoryKey === 'financial')
  .map((row) => [row.englishId, row]));
const shardAManifest = readJson('data/localization/sw-financial-shard-a-candidate.json');
const shardBManifest = readJson(MANIFEST_FILE);
const shardBBaselineById = new Map(shardBManifest.rows.map((row) => [row.englishId, row]));
const shardA = shardAManifest.rows.map((row) => financialById.get(row.englishId));
const shardB = shardBManifest.rows.map((row) => financialById.get(row.englishId));
const unaccepted = [...shardA, ...shardB];
const overlap = shardB.filter((row) => shardA.some((other) => other.englishId === row.englishId));

if (unaccepted.some((row) => !row)) throw new Error('Pinned financial shard assignment no longer resolves against the authoritative inventory.');
if (unaccepted.length !== 92) throw new Error(`Expected 92 pinned financial rows; found ${unaccepted.length}.`);
if (shardA.length !== 46 || shardB.length !== 46) throw new Error('Expected two exact 46-row shards.');
if (overlap.length) throw new Error(`Shard overlap: ${overlap.map((row) => row.englishId).join(', ')}`);
if (shardB[0].englishId !== 'lr-paye' || shardB.at(-1).englishId !== 'za-uif') throw new Error('Shard B boundaries drifted.');

const rows = shardB.map((row, index) => {
  const selected = ACCEPTED.has(row.englishId);
  const inspection = selected ? inspectAccepted(row) : null;
  if (selected && inspection.failedChecks.length) {
    throw new Error(`${row.englishId} cannot be accepted: ${inspection.failedChecks.join(', ')}`);
  }
  return {
    position: index + 47,
    englishId: row.englishId,
    englishName: row.englishName,
    englishRoute: normalizeRoute(row.englishRoute),
    startingState: shardBBaselineById.get(row.englishId).startingState,
    status: selected ? 'accepted' : 'blocked',
    swahiliRoute: selected ? inspection.swahiliRoute : normalizeRoute(row.primarySwahiliRoute),
    swahiliFile: selected ? inspection.swahiliFile : row.primarySwahiliFile,
    sourceOwner: selected ? inspection.implementationOwners : row.sourceOwner,
    proof: selected ? {
      staticContract: 'tests/swahili-financial-shard-b.test.js',
      browserMatrix: 'tests/e2e/swahili-financial-shard-b.spec.js',
      existingOracleAndWorkflowSuites: PROOF[row.englishId],
      checks: inspection.checks,
      advertisedExportProof: {
        status: 'repository-suite-present',
        suites: PROOF[row.englishId],
        note: row.englishId === 'student-loan'
          ? 'The focused shard suite downloads and parses CSV and JSON, reopens the generated PDF with pdf-parse, verifies clipboard output and proves no raw-input network write.'
          : row.englishId === 'staff-cost'
            ? 'The focused shard suite validates golden totals, downloads and parses injection-safe CSV, reopens the generated PDF, verifies clipboard/reset/stale-evidence behavior and proves no raw-input network write.'
            : row.englishId === 'pension-proj'
              ? 'The focused shard suite validates the shared pension projection oracle, parses the downloaded year-by-year CSV, reopens PDF, verifies clipboard/stale-evidence behavior and proves no raw-input network write.'
              : row.englishId === 'transfer-pricing'
                ? 'The focused shard suite exercises the five shared-engine methods and fail-closed range/source boundary, parses TXT and JSON, verifies print, copy and reset, and proves no raw-input network write.'
                : row.englishId === 'side-hustle-tax'
                  ? 'The focused shard suite validates the user-rate reserve oracle, injection-safe CSV, parsed JSON, reopened PDF, copy/reset/stale-evidence behavior and no raw-input network write.'
                  : row.englishId === 'salary-intelligence'
                    ? 'The focused shard suite validates quartile and annualization semantics, parses injection-safe CSV and JSON, clears and reimports/reopens JSON, reopens PDF with pdf-parse, verifies clipboard, future-date rejection, reset and no raw-input network write.'
                    : row.englishId === 'ng-cgt'
                      ? 'The focused shard suite compares the rendered estimate with the maintained NigeriaCgt engine, downloads and parses the only advertised TXT export, verifies clipboard, stale-result clearing, invalid focus, reset and no raw-input network write.'
                    : row.englishId === 'ng-cit'
                      ? 'The focused shard suite compares the rendered estimate with the maintained NigeriaCit engine, downloads and parses the only advertised TXT export, verifies clipboard, stale-result clearing, invalid focus, reset and no raw-input network write.'
                    : row.englishId === 'ng-wht'
                      ? 'The focused shard suite compares the rendered estimate with the maintained Nigeria WHT engine, downloads and parses TXT, reopens parser-valid print/PDF, verifies clipboard, stale-result clearing, invalid focus, reset and no raw-input network write.'
                      : row.englishId === 'za-dividend-tax'
                        ? 'The focused shard suite compares standard, documented reduced-rate and exemption outputs with the unchanged SARS engine, parses TXT, reopens print/PDF, verifies clipboard, stale-result clearing, invalid focus, reset and no raw-input network write.'
                        : row.englishId === 'za-gepf'
                          ? 'The focused shard suite compares the rendered estimate with the maintained GEPF engine, parses CSV and JSON, reopens PDF, verifies clipboard, stale-result clearing, invalid focus, reset and no raw-input network write.'
                          : row.englishId === 'za-transfer-duty'
                            ? 'The focused shard suite compares the rendered estimate with the maintained SARS transfer-duty engine, parses CSV and JSON, reopens PDF, verifies clipboard, stale-result clearing, invalid-date focus, reset and no raw-input network write.'
                            : row.englishId === 'za-uif'
                              ? 'The focused shard suite compares contribution, ordinary-benefit and maternity outputs with the maintained UIF engine, reopens the only advertised clipboard summary, verifies stale-result clearing, invalid focus, reset and no raw-input network write.'
          : 'App-specific suites contain parser or payload-contract checks. The focused current-lane run passed 20 of 31 selected workflow/export tests, including Mauritania PDF parsing; the remaining failures are recorded separately and are not represented as passing evidence.',
      },
      privacyNoRawInputNetworkLeak: true,
      mobile320: true,
      mobile375: true,
      reflow200Percent: true,
      lightDark: true,
      keyboardFocusA11y: true,
    } : null,
    blocker: selected ? null : blockReason(row),
  };
});

const acceptedRows = rows.filter((row) => row.status === 'accepted');
const blockedRows = rows.filter((row) => row.status === 'blocked');
const missingArtwork = rows.filter((row) => {
  const image = `assets/img/tools/${row.englishId}.webp`;
  return !fs.existsSync(path.join(ROOT, image));
}).map((row) => ({ englishId: row.englishId, expectedArtwork: `assets/img/tools/${row.englishId}.webp`, status: 'missing' }));

const manifest = {
  schemaVersion: 1,
  lane: 'swahili-financial-shard-b',
  baseSha: BASE_SHA,
  derivation: {
    categoryKey: 'financial',
    acceptedRowsExcludedFrom: ACCEPTANCE_FILE,
    sort: 'englishId ascending using localeCompare',
    positions: [47, 92],
    totalUnacceptedFinancialRows: unaccepted.length,
    shardACount: shardA.length,
    shardBCount: shardB.length,
    overlapWithShardA: overlap.map((row) => row.englishId),
    shardALastEnglishId: shardA.at(-1).englishId,
    shardBFirstEnglishId: shardB[0].englishId,
    shardBLastEnglishId: shardB.at(-1).englishId,
  },
  rows: rows.map(({ proof, blocker, ...row }) => row),
};

const receipt = {
  schemaVersion: 1,
  lane: 'swahili-financial-shard-b',
  reviewedAt: '2026-08-09',
  baseSha: BASE_SHA,
  acceptanceRule: 'Fail closed per English ID. Physical route presence or localized-shell classification alone earns no credit.',
  denominator: rows.length,
  accepted: acceptedRows.length,
  blocked: blockedRows.length,
  coordinatorOwnedFilesEdited: false,
  orderingDecision: 'Position 90 za-paye remains skipped fail-closed because it has no maintained readable engine and its 2025/26 source contract is stale. Position 91 za-transfer-duty is accepted. Position 92 za-uif is the next eligible row and owns a maintained DOM-free engine plus current SARS and Department of Employment and Labour evidence.',
  changedProductPaths: [
    'assets/js/engines/lr-paye.js',
    'assets/js/engines/mr-paye.js',
    'assets/js/pages/student-loan-vip.js',
    'assets/js/pages/staff-cost-sw.js',
    'assets/js/pages/pension-projection-sw.js',
    'assets/js/pages/transfer-pricing-vip.js',
    'assets/js/pages/side-income-tax-reserve-vip.js',
    'assets/js/pages/salary-intelligence-vip.js',
    'assets/js/pages/ng-cgt-vip.js',
    'assets/js/pages/ng-cit-vip.js',
    'assets/js/pages/ng-wht-vip.js',
    'assets/js/pages/za-cgt-vip.js',
    'assets/js/pages/za-dividend-tax-vip.js',
    'assets/js/pages/za-gepf-vip.js',
    'assets/css/za-gepf-sw.css',
    'assets/js/pages/za-transfer-duty-vip.js',
    'assets/css/za-transfer-duty-sw.css',
    'engines/src/za-transfer-duty-engine.js',
    'engines/za-transfer-duty-engine.js',
    'assets/js/pages/za-uif-vip.js',
    'assets/css/za-uif-sw.css',
    'engines/src/za-uif-engine.js',
    'engines/za-uif-engine.js',
    'assets/css/ng-wht-vip.css',
    'data/tool-verification.json',
    'data/source-registry.json',
    'assets/js/components/tool-registry.js',
    'assets/css/property-roi-vip.css',
    'assets/css/property-transfer-cost-vip.css',
    'assets/css/route-fares-vip.css',
    'assets/css/somalia-paye-vip.css',
    'assets/css/startup-valuation-vip.css',
    'assets/css/togo-paye-vip.css',
    'sw/sao-tome/kikokotoo-kodi-mshahara/index.html',
    'sw/liberia/kikokotoo-kodi-mshahara/index.html',
    'sw/mauritania/kikokotoo-kodi-mshahara/index.html',
    'sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html',
    'sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi/index.html',
    'sw/zana/bajeti-ya-gharama-za-wafanyakazi/index.html',
    'sw/zana/makadirio-ya-pensheni/index.html',
    'sw/zana/ulinganisho-wa-bei-za-uhamisho/index.html',
    'sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada/index.html',
    'sw/zana/daftari-la-ushahidi-wa-mishahara/index.html',
    'sw/zana/kikokotoo-cgt-nigeria/index.html',
    'sw/zana/kikokotoo-cit-nigeria/index.html',
    'sw/zana/kikokotoo-wht-nigeria/index.html',
    'sw/zana/kikokotoo-cgt-afrika-kusini/index.html',
    'sw/zana/kikokotoo-kodi-gawio-afrika-kusini/index.html',
    'sw/zana/kikokotoo-gepf-afrika-kusini/index.html',
    'sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/index.html',
    'sw/zana/kikokotoo-uif-afrika-kusini/index.html',
    'tools/student-loan/index.html',
    'fr/tools/pret-etudiant/index.html',
    'tools/staff-cost/index.html',
    'fr/tools/cout-employe/index.html',
    'ha/kayan-aiki/kudin-maikaci/index.html',
    'tools/pension-proj/index.html',
    'fr/tools/projection-pension-simple/index.html',
    'tools/transfer-pricing/index.html',
    'fr/tools/prix-transfert/index.html',
    'tools/side-hustle-tax/index.html',
    'fr/tools/impot-activite-secondaire/index.html',
    'tools/salary-intelligence/index.html',
    'fr/jobs/salary-benchmarks/index.html',
    'tools/ng-cgt/index.html',
    'fr/tools/ng-plus-value/index.html',
    'ha/kayan-aiki/cgt-najeriya/index.html',
    'tools/ng-cit/index.html',
    'fr/tools/ng-impot-societes/index.html',
    'ha/kayan-aiki/cit-najeriya/index.html',
    'yo/awon-ise/cit-naijiria/index.html',
    'tools/ng-wht/index.html',
    'fr/tools/ng-retenue-source/index.html',
    'ha/kayan-aiki/wht-najeriya/index.html',
    'yo/awon-ise/wht-naijiria/index.html',
    'tools/za-cgt/index.html',
    'fr/tools/za-plus-value/index.html',
    'tools/za-dividend-tax/index.html',
    'fr/tools/za-impot-dividendes/index.html',
    'tools/za-gepf/index.html',
    'fr/tools/za-gepf/index.html',
    'tools/za-transfer-duty/index.html',
    'fr/tools/za-droits-mutation/index.html',
    'tools/za-uif/index.html',
    'fr/tools/za-uif/index.html',
  ],
  formulaDataSourceDecision: 'No rate, ceiling, tier or benefit formula changed. Za-uif delegates to engines/za-uif-engine.js generated from the maintained engines/src owner; only verifiedThrough advanced to 2026-08-09 after official SARS and Department source rechecks. The 1% plus 1% contribution, R17,712 ceiling, 38%-60% and 20% tiers, and 66% maternity boundary remain unchanged.',
  browserMatrix: { engine: 'system Chrome', workers: 1, isolatedPorts: [43917, 43918, 43919, 43920, 43921, 43922, 43923, 43924], widths: [320, 375], colorSchemes: ['dark', 'light'], textReflowPercent: 200, syntheticDataOnly: true },
  validationSummary: {
    focusedNodeSubtests: { passed: 13, failed: 0, note: 'Current increment covered the UIF engine oracle, eleven shard derivation/static/source-owner checks and the tool-verification source contract.' },
    zaUifFamilyBrowser: { passed: 4, failed: 0, execution: 'one-worker English, French and Swahili regression on isolated port 43924 with contribution, ordinary-benefit and maternity output, private clipboard summary, privacy, focus, theme and reflow proof' },
    zaTransferDutyFamilyBrowser: { passed: 6, failed: 0, execution: 'one-worker English, French and Swahili regression on isolated port 43923 with exact shared-engine output, parsed CSV/JSON/PDF, real French and English PDF downloads, privacy, focus, theme and reflow proof' },
    zaGepfFamilyBrowser: { passed: 6, failed: 0, execution: 'one-worker English, French and Swahili regression on isolated port 43922 with exact shared-engine output, parsed CSV/JSON/PDF, real French and English PDF downloads, privacy, focus, theme and reflow proof' },
    zaDividendTaxFamilyBrowser: { passed: 8, failed: 0, execution: 'one-worker English, French and Swahili regression on isolated port 43921 with standard/reduced/exempt boundaries, parsed TXT, reopened print/PDF, privacy, focus, theme and reflow proof' },
    zaCgtFamilyBrowser: { passed: 7, failed: 0, execution: 'one-worker English and Swahili regression on isolated port 43920 with exact progressive tax, local TXT, privacy, focus, theme and reflow proof' },
    ngCgtFamilyBrowser: { passed: 7, failed: 0, execution: 'one-worker English, French, Hausa and Swahili family regression with exact totals, TXT, scope, privacy and reflow proof' },
    ngCitFamilyBrowser: { passed: 9, failed: 0, execution: 'one-worker English, Swahili, French, Hausa and Yoruba family regression on isolated port 43918 with exact statutory boundaries, TXT, privacy, focus, theme and reflow proof' },
    ngWhtFamilyBrowser: { passed: 13, failed: 0, execution: 'one-worker English, Swahili, French, Hausa and Yoruba family regression on isolated port 43919 with exact engine, TXT/PDF, privacy, focus, theme and reflow proof' },
    shardBrowserMatrix: { passed: 48, failed: 0, execution: 'complete one-worker system-Chrome run on isolated port 43917' },
    focusedExistingWorkflowExportSelection: { passed: 20, failed: 11, failuresClaimedAsPass: false },
    privacyAiConsent: { serverPassed: true, browserPassed: 3, browserFailed: 0 },
    localizationValidation: { publicPages: 11304, hreflangRelationships: 33508, equivalenceGroups: 5351, directLanguageValidation: 'passed', hreflangStatus: 'passed', buildI18nValidateWrapper: 'carried-protected-artifact-debt', protectedGeneratedCoverageArtifacts: 'data/registry/locale-page-coverage.json and reports/localization-coverage.{json,md} were intentionally not regenerated' },
    linkValidation: { htmlFiles: 11523, internalLinks: 138307, broken: 0 },
    registryAudit: { status: 'carried-baseline-debt', missingPages: ['job-offer-evaluator', 'zana-tathmini-ya-ofa-ya-kazi-sw-wave8'], netNewNgCgtMissingPage: false, netNewNgCitMissingPage: false, netNewNgWhtMissingPage: false, netNewZaCgtMissingPage: false, netNewZaDividendTaxMissingPage: false, netNewZaGepfMissingPage: false },
    southAfricaGepfOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      benefitsContract: 'The official GEPF retirement-benefits and employer-contributions pages remain reachable; the published benefit structure, contribution boundaries and Fund decision boundary remain the maintained engine source contract.',
      actuarialContract: 'GEPF published revised actuarial-interest factors effective 1 October 2025. The shared engine keeps its reviewed factor contract and identifies the estimate as planning-only rather than a Fund quote.',
      decision: 'No formula parameter changed. The Swahili route delegates to the maintained za-gepf engine and does not determine recognised service, tax, withdrawal eligibility or final Fund benefits.',
      urls: [
        'https://www.gepf.co.za/retirement-benefits/',
        'https://www.gepf.co.za/employer-contributions/',
        'https://www.gepf.co.za/clarification-on-the-implementation-of-revised-actuarialinterest-factors-as-at-1-october-2025/',
      ],
    },
    southAfricaTransferDutyOfficialSourceRecheck: {
      checkedOn: '2026-08-09',
      rateContract: 'Official SARS Budget 2026 guidance and Act 3 of 2026 retain the 2027 transfer-duty table effective 1 April 2026.',
      valueContract: 'The SARS eFiling guide retains the greater-of-fair-value-and-consideration assessment boundary and the treatment of other consideration.',
      decision: 'No bracket or formula changed. Only the engine verified-through date advanced to the source-review date; VAT status remains explicit user input and VAT itself is not calculated.',
      urls: [
        'https://www.sars.gov.za/tax-rates/transfer-duty/',
        'https://www.sars.gov.za/td-ae-02-g02-guide-for-transfer-duty-via-efiling-external-guide/',
        'https://www.sars.gov.za/wp-content/uploads/Docs/Budget/Budget2026/Budget-tax-guide-2026-online-version-for-printing.pdf',
        'https://www.sars.gov.za/wp-content/uploads/Legal/Acts/2026/Rates-and-Monetary-Amounts-and-Amendment-of-Revenue-Laws-Act-3-of-2026-Government-Gazette-55258.pdf',
      ],
    },
    southAfricaUifOfficialSourceRecheck: {
      checkedOn: '2026-08-09',
      contributionContract: 'SARS still publishes the 1% employee plus 1% employer contribution and the R17,712 monthly ceiling.',
      ordinaryBenefitContract: 'The Department fact sheet and Easy Aid guide retain the daily-income formula, 38%-60% first 238 days, 20% days 239-365 and maximum 365 verified credits.',
      maternityContract: 'The official UIF maternity page retains the 66% rate, 121-day maximum and employer-pay top-up boundary.',
      decision: 'No formula parameter changed. The Swahili route remains a planning tool and leaves credits, eligibility, claims and approved payment to UIF.',
      urls: [
        'https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/',
        'https://www.labour.gov.za/DocumentCenter/Publications/Unemployment%20Insurance%20Fund/Fact%20Sheet%20on%20the%20Calculation%20of%20normal%20UIF%20benefit.pdf',
        'https://www.labour.gov.za/DocumentCenter/Publications/Unemployment%20Insurance%20Fund/EASY%20AID%20Guide%20Spreadsheet%20Application.pdf',
        'https://uif.labour.gov.za/UIF_BENEFITS/Pages/Maternity-Benefits.aspx',
      ],
    },
    southAfricaDividendTaxOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      ratesContract: 'The official SARS Dividends Tax page remains reachable and states 20% for dividends paid on or after 22 February 2017, with payment by the last day of the following month. The 2027 SARS interest-and-dividends page confirms no rate change.',
      reliefContract: 'SARS continues to require the relevant declaration and undertaking before an exemption or reduced DTA rate may be applied; the DTA portal remains the treaty source boundary.',
      decision: 'No formula parameter changed. The Swahili route delegates to the reviewed za-dividend-tax engine and does not infer beneficial ownership, treaty eligibility, exemption, filing, assessment or payment status.',
      urls: [
        'https://www.sars.gov.za/types-of-tax/dividends-tax/',
        'https://www.sars.gov.za/tax-rates/income-tax/interest-and-dividends/',
        'https://www.sars.gov.za/legal-counsel/international-treaties-agreements/double-taxation-agreements-protocols/',
      ],
    },
    southAfricaCgtOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      ratesContract: 'The official SARS CGT page remains reachable and identifies the 2027 assessment year as 1 March 2026 through 28 February 2027; the official individual-rate page and comprehensive CGT guide remain the engine source boundary.',
      decision: 'No formula parameter changed. The Swahili route delegates to the reviewed za-cgt engine and does not decide capital-versus-revenue classification, residence eligibility, valuation, filing, assessment or payment.',
      urls: [
        'https://www.sars.gov.za/tax-rates/income-tax/capital-gains-tax-cgt/',
        'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/',
        'https://www.sars.gov.za/lapd-cgt-g01-comprehensive-guide-to-capital-gains-tax/',
      ],
    },
    nigeriaWhtOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      regulationsContract: 'The official 2024 Gazette remains reachable and states the transaction, recipient, residence, Tax ID and ratified-treaty rules used by the unchanged engine.',
      administrationContract: 'Nigeria Tax Administration Act 2025 section 51 requires deduction at prescribed regulatory rates; JRB 2026 guidance continues to reference the 2024 Regulations and federal transition guidance retains the 1 January 2026 boundary.',
      decision: 'No formula parameter changed. The Swahili route delegates to the reviewed engine, requires scope and relief evidence, and makes no filing, authority, treaty-entitlement or exemption decision.',
      urls: [
        'https://fiscalreforms.ng/wp-content/uploads/2024/10/Deduction-of-Tax-at-Source-Withholding-Regulations-2024_Gazetted.pdf',
        'https://www.nipc.gov.ng/wp-content/uploads/2025/08/Nigeria-Tax-Administration-Act-2025-Gazette.pdf',
        'https://www.jrb.gov.ng/media-center/jrb-releases-pit-guidelines-2026',
        'https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/',
      ],
    },
    nigeriaCitOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      actContract: 'The NIPC-published Nigeria Tax Act 2025 remains reachable and states the small-company definition, 0% or 30% company-tax branch, 4% development levy and section 57 review trigger used by the existing engine.',
      transitionContract: 'Federal Ministry of Finance guidance published in June 2026 still states that the Nigeria Tax Act 2025 applies from 1 January 2026.',
      decision: 'No formula parameter changed. The Swahili route delegates to the reviewed English engine, requires explicit scope confirmation and does not calculate the section 57 top-up or make a filing or assessment decision.',
      urls: [
        'https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf',
        'https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/',
        'https://statehouse.gov.ng/new-tax-laws-will-commence-on-january-1-2026-as-planned/',
      ],
    },
    nigeriaCgtOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      actContract: 'The NIPC-published Nigeria Tax Act 2025 remains reachable and states the Nigerian-share proceeds, gain and same-year reinvestment rules used by the existing engine.',
      transitionContract: 'Federal Ministry of Finance guidance published in June 2026 still states that the Nigeria Tax Act 2025 applies from 1 January 2026.',
      decision: 'No formula parameter changed. The Swahili route delegates to the reviewed English engine and remains a scoped planning estimate rather than a filing, assessment or exemption decision.',
      urls: [
        'https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf',
        'https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/',
      ],
    },
    mauritaniaOfficialSourceRecheck: {
      checkedOn: '2026-08-08',
      dgiItsContract: 'Official DGI obligations page remained reachable and states monthly ITS rates of 15%, 25% and 40%.',
      cnssContributionContract: 'Official CNSS declaration form remained reachable and states 13% employer CNSS, 1% worker CNSS and 2% occupational medicine.',
      decision: 'No formula or cap changed; the reviewed 2026-07-21 source contract and 2026-10-31 next-review boundary remain in force.',
      urls: [
        'https://impots.gov.mr/DGI/particuliers/calendrier_obligations_paiement.html',
        'https://cnss.mr/wp-content/uploads/2020/12/declaration-trimestrielle-FR.pdf',
      ],
    },
    lint: { status: 'passed', checkedJavaScriptFiles: 49, netNewChangedPathsReported: 0 },
    legacyLiberiaRegistryTest: { status: 'carried-baseline-debt', productFixturesPassedBeforeRegistryAssertion: true, reason: 'tests/engines/lr-paye.test.js expects two source titles while the existing central formula registry currently contains five.' },
  },
  rows,
  missingArtworkQueue: ARTWORK_FILE,
  requiredCommands: [
    'node scripts/build-sw-financial-shard-b-evidence.js',
    'node scripts/build-source-registry.js --check --as-of=2026-08-08 --only-source-ids=nigeria-wht-2026-source',
    'node scripts/build-source-registry.js --check --as-of=2026-08-08 --only-source-ids=south-africa-cgt-2027-source',
    'node scripts/build-source-registry.js --check --as-of=2026-08-08 --only-source-ids=south-africa-dividends-tax-source',
    'node scripts/build-source-registry.js --check --as-of=2026-08-08 --only-source-ids=south-africa-gepf-source',
    'node scripts/build-source-registry.js --check --as-of=2026-08-09 --only-source-ids=south-africa-transfer-duty-source',
    'node scripts/build-source-registry.js --check --as-of=2026-08-09 --only-source-ids=south-africa-uif-source',
    'node --test tests/engines/ng-wht.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node --test tests/engines/za-cgt.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node --test tests/engines/za-dividend-tax.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node --test tests/za-gepf-engine.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node --test tests/za-transfer-duty-engine.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node --test tests/za-uif-engine.test.js tests/swahili-financial-shard-b.test.js tests/tool-verification.test.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.ng-wht-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.za-cgt-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.za-dividend-tax-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.za-gepf-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.za-transfer-duty-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.za-uif-sw.config.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.sw-financial-shard-b.config.js',
    'node tests/ai-consent-server.test.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test tests/e2e/privacy-ai-consent.spec.js --workers=1 --trace=off',
    'npm run build:i18n:validate (carried protected localization-artifact staleness only)',
    'node scripts/build-i18n.js --validate',
    'npm run validate:hreflang',
    'npm run check-links',
    'npm run audit',
    'npm run lint',
    'npm run type-check',
    'git diff --check',
  ],
};

const human = [
  '# Swahili Finance, Tax & Market Data shard B candidate receipt',
  '',
  `Baseline: \`${BASE_SHA}\``,
  '',
  `Denominator: **${rows.length}**. Accepted: **${acceptedRows.length}**. Blocked: **${blockedRows.length}**.`,
  '',
  `Derivation proof: ${unaccepted.length} unaccepted financial rows; shard A ${shardA.length} rows through \`${shardA.at(-1).englishId}\`; shard B positions 47-92 from \`${shardB[0].englishId}\` through \`${shardB.at(-1).englishId}\`; overlap **${overlap.length}**.`,
  '',
  'Ordering proof: position 90 `za-paye` remains fail-closed because it has no maintained readable engine and its source contract still targets 2025/26. Positions 91 `za-transfer-duty` and 92 `za-uif` are accepted; UIF owns a maintained DOM-free engine plus current official SARS and Department evidence.',
  '',
  'The missing `.claude/rules/i18n.md` reference was recorded as a setup gap; AGENTS.md, the Swahili strategy and coordinator skill supplied the active localization contract.',
  '',
  '## Accepted candidates',
  '',
  '| ID | English owner | Swahili app | Source owners | Export/browser proof |',
  '|---|---|---|---|---|',
  ...acceptedRows.map((row) => `| \`${row.englishId}\` | \`${row.englishRoute}\` | \`${row.swahiliRoute}\` | ${(row.sourceOwner || []).map((owner) => `\`${owner}\``).join('<br>')} | \`tests/e2e/swahili-financial-shard-b.spec.js\` plus app oracle suite |`),
  '',
  '## Blocked candidates',
  '',
  '| ID | Current candidate | Exact blocker |',
  '|---|---|---|',
  ...blockedRows.map((row) => `| \`${row.englishId}\` | ${row.swahiliRoute ? `\`${row.swahiliRoute}\`` : 'None'} | ${row.blocker} |`),
  '',
  '## Proof contract',
  '',
  '- Synthetic inputs only. Shared DOM-free engines and existing app-specific oracle suites preserve English formula/data semantics.',
  '- The focused Playwright matrix checks every accepted route at 320px and 375px, 200% text reflow, system light/dark, keyboard focus, canonical/OG identity, local resource failures, privacy and local-only advertised actions.',
  '- Each accepted app points to an app-specific parser or export-payload suite. The current ng-cit family suite passed 9/9 after its privacy assertion separated consent-mode measurement beacons from first-party or raw-input writes; the historical mixed 20/31 selection remains recorded separately and is not represented as green.',
  '- No coordinator acceptance ledger, inventory, AI route map, locale coverage output, sitemap, redirects, service-worker stamp, live service or other locale UI/copy is edited.',
  '- Blocked high-stakes tax apps remain blocked rather than receiving invented formulas, rates, claims or evidence.',
  '',
  '## Current lane command evidence',
  '',
  `- Evidence generator check: 46 rows, ${acceptedRows.length} accepted candidates, ${blockedRows.length} blocked, one missing artwork.`,
  '- PASS: current focused Node subtests 13/13 cover the UIF engine oracle, shard derivation/static/source-owner checks and the source-verification panel contract.',
  '- PASS: za-uif English/French/Swahili focused family regression 4/4, including contributions, ordinary and maternity benefits, reopened private clipboard summary, privacy, focus, theme and reflow.',
  '- PASS: za-transfer-duty English/French/Swahili focused family regression 6/6, including exact maintained-engine output, parsed CSV/JSON/PDF, real English and French PDF downloads, privacy, focus, theme and reflow.',
  '- PASS: za-gepf English/French/Swahili focused family regression 6/6, including exact maintained-engine output, parsed CSV/JSON/PDF, real English and French PDF downloads, privacy, focus, theme and reflow.',
  '- PASS: za-dividend-tax English/French/Swahili focused family regression 8/8, including standard/reduced/exempt boundaries, parsed TXT, reopened print/PDF, privacy, focus, theme and reflow.',
  '- PASS: za-cgt English/Swahili focused family regression 7/7, including exact progressive tax, parsed TXT, metadata, privacy, focus, theme and reflow.',
  '- PASS: ng-wht English/Swahili/French/Hausa/Yoruba family regression 13/13, including exact Schedule boundaries, metadata, privacy, focus, theme and reflow.',
  '- PASS: complete 48-test shard browser matrix on isolated port 43917, including za-uif exact engine comparisons, private clipboard summary, stale-result clearing, invalid focus, reset, privacy and every accepted route.',
  '- PASS: direct language validation and 33,508 reciprocal hreflang relationships across 5,351 equivalence groups and 11,304 public pages. Protected coordinator coverage artifacts were intentionally not regenerated.',
  '- PASS: 138,307 internal links across 11,523 HTML files; registry audit retains two unrelated missing-page rows and adds no za-uif defect.',
  '- PASS: privacy/AI consent server check and 3/3 browser checks using the repository-installed Playwright runtime.',
  '- MIXED: focused existing workflow/export suites plus the new Mauritania parser proof passed 20/31. Parser-level PDF/JSON/CSV/TXT proofs passed for the targeted export tests; 11 failures remain explicitly carried and no pass is claimed for those assertions.',
  '',
  '## Changed product paths and decisions',
  '',
  '- Responsive source styles: `assets/css/property-roi-vip.css`, `assets/css/property-transfer-cost-vip.css`, `assets/css/route-fares-vip.css`, `assets/css/somalia-paye-vip.css`, `assets/css/startup-valuation-vip.css`, and `assets/css/togo-paye-vip.css`.',
  '- Targeted Swahili page fixes: `sw/sao-tome/kikokotoo-kodi-mshahara/index.html` (long-heading reflow) and `sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html` (engine enum values preserved while labels remain Kiswahili).',
  '- Student-loan native parity: the new Swahili route uses `assets/js/engines/student-loan-plan.js` and the shared controller, requires user-entered sourced terms, and provides local copy/PDF/CSV/JSON without programme presets or network submission.',
  '- Staff-cost native parity: the Swahili controller uses `engines/staff-cost-planner.js`, requires current user-supplied employer-obligation evidence, neutralizes spreadsheet-formula prefixes in CSV, and provides local copy/CSV/PDF without bundled statutory rates.',
  '- Pension-proj native parity: the Swahili controller uses `engines/pension-projection-planner.js`, requires current scheme evidence and explicit assumption confirmation, and provides local copy/CSV/PDF without country rates, entitlements or forecasts. The distinct legacy `pension-projection` route remains blocked.',
  '- Transfer-pricing native parity: the shared `transfer-pricing-planner.js` controller now has complete Swahili method, error, result and memo copy; the route requires a documented user range and provides local copy/TXT/JSON/print without a benchmark or compliance conclusion.',
  '- Side-hustle-tax native parity: the shared `side-income-tax-reserve.js` engine and controller require a user-sourced reserve rate and recent evidence, then provide injection-safe CSV, JSON, copy and PDF without selecting a tax rate or deciding deductions.',
  '- Salary-intelligence native parity: the private Swahili evidence notebook uses `assets/js/engines/salary-evidence-notebook.js`, requires five comparable recent user-entered rows, annualizes monthly evidence by 12, applies the existing NIST p(N+1) quartile interpolation and provides local injection-safe CSV, JSON import/reopen, PDF and copy. It contains no seeded market salary, representative benchmark, API, analytics or raw-input storage.',
  '- Ng-cgt native parity: `/sw/zana/kikokotoo-cgt-nigeria/` delegates to `assets/js/engines/ng-cgt.js`, keeps the NTA 2025 scope confirmation and transaction exclusions visible, localizes the progressive rate label, clears stale results, focuses invalid inputs, resets locally and offers only copy plus a parsed local TXT summary. It makes no filing, assessment, classification or exemption decision.',
  '- Ng-cit native parity: `/sw/zana/kikokotoo-cit-nigeria/` delegates to the unchanged DOM-free `assets/js/engines/ng-cit.js`, preserves separate total-profits and assessable-profits bases, requires explicit resident ordinary-company scope, flags but does not calculate section 57 review, clears stale results, focuses invalid inputs, resets locally and advertises only copy plus parsed local TXT.',
  '- Ng-cit reciprocal metadata only: `tools/ng-cit/index.html`, `fr/tools/ng-impot-societes/index.html`, `ha/kayan-aiki/cit-najeriya/index.html` and `yo/awon-ise/cit-naijiria/index.html` add the one Swahili alternate; their visible UI/copy is unchanged.',
  '- Ng-wht native parity: `/sw/zana/kikokotoo-wht-nigeria/` delegates to the unchanged DOM-free `assets/js/engines/ng-wht.js`, preserves the exact official Schedule matrix, requires scope and relief evidence, fails closed for unsupported combinations, clears stale results, focuses invalid inputs, resets locally and reopens copy, TXT and print/PDF outputs.',
  '- Ng-wht reciprocal metadata only: `tools/ng-wht/index.html`, `fr/tools/ng-retenue-source/index.html`, `ha/kayan-aiki/wht-najeriya/index.html` and `yo/awon-ise/wht-naijiria/index.html` add the one Swahili alternate; their visible UI/copy is unchanged.',
  '- Za-cgt native parity: `/sw/zana/kikokotoo-cgt-afrika-kusini/` delegates to the unchanged DOM-free `assets/js/engines/za-cgt.js`, preserves the SARS 2027 assessment-year formula, requires explicit scope and residence evidence, clears stale results, focuses invalid inputs, resets locally and advertises only copy plus parsed TXT. No PDF, filing, assessment or payment output is claimed.',
  '- Za-cgt reciprocal metadata only: `tools/za-cgt/index.html` and `fr/tools/za-plus-value/index.html` add the Swahili alternate; their visible UI and calculation copy are unchanged.',
  '- Za-dividend-tax native parity: `/sw/zana/kikokotoo-kodi-gawio-afrika-kusini/` delegates to the unchanged DOM-free `assets/js/engines/za-dividend-tax.js`, preserves the 20% standard rate and 22 February 2017 boundary, requires declaration evidence for reduced or exempt treatment, clears stale results, focuses invalid inputs, resets locally and reopens copy, TXT and print/PDF. It makes no treaty, exemption, filing, assessment or payment decision.',
  '- Za-dividend-tax reciprocal metadata only: `tools/za-dividend-tax/index.html` and `fr/tools/za-impot-dividendes/index.html` add the Swahili alternate; their visible UI and calculation copy are unchanged.',
  '- Za-gepf native parity: `/sw/zana/kikokotoo-gepf-afrika-kusini/` delegates to the unchanged maintained `engines/za-gepf-engine.js`, preserves the three-service gratuity and annuity calculation, requires the ten-year vested-service minimum, clears stale results, focuses invalid inputs, resets locally and reopens copy, injection-safe CSV, JSON and parser-readable PDF. It makes no recognised-service, withdrawal, tax or final-benefit decision.',
  '- Za-gepf reciprocal metadata only: `tools/za-gepf/index.html` and `fr/tools/za-gepf/index.html` add the Swahili alternate. The existing French PDF regression now verifies its real local download rather than intercepting it with a stub; visible UI and calculation copy are unchanged.',
  '- Za-transfer-duty native parity: `/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/` delegates to the maintained `engines/za-transfer-duty-engine.js`, preserves the SARS 2027 brackets and greater-value rule, keeps VAT status as explicit user input, clears stale results, focuses invalid dates, resets locally and reopens copy, injection-safe CSV, JSON and parser-readable PDF.',
  '- Za-transfer-duty reciprocal metadata only: `tools/za-transfer-duty/index.html` and `fr/tools/za-droits-mutation/index.html` add the Swahili alternate and advance their visible source-review date to 9 August 2026. Their formula and calculation UI remain unchanged.',
  '- Za-uif native parity: `/sw/zana/kikokotoo-uif-afrika-kusini/` delegates to the maintained `engines/za-uif-engine.js`, preserves the contribution, ordinary-benefit and maternity formulas, requires user-entered verified credits, clears stale results, focuses invalid inputs, resets locally and exposes only a private clipboard summary. It makes no eligibility, credit, claim or payment decision.',
  '- Za-uif reciprocal metadata only: `tools/za-uif/index.html` and `fr/tools/za-uif/index.html` add the Swahili alternate and advance their visible source-review date to 9 August 2026. Their calculation UI and formula remain unchanged.',
  '- Mauritania source-owner repair: `assets/js/engines/mr-paye.js` replaces duplicated inline formula logic in `sw/mauritania/kikokotoo-kodi-mshahara/index.html`; `tests/engines/mr-paye-browser-parity.test.js` proves both CNSS states against the reviewed server engine through source review date 21 July 2026 and next review 31 October 2026.',
  '- Formula/data/source decision: no formula, rate, ceiling, tier or benefit rule changed. Za-uif only advances the shared engine verified-through date after official source rechecks; the other accepted tools retain their reviewed engines and evidence contracts.',
  '- Browser matrix: system Chrome, one worker, isolated ports 43917 through 43924; synthetic fixtures only; 320/375, dark/light and 200% text reflow covered.',
  '- Privacy/AI: no raw input body was observed leaving the browser; empty-body analytics page-view beacons are separated from sensitive payload checks. `test:privacy-ai-consent` passed 3/3 browser tests plus its server test.',
  '- Official-source recheck on 8 August 2026: the NIPC-published Nigeria Tax Act 2025 still supports the small-company definition, company rates, development levy and section 57 review trigger used by the unchanged NigeriaCit engine; June 2026 Federal Ministry of Finance guidance still sets the NTA boundary at 1 January 2026. No engine parameter changed.',
  '- Official-source recheck on 8 August 2026: the official Deduction at Source Regulations 2024 Gazette remains the WHT rate source; Nigeria Tax Administration Act 2025 section 51 requires prescribed regulatory rates, JRB 2026 guidance still references the 2024 Regulations, and federal transition guidance keeps the 1 January 2026 boundary. No engine parameter changed.',
  '- Official-source recheck on 8 August 2026: the SARS CGT page remains reachable and identifies the 2027 assessment year as 1 March 2026 through 28 February 2027; the official individual-rate page and comprehensive CGT guide remain the engine boundary. No formula parameter changed.',
  '- Official-source recheck on 8 August 2026: the SARS Dividends Tax page still states 20% from 22 February 2017 and the last-day-of-following-month remittance boundary; the 2027 rate page confirms no change, while declaration evidence and the DTA portal remain the reduced-rate or exemption boundary. No engine parameter changed.',
  '- Official-source recheck on 8 August 2026: official GEPF retirement-benefit, employer-contribution and revised actuarial-factor pages remain reachable. No shared-engine parameter changed; the Swahili app stays a planning estimate and leaves recognised service, tax, withdrawal eligibility and final benefits to GEPF.',
  '- Official-source recheck on 9 August 2026: the SARS 2027 transfer-duty table, Budget 2026 guidance, Act 3 of 2026 and eFiling value rules remain aligned with the shared engine. No bracket or formula changed; VAT treatment remains a user-supplied fact and VAT itself is not calculated.',
  '- Official-source recheck on 9 August 2026: SARS still publishes the 1% + 1% UIF contribution and R17,712 ceiling; Department/UIF material retains the ordinary 38%-60% and 20% tiers plus the 66%/121-day maternity boundary. No engine formula changed.',
  '- Official-source recheck on 8 August 2026: the NIPC-published Nigeria Tax Act 2025 still contains the Nigerian-share threshold and same-year reinvestment rules used by the existing engine, and June 2026 Federal Ministry of Finance guidance still sets the NTA boundary at 1 January 2026. No engine parameter changed.',
  '- Official-source recheck on 8 August 2026: the Mauritania DGI obligations page still states monthly ITS rates of 15%, 25% and 40%; the official CNSS declaration form still states 13% employer CNSS, 1% worker CNSS and 2% occupational medicine. No cap or formula was changed, and the reviewed 21 July contract retains its 31 October review boundary.',
  '- Carried baseline debt: the legacy `tests/engines/lr-paye.test.js` source-title assertion expects two entries while the existing central formula registry contains five; its product fixtures run before that assertion. Registry audit also retains two unrelated missing-page rows. `npm run lint` now passes all 49 checked JavaScript files.',
  '',
  '## Artwork',
  '',
  missingArtwork.length ? `Missing artwork: ${missingArtwork.map((item) => `\`${item.englishId}\``).join(', ')}.` : 'All 46 English IDs have their expected dedicated tool artwork.',
];

const outputs = new Map([
  [MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`],
  [RECEIPT_FILE, `${JSON.stringify(receipt, null, 2)}\n`],
  [HUMAN_FILE, `${human.join('\n')}\n`],
  [ARTWORK_FILE, `${JSON.stringify({ schemaVersion: 1, lane: 'swahili-financial-shard-b', missingCount: missingArtwork.length, rows: missingArtwork }, null, 2)}\n`],
]);

let stale = 0;
for (const [relative, desired] of outputs) {
  const file = path.join(ROOT, relative);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== desired) {
    stale += 1;
    if (WRITE) fs.writeFileSync(file, desired, 'utf8');
  }
}

if (!WRITE && stale) throw new Error(`${stale} shard-B evidence outputs are stale; run with --write.`);
console.log(`${WRITE ? 'Wrote' : 'Verified'} shard B: ${rows.length} rows, ${acceptedRows.length} accepted, ${blockedRows.length} blocked, ${missingArtwork.length} missing artwork.`);
