'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-financial-shard-b-manifest.json');
const RECEIPT = path.join(ROOT, 'reports/swahili-financial-shard-b-candidate-receipt.json');
const ARTWORK = path.join(ROOT, 'reports/swahili-financial-shard-b-missing-artwork.json');
const nigeriaCit = require('../assets/js/engines/ng-cit.js');
const nigeriaWht = require('../assets/js/engines/ng-wht.js');
const southAfricaCgt = require('../assets/js/engines/za-cgt.js');
const southAfricaDividendTax = require('../assets/js/engines/za-dividend-tax.js');
const southAfricaGepf = require('../engines/src/za-gepf-engine.js');
const southAfricaTransferDuty = require('../engines/src/za-transfer-duty-engine.js');

const EXPECTED_IDS = [
  'lr-paye', 'ly-paye', 'ma-paye', 'mg-paye', 'microfinance-calc',
  'mortgage-affordability', 'mortgage-calculator', 'mr-paye', 'mz-paye', 'na-paye',
  'ng-cgt', 'ng-cit', 'ng-land-use', 'ng-paye', 'ng-pension', 'ng-wht',
  'paye-calculator', 'payslip-generator', 'pension-proj', 'pension-projection',
  'property-roi', 'property-transfer-cost', 'rent-vs-buy', 'retirement-planner',
  'route-fares', 'salary-compare', 'salary-intelligence', 'sars-efiling', 'sd-paye',
  'side-hustle-tax', 'sl-paye', 'so-paye', 'ss-paye', 'st-paye', 'staff-cost',
  'startup-valuation', 'student-loan', 'tg-paye', 'tn-paye', 'transfer-pricing',
  'za-cgt', 'za-dividend-tax', 'za-gepf', 'za-paye', 'za-transfer-duty', 'za-uif',
];

const ACCEPTED_IDS = [
  'lr-paye', 'microfinance-calc', 'mortgage-affordability', 'mortgage-calculator',
  'mr-paye', 'ng-cgt', 'ng-cit', 'ng-wht', 'payslip-generator', 'pension-proj', 'property-roi', 'property-transfer-cost', 'rent-vs-buy',
  'retirement-planner', 'route-fares', 'salary-compare', 'salary-intelligence', 'side-hustle-tax', 'so-paye', 'ss-paye',
  'st-paye', 'staff-cost', 'startup-valuation', 'student-loan', 'tg-paye', 'transfer-pricing', 'za-cgt', 'za-dividend-tax', 'za-gepf', 'za-transfer-duty',
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('shard B is the exact non-overlapping 46-row slice', () => {
  const manifest = readJson(MANIFEST);
  assert.equal(manifest.baseSha, '6edacda8437e1fa9b9e5a512138cbdd3169e38be');
  assert.deepEqual(manifest.derivation.positions, [47, 92]);
  assert.equal(manifest.derivation.totalUnacceptedFinancialRows, 92);
  assert.equal(manifest.derivation.shardACount, 46);
  assert.equal(manifest.derivation.shardBCount, 46);
  assert.deepEqual(manifest.derivation.overlapWithShardA, []);
  assert.equal(manifest.derivation.shardALastEnglishId, 'loan-compare');
  assert.deepEqual(manifest.rows.map((row) => row.position), Array.from({ length: 46 }, (_, index) => index + 47));
  assert.deepEqual(manifest.rows.map((row) => row.englishId), EXPECTED_IDS);
});

test('acceptance is fail-closed per English ID and every accepted check has concrete proof', () => {
  const receipt = readJson(RECEIPT);
  assert.equal(receipt.denominator, 46);
  assert.equal(receipt.accepted, 30);
  assert.equal(receipt.blocked, 16);
  assert.equal(receipt.coordinatorOwnedFilesEdited, false);
  assert.deepEqual(receipt.rows.filter((row) => row.status === 'accepted').map((row) => row.englishId), ACCEPTED_IDS);

  for (const row of receipt.rows) {
    if (row.status === 'blocked') {
      assert.ok(row.blocker, `${row.englishId} must carry an exact blocker`);
      assert.equal(row.proof, null);
      continue;
    }
    assert.ok(row.swahiliFile && fs.existsSync(path.join(ROOT, row.swahiliFile)), `${row.englishId} route missing`);
    assert.ok(row.sourceOwner.length > 0, `${row.englishId} source owner missing`);
    assert.ok(Object.values(row.proof.checks).every(Boolean), `${row.englishId} has a failed static check`);
    for (const proofFile of row.proof.existingOracleAndWorkflowSuites) {
      assert.ok(fs.existsSync(path.join(ROOT, proofFile)), `${row.englishId} proof missing: ${proofFile}`);
    }
  }
});

test('missing-artwork queue is explicit and limited to the blocked SARS eFiling row', () => {
  const queue = readJson(ARTWORK);
  assert.equal(queue.missingCount, 1);
  assert.deepEqual(queue.rows, [{
    englishId: 'sars-efiling',
    expectedArtwork: 'assets/img/tools/sars-efiling.webp',
    status: 'missing',
  }]);
});

test('localized microfinance labels preserve shared engine enum values', () => {
  const html = fs.readFileSync(path.join(ROOT, 'sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html'), 'utf8');
  assert.match(html, /<option value="annual">Kwa mwaka<\/option>/);
  assert.match(html, /<option value="monthly" selected>Kwa mwezi<\/option>/);
  assert.doesNotMatch(html, /value="kila (?:mwaka|mwezi)"/);
});

test('ng-cit Swahili parity preserves the reviewed source and DOM-free engine contract', () => {
  assert.deepEqual(nigeriaCit.formulaParameters, {
    effectiveFrom: '2026-01-01',
    smallTurnoverMaximum: 50000000,
    smallFixedAssetsMaximum: 250000000,
    citRate: 0.3,
    developmentLevyRate: 0.04,
    etrTurnoverReview: 20000000000,
    professionalServicesExcluded: true,
  });
  assert.deepEqual(
    nigeriaCit.calculate({
      turnover: 80000000,
      fixedAssets: 200000000,
      totalProfits: 7000000,
      assessableProfits: 10000000,
      professionalServices: false,
      mneGroup: false,
      scopeConfirmed: true,
    }),
    {
      regime: 'Nigeria Tax Act 2025 (from 1 January 2026)',
      classification: 'other',
      smallCompany: false,
      professionalServices: false,
      turnover: 80000000,
      fixedAssets: 200000000,
      totalProfits: 7000000,
      assessableProfits: 10000000,
      citRate: 0.3,
      developmentLevyRate: 0.04,
      cit: 2100000,
      developmentLevy: 400000,
      total: 2500000,
      etrReview: false,
      limitations: [
        'Resident ordinary company estimate only',
        'Excludes minimum effective tax top-up',
        'Excludes specialised sectors, incentives, losses and transition adjustments',
      ],
    },
  );

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['ng-cit'];
  assert.equal(verification.last_verified, '2026-08-08');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-cit-nigeria/'));
  assert.deepEqual(verification.source_urls, [
    'https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf',
    'https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/',
    'https://statehouse.gov.ng/new-tax-laws-will-commence-on-january-1-2026-as-planned/',
  ]);
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'nigeria-cit-2026-source');
  assert.equal(source.lastReviewedAt, '2026-08-08');
  assert.ok(source.toolIds.includes('ng-cit-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-cit-nigeria'));
});

