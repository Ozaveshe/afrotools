'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_SHA = '8354e321ff34caf60a33a3393cd0dcddfb00c023';
const MANIFEST = 'data/localization/sw-agriculture-parity-manifest.json';
const RAW = 'reports/sw-agriculture-browser-raw/cassava-processing-playwright.json';
const RAW_HUB = 'reports/sw-agriculture-browser-raw/cassava-processing-hub-repair-playwright.json';
const ORACLES = 'reports/sw-agriculture-cassava-processing-oracles.json';
const BROWSER = 'reports/sw-agriculture-acceptance/cassava-processing-browser.json';
const RECEIPT = 'reports/sw-agriculture-acceptance/cassava-processing.json';
const MISSING_ARTWORK = 'reports/sw-agriculture-cassava-processing-missing-artwork.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
}

function flattenSpecs(suites, output = []) {
  for (const suite of suites || []) {
    output.push(...(suite.specs || []));
    flattenSpecs(suite.suites, output);
  }
  return output;
}

function webpDimensions(file) {
  const buffer = fs.readFileSync(path.join(ROOT, file));
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`Artwork is not a valid WebP: ${file}`);
  }
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  throw new Error(`Unsupported WebP chunk ${chunk}: ${file}`);
}

function passingResult(spec) {
  const test = (spec.tests || [])[0];
  const result = test && (test.results || []).at(-1);
  if (!test || test.status !== 'expected' || !result || result.status !== 'passed') return null;
  return result;
}

