#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const DEFAULT_INPUT = path.join(
  ROOT,
  'reports/sw-agriculture-browser-raw/irrigation-playwright.json'
);
const OUTPUT = path.join(ROOT, 'reports/sw-agriculture-irrigation-browser-proof.json');

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
  const rows = manifest.rows.filter((row) => row.family === 'irrigation');
  const playwright = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const specs = collectSpecs(playwright.suites);
  const byTitle = new Map(specs.map((spec) => [spec.title, spec]));
  if (rows.length !== 55) throw new Error(`Expected 55 Irrigation rows; found ${rows.length}.`);
  if (specs.length !== 55) throw new Error(`Expected 55 Playwright specs; found ${specs.length}.`);
  if (byTitle.size !== specs.length) throw new Error('Playwright JSON contains duplicate spec titles.');
  if ((playwright.stats && playwright.stats.expected) !== 55) {
    throw new Error(`Expected 55 passing browser results; found ${playwright.stats && playwright.stats.expected}.`);
  }
  if ((playwright.stats && playwright.stats.unexpected) !== 0) {
    throw new Error('Playwright JSON contains unexpected results.');
  }

  const proofRows = rows.map((row) => {
    const title = `${row.english.id} full route local proof`;
    const spec = byTitle.get(title);
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
        ? 'Shared IrrigationEngine calculation with route country data, keyboard submit and focused invalid state'
        : 'Native 54-country family chooser with route, artwork, theme and reflow proof',
      browser: {
        spec: 'tests/e2e/sw-agriculture-irrigation-family.spec.js',
        project: spec.tests[0].projectName,
        durationMs: results[0].duration,
        viewports: [320, 375],
        textReflowPercent: 200,
        themes: ['light', 'dark'],
        keyboardAndFocus: true,
        staleResultInvalidation: true,
        shareAction: true,
        monthlyMode: true,
        irrigationMethodBoundaries: true,
        serverRootIdentity: true,
        labelsAndLiveRegions: true,
        consoleErrors: 0,
        resourceFailures: 0,
        networkWrites: 0,
        externalRequests: 0,
        canonicalOgSchemaHreflang: true,
        artworkLoaded: true,
        aiRoute: 'irrigation-calculator',
        aiConsent: 'required-before-model-send',
      },
      exports: row.country ? {
        applicable: true,
        reopened: ['json', 'txt', 'csv', 'pdf'],
        jsonParsed: true,
        csvParsed: true,
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
  const blockedIds = proofRows.map((row) => row.englishId);
  if (
    new Set(blockedIds).size !== rows.length
    || blockedIds.some((id, index) => id !== rows[index].english.id)
  ) {
    throw new Error('Irrigation browser proof IDs do not exactly match the manifest.');
  }

  return {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    family: 'irrigation',
    status: 'passed-local-proof',
    routes: proofRows.length,
    passedLocalProof: proofRows.length,
    accepted: 0,
    blocked: proofRows.length,
    acceptedIds: [],
    blockedIds,
    independentAcceptanceRequired: true,
    rawResult: {
      input: path.relative(ROOT, inputFile).replace(/\\/g, '/'),
      expected: playwright.stats.expected,
      unexpected: playwright.stats.unexpected,
      skipped: playwright.stats.skipped,
      durationMs: playwright.stats.duration,
    },
    runner: {
      spec: 'tests/e2e/sw-agriculture-irrigation-family.spec.js',
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
    throw new Error('Swahili Irrigation browser proof is stale.');
  }
  if (!options.check && current !== content) fs.writeFileSync(OUTPUT, content, 'utf8');
  console.log(JSON.stringify({
    family: report.family,
    routes: report.routes,
    accepted: report.accepted,
    blocked: report.blocked,
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
