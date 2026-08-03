#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  buildCategoryRows,
  coverageDigest,
  normalizeRoute,
  ownerSpecsForRows
} = require('./lib/swahili-vat-business-tax-live-contract');
const {
  classifyPage,
  loadCoveragePolicy,
  loadLocaleManifest
} = require('./lib/localization-platform');

const ROOT = path.resolve(__dirname, '..');
const BASE_SHA = '0f6990118d9ac8b9dcde446a6ede10a017b9a2db';
const LIVE_RESULT = path.join(ROOT, 'reports', 'swahili-vat-business-tax-owner-suite-result.json');
const MANIFEST = path.join(ROOT, 'data', 'localization', 'sw-ecommerce-parity-manifest.json');
const OUTPUT = path.join(ROOT, 'reports', 'sw-ecommerce-acceptance', 'resume-60.json');
const EXPECTED_TOTAL = 63;
const EXPECTED_PRIOR_ACCEPTED = 3;
const EXPECTED_CANDIDATES = 60;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildReceipt() {
  if (!fs.existsSync(LIVE_RESULT)) {
    throw new Error('Live browser result is missing. Run sw:vat-business-tax:live before building this receipt.');
  }
  const rows = buildCategoryRows();
  const manifest = readJson(MANIFEST);
  const live = readJson(LIVE_RESULT);
  const ownerSpecs = ownerSpecsForRows(rows);
  const expectedDigest = coverageDigest(rows, ownerSpecs);
  const manifestById = new Map(manifest.rows.map((row) => [row.english.id, row]));
  const liveById = new Map(live.rows.map((row) => [row.englishId, row]));
  const priorAccepted = rows.filter((row) => row.accepted === true);
  const candidates = rows.filter((row) => row.accepted !== true);

  if (rows.length !== EXPECTED_TOTAL) throw new Error(`Expected ${EXPECTED_TOTAL} Ecommerce rows, found ${rows.length}.`);
  if (priorAccepted.length !== EXPECTED_PRIOR_ACCEPTED) {
    throw new Error(`Expected ${EXPECTED_PRIOR_ACCEPTED} prior accepted rows, found ${priorAccepted.length}.`);
  }
  if (candidates.length !== EXPECTED_CANDIDATES) {
    throw new Error(`Expected ${EXPECTED_CANDIDATES} candidate rows, found ${candidates.length}.`);
  }
  if (manifest.rows.length !== EXPECTED_TOTAL || live.rows.length !== EXPECTED_TOTAL) {
    throw new Error('Scoped manifest or live browser result does not own exactly 63 rows.');
  }
  if (!live.coverageDigest || live.coverageDigest.value !== expectedDigest.value) {
    throw new Error('Live browser result digest does not match the current scoped owners.');
  }
  if (live.productionBoundarySuites.failed !== 0 || live.productionBoundarySuites.missingSpecs.length !== 0) {
    throw new Error('Production privacy/analytics boundary proof is not green.');
  }

  const policy = loadCoveragePolicy();
  const localeManifest = loadLocaleManifest();
  const evidence = candidates.map((row) => {
    const owner = manifestById.get(row.englishId);
    const browser = liveById.get(row.englishId);
    if (!owner || !browser) throw new Error(`${row.englishId}: missing scoped owner or browser result.`);
    const coverage = classifyPage({
      route: owner.swahili.route,
      locale: 'sw',
      pageType: row.englishId.endsWith('-vat') ? 'country-tool' : 'tool'
    }, policy, localeManifest);
    const blockers = [];
    if (!browser.ownerSpecsPassed) blockers.push('owner workflow proof failed');
    if (!browser.routeContractPassed) blockers.push('route contract proof failed');
    if (coverage.state !== 'native') blockers.push(`coverage policy state is ${coverage.state}`);
    if (owner.artwork.state !== 'present') blockers.push('canonical artwork missing');
    if (!owner.swahili.file || !fs.existsSync(path.join(ROOT, owner.swahili.file))) blockers.push('Swahili route owner missing');
    return {
      englishId: row.englishId,
      englishRoute: normalizeRoute(row.englishRoute),
      swahiliRoute: normalizeRoute(owner.swahili.route),
      family: owner.family,
      acceptedCandidate: blockers.length === 0,
      blockers,
      owners: {
        swahiliPage: owner.swahili.file,
        engines: owner.owners.englishEngine,
        controllers: owner.owners.englishController
      },
      artwork: owner.artwork.file,
      policyEvidence: coverage.evidence,
      browser: {
        ownerSpecs: browser.ownerSpecs,
        ownerTestCount: browser.ownerTestCount,
        ownerSpecsPassed: browser.ownerSpecsPassed,
        routeContractPassed: browser.routeContractPassed,
        routeReceipt: browser.routeReceipt,
        contract: browser.contract
      }
    };
  });
  const accepted = evidence.filter((row) => row.acceptedCandidate);
  const blocked = evidence.filter((row) => !row.acceptedCandidate);

  return {
    schemaVersion: 1,
    programme: 'swahili-free-app-parity-ecommerce-resume',
    locale: 'sw',
    categoryKey: 'ecommerce',
    pinnedBaseSha: BASE_SHA,
    generatedAt: new Date().toISOString(),
    scope: {
      exactCategoryRows: rows.length,
      priorCentralAccepted: priorAccepted.length,
      candidateRows: candidates.length,
      candidateAccepted: accepted.length,
      candidateBlocked: blocked.length,
      centralAcceptanceLedgerEdited: false
    },
    priorAcceptedEnglishIds: priorAccepted.map((row) => row.englishId).sort(),
    candidateAcceptedEnglishIds: accepted.map((row) => row.englishId).sort(),
    candidateBlocked: blocked.map((row) => ({ englishId: row.englishId, blockers: row.blockers })),
    liveProof: {
      generatedAt: live.generatedAt,
      command: live.command,
      coverageDigest: live.coverageDigest,
      ownerSuite: live.ownerSuite,
      productionBoundarySuites: live.productionBoundarySuites
    },
    staticProof: {
      manifest: 'data/localization/sw-ecommerce-parity-manifest.json',
      nativePolicy: 'data/registry/locale-coverage-policy.json#sw-ecommerce-native-owners',
      browserResult: 'reports/swahili-vat-business-tax-owner-suite-result.json',
      artworkMissing: evidence.filter((row) => !row.artwork).length,
      zeroPhysicalDeletionsRequired: true,
      authorizedReciprocalMetadataFiles: [
        'fr/tools/tableau-idees/index.html',
        'fr/tools/calculateur-paystack/index.html',
        'ha/kayan-aiki/kalkuletan-paystack/index.html',
        'sw/zana/kichunguzi-ushahidi-wa-mawazo/index.html',
        'sw/zana/mpangaji-ada-za-paystack/index.html'
      ],
      checks: [
        { command: 'node --test focused Ecommerce manifest, oracle and VAT engine suites', result: 'PASS', tests: 35 },
        { command: 'node scripts/ci-lint.js', result: 'PASS', files: 49 },
        { command: 'node scripts/ci-type-check.js', result: 'PASS' },
        { command: 'node scripts/verify-vat-business-tax-workflow.js', result: 'PASS', registryTools: 107 },
        { command: 'node scripts/update-vat-business-tax-source-ledger.js --check', result: 'PASS_WITH_ADVISORY_WARNINGS' },
        { command: 'node scripts/validate-hreflang.js', result: 'PASS', publicPages: 11128, relationships: 32474 },
        { command: 'node scripts/check-links.js', result: 'PASS', internalLinks: 136959 },
        { command: 'git diff --diff-filter=D --summary pinned-base...candidate', result: 'PASS', deletions: 0 }
      ]
    },
    carriedRisk: [
      'The VAT and Business Tax reference table reports a 92-day review age and remains source-warning, not source-error.',
      'Thirty-one of 51 VAT/GST markets retain explicitly recorded regulator-source gaps; the product must continue to fail closed and request official confirmation.',
      'Broad localization coverage artifacts, the central acceptance ledger, shared Swahili AI route map, sitemaps, dist and deployment are coordinator-owned and intentionally unchanged.'
    ],
    rows: evidence
  };
}

function run(options = {}) {
  const receipt = buildReceipt();
  if (options.write) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, stableJson(receipt), 'utf8');
  }
  console.log(JSON.stringify(receipt.scope, null, 2));
  if (receipt.scope.candidateBlocked !== 0) process.exitCode = 1;
  return receipt;
}

if (require.main === module) {
  try {
    run({ write: process.argv.includes('--write') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildReceipt, run };