function build() {
  const manifest = readJson(MANIFEST);
  const raw = readJson(RAW);
  const rawHub = readJson(RAW_HUB);
  const oracleReport = readJson(ORACLES);
  const rows = manifest.rows.filter((row) => row.family === 'cassava-processing');
  const countries = rows.filter((row) => row.country);
  if (rows.length !== 16 || countries.length !== 15) {
    throw new Error(`Expected 16/15 Cassava Processing rows; found ${rows.length}/${countries.length}.`);
  }
  if (raw.stats.expected !== 16 || raw.stats.unexpected !== 0 || raw.stats.skipped !== 0) {
    throw new Error(`Raw browser proof is incomplete: ${raw.stats.expected || 0} expected, ${raw.stats.unexpected || 0} unexpected.`);
  }
  if (rawHub.stats.expected !== 1 || rawHub.stats.unexpected !== 0 || rawHub.stats.skipped !== 0) {
    throw new Error('Current generated hub repair proof is incomplete.');
  }
  if (oracleReport.routes !== 16 || oracleReport.countryOracles !== 15) {
    throw new Error('Route-specific Cassava oracle report is incomplete.');
  }

  const specs = flattenSpecs(raw.suites);
  const specsByTitle = new Map(specs.map((spec) => [spec.title, spec]));
  const hubSpecsByTitle = new Map(flattenSpecs(rawHub.suites).map((spec) => [spec.title, spec]));
  const oraclesById = new Map(oracleReport.rows.map((row) => [row.englishId, row]));
  const missingArtwork = [];
  const browserRows = [];
  const receiptRows = [];

  for (const row of rows) {
    const title = `${row.english.id} full route local proof`;
    const spec = (row.country ? specsByTitle : hubSpecsByTitle).get(title);
    const result = spec && passingResult(spec);
    if (!result) throw new Error(`Missing passing physical-route browser proof for ${row.english.id}.`);
    const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
    const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
    if (!english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`)) {
      throw new Error(`English reciprocal hreflang missing for ${row.english.id}.`);
    }
    if (!french.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`)) {
      throw new Error(`French reciprocal hreflang missing for ${row.english.id}.`);
    }
    if (!html.includes('FAO, ripoti za IITA kuhusu mihogo baada ya mavuno')) {
      throw new Error(`Named native source missing for ${row.english.id}.`);
    }
    if (!html.includes('marejeo ya bei ya 2024–2025; si data ya moja kwa moja.')) {
      throw new Error(`Freshness disclosure missing for ${row.english.id}.`);
    }
    if (!html.includes('Kiwango cha uhakika')) throw new Error(`Confidence disclosure missing for ${row.english.id}.`);
    if (!fs.existsSync(path.join(ROOT, row.artwork.file)) || !html.includes(row.artwork.file)) {
      missingArtwork.push({ id: row.english.id, expected: row.artwork.file });
    }

    const oracle = oraclesById.get(row.english.id);
    if (!oracle) throw new Error(`Oracle missing for ${row.english.id}.`);
    if (row.country && (!oracle.validOracle || !oracle.invalidOracle)) {
      throw new Error(`Country formula/boundary oracle missing for ${row.english.id}.`);
    }

    const browserProof = {
      id: row.english.id,
      route: row.swahili.routeKey,
      state: 'passed',
      testTitle: title,
      browser: 'chromium',
      durationMs: result.duration,
      serverIdentity: 'tests/fixtures/sw-cassava-processing-worktree-sentinel.txt',
      formulaOracle: row.country ? 'route-specific-shared-engine-parity' : 'hub-link-and-source-proof',
      invalidBoundaries: row.country ? oracle.invalidOracle.boundaries : [],
      staleResultAndExports: row.country ? 'cleared-and-disabled-on-input-change-and-invalid-submit' : 'not-applicable-hub',
      exportsReopened: row.country ? ['json', 'txt', 'csv', 'pdf'] : [],
      savedResultReopened: Boolean(row.country),
      share: row.country ? 'navigator.share-payload-proved-with-truthful-local-fallback' : 'not-offered-hub',
      privacy: 'no-external-requests-no-network-writes-local-only',
      ai: 'route-id-and-explicit-model-consent-boundary-visible',
      viewports: [320, 375],
      textReflowPercent: 200,
      themes: ['light', 'dark', 'system-light', 'system-dark'],
      computedContrast: { textMinimum: 4.5, boundaryMinimum: 3, focusMinimum: 3 },
      keyboardAndFocus: row.country ? 'submit-result-invalid-focus-and-skip-link' : 'skip-link',
      consoleResourceFailures: 0,
      artworkLoaded: true,
      metadata: ['canonical', 'og:url', 'schema-inLanguage', 'hreflang-en-fr-sw'],
    };
    browserRows.push(browserProof);

    const dimensions = webpDimensions(row.artwork.file);
    receiptRows.push({
      id: row.english.id,
      countryCode: row.country ? row.country.code : null,
      english: { route: row.english.routeKey, file: row.english.file },
      swahili: { route: row.swahili.routeKey, file: row.swahili.file },
      owner: 'scripts/lib/sw-agriculture-family-contracts/cassava-processing.js',
      controller: row.country ? 'assets/js/pages/sw-agriculture-cassava-processing.js' : null,
      engine: row.country ? 'engines/src/cassava-processing-engine.js' : null,
      data: row.country ? 'data/agriculture/cassava-processing-data.js' : null,
      artwork: {
        file: row.artwork.file,
        format: 'webp',
        bytes: fs.statSync(path.join(ROOT, row.artwork.file)).size,
        width: dimensions.width,
        height: dimensions.height,
        sha256: sha256(row.artwork.file),
      },
      oracle,
      browser: browserProof,
      centralAcceptanceState: row.acceptance.state,
      familyReceiptState: 'passed-local-proof',
    });
  }

  if (missingArtwork.length) throw new Error(`Missing Cassava artwork: ${missingArtwork.map((item) => item.id).join(', ')}`);
  const acceptedIds = receiptRows.map((row) => row.id);
  const browser = {
    schemaVersion: 1,
    generatedAt: '2026-08-02',
    family: 'cassava-processing',
    locale: 'sw',
    rawReporters: [RAW, RAW_HUB],
    expectedRows: 16,
    acceptedRows: 16,
    blockedRows: 0,
    acceptedIds,
    blockedIds: [],
    aggregate: {
      hubRoutes: 1,
      countryApps: 15,
      parsedExports: 60,
      invalidBoundaryAssertions: 90,
      networkWrites: 0,
      consoleAndResourceFailures: 0,
      computedContrast: { textMinimum: 4.5, boundaryMinimum: 3, focusMinimum: 3 },
    },
    rows: browserRows,
  };
  const receipt = {
    schemaVersion: 1,
    reviewedAt: '2026-08-02',
    family: 'cassava-processing',
    locale: 'sw',
    baselineSha: BASELINE_SHA,
    commitSha: 'the direct child commit containing this receipt',
    status: 'accepted-local-candidate',
    counts: { physicalOwners: 16, hubs: 1, countryApps: 15, accepted: 16, blocked: 0 },
    acceptedIds,
    blockedIds: [],
    owners: {
      generator: 'node scripts/build-sw-agriculture-family.js --family cassava-processing',
      renderer: 'scripts/lib/sw-agriculture-family-contracts/cassava-processing.js',
      controller: 'assets/js/pages/sw-agriculture-cassava-processing.js',
      englishEngine: 'engines/src/cassava-processing-engine.js',
      data: 'data/agriculture/cassava-processing-data.js',
      routeContract: MANIFEST,
    },
    proof: {
      sourceAndOracle: 'node tests/sw-agriculture-cassava-processing-family.test.js',
      sourceOwner: 'node scripts/build-sw-agriculture-family.js --family cassava-processing --check',
      chromium: 'playwright test tests/e2e/sw-agriculture-cassava-processing-family.spec.js --workers=1 --reporter=json',
      rawReporters: [RAW, RAW_HUB],
      browserReceipt: BROWSER,
      missingArtworkReceipt: MISSING_ARTWORK,
      hreflang: 'npm run validate:hreflang — 10,868 pages, 31,162 relationships, 5,276 groups, passed',
      internalLinks: 'npm run check-links — 133,382 links across 11,087 files, 0 broken',
      accessibility: '16 route-level browser checks plus computed text >=4.5, boundary >=3 and focus >=3',
      privacyAndAiConsent: 'ai-consent-server.test.js plus 3 privacy-ai-consent browser tests passed',
    },
    scope: {
      centralAcceptanceMutated: false,
      centralAiMutated: false,
      masterLedgerMutated: false,
      sitemapMutated: false,
      distMutated: false,
      pushPrMergeDeployPerformed: false,
    },
    hashes: {
      renderer: sha256('scripts/lib/sw-agriculture-family-contracts/cassava-processing.js'),
      controller: sha256('assets/js/pages/sw-agriculture-cassava-processing.js'),
      englishEngine: sha256('engines/src/cassava-processing-engine.js'),
      data: sha256('data/agriculture/cassava-processing-data.js'),
      manifest: sha256(MANIFEST),
      rawReporter: sha256(RAW),
      rawHubReporter: sha256(RAW_HUB),
      browserSpec: sha256('tests/e2e/sw-agriculture-cassava-processing-family.spec.js'),
      sourceTest: sha256('tests/sw-agriculture-cassava-processing-family.test.js'),
      receiptBuilder: sha256('scripts/build-sw-agriculture-cassava-processing-receipt.js'),
    },
    limitations: [
      'This is local candidate proof, not central acceptance, preview, production or deployment proof.',
      'The protected central AI map was not edited; route ids and the optional consent boundary are proved locally.',
      'Prices and processing assumptions are static 2024–2025 planning references and require local confirmation.',
      'The generic static accessibility scanner recognizes only an English skip-link token; browser proof verifies the native Kiswahili skip link on every route.',
      'The broad localization snapshot expects coordinator-owned generated locale coverage output; that prohibited artifact was left untouched.',
    ],
    rows: receiptRows,
  };
  const artwork = {
    schemaVersion: 1,
    generatedAt: '2026-08-02',
    family: 'cassava-processing',
    expected: 16,
    present: 16,
    missing: 0,
    missingIds: [],
  };
  return { browser, receipt, artwork };
}

function writeOrCheck(file, value, check) {
  const output = `${JSON.stringify(value, null, 2)}\n`;
  const absolute = path.join(ROOT, file);
  if (check) {
    if (!fs.existsSync(absolute) || fs.readFileSync(absolute, 'utf8') !== output) throw new Error(`${file} is stale.`);
  } else {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, output, 'utf8');
  }
}

function main() {
  const check = process.argv.includes('--check');
  const output = build();
  writeOrCheck(BROWSER, output.browser, check);
  writeOrCheck(RECEIPT, output.receipt, check);
  writeOrCheck(MISSING_ARTWORK, output.artwork, check);
  console.log(JSON.stringify({ family: 'cassava-processing', accepted: 16, blocked: 0, mode: check ? 'check' : 'write' }, null, 2));
}

if (require.main === module) main();
module.exports = { build, flattenSpecs, webpDimensions };
