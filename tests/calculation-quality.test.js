'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const quality = require('../scripts/lib/calculation-quality');

function test(name, fn) {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

const artifacts = quality.loadQualityArtifacts(ROOT);

test('calculation quality JSON schema exposes all protected contracts', function () {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/calculation-quality/calculation-quality.schema.json'), 'utf8'));
  for (const definition of ['EngineInventory', 'FormulaRegistry', 'FormulaRecord', 'GoldenFixtureRegistry', 'ExternalDataRegistry', 'FixtureDeltaRegistry']) {
    assert.ok(schema.$defs[definition], 'missing schema definition ' + definition);
  }
  for (const field of ['jurisdictions', 'applicablePopulation', 'sources', 'effectiveFrom', 'effectiveTo', 'parameters', 'rounding', 'currency', 'units', 'knownExclusions', 'lastVerified', 'owner', 'disclaimer']) {
    assert.ok(schema.$defs.FormulaRecord.required.includes(field), 'FormulaRecord should require ' + field);
  }
});

test('engine inventory covers every configured engine artifact exactly once', function () {
  const discovered = quality.discoverEngineArtifacts(ROOT);
  const inventoryPaths = artifacts.inventory.engines.map((entry) => entry.artifactPath);
  assert.deepStrictEqual(inventoryPaths.slice().sort(), discovered.slice().sort());
  assert.strictEqual(new Set(inventoryPaths).size, inventoryPaths.length);

  const domains = new Set(artifacts.inventory.engines.map((entry) => entry.riskDomain));
  for (const domain of quality.RISK_DOMAINS) assert.ok(domains.has(domain), 'missing risk domain ' + domain);
});

test('high and medium risk engines have complete versioned formula metadata', function () {
  const formulas = new Map(artifacts.formulas.formulas.map((formula) => [formula.id, formula]));
  for (const engine of artifacts.inventory.engines.filter((entry) => entry.riskLevel !== 'low')) {
    assert.ok(engine.formulaIds.length, engine.id + ' needs formula ids');
    for (const formulaId of engine.formulaIds) {
      const formula = formulas.get(formulaId);
      assert.ok(formula, engine.id + ' missing formula ' + formulaId);
      quality.assertFormulaMetadata(formula, engine, ROOT);
    }
  }
});

test('legacy HTML formula digests ignore presentation-only disclosure state', function () {
  const egyptRoute = artifacts.formulas.formulas.find((formula) => formula.id === 'route-eg-paye');
  assert.ok(egyptRoute, 'missing protected Egypt PAYE route formula');
  assert.strictEqual(quality.digestFile(ROOT, egyptRoute.artifactPath), egyptRoute.artifactDigest);
});

test('all high-risk PAYE and VAT routes map to one formula and external source', function () {
  const verification = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-verification.json'), 'utf8'));
  const result = quality.checkHighRiskRouteTraceability(verification, artifacts.formulas);
  assert.strictEqual(result.protectedRoutes, 119);
  assert.strictEqual(result.mappedRoutes, result.protectedRoutes);
  assert.deepStrictEqual(result.gaps, []);
});

test('formula resolver never falls back across jurisdiction or effective dates', function () {
  const unknown = quality.resolveFormula(artifacts.formulas, {
    formulaFamily: 'paye-server', jurisdiction: 'XX', effectiveOn: '2026-01-01'
  });
  assert.deepStrictEqual(unknown, {
    ok: false,
    error: 'UNSUPPORTED_JURISDICTION',
    formulaFamily: 'paye-server',
    jurisdiction: 'XX',
    effectiveOn: '2026-01-01'
  });

  const expired = quality.resolveFormula(artifacts.formulas, {
    formulaFamily: 'paye-server', jurisdiction: 'ZA', effectiveOn: '2026-03-01'
  });
  assert.strictEqual(expired.ok, false);
  assert.strictEqual(expired.error, 'UNSUPPORTED_DATE');

  const leapDay = quality.resolveFormula(artifacts.formulas, {
    formulaFamily: 'paye-server', jurisdiction: 'ZA', effectiveOn: '2024-02-29'
  });
  assert.strictEqual(leapDay.ok, false);
  assert.strictEqual(leapDay.error, 'UNSUPPORTED_DATE');

  const engineRegistry = require('../netlify/functions/_engines');
  const engineRegistrySource = fs.readFileSync(path.join(ROOT, 'netlify/functions/_engines/index.js'), 'utf8');
  assert.match(engineRegistrySource, /require\('\.\.\/\.\.\/\.\.\/data\/calculation-quality\/formula-registry\.json'\)/, 'deployed functions must bundle formula metadata');
  const unknownEngine = engineRegistry.resolve('XX', '2026-01-01');
  assert.strictEqual(unknownEngine.ok, false);
  assert.strictEqual(unknownEngine.error, 'UNSUPPORTED_JURISDICTION');
  const expiredEngine = engineRegistry.resolve('ZA', '2026-03-01');
  assert.strictEqual(expiredEngine.ok, false);
  assert.strictEqual(expiredEngine.error, 'UNSUPPORTED_DATE');
  const tracedResult = engineRegistry.get('NG').calculate({ grossAnnual: 1000000 });
  assert.match(tracedResult.meta.formulaVersion, /\+sha256\.[a-f0-9]{12}$/);
  assert.strictEqual(tracedResult.meta.formulaId, 'paye-server-ng');
  assert.ok(tracedResult.meta.sourceReferences.length);
  for (const code of engineRegistry.listCountryCodes()) {
    const formula = engineRegistry.getFormula(code);
    assert.ok(formula, code + ' should expose formula metadata');
    assert.match(formula.formulaVersion, /\+sha256\.[a-f0-9]{12}$/);
    const result = engineRegistry.get(code).calculate({ grossAnnual: 1000000 });
    assert.strictEqual(result.meta.formulaId, formula.formulaId, code + ' result should be traceable');
    assert.strictEqual(result.meta.formulaVersion, formula.formulaVersion, code + ' result should expose the registered version');
    assert.ok(result.meta.sourceReferences.length, code + ' result should expose sources');
  }
});

test('golden fixtures cover required boundary classes and current results', function () {
  const classes = new Set(artifacts.fixtures.fixtures.flatMap((fixture) => fixture.caseClasses));
  for (const required of quality.REQUIRED_FIXTURE_CLASSES) {
    assert.ok(classes.has(required), 'missing fixture class ' + required);
  }

  const run = quality.runGoldenFixtures(artifacts, ROOT);
  assert.strictEqual(run.failed, 0, JSON.stringify(run.failures, null, 2));
  assert.ok(run.total >= 53 * 3, 'expected at least three PAYE fixtures per server engine');
  assert.deepStrictEqual(run.changes, []);
});

test('external data contracts reject incompatible payloads and expose staleness', function () {
  const forex = artifacts.externalData.datasets.find((entry) => entry.storageKey === 'forex-latest');
  assert.ok(forex);

  const incompatible = quality.validateExternalData(forex, { timestamp: '2026-07-12T00:00:00Z', rates: {} }, '2026-07-12T00:00:00Z');
  assert.strictEqual(incompatible.valid, false);
  assert.strictEqual(incompatible.code, 'INCOMPATIBLE_EXTERNAL_DATA');
  assert.strictEqual(incompatible.preserveLastKnownGood, true);

  const stalePayload = {
    schemaVersion: forex.schemaVersion,
    timestamp: '2026-01-01T00:00:00Z',
    source: 'test-source',
    base: 'USD',
    rates: { NGN: 1500 }
  };
  const stale = quality.validateExternalData(forex, stalePayload, '2026-07-12T00:00:00Z');
  assert.strictEqual(stale.valid, true);
  assert.strictEqual(stale.code, 'STALE_EXTERNAL_DATA');
  assert.strictEqual(stale.publicState, 'stale');
  assert.doesNotMatch(stale.publicLabel, /\blive\b|\bcurrent\b|official verified/i);
});

test('protected live-data keys are validated before persistence', function () {
  const dataStore = require('../netlify/functions/_shared/data-store');
  assert.strictEqual(typeof dataStore.validateDataForKey, 'function');
  const invalid = dataStore.validateDataForKey('rates-latest', { timestamp: 'bad', countries: [] }, '2026-07-12T00:00:00Z');
  assert.strictEqual(invalid.valid, false);
  assert.strictEqual(invalid.preserveLastKnownGood, true);

  const source = fs.readFileSync(path.join(ROOT, 'netlify/functions/_shared/data-store.js'), 'utf8');
  assert.ok(source.indexOf('validateDataForKey(key, data') < source.indexOf("fetch(SUPABASE_URL + '/rest/v1/live_data_store?on_conflict=key'"), 'validation must occur before persistence');
  const contractSource = fs.readFileSync(path.join(ROOT, 'netlify/functions/_shared/live-data-contracts.js'), 'utf8');
  assert.match(contractSource, /require\('\.\.\/\.\.\/\.\.\/data\/calculation-quality\/external-data-contracts\.json'\)/, 'deployed functions must bundle compatibility contracts');
  assert.match(fs.readFileSync(path.join(ROOT, 'netlify/functions/scheduled-fetch-forex-rates.js'), 'utf8'), /schemaVersion:\s*1/);
  assert.match(fs.readFileSync(path.join(ROOT, 'netlify/functions/scheduled-fetch-fuel-prices.js'), 'utf8'), /schemaVersion:\s*1/);
  assert.match(fs.readFileSync(path.join(ROOT, 'netlify/functions/scheduled-fetch-central-bank-rates.js'), 'utf8'), /data\.schemaVersion\s*=\s*1/);
});

test('formula update workflow requires provenance, fixture deltas, and owner review', function () {
  const builder = fs.readFileSync(path.join(ROOT, 'scripts/build-calculation-quality.js'), 'utf8');
  const codeowners = fs.readFileSync(path.join(ROOT, '.github/CODEOWNERS'), 'utf8');
  const pullRequestTemplate = fs.readFileSync(path.join(ROOT, '.github/pull_request_template.md'), 'utf8');
  assert.match(builder, /--accept-formula-change/);
  assert.match(builder, /--review-file=/);
  assert.match(builder, /fixtureDeltas/);
  assert.match(codeowners, /netlify\/functions\/_engines/);
  assert.match(codeowners, /assets\/js\/engines/);
  assert.match(pullRequestTemplate, /Formula \/ Jurisdiction Review/);
  assert.match(pullRequestTemplate, /calculation-quality:check/);
});

test('formula country, currency, route, and source jurisdictions agree', function () {
  const result = quality.checkCountryIdentity(artifacts, ROOT);
  assert.deepStrictEqual(result.errors, []);
  assert.ok(result.checked > 0);
  assert.ok(artifacts.formulas.routeMappings.length > 0);
});

test('quality report is deterministic for an explicit as-of date', function () {
  const first = quality.generateQualityReport(artifacts, ROOT, '2026-07-12');
  const second = quality.generateQualityReport(artifacts, ROOT, '2026-07-12');
  assert.strictEqual(JSON.stringify(first), JSON.stringify(second));
  assert.strictEqual(first.findings.filter((finding) => finding.severity === 'error').length, 0);
  assert.strictEqual(first.fixtures.failed, 0);
  assert.deepStrictEqual(first.fixtures.changes, []);
  assert.strictEqual(first.reviewBacklog.highRiskSources, 0, 'every high-risk formula must have a reviewed source');
  assert.ok(first.reviewBacklog.highRiskEffectiveDates > 0, 'unknown legacy effective dates must remain visible');
});

console.log('Calculation quality system tests passed.');
