#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const builder = require('../scripts/build-ai-tool-context.js');
const generated = require('../netlify/functions/_shared/ai-tool-context.generated.js');
const advisor = require('../netlify/functions/ai-advisor.js');
const formulaRegistry = require('../data/calculation-quality/formula-registry.json');
const fuelSnapshot = require('../data/fuel/latest.json');
const forexSnapshot = require('../data/forex/latest.json');
const remittanceEngine = require('../assets/js/engines/remittance-v2.js');

const formulaById = new Map(formulaRegistry.formulas.map(function (formula) {
  return [formula.id, formula];
}));

function assertGeneratedContextIsCurrent(key, candidate, freshlyBuilt) {
  assert.strictEqual(
    candidate,
    freshlyBuilt.contexts[key],
    key + ' AI context drifted from its engine, formula registry, or data snapshot; run npm run ai:tool-context'
  );
}

function run() {
  const freshlyBuilt = builder.buildAll();
  assert.deepStrictEqual(freshlyBuilt.summary, {
    total: 500,
    sourceCoupled: 213,
    unverifiedStatic: 287,
  });
  assert.strictEqual(Object.keys(generated).length, freshlyBuilt.summary.total);

  const representativeKeys = ['ng-paye', 'ke-paye', 'ke-vat', 'bj-vat', 'km-vat', 'cg-vat', 'ci-vat', 'dj-vat', 'cd-vat', 'gq-vat', 'et-vat', 'sz-vat', 'ga-vat', 'gm-vat', 'gn-vat', 'gw-vat', 'salary-compare', 'salary-intelligence', 'retirement-planner', 'za-uif', 'employee-cost', 'contractor-vs-employee', 'domestic-worker', 'gratuity-calculator', 'maternity-leave', 'retrenchment-calculator', 'staff-cost', 'pension-proj', 'crypto-cgt', 'currency-converter', 'fuel-cost', 'route-fares', 'backup-power-costs', 'afrorates', 'remittance-v2'];
  representativeKeys.forEach(function (key) {
    assertGeneratedContextIsCurrent(key, generated[key], freshlyBuilt);
    const record = freshlyBuilt.records[key];
    assert.strictEqual(record.definition.status, 'source-coupled');
    assert.ok(record.sourceRecord.facts.sourceLabel, key + ' needs a source label');
    assert.ok(record.sourceRecord.facts.asOf, key + ' needs an as-of date');
    assert.ok(generated[key].includes('Source: ' + record.sourceRecord.facts.sourceLabel));
    assert.ok(
      generated[key].includes('As of: ' + record.sourceRecord.facts.asOf)
      || generated[key].includes('Reviewed: ' + record.sourceRecord.facts.asOf),
      key + ' needs its source freshness date in generated context'
    );
  });

  // PAYE facts are derived from the executable engine and reconciled with the
  // formula registry's version/source metadata.
  ['ng-paye', 'ke-paye'].forEach(function (key) {
    const facts = freshlyBuilt.records[key].sourceRecord.facts;
    const formula = formulaById.get(facts.formulaId);
    assert.strictEqual(facts.formulaVersion, formula.formulaVersion);
    assert.strictEqual(facts.sourceCheckedOn, formula.lastVerified);
    facts.bands.forEach(function (band) {
      assert.ok(generated[key].includes(String(band.rate * 100) + '%'));
    });
  });

  // VAT rate comes from the formula-owned executable artifact, while the
  // formula record supplies the version, source, and review date.
  {
    const facts = freshlyBuilt.records['ke-vat'].sourceRecord.facts;
    const formula = formulaById.get('route-ke-vat');
    assert.strictEqual(facts.formulaVersion, formula.formulaVersion);
    assert.strictEqual(facts.asOf, formula.lastVerified);
    assert.ok(generated['ke-vat'].includes('standard rate ' + (facts.standardRate * 100) + '%'));
  }

  // Eritrea remains a historical, evidence-gated sales-tax reference. Its
  // structured context must never imply that a current VAT rate was found.
  ['er-vat', 'er-tva-fr', 'eritrea-kikokotoo-vat-sw'].forEach(function (key) {
    assertGeneratedContextIsCurrent(key, generated[key], freshlyBuilt);
    const facts = freshlyBuilt.records[key].sourceRecord.facts;
    assert.strictEqual(facts.standardRate, null);
    assert.strictEqual(facts.currentRateConfirmed, false);
    assert.strictEqual(facts.sourceAsOf, '2002-12-31');
    assert.ok(generated[key].includes('not current VAT facts'));
    assert.ok(generated[key].includes('does not establish current 2026 rates'));
  });

  // Snapshot-driven contexts must carry the current committed values rather
  // than the legacy numbers that used to live in ai-advisor.js.
  {
    const facts = freshlyBuilt.records['fuel-cost'].sourceRecord.facts;
    const nigeria = fuelSnapshot.countries.find(function (country) { return country.code === 'NG'; });
    const generatedNigeria = facts.countries.find(function (country) { return country.code === 'NG'; });
    assert.strictEqual(generatedNigeria.petrol, nigeria.petrol.price);
    assert.ok(generatedNigeria.sourceUrl);
    assert.strictEqual(facts.officialVerifiedCount, 0);
    assert.deepStrictEqual(facts.excluded.map(function (row) { return row.code; }), ['KE', 'ZA', 'GH']);
    ['fuel-tracker', 'suivi-carburant-fr'].forEach(function (key) {
      assertGeneratedContextIsCurrent(key, generated[key], freshlyBuilt);
      assert.ok(generated[key].includes('not official verification'));
      assert.ok(generated[key].includes('no greater than 45 days'));
    });
  }

  {
    const facts = freshlyBuilt.records['remittance-v2'].sourceRecord.facts;
    const ngn = facts.currencies.find(function (currency) { return currency.currency === 'NGN'; });
    assert.strictEqual(ngn.unitsPerUsd, forexSnapshot.rates.NGN);
    const fintech = facts.providers.find(function (provider) { return provider.key === 'fintech'; });
    assert.strictEqual(fintech.feeRate, remittanceEngine.PROVIDER_TYPES.fintech.defaultFeePct);
    assert.strictEqual(fintech.marginPercent, remittanceEngine.PROVIDER_TYPES.fintech.defaultMarginPct);
  }

  {
    const facts = freshlyBuilt.records['currency-converter'].sourceRecord.facts;
    assert.strictEqual(facts.dataset, 'forex');
    assert.strictEqual(facts.maxAgeDays, 7);
    assert.strictEqual(facts.executableQuote, false);
    assert.strictEqual(facts.asOf, forexSnapshot.timestamp);
    if (facts.snapshotAgeDays > facts.maxAgeDays) {
      assert.deepStrictEqual(facts.currencies, []);
      assert.ok(generated['currency-converter'].includes('Do not quote or infer a rate.'));
    }
    assert.ok(generated['currency-converter'].includes('Do not request or transmit the amount'));
  }

  {
    const facts = freshlyBuilt.records['km-vat'].sourceRecord.facts;
    assert.strictEqual(facts.formulaId, 'route-km-vat');
    assert.strictEqual(facts.standardRate, 0.1);
    assert.ok(facts.knownExclusions.some(function (value) { return /incoming-call termination/i.test(value); }));
    assert.ok(generated['km-vat'].includes('standard rate 10%'));
  }

  {
    assertGeneratedContextIsCurrent('investment-return', generated['investment-return'], freshlyBuilt);
    const record = freshlyBuilt.records['investment-return'];
    const facts = record.sourceRecord.facts;
    assert.strictEqual(record.definition.status, 'source-coupled');
    assert.strictEqual(facts.formulaId, 'route-investment-return');
    assert.deepStrictEqual(facts.parameters.contributionTiming, ['end', 'beginning']);
    assert.ok(generated['investment-return'].includes('exact real-return method'));
    assert.ok(generated['investment-return'].includes('Do not request or transmit the user\'s investment amounts'));
    assert.strictEqual(advisor.__test__.getToolContext('investment-return'), generated['investment-return']);
  }

  {
    const record = freshlyBuilt.records['employee-cost'];
    const facts = record.sourceRecord.facts;
    assert.strictEqual(facts.mode, 'manual_user_input');
    assert.strictEqual(facts.networkData, false);
    assert.strictEqual(facts.aiPrefill, false);
    assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
    assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
    assert.ok(generated['employee-cost'].includes('No salary, cost or source field is sent to AI.'));
    assert.ok(generated['employee-cost'].includes('no AI prefill exists'));
  }

  {
    const record = freshlyBuilt.records['contractor-vs-employee'];
    const facts = record.sourceRecord.facts;
    assert.strictEqual(facts.mode, 'manual_user_input');
    assert.strictEqual(facts.networkData, false);
    assert.strictEqual(facts.aiPrefill, false);
    assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
    assert.strictEqual(facts.classificationVerdict, false);
    assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
    assert.ok(generated['contractor-vs-employee'].includes('No calculator or contract field is sent to AI.'));
    assert.ok(generated['contractor-vs-employee'].includes('Cost arithmetic never decides worker classification.'));
  }

  // Demonstrate that a stale numeric token is rejected by the same equality
  // assertion CI uses after any source or engine change.
  assert.throws(function () {
    assertGeneratedContextIsCurrent(
      'ng-paye',
      generated['ng-paye'].replace('15%', '14%'),
      freshlyBuilt
    );
  }, /AI context drifted/);

  Object.values(freshlyBuilt.records).forEach(function (record) {
    if (record.definition.status === 'source-coupled') {
      assert.ok(!/\d/.test(record.definition.staticText), record.definition.toolKey + ' has a hand-typed numeric fact');
    }
  });

  const advisorSource = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'ai-advisor.js'), 'utf8');
  assert.ok(!advisorSource.includes('const TOOL_CONTEXT = {'));
  assert.ok(advisorSource.includes("require('./_shared/ai-tool-context.generated.js')"));
  representativeKeys.forEach(function (key) {
    assert.strictEqual(advisor.__test__.getToolContext(key), generated[key]);
  });

  console.log('ai-tool-context-drift.test.js passed');
}

run();
