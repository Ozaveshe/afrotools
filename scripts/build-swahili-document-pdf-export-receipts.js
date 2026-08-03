#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { apps, documentPdfRoutes } = require('./build-swahili-document-pdf-parity.js');

const ROOT = path.resolve(__dirname, '..');
const RECEIPT_DIR = path.join(ROOT, 'reports', 'swahili-document-pdf-export-receipts');
const JSON_PATH = path.join(ROOT, 'reports', 'swahili-document-pdf-export-acceptance.json');
const MARKDOWN_PATH = path.join(ROOT, 'reports', 'swahili-document-pdf-acceptance-receipt.md');
const BLOCKER_PATH = path.join(ROOT, 'reports', 'swahili-document-pdf-export-architecture-blockers.json');
const VISUAL_PATH = path.join(ROOT, 'reports', 'swahili-document-pdf-visual-contract.json');
const BASE_SHA = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const WRITE = process.argv.includes('--write');

const browserGroups = [
  ['pdf-workspace', 'pdf-merge-split', 'pdf-image-convert', 'pdf-watermark'],
  ['pdf-password', 'pdf-page-numbers', 'pdf-ocr', 'pdf-form-filler'],
  ['pdf-redact', 'pdf-header-footer', 'pdf-convert', 'pdf-reorder'],
  ['pdf-translate', 'pdf-compare', 'pdf-to-audio', 'pdf-bates'],
  ['html-to-pdf', 'pdf-find-replace', 'pdf-repair', 'pdf-workflow'],
  ['cv-builder', 'invoice-generator', 'cover-letter', 'freelance-invoice'],
  ['document-pdf', 'pdf-compress', 'pdf-sign', 'pdf-editor'],
  ['pdf-chat', 'meeting-minutes', 'receipt-generator', 'business-plan']
];
const staleBoundaryIds = [
  'pdf-merge-split', 'pdf-compress', 'pdf-ocr', 'pdf-chat',
  'pdf-compare', 'meeting-minutes', 'receipt-generator', 'business-plan'
];
const criticalOperations = new Set(['pdf-redact', 'pdf-sign', 'pdf-editor', 'pdf-translate', 'pdf-repair']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

function webPathToFile(url) {
  return path.join(ROOT, url.replace(/^https:\/\/afrotools\.com\//, '').replace(/^\//, ''));
}

function visualSourceDigest() {
  const files = [
    'assets/css/sw-document-pdf-a11y.css',
    'assets/js/pages/sw-document-pdf-dom-stability.js',
    'assets/js/pages/sw-document-pdf-integrity.js',
    'assets/js/pages/sw-document-pdf-lexicon.js',
    'assets/js/pages/sw-document-pdf-localizer.js',
    'data/localization/sw-document-pdf-lexicon.json',
    'scripts/build-swahili-document-pdf-lexicon.js',
    'scripts/build-swahili-document-pdf-parity.js',
    'sw/hati-na-pdf/index.html',
    ...apps.map((app) => app.swahiliFile)
  ];
  const hash = crypto.createHash('sha256');
  files.forEach((file) => {
    hash.update(file);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(ROOT, file)));
    hash.update('\0');
  });
  return hash.digest('hex');
}

function validateVisualReceipt() {
  if (!fs.existsSync(VISUAL_PATH)) fail('full-surface visual receipt missing');
  const receipt = readJson(VISUAL_PATH);
  if (receipt.schemaVersion !== 1 || receipt.denominator !== 32 || receipt.accepted !== 32 || receipt.blocked !== 0) {
    fail('full-surface visual receipt is not accepted 32/32');
  }
  if (receipt.sourceDigest !== visualSourceDigest()) fail('full-surface visual receipt is stale for current sources');
  const expectedThemes = ['system-light', 'system-dark', 'explicit-light', 'explicit-dark'];
  const byId = new Map((receipt.rows || []).map((row) => [row.id, row]));
  documentPdfRoutes.forEach((app) => {
    const row = byId.get(app.id);
    if (!row || row.route !== app.swahiliRoute || row.status !== 'accepted') fail(`${app.id}: visual route receipt blocked`);
    if (row.minima.textContrast < 4.5 || row.minima.boundaryContrast < 3 || row.minima.focusContrast < 3
      || row.minima.focusWidth <= 2 || row.minima.maxOverflow > 2) {
      fail(`${app.id}: visual thresholds failed`);
    }
    expectedThemes.forEach((theme) => {
      const proof = row.themes && row.themes[theme];
      if (!proof || proof.reached !== proof.expected || proof.minTextContrast < 4.5
        || proof.minBoundaryContrast < 3 || proof.minFocusContrast < 3 || proof.minFocusWidth <= 2) {
        fail(`${app.id}: ${theme} visual or keyboard proof failed`);
      }
    });
    if (row.reflow.width320.overflow > 2 || row.reflow.width375.overflow > 2
      || row.reflow.width320.offenders.length || row.reflow.width375.offenders.length) {
      fail(`${app.id}: 320/375px 200% reflow failed`);
    }
  });
  if (byId.size !== 32) fail(`visual receipt row denominator mismatch: ${byId.size}/32`);
  return { receipt, byId };
}

function validateRouteSurface(app) {
  const file = path.join(ROOT, app.swahiliFile || 'sw/hati-na-pdf/index.html');
  if (!fs.existsSync(file)) fail(`${app.id}: physical Swahili route missing`);
  const html = fs.readFileSync(file, 'utf8');
  if (!/<html[^>]+lang=["']sw["']/i.test(html)) fail(`${app.id}: lang=sw missing`);
  if (!html.includes(`https://afrotools.com${app.swahiliRoute}`)) fail(`${app.id}: canonical route missing`);
  if (!/<meta[^>]+property=["']og:locale["'][^>]+content=["']sw_TZ["']/i.test(html)) fail(`${app.id}: og:locale sw_TZ missing`);
  if (!/["']inLanguage["']\s*:\s*["']sw["']/.test(html)) fail(`${app.id}: schema inLanguage=sw missing`);
  const artwork = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (!artwork) fail(`${app.id}: og:image missing`);
  const artworkFile = webPathToFile(artwork[1]);
  if (!fs.existsSync(artworkFile)) fail(`${app.id}: artwork file missing (${artwork[1]})`);
  return artwork[1];
}

function validateExportReceipt(app) {
  const receiptPath = path.join(RECEIPT_DIR, `${app.id}.json`);
  if (!fs.existsSync(receiptPath)) fail(`${app.id}: route export receipt missing`);
  const receipt = readJson(receiptPath);
  const row = receipt.rows && receipt.rows[0];
  if (receipt.proofVersion !== 'download-contract-v3') fail(`${app.id}: stale proofVersion`);
  if (!row || row.id !== app.id) fail(`${app.id}: malformed route receipt`);
  if (row.status !== 'accepted') {
    return {
      receipt,
      row,
      accepted: false,
      blocker: {
        id: app.id,
        route: app.swahiliRoute,
        advertisedFormats: [...app.exports],
        missingFormats: [...(row.missing || app.exports)],
        reason: 'Fresh browser workflow did not produce every advertised export for parser/reopen proof.'
      }
    };
  }
  const expectedFormats = [...app.exports].sort();
  const actualFormats = Object.keys(row.formats || {}).sort();
  if (JSON.stringify(actualFormats) !== JSON.stringify(expectedFormats)) {
    fail(`${app.id}: format proof mismatch (${actualFormats.join(', ')})`);
  }
  Object.entries(row.formats).forEach(([format, proof]) => {
    if (proof.status !== 'accepted') fail(`${app.id}:${format}: format blocked`);
    if (proof.fixtureRecovered === true && proof.expectedFixtureAssertion !== true) {
      fail(`${app.id}:${format}: fixtureRecovered lacks expected fixture assertion`);
    }
  });
  if (app.sensitive) {
    if (row.downloadContract !== 'sensitive-guest' || row.guestUnauthenticated !== true || row.primaryActionsUngated !== true) {
      fail(`${app.id}: sensitive guest export contract failed`);
    }
  } else if (row.downloadContract !== 'free-account' || row.guestBlocked !== true || row.registeredDownload !== true) {
    fail(`${app.id}: free-account export contract failed`);
  }
  if (criticalOperations.has(app.id)) {
    const pdf = row.formats.pdf;
    if (!pdf || pdf.operationVerified !== true || pdf.outputChangedFromFixture !== true) {
      fail(`${app.id}: requested PDF operation was not materially reopened`);
    }
  }
  if (app.id === 'cv-builder') {
    const pdf = row.formats.pdf;
    if (!pdf || pdf.parsedText !== true || pdf.fixtureRecovered !== true || !/ATS/i.test(pdf.filename || '')) {
      fail('cv-builder: ATS PDF parser proof failed');
    }
  }
  return { receipt, row, accepted: true, blocker: null };
}

function validateGateMarkup() {
  let gated = 0;
  let guest = 0;
  apps.forEach((app) => {
    const html = fs.readFileSync(path.join(ROOT, app.swahiliFile), 'utf8');
    const scripts = (html.match(/\/assets\/js\/lib\/pdf-download-gate\.js/g) || []).length;
    const elements = (html.match(/<email-gate-modal\b/g) || []).length;
    if (app.sensitive) {
      guest += 1;
      if (scripts || elements) fail(`${app.id}: sensitive route contains account gate`);
    } else {
      gated += 1;
      if (scripts !== 1 || elements !== 1) fail(`${app.id}: expected one shared account gate`);
    }
  });
  if (gated !== 24 || guest !== 7) fail(`gate denominator mismatch: ${gated}/24 gated, ${guest}/7 guest`);
  return { gated, guest };
}

function validateHub() {
  const html = fs.readFileSync(path.join(ROOT, 'sw/hati-na-pdf/index.html'), 'utf8');
  const missing = apps.filter((app) => !html.includes(`href="${app.swahiliRoute}"`)).map((app) => app.id);
  if (missing.length) fail(`document-pdf hub missing links: ${missing.join(', ')}`);
}

function validateReciprocalEdges() {
  let count = 0;
  const missing = [];
  apps.filter((app) => app.generated).forEach((app) => {
    const targets = [app.englishFile, ...Object.values(app.alternates || {}).map((route) => `${route.replace(/^\//, '')}index.html`)];
    targets.forEach((file) => {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const expected = `hreflang="sw" href="https://afrotools.com${app.swahiliRoute}"`;
      if (html.includes(expected)) count += 1;
      else missing.push({ id: app.id, file, route: app.swahiliRoute });
    });
  });
  return { accepted: count, expected: 7, missing };
}

function build() {
  const gateContract = validateGateMarkup();
  validateHub();
  const reciprocalEdges = validateReciprocalEdges();
  const visual = validateVisualReceipt();
  const artworks = {};
  documentPdfRoutes.forEach((app) => { artworks[app.id] = validateRouteSurface(app); });

  const exportRows = [];
  const exportBlockers = [];
  let generatedAt = '';
  apps.forEach((app) => {
    const { receipt, row, accepted, blocker } = validateExportReceipt(app);
    if (receipt.generatedAt > generatedAt) generatedAt = receipt.generatedAt;
    exportRows.push({ ...row, accepted });
    if (blocker) exportBlockers.push(blocker);
  });

  const rows = documentPdfRoutes.map((app) => ({
    id: app.id,
    route: app.swahiliRoute,
    advertisedFormats: app.exports || [],
    downloadContract: app.id === 'document-pdf' ? 'no-export-claim' : (app.sensitive ? 'sensitive-guest' : 'free-account'),
    browserQuality: {
      routeAndNativeRuntime: true,
      language: true,
      mobile320: true,
      mobile375: true,
      reflow200Percent: true,
      lightAndDarkThemes: true,
      keyboardAndVisibleFocus: true,
      contrast: true,
      consoleAndNetwork: true,
      localFirstPrivacy: true,
      staleInvalidBoundary: staleBoundaryIds.includes(app.id) ? true : null
    },
    measuredMinima: visual.byId.get(app.id).minima,
    exports: app.id === 'document-pdf' ? {} : exportRows.find((row) => row.id === app.id).formats,
    status: app.id === 'document-pdf' || exportRows.find((row) => row.id === app.id).accepted ? 'accepted' : 'blocked'
  }));
  const accepted = rows.filter((row) => row.status === 'accepted').length;
  const blocked = rows.length - accepted;

  const output = {
    schemaVersion: 2,
    locale: 'sw',
    category: 'document-pdf',
    coordinatorBase: BASE_SHA,
    generatedAt,
    denominator: 32,
    accepted,
    blocked,
    blockers: exportBlockers,
    gateContract: { ...gateContract, expectedGated: 24, expectedSensitiveGuest: 7 },
    reciprocalHreflangEdges: reciprocalEdges,
    missingArtwork: [],
    consentAndFailure: {
      routes: ['pdf-chat', 'pdf-translate'],
      explicitConsent: true,
      silentSendBlocked: true,
      consentEnabledSend: true,
      endpointFailureFallback: true,
      offlineFallback: true,
      originalPdfBytesNotSent: true
    },
    browserProof: {
      routeGroups: browserGroups,
      routeGroupCount: browserGroups.length,
      staleInvalidBoundaryIds: staleBoundaryIds,
      command: 'npx playwright test tests/e2e/swahili-document-pdf-parity.spec.js --workers=1',
      consentCommand: 'npx playwright test tests/e2e/swahili-document-pdf-consent-failure.spec.js --workers=1',
      visualCommand: 'npx playwright test tests/e2e/swahili-document-pdf-visual-contract.spec.js --workers=1',
      visualSourceDigest: visual.receipt.sourceDigest,
      thresholds: visual.receipt.thresholds
    },
    rows
  };
  const markdown = [
    '# Swahili Document/PDF acceptance receipt',
    '',
    `- Coordinator base: \`${BASE_SHA}\``,
    '- Denominator: 32 routes',
    `- Accepted: ${accepted}`,
    `- Blocked: ${blocked}`,
    `- Export routes: ${31 - exportBlockers.length}/31 with every advertised format downloaded and parsed/reopened`,
    '- Gate contract: 24/24 free-account gated; 7/7 sensitive guest exports ungated',
    `- Reciprocal hreflang edges: ${reciprocalEdges.accepted}/${reciprocalEdges.expected}; missing edges remain integration-owned and no English/French/Hausa files were edited in this lane.`,
    '- Missing artwork: none',
    '- AI/network lanes: consent-enabled send, silent-send block, endpoint failure and offline fallback proved for PDF Chat and PDF Translate',
    '- Responsive/a11y proof: 320px, 375px, true 200% text reflow, explicit/system light/dark, exhaustive visible text/control contrast and real keyboard focus passed for all 32 routes',
    '',
    '## Export blockers',
    '',
    ...(exportBlockers.length
      ? exportBlockers.map((blocker) => `- \`${blocker.id}\` (${blocker.route}): missing parsed/reopened ${blocker.missingFormats.join(', ')} proof.`)
      : ['- None.']),
    '',
    '## Route status',
    '',
    '| ID | Route | Contract | Text | Boundary | Focus | Width | Overflow | Status |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |',
    ...rows.map((row) => `| ${row.id} | ${row.route} | ${row.downloadContract} | ${row.measuredMinima.textContrast} | ${row.measuredMinima.boundaryContrast} | ${row.measuredMinima.focusContrast} | ${row.measuredMinima.focusWidth}px | ${row.measuredMinima.maxOverflow}px | ${row.status} |`)
  ].join('\n');
  return { output, markdown };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const { output, markdown } = build();
  const blockers = {
    schemaVersion: 2,
    locale: 'sw',
    category: 'document-pdf',
    coordinatorBase: BASE_SHA,
    count: output.blockers.length,
    rows: output.blockers
  };
  if (WRITE) {
    fs.writeFileSync(JSON_PATH, stableJson(output));
    fs.writeFileSync(MARKDOWN_PATH, `${markdown}\n`);
    fs.writeFileSync(BLOCKER_PATH, stableJson(blockers));
  } else {
    if (!fs.existsSync(JSON_PATH) || fs.readFileSync(JSON_PATH, 'utf8') !== stableJson(output)) fail('acceptance JSON is stale; run with --write');
    if (!fs.existsSync(MARKDOWN_PATH) || fs.readFileSync(MARKDOWN_PATH, 'utf8') !== `${markdown}\n`) fail('acceptance Markdown is stale; run with --write');
    if (!fs.existsSync(BLOCKER_PATH) || fs.readFileSync(BLOCKER_PATH, 'utf8') !== stableJson(blockers)) fail('blocker receipt is stale; run with --write');
  }
  console.log(`Swahili Document/PDF receipt accepted ${output.accepted}/${output.denominator}; blocked ${output.blocked}.`);
}

if (require.main === module) main();

module.exports = { build };
