#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const DEFAULT_INPUT = path.join(
  ROOT,
  'reports/sw-agriculture-browser-raw/farm-profit-playwright.json'
);
const OUTPUT = path.join(ROOT, 'reports/sw-agriculture-farm-profit-browser-proof.json');

function collectSpecs(suites, result = []) {
  for (const suite of suites || []) {
    result.push(...(suite.specs || []));
    collectSpecs(suite.suites, result);
  }
  return result;
}

function parseArgs(argv) {
  const options = { input: DEFAULT_INPUT, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') options.input = path.resolve(argv[++index]);
    else if (argv[index] === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

function build(inputFile) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const rows = manifest.rows.filter((row) => row.family === 'farm-profit');
  const playwright = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const specs = collectSpecs(playwright.suites);
  const byTitle = new Map(specs.map((spec) => [spec.title, spec]));
  if (rows.length !== 55) throw new Error(`Expected 55 Farm Profit rows; found ${rows.length}.`);
  if (specs.length !== 55 || byTitle.size !== 55) {
    throw new Error(`Expected 55 unique Farm Profit Playwright specs; found ${specs.length}/${byTitle.size}.`);
  }
  if (
    !playwright.stats
    || playwright.stats.expected !== 55
    || playwright.stats.unexpected !== 0
    || playwright.stats.skipped !== 0
  ) {
    throw new Error('Farm Profit Playwright JSON is not a complete 55/55 passing run.');
  }

  const proofRows = rows.map((row) => {
    const spec = byTitle.get(`${row.english.id} full route local proof`);
    if (!spec || !spec.ok || spec.tests.length !== 1) {
      throw new Error(`Missing passing browser proof for ${row.english.id}.`);
    }
    const results = spec.tests[0].results || [];
    if (
      spec.tests[0].status !== 'expected'
      || results.length !== 1
      || results[0].status !== 'passed'
      || (results[0].errors || []).length
    ) {
      throw new Error(`Non-passing browser proof for ${row.english.id}.`);
    }
    return {
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      swahiliRoute: row.swahili.routeKey,
      countryCode: row.country ? row.country.code : null,
      status: 'passed-local-proof',
      workflow: row.country
        ? 'Shared FarmProfitEngine country calculation with local/export/process boundaries, keyboard submit, six focused invalid boundaries and stale-result lockout'
        : 'Native 54-country Farm Profit chooser with route, artwork, locale mesh, theme and reflow proof',
      browser: {
        spec: 'tests/e2e/sw-agriculture-farm-profit-family.spec.js',
        project: spec.tests[0].projectName,
        durationMs: results[0].duration,
        viewports: [320, 375],
        textReflowPercent: 200,
        themes: ['light', 'dark'],
        fullKeyboardAndFocus: true,
        labelsAndLiveRegions: true,
        staleResultInvalidation: true,
        disabledStaleExport: true,
        shareAction: true,
        sellingMethodBoundaries: row.country ? ['local', 'export', 'process'] : [],
        invalidBoundaries: row.country
          ? ['farm-size', 'yield', 'market-price', 'post-harvest-loss', 'family-labor', 'export-price']
          : [],
        serverRootIdentity: true,
        consoleErrors: 0,
        resourceFailures: 0,
        networkWrites: 0,
        externalRequests: 0,
        canonicalOgSchemaHreflang: true,
        artworkLoaded: true,
        aiRouteId: 'farm-profit-calculator',
        aiConsent: 'required-before-model-send',
      },
      exports: row.country ? {
        applicable: true,
        reopened: ['json', 'txt', 'csv', 'pdf'],
        jsonParsed: true,
        txtParsed: true,
        csvParsed: true,
        pdfSignatureVerified: true,
        pdfParsed: true,
        localSaveReopened: true,
      } : {
        applicable: false,
        reason: 'The family hub does not advertise result exports.',
      },
      privacy: {
        localFirst: true,
        noNetwork: true,
        rawInputAnalytics: false,
      },
    };
  });
  const ids = proofRows.map((row) => row.englishId);
  if (
    new Set(ids).size !== rows.length
    || ids.some((id, index) => id !== rows[index].english.id)
  ) {
    throw new Error('Farm Profit browser proof IDs do not exactly match the manifest.');
  }
  return {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    family: 'farm-profit',
    status: 'passed-local-proof',
    routes: proofRows.length,
    passedLocalProof: proofRows.length,
    rawResult: {
      input: path.relative(ROOT, inputFile).replace(/\\/g, '/'),
      expected: playwright.stats.expected,
      unexpected: playwright.stats.unexpected,
      skipped: playwright.stats.skipped,
      durationMs: playwright.stats.duration,
    },
    runner: {
      spec: 'tests/e2e/sw-agriculture-farm-profit-family.spec.js',
      project: 'chromium',
      workers: 1,
      passed: playwright.stats.expected,
      failed: playwright.stats.unexpected,
    },
    rows: proofRows,
  };
}

function run(options) {
  const report = build(options.input);
  const content = `${JSON.stringify(report, null, 2)}\n`;
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : null;
  if (options.check && current !== content) {
    throw new Error('Swahili Farm Profit browser proof is stale.');
  }
  if (!options.check && current !== content) fs.writeFileSync(OUTPUT, content, 'utf8');
  console.log(JSON.stringify({
    family: report.family,
    routes: report.routes,
    passedLocalProof: report.passedLocalProof,
    mode: options.check ? 'check' : 'write',
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { build, collectSpecs, parseArgs, run };
