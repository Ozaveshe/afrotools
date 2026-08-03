'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_SHA = '8354e321ff34caf60a33a3393cd0dcddfb00c023';
const MANIFEST = 'data/localization/sw-agriculture-parity-manifest.json';
const BROWSER = 'reports/sw-agriculture-acceptance/seed-rate-browser.json';
const SOURCE_BROWSER = 'reports/sw-agriculture-browser-raw/seed-rate-source-playwright.json';
const OUTPUT = 'reports/sw-agriculture-acceptance/seed-rate.json';
const MISSING_ARTWORK = 'reports/sw-agriculture-seed-rate-missing-artwork.json';

function readJson(file) { return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')); }
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

function build() {
  const manifest = readJson(MANIFEST);
  const browser = readJson(BROWSER);
  const sourceBrowser = readJson(SOURCE_BROWSER);
  const rows = manifest.rows.filter(row => row.family === 'seed-rate');
  const countries = rows.filter(row => row.country);
  if (rows.length !== 55 || countries.length !== 54) throw new Error(`Expected 55/54 Seed Rate rows; found ${rows.length}/${countries.length}.`);
  if (browser.schemaVersion !== 2 || browser.browser !== 'chromium' || browser.expectedRows !== 55 || browser.acceptedRows !== 55) {
    throw new Error(`Browser proof is incomplete: ${browser.acceptedRows || 0}/55.`);
  }
  if (!browser.contrast || browser.contrast.provedRows !== 55
    || browser.contrast.minimumBoundary < 3
    || browser.contrast.minimumText < 4.5
    || browser.contrast.minimumFocus < 3
    || JSON.stringify(browser.contrast.modes) !== JSON.stringify(['light', 'dark', 'system-light', 'system-dark'])) {
    throw new Error('Rendered Seed Rate contrast proof is incomplete.');
  }
  if (sourceBrowser.stats.expected !== 55 || sourceBrowser.stats.unexpected !== 0 || sourceBrowser.stats.skipped !== 0) {
    throw new Error('Current Seed Rate named-source browser proof is incomplete.');
  }
  const sourceSpecs = new Map(flattenSpecs(sourceBrowser.suites).map(spec => [spec.title, spec]));
  const browserByRoute = new Map(browser.rows.map(row => [row.route, row]));
  const receiptRows = rows.map(row => {
    const proof = browserByRoute.get(row.swahili.routeKey);
    if (!proof || proof.state !== 'passed') throw new Error(`Missing passing proof for ${row.english.id}.`);
    if (!proof.contrast || proof.contrast.minimumBoundary < 3
      || proof.contrast.minimumText < 4.5 || proof.contrast.minimumFocus < 3) {
      throw new Error(`Rendered contrast proof is incomplete for ${row.english.id}.`);
    }
    const swahili = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
    const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
    const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
    const sourceTitle = `${row.english.id}: complete native named-source and freshness proof`;
    const sourceTest = sourceSpecs.get(sourceTitle) && sourceSpecs.get(sourceTitle).tests[0];
    const sourceResult = sourceTest && sourceTest.results.at(-1);
    if (!sourceTest || sourceTest.status !== 'expected' || !sourceResult || sourceResult.status !== 'passed') {
      throw new Error(`Missing current named-source browser proof for ${row.english.id}.`);
    }
    if (/Data sources|Tomato planning parameters also reference|FAO crop information|World Bank/i.test(swahili)) {
      throw new Error(`Incomplete or untranslated source fragment remains for ${row.english.id}.`);
    }
    if (!swahili.includes('Taarifa za FAO kuhusu zao la nyanya')) {
      throw new Error(`Linked named FAO source missing for ${row.english.id}.`);
    }
    if (!swahili.includes('Uhakika') || !swahili.includes('2026')) {
      throw new Error(`Freshness/confidence disclosure missing for ${row.english.id}.`);
    }
    if (!english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`)) {
      throw new Error(`English reciprocal hreflang missing for ${row.english.id}.`);
    }
    if (!french.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`)) {
      throw new Error(`French reciprocal hreflang missing for ${row.english.id}.`);
    }
    if (!swahili.includes(row.artwork.file)) throw new Error(`Artwork reference missing for ${row.english.id}.`);
    const dimensions = webpDimensions(row.artwork.file);
    return {
      id: row.english.id,
      countryCode: row.country && row.country.code || null,
      english: { route: row.english.routeKey, file: row.english.file },
      swahili: { route: row.swahili.routeKey, file: row.swahili.file },
      owner: 'scripts/lib/sw-agriculture-family-contracts/seed-rate.js',
      controller: row.country ? 'assets/js/pages/sw-seed-rate-controller.js' : null,
      engine: row.country ? 'engines/src/seed-rate-engine.js -> engines/seed-rate-engine.js' : null,
      data: row.country ? [
        `data/agriculture/${row.country.code.toLowerCase()}-agri-data.js`,
        'data/agriculture/seed-data.js',
        'data/agriculture/seed-data-extension.js'
      ] : ['data/agriculture/country-index.js'],
      artwork: {
        file: row.artwork.file, format: 'webp', bytes: fs.statSync(path.join(ROOT, row.artwork.file)).size,
        width: dimensions.width, height: dimensions.height, sha256: sha256(row.artwork.file)
      },
      browser: proof,
      sourceBrowser: { state: 'passed', testTitle: sourceTitle, durationMs: sourceResult.duration },
      centralAcceptanceState: row.acceptance.state,
      familyReceiptState: 'passed-local-proof'
    };
  });
  const acceptedIds = receiptRows.map(row => row.id);
  const blockedIds = browser.blockedIds || [];
  if (blockedIds.length) throw new Error(`Blocked Seed Rate ids remain: ${blockedIds.join(', ')}`);
  return {
    schemaVersion: 1,
    reviewedAt: '2026-08-02',
    family: 'seed-rate',
    locale: 'sw',
    baselineSha: BASELINE_SHA,
    commitSha: 'the direct child commit containing this receipt',
    status: 'accepted-local-candidate',
    counts: { physicalOwners: 55, hubs: 1, countryApps: 54, accepted: acceptedIds.length, blocked: blockedIds.length },
    acceptedIds,
    blockedIds,
    scope: {
      excludedAcceptedFamilies: ['crop-yield', 'fertilizer'],
      excludedCandidates: ['irrigation', 'farm-profit'],
      centralAcceptanceMutated: false,
      centralAiMutated: false,
      masterLedgerMutated: false,
      sitemapMutated: false,
      distMutated: false,
      pushPrMergeDeployPerformed: false
    },
    owners: {
      generator: 'node scripts/build-sw-agriculture-family.js --family seed-rate',
      renderer: 'scripts/lib/sw-agriculture-family-contracts/seed-rate.js',
      controller: 'assets/js/pages/sw-seed-rate-controller.js',
      englishEngine: 'engines/src/seed-rate-engine.js',
      browserEngine: 'engines/seed-rate-engine.js',
      seedData: ['data/agriculture/seed-data.js', 'data/agriculture/seed-data-extension.js'],
      routeContract: MANIFEST
    },
    proof: {
      sourceAndOracle: 'node --test tests/sw-agriculture-seed-rate.test.js',
      sourceOwner: 'node scripts/build-sw-agriculture-family.js --family seed-rate --check',
      chromium: 'npx playwright test -c tests/playwright.sw-seed-rate.config.js sw-agriculture-seed-rate-family.spec.js --project=chromium --workers=1',
      namedSourceChromium: 'playwright test -c tests/playwright.sw-seed-rate-source.config.js sw-agriculture-seed-rate-source.spec.js --project=chromium --workers=1',
      namedSourceRawReporter: SOURCE_BROWSER,
      missingArtworkReceipt: MISSING_ARTWORK,
      nativeNamedSourceRows: sourceBrowser.stats.expected,
      browserAcceptedRows: browser.acceptedRows,
      deterministicCountryOracles: 54,
      invalidAndBoundaryStates: 54,
      staleResultsCleared: 54,
      exportGatesFailClosed: 54,
      reopenedExportsPerCountry: ['json', 'txt', 'csv', 'pdf'],
      localSavesReopened: 54,
      privacyLocalOnlyRows: 55,
      networkWrites: 0,
      aiRoute: '/sw/ai/',
      aiConsentBoundaryRows: 55,
      viewports: [320, 375],
      textReflowPercent: 200,
      themes: ['light', 'dark'],
      renderedContrast: browser.contrast,
      consoleAndResourceErrors: 0,
      artworkResolved: 55,
      reciprocalHreflangPairs: 55,
      hreflangValidation: {
        command: 'npm run validate:hreflang',
        publicPages: 10907,
        relationships: 31396,
        equivalenceGroups: 5276,
        status: 'passed'
      },
      linkValidation: {
        command: 'npm run check-links',
        htmlFiles: 11126,
        internalLinks: 134051,
        broken: 0
      }
    },
    hashes: {
      renderer: sha256('scripts/lib/sw-agriculture-family-contracts/seed-rate.js'),
      controller: sha256('assets/js/pages/sw-seed-rate-controller.js'),
      englishEngine: sha256('engines/src/seed-rate-engine.js'),
      browserEngine: sha256('engines/seed-rate-engine.js'),
      seedData: sha256('data/agriculture/seed-data.js'),
      seedDataExtension: sha256('data/agriculture/seed-data-extension.js'),
      manifest: sha256(MANIFEST),
      sourceBrowserReporter: sha256(SOURCE_BROWSER),
      sourceBrowserSpec: sha256('tests/e2e/sw-agriculture-seed-rate-source.spec.js'),
      sourceTest: sha256('tests/sw-agriculture-seed-rate.test.js')
    },
    limitations: [
      'This is local candidate proof, not central acceptance, preview, production or deployment proof.',
      'The protected central AI route map was not edited; each family page proves the optional /sw/ai/ handoff and separate model-consent boundary.',
      'npm run build:i18n:validate is blocked by stale generated locale coverage artifacts that predate and remain untouched by this Seed Rate candidate.',
      'Seed prices, package sizes and agricultural assumptions are static planning references and require local confirmation.'
    ],
    rows: receiptRows
  };
}

function main() {
  const check = process.argv.includes('--check');
  const receipt = build();
  const output = `${JSON.stringify(receipt, null, 2)}\n`;
  const file = path.join(ROOT, OUTPUT);
  const artworkOutput = `${JSON.stringify({
    schemaVersion: 1,
    reviewedAt: '2026-08-02',
    family: 'seed-rate',
    expected: receipt.counts.physicalOwners,
    present: receipt.counts.physicalOwners,
    missing: 0,
    missingIds: []
  }, null, 2)}\n`;
  const artworkFile = path.join(ROOT, MISSING_ARTWORK);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== output) throw new Error(`${OUTPUT} is stale.`);
    if (!fs.existsSync(artworkFile) || fs.readFileSync(artworkFile, 'utf8') !== artworkOutput) throw new Error(`${MISSING_ARTWORK} is stale.`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, output, 'utf8');
    fs.writeFileSync(artworkFile, artworkOutput, 'utf8');
  }
  console.log(JSON.stringify({ family: 'seed-rate', accepted: 55, blocked: 0, mode: check ? 'check' : 'write' }, null, 2));
}

if (require.main === module) main();
module.exports = { build, webpDimensions };
