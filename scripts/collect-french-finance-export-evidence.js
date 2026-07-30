'use strict';

const fs = require('fs');
const path = require('path');
const { validateWorkflowReceipt } = require('./lib/french-finance-workflow-contract');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/registry/french-finance-tax-market-data.json');
const PART_DIR = path.join(ROOT, 'artifacts', 'french-finance-export-contract-parts');
const BROWSER_FILE = path.join(ROOT, 'reports', 'french-finance-tax-market-data-browser-evidence.json');
const RUN_ID = process.env.FRENCH_FINANCE_EXPORT_RUN_ID;
const FINANCE_PORT = Number(process.env.FRENCH_FINANCE_PLAYWRIGHT_PORT || 42973);
const EXPECTED_SERVER_IDENTITY = {
  workspaceRoot: ROOT,
  baselineCommit: '8ce5cac175e42201968b1f7540752d6acf92d4ca',
  sentinel: 'ccf6-fr-finance-result-mutation-v2',
  port: FINANCE_PORT
};
const EXPECTED_ROWS = 132;
const EXPECTED_PARTS = 22;

if (!RUN_ID) throw new Error('FRENCH_FINANCE_EXPORT_RUN_ID is required.');

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  return route === '/' ? route : `/${route.replace(/^\/+|\/+$/g, '')}`;
}

const proofRows = [];
for (let part = 1; part <= EXPECTED_PARTS; part += 1) {
  const file = path.join(PART_DIR, `part-${part}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing export proof part ${part}.`);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (payload.runId !== RUN_ID) throw new Error(`Stale export proof part ${part}: ${payload.runId}`);
  if (JSON.stringify(payload.serverIdentity) !== JSON.stringify(EXPECTED_SERVER_IDENTITY)) {
    throw new Error(`Wrong Finance server identity in export proof part ${part}.`);
  }
  proofRows.push(...payload.rows);
}
if (proofRows.length !== EXPECTED_ROWS) throw new Error(`Expected ${EXPECTED_ROWS} export proof rows; found ${proofRows.length}.`);
if (new Set(proofRows.map((row) => normalizeRoute(row.englishRoute))).size !== EXPECTED_ROWS) {
  throw new Error('Duplicate English owner in export proof.');
}

const manifestByEnglish = new Map(manifest.rows.map((row) => [normalizeRoute(row.englishRoute), row]));
const failed = [];
const workflowStatusByEnglish = new Map();
for (const proof of proofRows) {
  const owner = manifestByEnglish.get(normalizeRoute(proof.englishRoute));
  if (!owner) {
    failed.push(`${proof.englishRoute}: not in 132-row manifest`);
    continue;
  }
  const contract = proof.exportContract;
  if (!contract) {
    failed.push(`${proof.englishRoute}: export contract missing`);
    continue;
  }
  const workflow = validateWorkflowReceipt({
    englishRoute: proof.englishRoute,
    fixture: contract.fixture
  });
  workflowStatusByEnglish.set(normalizeRoute(proof.englishRoute), workflow);
  if (!workflow.passed) failed.push(`${proof.englishRoute}: ${workflow.errors.join('; ')}`);
  if (!proof.passed || contract.finalStatus !== 'accepted') {
    failed.push(`${proof.englishRoute}: proof did not pass`);
  }
  if (!['required', 'notApplicable'].includes(contract.classification)) {
    failed.push(`${proof.englishRoute}: unresolved ${contract.classification || 'missing classification'}`);
    continue;
  }
  if (contract.classification === 'required') {
    const formats = contract.frenchOwner && Array.isArray(contract.frenchOwner.formats)
      ? contract.frenchOwner.formats
      : [];
    const passedOracles = new Set((contract.oracles || []).filter((oracle) => oracle.passed).map((oracle) => oracle.format));
    const missing = formats.filter((format) => !passedOracles.has(format));
    if (!formats.length || missing.length) {
      failed.push(`${proof.englishRoute}: missing parsed oracle(s) ${missing.join(', ') || 'all formats'}`);
    }
    if (!contract.fixture || !contract.fixture.inputs.length || !contract.fixture.expectedResults.length) {
      failed.push(`${proof.englishRoute}: missing fixture inputs/results`);
    }
    if (!contract.privacyGate
      || contract.privacyGate.fixtureValueNetworkLeak !== false
      || contract.privacyGate.accountOrEmailGate !== false) {
      failed.push(`${proof.englishRoute}: local ungated privacy proof missing`);
    }
  } else if (!contract.englishOwner || !contract.englishOwner.evidence) {
    failed.push(`${proof.englishRoute}: notApplicable English owner evidence missing`);
  }
}
const browser = JSON.parse(fs.readFileSync(BROWSER_FILE, 'utf8'));
const proofByFrench = new Map(proofRows.map((row) => [normalizeRoute(row.frenchRoute), row]));
browser.rows = browser.rows.map((row) => {
  const proof = proofByFrench.get(normalizeRoute(row.frenchRoute));
  if (!proof) throw new Error(`Missing export proof for browser row ${row.frenchRoute}.`);
  const workflow = workflowStatusByEnglish.get(normalizeRoute(row.englishRoute))
    || { passed: false, errors: ['workflow receipt missing'] };
  const exportAccepted = proof.passed === true
    && proof.exportContract
    && proof.exportContract.finalStatus === 'accepted'
    && workflow.passed;
  return {
    ...row,
    workflowPassed: workflow.passed,
    workflowErrors: workflow.errors,
    exportsParsed: exportAccepted,
    exportContract: proof.exportContract
  };
});
if (browser.rows.length !== EXPECTED_ROWS) throw new Error(`Expected ${EXPECTED_ROWS} browser rows; found ${browser.rows.length}.`);
browser.generatedAt = new Date().toISOString();
browser.exportRunId = RUN_ID;
browser.serverIdentity = EXPECTED_SERVER_IDENTITY;
browser.exportsParsedRows = browser.rows.filter((row) => row.exportsParsed).length;
browser.exportRequiredRows = browser.rows.filter((row) => row.exportContract.classification === 'required').length;
browser.exportNotApplicableRows = browser.rows.filter((row) => row.exportContract.classification === 'notApplicable').length;
browser.exportProductGapRows = browser.rows.filter((row) => row.exportContract.classification === 'productGap').length;
browser.workflowPassedRows = browser.rows.filter((row) => row.workflowPassed).length;
browser.notes = 'Responsive, theme, keyboard, console, canonical and OG evidence is retained from the 132-row browser sweep. Workflow acceptance is fail-closed on an explicit before/after result-region mutation; titles, static copy, source/privacy cards and marketing CTAs cannot satisfy the oracle. Required export proof remains one physical row per app with format-specific parsing, local fixture privacy and no account/email gate.';
fs.writeFileSync(BROWSER_FILE, `${JSON.stringify(browser, null, 2)}\n`);

console.log(JSON.stringify({
  rows: browser.rows.length,
  required: browser.exportRequiredRows,
  notApplicable: browser.exportNotApplicableRows,
  productGap: browser.exportProductGapRows,
  parsed: browser.exportsParsedRows
}, null, 2));
if (failed.length) throw new Error(`Export contract acceptance failed:\n${[...new Set(failed)].join('\n')}`);