test('ng-wht Swahili parity preserves the reviewed official Schedule and DOM-free engine contract', () => {
  const result = nigeriaWht.calculate({
    transactionType: 'professional',
    recipientClass: 'corporate',
    residency: 'resident',
    grossAmount: 5000000,
    transactionDate: '2026-08-08',
    taxIdAvailable: true,
    treatment: 'schedule',
    documentationConfirmed: false,
    treatyRatePercent: 0,
    scopeConfirmed: true,
  });
  assert.equal(result.scheduleRatePercent, 5);
  assert.equal(result.appliedRatePercent, 5);
  assert.equal(result.deduction, 250000);
  assert.equal(result.netPayment, 4750000);

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['ng-wht'];
  assert.equal(verification.last_verified, '2026-08-08');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-wht-nigeria/'));
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'nigeria-wht-2026-source');
  assert.equal(source.lastReviewedAt, '2026-08-08');
  assert.ok(source.toolIds.includes('ng-wht-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-wht-nigeria'));
});

test('za-cgt Swahili parity preserves the reviewed SARS 2027 DOM-free engine contract', () => {
  const result = southAfricaCgt.calculate({
    taxpayerType: 'individual',
    disposalDate: '2026-08-08',
    assetType: 'general',
    proceeds: 2500000,
    acquisitionCost: 1500000,
    acquisitionCosts: 0,
    improvementCosts: 200000,
    disposalCosts: 50000,
    otherCapitalGains: 0,
    currentCapitalLosses: 0,
    assessedCapitalLoss: 0,
    otherTaxableIncome: 500000,
    residenceEligible: false,
    qualifyingResidencePercent: 100,
    ownershipPercent: 100,
    scopeConfirmed: true,
  });
  assert.equal(result.transactionAmount, 750000);
  assert.equal(result.netCapitalGain, 700000);
  assert.equal(result.taxableCapitalGain, 280000);
  assert.equal(result.tax, 101816);

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['za-cgt'];
  assert.equal(verification.last_verified, '2026-08-08');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-cgt-afrika-kusini/'));
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'south-africa-cgt-2027-source');
  assert.equal(source.lastReviewedAt, '2026-08-08');
  assert.ok(source.toolIds.includes('za-cgt-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-cgt-afrika-kusini'));
});

