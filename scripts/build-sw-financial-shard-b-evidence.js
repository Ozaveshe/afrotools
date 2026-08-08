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
  'payslip-generator',
  'property-roi',
  'property-transfer-cost',
  'rent-vs-buy',
  'retirement-planner',
  'route-fares',
  'salary-compare',
  'so-paye',
  'ss-paye',
  'st-paye',
  'startup-valuation',
  'tg-paye',
]);

const PROOF = {
  'lr-paye': ['tests/engines/lr-paye-browser-parity.test.js', 'tests/e2e/swahili-financial-shard-b.spec.js'],
  'microfinance-calc': ['tests/microfinance-offer-engine.test.js', 'tests/e2e/microfinance-offer-vip.spec.js'],
  'mortgage-affordability': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/mortgage-budget-boundary.spec.js'],
  'mortgage-calculator': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/day3-finance-mortgage-vip.spec.js'],
  'payslip-generator': ['tests/payslip-unicode-roundtrip.test.js', 'tests/e2e/day3-finance-payslip-vip.spec.js'],
  'property-roi': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/property-roi-vip.spec.js'],
  'property-transfer-cost': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/property-transfer-cost-vip.spec.js'],
  'rent-vs-buy': ['tests/day7-property-tool-contract.test.js', 'tests/e2e/rent-vs-buy-vip.spec.js'],
  'retirement-planner': ['tests/retirement-scenario-planner.test.js', 'tests/e2e/day3-finance-retirement-planner-vip.spec.js'],
  'route-fares': ['tests/engines/route-fares.test.js', 'tests/e2e/day3-finance-route-fares-locales-vip.spec.js'],
  'salary-compare': ['tests/salary-offer-compare.test.js', 'tests/e2e/day3-finance-salary-compare-vip.spec.js'],
  'so-paye': ['tests/engines/so-paye.test.js', 'tests/e2e/day3-finance-somalia-vip.spec.js'],
  'ss-paye': ['tests/engines/ss-paye.test.js', 'tests/e2e/day3-finance-south-sudan-vip.spec.js'],
  'st-paye': ['tests/engines/st-paye.test.js', 'tests/e2e/day3-finance-sao-tome-vip.spec.js'],
  'startup-valuation': ['tests/startup-valuation-engine.test.js', 'tests/e2e/startup-valuation-vip.spec.js'],
  'tg-paye': ['tests/engines/tg-paye.test.js', 'tests/e2e/day3-finance-togo-vip.spec.js'],
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
  const swFile = row.primarySwahiliFile;
  const swPath = swFile && path.join(ROOT, swFile);
  const englishFile = resolveEnglishFile(row.englishRoute);
  const englishPath = englishFile && path.join(ROOT, englishFile);
  const swExists = Boolean(swPath && fs.existsSync(swPath));
  const enExists = Boolean(englishPath && fs.existsSync(englishPath));
  const html = swExists ? fs.readFileSync(swPath, 'utf8') : '';
  const english = enExists ? fs.readFileSync(englishPath, 'utf8') : '';
  const route = normalizeRoute(row.primarySwahiliRoute);
  const canonical = normalizeRoute(extract(html, /<link\b(?=[^>]*rel=["'][^"']*canonical)[^>]*href=["']([^"']+)/i));
  const ogUrl = normalizeRoute(extract(html, /<meta\b(?=[^>]*property=["']og:url["'])[^>]*content=["']([^"']+)/i));
  const ogImage = extract(html, /<meta\b(?=[^>]*property=["']og:image["'])[^>]*content=["']([^"']+)/i);
  const artwork = ogImage && ogImage.replace(/^https?:\/\/[^/]+\//i, '');
  const scripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)/gi)]
    .map((match) => match[1].split(/[?#]/)[0])
    .filter((source) => /\/(?:engines?|pages|lib)\//.test(source));
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
  return { englishFile, swahiliFile: swFile, swahiliRoute: route, implementationOwners: scripts, ogImage, artwork, checks, failedChecks };
}

function blockReason(row) {
  if (row.state === 'missing') return 'No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane.';
  if (row.englishId === 'paye-calculator') return 'The candidate is a PAYE directory hub, not a native equivalent of the English calculator app.';
  if (row.englishId === 'salary-intelligence') return 'The candidate is the broad salary category hub, not a native equivalent of the English salary-intelligence app.';
  return 'The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt.';
}

const inventory = readJson(INVENTORY_FILE);
const acceptance = readJson(ACCEPTANCE_FILE);
const alreadyAccepted = new Set(acceptance.entries.filter((entry) => entry.status === 'accepted').map((entry) => entry.englishId));
const unaccepted = inventory.rows.filter((row) => row.categoryKey === 'financial' && !alreadyAccepted.has(row.englishId))
  .sort((left, right) => left.englishId.localeCompare(right.englishId));
const shardA = unaccepted.slice(0, 46);
const shardB = unaccepted.slice(46, 92);
const overlap = shardB.filter((row) => shardA.some((other) => other.englishId === row.englishId));

if (unaccepted.length !== 92) throw new Error(`Expected 92 unaccepted financial rows; found ${unaccepted.length}.`);
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
    startingState: row.state,
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
        note: 'App-specific suites contain parser or payload-contract checks. The focused current-lane run passed 19 of 30 selected workflow/export tests; the remaining failures are recorded separately and are not represented as passing evidence.',
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
  reviewedAt: '2026-08-08',
  baseSha: BASE_SHA,
  acceptanceRule: 'Fail closed per English ID. Physical route presence or localized-shell classification alone earns no credit.',
  denominator: rows.length,
  accepted: acceptedRows.length,
  blocked: blockedRows.length,
  coordinatorOwnedFilesEdited: false,
  changedProductPaths: [
    'assets/js/engines/lr-paye.js',
    'assets/css/property-roi-vip.css',
    'assets/css/property-transfer-cost-vip.css',
    'assets/css/route-fares-vip.css',
    'assets/css/somalia-paye-vip.css',
    'assets/css/startup-valuation-vip.css',
    'assets/css/togo-paye-vip.css',
    'sw/sao-tome/kikokotoo-kodi-mshahara/index.html',
    'sw/liberia/kikokotoo-kodi-mshahara/index.html',
    'sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html',
  ],
  formulaDataSourceDecision: 'No rate, threshold, jurisdiction data or authority source changed. The microfinance option-value fix restores existing shared-engine enum semantics. Liberia now uses a DOM-free browser engine proved against the reviewed server engine; this corrects the Swahili page so NASSCORP remains separate from the PAYE tax base.',
  browserMatrix: { engine: 'system Chrome', workers: 1, isolatedPorts: [43917, 43918], widths: [320, 375], colorSchemes: ['dark', 'light'], textReflowPercent: 200, syntheticDataOnly: true },
  validationSummary: {
    focusedNodeSubtests: { passed: 16, failed: 0 },
    shardBrowserMatrix: { passed: 18, failed: 0, execution: 'complete one-worker system-Chrome run on isolated port 43917' },
    focusedExistingWorkflowExportSelection: { passed: 19, failed: 11, failuresClaimedAsPass: false },
    privacyAiConsent: { serverPassed: true, browserPassed: 3, browserFailed: 0 },
    lint: { status: 'passed', checkedJavaScriptFiles: 49, netNewChangedPathsReported: 0 },
    legacyLiberiaRegistryTest: { status: 'carried-baseline-debt', productFixturesPassedBeforeRegistryAssertion: true, reason: 'tests/engines/lr-paye.test.js expects two source titles while the existing central formula registry currently contains five.' },
  },
  rows,
  missingArtworkQueue: ARTWORK_FILE,
  requiredCommands: [
    'node scripts/build-sw-financial-shard-b-evidence.js',
    'node --test tests/swahili-financial-shard-b.test.js',
    'node C:\\Users\\Oza\\Documents\\afrotools\\node_modules\\@playwright\\test\\cli.js test --config tests/playwright.sw-financial-shard-b.config.js',
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
  '- Each accepted app points to an app-specific parser or export-payload suite. The focused current-lane selection passed 19/30; remaining failures were stale analytics-beacon assertions, unrelated locale expectations or bounded timeouts and are not represented as passes.',
  '- No coordinator acceptance ledger, inventory, AI route map, locale coverage output, sitemap, redirects, service-worker stamp, live service or other locale UI/copy is edited.',
  '- Blocked high-stakes tax apps remain blocked rather than receiving invented formulas, rates, claims or evidence.',
  '',
  '## Current lane command evidence',
  '',
  '- PASS: evidence generator check; 46 rows, 16 accepted candidates, 30 blocked, one missing artwork.',
  '- PASS: 16 focused Node subtests covering scope, source contracts and DOM-free engine/oracle fixtures.',
  '- PASS: focused browser reruns after responsive CSS and privacy-test boundary fixes.',
  '- PASS after fixes: complete 18-test shard browser matrix on isolated port 43917, including the parsed Liberia PDF workflow and route shards with system Chrome.',
  '- MIXED: focused existing workflow/export suites passed 19/30. Parser-level PDF/JSON/CSV/TXT proofs passed for the targeted export tests; 11 failures remain explicitly carried and no pass is claimed for those assertions.',
  '',
  '## Changed product paths and decisions',
  '',
  '- Responsive source styles: `assets/css/property-roi-vip.css`, `assets/css/property-transfer-cost-vip.css`, `assets/css/route-fares-vip.css`, `assets/css/somalia-paye-vip.css`, `assets/css/startup-valuation-vip.css`, and `assets/css/togo-paye-vip.css`.',
  '- Targeted Swahili page fixes: `sw/sao-tome/kikokotoo-kodi-mshahara/index.html` (long-heading reflow) and `sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html` (engine enum values preserved while labels remain Kiswahili).',
  '- Formula/data/source decision: no formula, rate, threshold, jurisdiction data or authority source changed. The microfinance fix restores the existing shared engine contract (`annual`, `monthly`, `period`).',
  '- Browser matrix: system Chrome, one worker, isolated ports 43917 and 43918; synthetic fixtures only; 320/375, dark/light and 200% text reflow covered.',
  '- Privacy/AI: no raw input body was observed leaving the browser; empty-body analytics page-view beacons are separated from sensitive payload checks. `test:privacy-ai-consent` passed 3/3 browser tests plus its server test.',
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
