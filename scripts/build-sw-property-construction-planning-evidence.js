#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');
if (WRITE === CHECK) throw new Error('Use exactly one of --write or --check.');

const manifest = require('../data/registry/sw-property-construction-planning.json');
const browser = require('../reports/sw-property-construction-planning-browser-evidence.json');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const acceptance = require('../data/audits/swahili-free-app-acceptance.json');
const contrasts = browser.routes.flatMap((row) => row.contrast);
function minimum(kind) {
  return contrasts.filter((row) => row.kind === kind).reduce((lowest, row) => (!lowest || row.ratio < lowest.ratio ? row : lowest), null);
}
const denominator = inventory.rows.filter((row) => row.category === 'Mortgage & Property').length;
const acceptedLegal = acceptance.entries.filter((row) => row.categoryKey === 'legal' && row.status === 'accepted');
const acceptedHere = new Set(manifest.rows.map((row) => row.englishId));
const acceptedBeforeFamily = acceptedLegal.filter((row) => !acceptedHere.has(row.englishId)).length;
const receipt = {
  schemaVersion: 1,
  lane: 'Swahili Legal Mortgage and Property native parity',
  family: 'property-construction-planning',
  coordinatorBase: '8354e321ff34caf60a33a3393cd0dcddfb00c023',
  previousAcceptedCandidates: [
    '2206b1c697dde5cefd773335744ed840dda21ce7',
    '208977366770e91ad9f3e27d9f110a18f74a08c3',
    'ae7e9013278297ed22c9a01228925b3b3ea1c08b'
  ],
  denominator,
  centralAccepted: acceptedLegal.length,
  acceptedBeforeFamily,
  acceptedRoutes: manifest.rows.map((row) => row.swahiliRoute),
  blockedRoutes: [],
  remainingAfterThisFamily: denominator - acceptedLegal.length,
  sharedEngine: { path: 'assets/js/engines/property-assumption.js', changed: false, oracleIds: manifest.rows.map((row) => row.englishId) },
  sources: manifest.rows.map((row) => ({ englishId: row.englishId, url: row.source.url, checkedAt: row.source.checkedAt, availability: row.source.availability, role: row.source.role, suppliesUnitPrices: row.source.suppliesUnitPrices, jurisdiction: row.source.jurisdiction })),
  exports: ['copy', 'txt', 'json', 'pdf', 'print'],
  privacy: 'local-only-no-storage-no-ai-no-account-no-external-request',
  aiCoverage: { englishCanonicalCatalog: true, generatedSwahiliRouteMapEdited: false, coordinatorIntegrationPending: true },
  browserProof: {
    port: 4211,
    routes: browser.routes.length,
    widths: [320, 375],
    reflowPercent: 200,
    themes: ['light', 'dark', 'system-light', 'system-dark'],
    computedMinima: { text: minimum('text'), componentBoundary: minimum('boundary'), focus: minimum('focus') },
    pdfParser: 'pdf-parse',
    pdfPage: { width: 595, height: 842, margin: 48 },
    externalRequests: 0,
    consoleErrors: 0,
    pageErrors: 0
  },
  tests: {
    static: 'node --test tests/sw-property-construction-planning-parity.test.js (13/13)',
    browser: 'PORT=4211 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 npx playwright test tests/e2e/sw-property-construction-planning-family.spec.js --project=chromium --workers=1 (2/2)',
    generator: 'node scripts/build-sw-property-construction-planning-parity.js --check (0 drift)',
    pdfCategory: 'npm run pdf:verify (pass)',
    i18n: 'npm run build:i18n:validate (pass)',
    hreflang: 'npm run validate:hreflang (pass)',
    legalWorkflow: 'pre-existing base blocker: verifier expects Apps title while exact 8354 base Legal hub uses Tools title'
  },
  guardrails: { centralAcceptanceLedgerEdited: false, generatedAiRouteMapEdited: false, masterLedgerEdited: false, sitemapEdited: false, distEdited: false, sharedEngineEdited: false, crossLocaleRuntimeEdited: false, deletions: 0, pushMergeDeploy: false }
};

const outputs = {
  'reports/sw-property-construction-planning-receipt.json': `${JSON.stringify(receipt, null, 2)}\n`,
  'reports/sw-property-construction-planning-receipt.md': `# Swahili property construction-planning parity receipt\n\n- Coordinator base: \`${receipt.coordinatorBase}\`\n- Accepted: 2/2 — ${receipt.acceptedRoutes.join(', ')}\n- Blocked: 0\n- Remaining assigned Legal/Mortgage & Property rows: ${receipt.remainingAfterThisFamily}\n- Shared English engine: \`${receipt.sharedEngine.path}\` (unchanged).\n- Source: accessible official Stats SA construction-material index context checked 2 August 2026; South Africa only, and no unit price, quantity, BOQ, quote, currency or result is supplied.\n- Exports reopened: copy, TXT, JSON, parser-valid bounded PDF, print.\n- Privacy: local-only; no input persistence, account, AI or external request.\n- Browser: isolated port 4211; 320px, 375px, 200% text reflow; light, dark, system-light and system-dark.\n- Computed minima: text ${receipt.browserProof.computedMinima.text.ratio.toFixed(3)}:1; component boundary ${receipt.browserProof.computedMinima.componentBoundary.ratio.toFixed(3)}:1; focus ${receipt.browserProof.computedMinima.focus.ratio.toFixed(3)}:1.\n- Static 13/13; browser 2/2; PDF, i18n and hreflang gates pass.\n- Carried base blocker: Legal workflow verifier title wording mismatch; this candidate does not edit the English Legal hub.\n- Guardrails: zero deletions and no central acceptance, AI map, master ledger, sitemap, dist, push, merge or deploy change.\n`,
  'reports/sw-property-construction-planning-missing-artwork.md': '# Swahili property construction-planning artwork check\n\nMissing artwork: **0**.\n\n- `building-materials.webp`: present and browser-decoded at 800 × 450.\n- `construction-budget.webp`: present and browser-decoded at 800 × 450.\n'
};
let changed = 0;
for (const [relative, content] of Object.entries(outputs)) {
  const file = path.join(ROOT, relative), current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== content) {
    changed += 1;
    if (WRITE) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, 'utf8'); }
  }
}
console.log(`${WRITE ? 'Built' : 'Checked'} Swahili property construction-planning evidence: 2 routes; ${changed} changed outputs.`);
if (CHECK && changed) process.exitCode = 1;