test('za-dividend-tax Swahili parity preserves the reviewed SARS DOM-free engine contract', () => {
  const standard = southAfricaDividendTax.calculate({
    grossDividend: 100000, paymentCount: 2, paymentDate: '2026-08-08', treatment: 'standard',
    reducedRatePercent: 15, documentationConfirmed: false, scopeConfirmed: true,
  });
  assert.equal(standard.rate, 0.2);
  assert.equal(standard.taxPerPayment, 20000);
  assert.equal(standard.scenarioTax, 40000);
  assert.equal(standard.indicativeRemittanceDate, '2026-09-30');
  const reduced = southAfricaDividendTax.calculate({
    grossDividend: 100000, paymentCount: 1, paymentDate: '2026-08-08', treatment: 'reduced',
    reducedRatePercent: 7.5, documentationConfirmed: true, scopeConfirmed: true,
  });
  assert.equal(reduced.taxPerPayment, 7500);
  assert.throws(() => southAfricaDividendTax.calculate({
    grossDividend: 100000, paymentCount: 1, paymentDate: '2026-08-08', treatment: 'exempt',
    reducedRatePercent: 0, documentationConfirmed: false, scopeConfirmed: true,
  }), /documentation confirmation/);

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['za-dividend-tax'];
  assert.equal(verification.last_verified, '2026-08-08');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-kodi-gawio-afrika-kusini/'));
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'south-africa-dividends-tax-source');
  assert.equal(source.lastReviewedAt, '2026-08-08');
  assert.ok(source.toolIds.includes('za-dividend-tax-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-kodi-gawio-afrika-kusini'));
});

test('za-gepf Swahili parity preserves the reviewed GEPF shared-engine contract', () => {
  const result = southAfricaGepf.calculate({ finalAnnualSalary: 300000, vestedService: 25, savingsService: 0.667, retirementService: 1.333, retirementAge: 60, earlyBasis: 'standard', employerType: 'other' });
  assert.equal(result.ok, true);
  assert.equal(result.gratuityEstimate, 550523.25);
  assert.equal(result.annualAnnuityEstimate, 146951.26);
  assert.equal(result.monthlyAnnuityEstimate, 12245.94);
  assert.equal(result.memberMonthlyContribution, 1875);
  assert.equal(result.employerMonthlyContribution, 3250);
  assert.equal(southAfricaGepf.calculate({ finalAnnualSalary: 300000, vestedService: 8, savingsService: 0.3, retirementService: 0.6, retirementAge: 60 }).error, 'under_ten_vested');

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['za-gepf'];
  assert.equal(verification.last_verified, '2026-08-08');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-gepf-afrika-kusini/'));
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'south-africa-gepf-source');
  assert.equal(source.lastReviewedAt, '2026-08-08');
  assert.ok(source.toolIds.includes('za-gepf-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-gepf-afrika-kusini'));
});

test('za-transfer-duty Swahili parity preserves the reviewed SARS shared-engine contract', () => {
  assert.equal(southAfricaTransferDuty.RULES.effectiveFrom, '2026-04-01');
  assert.equal(southAfricaTransferDuty.RULES.verifiedThrough, '2026-08-09');
  assert.deepEqual(southAfricaTransferDuty.RULES.brackets.map((row) => [row.upper, row.rate, row.base, row.offset]), [
    [1210000, 0, 0, 0],
    [1663800, 0.03, 0, 1210000],
    [2329300, 0.06, 13614, 1663800],
    [2994800, 0.08, 53544, 2329300],
    [13310000, 0.11, 106784, 2994800],
    [Infinity, 0.13, 1241456, 13310000],
  ]);
  const result = southAfricaTransferDuty.calculate({ consideration: 2000000, otherConsideration: 100000, fairValue: 2200000, agreementDate: '2026-08-09', vatStatus: 'not-vat' });
  assert.equal(result.ok, true);
  assert.equal(result.totalConsideration, 2100000);
  assert.equal(result.taxableBasis, 2200000);
  assert.equal(result.duty, 45786);
  assert.equal(southAfricaTransferDuty.calculate({ consideration: 2000000, otherConsideration: 100000, fairValue: 2200000, agreementDate: '2026-08-09', vatStatus: 'vat' }).duty, 0);
  assert.equal(southAfricaTransferDuty.calculate({ consideration: 2000000, agreementDate: '2026-03-31', vatStatus: 'not-vat' }).error, 'unsupported_date');

  const verification = readJson(path.join(ROOT, 'data/tool-verification.json')).tools['za-transfer-duty'];
  assert.equal(verification.last_verified, '2026-08-09');
  assert.ok(verification.routes.includes('/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/'));
  const source = readJson(path.join(ROOT, 'data/source-registry.json')).sources.find((row) => row.id === 'south-africa-transfer-duty-source');
  assert.equal(source.lastReviewedAt, '2026-08-09');
  assert.ok(source.toolIds.includes('za-transfer-duty-sw-parity'));
  assert.ok(source.routes.includes('/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini'));
});
