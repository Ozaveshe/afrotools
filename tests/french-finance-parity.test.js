'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { buildFrenchAiRouteMap, normalizeRoute } = require('../scripts/lib/french-ai-route-map');
const {
  validateWorkflowReceipt,
  isForbiddenWorkflowControl
} = require('../scripts/lib/french-finance-workflow-contract');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/registry/french-finance-tax-market-data.json');
const evidence = require('../reports/french-finance-tax-market-data-evidence.json');
const browserEvidence = require('../reports/french-finance-tax-market-data-browser-evidence.json');
const aiEval = require('../data/ai/french-finance-route-eval.json');
const overrides = require('../data/ai/french-finance-route-overrides.json');

function routeExists(route) {
  const pathname = String(route).split(/[?#]/)[0].replace(/^\/+/, '');
  return [
    path.join(ROOT, pathname, 'index.html'),
    path.join(ROOT, `${pathname.replace(/\/$/, '')}.html`),
    path.join(ROOT, pathname)
  ].some((candidate) => fs.existsSync(candidate));
}

test('French finance scope is exact and does not double-count the VAT lane', () => {
  assert.equal(manifest.count, 132);
  assert.equal(manifest.rows.length, 132);
  assert.equal(evidence.totals.rows, 132);
  assert.equal(evidence.totals.vatRows, 63);
  assert.equal(evidence.totals.overlapWithVat, 0);
  assert.equal(new Set(manifest.rows.map((row) => row.englishRoute)).size, 132);
  assert.equal(new Set(manifest.rows.map((row) => row.frenchRoute)).size, 132);
  assert.equal(evidence.totals.nativeRuntime, 132);
});

test('every scoped app has a route, registry owner, implementation receipt and artwork', () => {
  for (const row of evidence.rows) {
    assert(routeExists(row.frenchRoute), row.frenchRoute);
    assert.equal(row.checks.registryOwner, true, row.englishRoute);
    assert.equal(row.checks.nativeRuntime, true, row.frenchRoute);
    assert.equal(row.checks.artworkExists, true, row.frenchRoute);
    assert(Array.isArray(row.implementationOwners), row.frenchRoute);
  }
});

test('all 132 export contracts fail closed on missing parsed proof', () => {
  assert.equal(evidence.totals.accepted, 132);
  assert.equal(evidence.totals.failed, 0);
  assert.equal(browserEvidence.exportsParsedRows, 132);
  assert.equal(browserEvidence.exportRequiredRows, 126);
  assert.equal(browserEvidence.exportNotApplicableRows, 6);
  assert.equal(browserEvidence.exportProductGapRows, 0);
  assert.match(browserEvidence.exportRunId, /^fr-finance-export-full-mutation-/);

  for (const row of manifest.rows) {
    const contract = row.exportContract;
    assert(contract, `${row.englishRoute}: exportContract`);
    assert(['required', 'notApplicable'].includes(contract.classification), `${row.englishRoute}: classification`);
    assert(Array.isArray(contract.englishOwner.actions), `${row.englishRoute}: English actions`);
    assert(Array.isArray(contract.frenchOwner.actions), `${row.englishRoute}: French actions`);
    assert.equal(contract.finalStatus, 'accepted', `${row.englishRoute}: finalStatus`);
    if (contract.classification === 'notApplicable') {
      assert.equal(contract.englishOwner.actions.length, 0, `${row.englishRoute}: English owner has no action`);
      assert.match(contract.englishOwner.evidence, /no export, print, copy, image-download, or file-download/i);
      continue;
    }
    assert(contract.englishOwner.actions.length || contract.frenchOwner.actions.length, `${row.englishRoute}: action owner`);
    assert(contract.frenchOwner.formats.length, `${row.frenchRoute}: formats`);
    assert(contract.fixture.inputs.length, `${row.frenchRoute}: fixture inputs`);
    assert(contract.fixture.expectedResults.length, `${row.frenchRoute}: expected result fields/values`);
    const workflow = validateWorkflowReceipt({
      englishRoute: row.englishRoute,
      fixture: contract.fixture
    });
    assert.equal(workflow.passed, true, `${row.frenchRoute}: ${workflow.errors.join('; ')}`);
    const passedFormats = new Set(contract.oracles.filter((oracle) => oracle.passed).map((oracle) => oracle.format));
    for (const format of contract.frenchOwner.formats) {
      assert(passedFormats.has(format), `${row.frenchRoute}: missing ${format} parser/oracle`);
    }
    assert.equal(contract.privacyGate.fixtureValueNetworkLeak, false, `${row.frenchRoute}: fixture network leak`);
    assert.equal(contract.privacyGate.accountOrEmailGate, false, `${row.frenchRoute}: gate`);
  }
});

test('workflow contracts reject static title results and signup controls', () => {
  const titleOnly = validateWorkflowReceipt({
    englishRoute: '/algeria/dz-paye',
    fixture: {
      strategy: 'synthetic-calculation',
      inputs: [{ label: 'Salaire brut', value: '500000' }],
      workflowControl: 'Calculer mon salaire net',
      workflowControlSelector: '.calc-btn',
      workflowOwnerSelector: '#inputCard',
      workflowControlOwnedByCalculator: true,
      interactionType: 'click',
      pageTitle: 'Calculateur de salaire net Algérie 2026',
      pageHeading: 'Calculateur de salaire net Algérie 2026',
      beforeResults: [{
        selector: 'h1',
        sourceKind: 'heading',
        label: 'Résultat affiché',
        value: 'Calculateur de salaire net Algérie 2026'
      }],
      afterResults: [{
        selector: 'h1',
        sourceKind: 'heading',
        label: 'Résultat affiché',
        value: 'Calculateur de salaire net Algérie 2026'
      }],
      expectedResults: [{
        selector: 'h1',
        sourceKind: 'heading',
        label: 'Résultat affiché',
        value: 'Calculateur de salaire net Algérie 2026'
      }],
      resultMutation: { baselineCaptured: true, changedSelectors: [], passed: false }
    }
  });
  assert.equal(titleOnly.passed, false);
  assert.match(titleOnly.errors.join(' | '), /result-region mutation|forbidden result selector|title or heading|static pre-interaction/i);

  const signupControl = validateWorkflowReceipt({
    englishRoute: '/tools/staff-cost',
    fixture: {
      strategy: 'synthetic-calculation',
      inputs: [{ label: 'Salaire', value: '500000' }],
      workflowControl: "M'inscrire →",
      workflowControlSelector: '#signup',
      workflowOwnerSelector: '#lead-form',
      workflowControlOwnedByCalculator: false,
      interactionType: 'click',
      beforeResults: [{ selector: '#result', sourceKind: 'id-result', value: '0' }],
      afterResults: [{ selector: '#result', sourceKind: 'id-result', value: '500000' }],
      expectedResults: [{ selector: '#result', sourceKind: 'id-result', value: '500000' }],
      resultMutation: { baselineCaptured: true, changedSelectors: ['#result'], passed: true }
    }
  });
  assert.equal(signupControl.passed, false);
  assert.equal(isForbiddenWorkflowControl("M'inscrire →"), true);
  assert.match(signupControl.errors.join(' | '), /forbidden calculation workflow control|not owned/i);
});

test('source French AI route builder discovers all 132 finance owners', () => {
  const routeData = buildFrenchAiRouteMap();
  const exceptions = new Map((overrides.intentionalCanonicalExceptions || [])
    .map((item) => [normalizeRoute(item.englishRoute), normalizeRoute(item.aiFrenchRoute)]));

  assert.equal(routeData.report.financeOverrideRoutes, 2);
  assert.equal(aiEval.count, 132);
  assert.equal(aiEval.cases.length, 132);

  for (const item of aiEval.cases) {
    const englishRoute = normalizeRoute(item.englishRoute);
    const expected = routeData.routes[englishRoute];
    assert(expected, `missing AI route for ${englishRoute}`);
    assert(routeExists(expected), `missing AI destination ${expected}`);
    const exception = exceptions.get(normalizeRoute(englishRoute));
    if (exception) {
      assert.equal(normalizeRoute(expected), exception, englishRoute);
      assert.equal(item.intentionalException, true, englishRoute);
    } else {
      assert.equal(normalizeRoute(expected), normalizeRoute(item.inventoryPrimaryFrenchRoute), englishRoute);
      assert.equal(item.intentionalException, false, englishRoute);
    }
  }
  assert.equal(aiEval.cases.filter((item) => item.intentionalException).length, 2);
});

test('French finance hub consumes the exact scoped manifest', () => {
  const html = fs.readFileSync(path.join(ROOT, 'fr', 'salary-tax', 'index.html'), 'utf8');
  assert.match(html, /fetch\(["']\/data\/registry\/french-finance-tax-market-data\.json["']/);
  assert.match(html, /manifest\.count !== 132/);
  assert.match(html, /"leave-calculator": "\/fr\/tools\/calculateur-conges-pto\/"/);
  assert.match(html, /"pension-proj": "\/fr\/tools\/projection-pension-simple\/"/);
  assert.doesNotMatch(html, /"leave-calculator": "\/fr\/tools\/calculateur-conges\/"/);
});
