#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  MANIFEST_PATH,
  assertManifestIntegrity,
} = require('./lib/fr-agriculture-parity-manifest');

const BROWSER_PROOF = Object.freeze({
  fertilizer: { port: 42851, result: '55 passed (1.5m)' },
  irrigation: { port: 42857, result: '55 passed (55.9s)' },
  'farm-profit': { port: 42861, result: '55 passed (2.4m)' },
  'seed-rate': { port: 42867, result: '55 passed (1.3m)' },
  'fish-farming': { port: 42873, result: '16 passed (34.6s)' },
  'cassava-processing': { port: 42879, result: '16 passed (1.1m)' },
  greenhouse: { port: 42885, result: '16 passed (49.8s)' },
  'livestock-feed': { port: 42891, result: '16 passed (54.9s)' },
  'input-prices': { port: 42897, result: '16 passed (23.9s)' },
  'farm-loans': { port: 42903, result: '16 passed (46.9s)' },
  'farm-payroll': { port: 42909, result: '54 passed (4.1m); central-african-republic timeout rerun passed (27.6s)' },
});

function parseArgs(argv) {
  const options = { family: null, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--family') options.family = argv[++index];
    else if (argv[index] === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!options.family) throw new Error('Provide --family <family-id>.');
  return options;
}

function buildReceipt(family) {
  const browser = BROWSER_PROOF[family];
  if (!browser) throw new Error(`No reviewed browser proof registered for ${family}.`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const oraclePath = path.join(ROOT, 'reports', `fr-agriculture-${family}-family-oracles.json`);
  const oracles = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));
  assertManifestIntegrity(manifest);
  const familyRows = manifest.rows.filter((row) => row.family === family);
  const countryRows = familyRows.filter((row) => row.country);
  if (
    oracles.family !== family
    || oracles.rows !== familyRows.length
    || oracles.countryOracles !== countryRows.length
  ) {
    throw new Error(`${family} oracle report does not match the exact manifest family split.`);
  }
  return {
    schemaVersion: 1,
    programme: 'fr-agriculture-parity',
    family,
    wave: 'full-family',
    status: 'passed',
    date: '2026-07-28',
    proof: {
      source: `node tests/fr-agriculture-${family}-family.test.js`,
      generator: `node scripts/build-fr-agriculture-family.js --family ${family} --check`,
      hreflang: `node scripts/sync-fr-agriculture-hreflang.js --family ${family} --check`,
      ai: 'node scripts/build-ai-french-route-map.js --check',
      browser: `PORT=${browser.port} PLAYWRIGHT_BASE_URL=http://127.0.0.1:${browser.port} npx playwright test tests/e2e/fr-agriculture-${family}-family.spec.js --project=chromium --workers=4 --reporter=line`,
      browserResult: browser.result,
    },
    rows: familyRows.map((row) => ({
      englishId: row.english.id,
      countryCode: row.country ? row.country.code : null,
      englishRoute: row.english.route,
      frenchRoute: row.french.route,
      status: 'accepted',
      oracle: row.country ? oracles.oracles[row.country.code] : {
        type: 'hub-directory',
        countryLinks: countryRows.length,
        manifestRows: familyRows.length,
      },
      browser: {
        suite: `tests/e2e/fr-agriculture-${family}-family.spec.js`,
        result: browser.result,
        isolatedPort: browser.port,
        viewports: [320, 375],
        reflow200Percent: true,
        themes: ['light', 'manual-dark', 'system-dark'],
        keyboardFocusA11y: true,
        consoleAndNetworkClean: true,
        seo: ['self-canonical', 'og', 'schema-inLanguage-fr', 'semantic-hreflang'],
        aiRoute: row.french.routeKey,
      },
      exports: row.country ? ['pdf', 'csv', 'json', 'txt'] : [],
      source: {
        engine: row.owners.englishEngine,
        data: row.owners.englishData,
        freshness: row.country ? 'static country reference; not live' : 'manifest-derived directory; not live',
        confidence: row.country ? 'planning estimate' : 'navigation-only hub',
      },
      artwork: row.artwork,
      limitations: row.country
        ? ['Planning output; verify changing prices, availability, assumptions and field conditions locally.']
        : ['The family hub selects a country route and has no calculation or export contract.'],
    })),
  };
}

function run(options) {
  const outputPath = path.join(ROOT, 'reports', 'fr-agriculture-acceptance', `${options.family}.json`);
  const content = `${JSON.stringify(buildReceipt(options.family), null, 2)}\n`;
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (options.check) {
    if (current !== content) throw new Error(`${path.relative(ROOT, outputPath)} is stale.`);
  } else if (current !== content) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, 'utf8');
  }
  process.stdout.write(`${JSON.stringify({ family: options.family, status: 'passed', file: path.relative(ROOT, outputPath).replace(/\\/g, '/') }, null, 2)}\n`);
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { BROWSER_PROOF, parseArgs, buildReceipt, run };
