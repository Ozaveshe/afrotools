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
    total: 356,
    sourceCoupled: 67,
    unverifiedStatic: 289,
  });
  assert.strictEqual(Object.keys(generated).length, freshlyBuilt.summary.total);

  const representativeKeys = ['ng-paye', 'ke-paye', 'ke-vat', 'fuel-cost', 'remittance-v2'];
  representativeKeys.forEach(function (key) {
    assertGeneratedContextIsCurrent(key, generated[key], freshlyBuilt);
    const record = freshlyBuilt.records[key];
    assert.strictEqual(record.definition.status, 'source-coupled');
    assert.ok(record.sourceRecord.facts.sourceLabel, key + ' needs a source label');
    assert.ok(record.sourceRecord.facts.asOf, key + ' needs an as-of date');
    assert.ok(generated[key].includes('Source: ' + record.sourceRecord.facts.sourceLabel));
    assert.ok(generated[key].includes('As of: ' + record.sourceRecord.facts.asOf));
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

  // Snapshot-driven contexts must carry the current committed values rather
  // than the legacy numbers that used to live in ai-advisor.js.
  {
    const facts = freshlyBuilt.records['fuel-cost'].sourceRecord.facts;
    const nigeria = fuelSnapshot.countries.find(function (country) { return country.code === 'NG'; });
    const generatedNigeria = facts.countries.find(function (country) { return country.code === 'NG'; });
    assert.strictEqual(generatedNigeria.petrol, nigeria.petrol.price);
    assert.strictEqual(generatedNigeria.diesel, nigeria.diesel.price);
  }

  {
    const facts = freshlyBuilt.records['remittance-v2'].sourceRecord.facts;
    const ngn = facts.currencies.find(function (currency) { return currency.currency === 'NGN'; });
    assert.strictEqual(ngn.unitsPerUsd, forexSnapshot.rates.NGN);
    const fintech = facts.providers.find(function (provider) { return provider.key === 'fintech'; });
    assert.strictEqual(fintech.feeRate, remittanceEngine.PROVIDER_TYPES.fintech.defaultFeePct);
    assert.strictEqual(fintech.marginPercent, remittanceEngine.PROVIDER_TYPES.fintech.defaultMarginPct);
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
