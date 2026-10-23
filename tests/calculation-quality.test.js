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

test('fixture history requires an exact source-reviewed delta', function () {
  const delta = { fixtureId: 'example', before: { tax: 1 }, after: { tax: 2 } };
  const review = { reviewedBy: 'test reviewer', reviewedAt: '2026-09-15', sourceUrl: 'https://example.org/source', reason: 'Reviewed rate change', fixtureDeltas: [delta] };
  assert.deepStrictEqual(quality.validateFixtureDeltaReviews([delta], [review]), [delta]);
  assert.throws(() => quality.validateFixtureDeltaReviews([delta], []), /matching source review/);
  assert.throws(() => quality.validateFixtureDeltaReviews([{ ...delta, after: { tax: 3 } }], [review]), /matching source review/);
});

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

test('maternity leave SEO presentation does not create protected formula drift', function () {
  const formula = artifacts.formulas.formulas.find((entry) => entry.id === 'route-maternity-leave');
  assert.ok(formula, 'missing protected maternity leave route formula');
  const source = fs.readFileSync(path.join(ROOT, formula.artifactPath), 'utf8');
  const seoVariant = source
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>Alternate reviewed search title</title>')
    .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, '<meta name="description" content="Alternate reviewed search description.">');
  assert.strictEqual(quality.digestHtmlFormulaSource(source), formula.artifactDigest);
  assert.strictEqual(quality.digestHtmlFormulaSource(seoVariant), formula.artifactDigest);
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(source.replace('verified-planner.js', 'verified-planner-v2.js')),
    formula.artifactDigest,
    'changing protected planner wiring must still change the route digest'
  );
});

test('HTML formula digests ignore reviewed presentation-asset cache versions only', function () {
  const formulaPage = (cacheVersion, rate) => [
    '<html><body><script>',
    'const rate = ' + rate + ';',
    'function calculate(amount) { return amount * rate; }',
    'const printable = \'<script defer src="/assets/js/lazy-analytics.js?v=' + cacheVersion + '"><\\/script>\';',
    '</script></body></html>'
  ].join('\n');
  const shellPage = (cacheVersion) =>
    '<html><body><script src="/assets/js/lazy-analytics.js?v=' + cacheVersion + '" defer></script></body></html>';

  assert.strictEqual(
    quality.digestHtmlFormulaSource(formulaPage('2cd970f9', '0.15')),
    quality.digestHtmlFormulaSource(formulaPage('630f8a7d', '0.15'))
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(formulaPage('11111111', '0.15')),
    quality.digestHtmlFormulaSource(formulaPage('11111111', '0.16'))
  );
  assert.strictEqual(
    quality.digestHtmlFormulaSource(shellPage('2cd970f9')),
    quality.digestHtmlFormulaSource(shellPage('630f8a7d'))
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(shellPage('630f8a7d')),
    quality.digestHtmlFormulaSource(shellPage('630f8a7d').replace('lazy-analytics.js', 'analytics.js'))
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(shellPage('630f8a7d')),
    quality.digestHtmlFormulaSource(shellPage('630f8a7d').replace('" defer>', '&mode=debug" defer>'))
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(shellPage('630f8a7d')),
    quality.digestHtmlFormulaSource('<html><body></body></html>')
  );

  for (const filename of ['related-tools.js', 'related-tools.min.js']) {
    const relatedToolsShell = (cacheVersion) =>
      '<html><body><script src="/assets/js/components/' + filename + '?v=' + cacheVersion + '" defer></script></body></html>';
    assert.strictEqual(
      quality.digestHtmlFormulaSource(relatedToolsShell('2cd970f9')),
      quality.digestHtmlFormulaSource(relatedToolsShell('630f8a7d'))
    );
    assert.notStrictEqual(
      quality.digestHtmlFormulaSource(relatedToolsShell('630f8a7d')),
      quality.digestHtmlFormulaSource(relatedToolsShell('630f8a7d').replace(filename, 'tool-registry.min.js'))
    );
  }

  const coreBundleShell = (cacheVersion) =>
    '<html><body><script src="/assets/js/bundles/core.' + cacheVersion + '.min.js" defer></script></body></html>';
  assert.strictEqual(
    quality.digestHtmlFormulaSource(coreBundleShell('53e2e483')),
    quality.digestHtmlFormulaSource(coreBundleShell('8401f4c6'))
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(coreBundleShell('8401f4c6')),
    quality.digestHtmlFormulaSource(coreBundleShell('8401f4c6').replace('/core.', '/tool-page.'))
  );
});

test('HTML formula digests ignore release decorations but retain route workflow changes', function () {
  const sourceOwned = '<!doctype html><html lang="sw" data-afrotools-source-owner="scripts/build-sw-itax-guide.js"><head>' +
    '<meta name="robots" content="index,follow">' +
    '<link rel="canonical" href="https://afrotools.com/sw/zana/mwongozo-wa-itax/">' +
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/itax-guide/">' +
    '<link rel="stylesheet" href="/assets/css/itax-guide-workspace.css">' +
    '</head><body><form data-itax-workspace><label>Kazi<select name="task">' +
    '<option value="return">Maandalizi ya return</option></select></label></form>' +
    '<script src="/engines/itax-guide-engine.js"></script>' +
    '<script src="/assets/js/pages/itax-guide-workspace.js"></script></body></html>';
  const releaseBuilt = sourceOwned
    .replace('<html ', '<html data-chat-bundle="/assets/js/bundles/chat.6886c889.min.js" ')
    .replace(
      '<link rel="canonical" href="https://afrotools.com/sw/zana/mwongozo-wa-itax/"><link rel="alternate" hreflang="en" href="https://afrotools.com/tools/itax-guide/">',
      '',
    )
    .replace(
      '</head>',
      '<link rel="canonical" href="https://afrotools.com/sw/zana/mwongozo-wa-itax/">\n' +
      '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/itax-guide/">\n</head>',
    )
    .replace(/(\/(?:assets|engines)\/[^"']+)(["'])/g, '$1?v=1234abcd$2')
    .replace(
      '</body>',
      '<script src="/assets/js/lib/sw-accessibility.js?v=2468ace0" defer></script>\n' +
      '<script src="/assets/js/lazy-analytics.js?v=8765dcba" defer></script>\n</body>',
    );

  assert.strictEqual(
    quality.digestHtmlFormulaSource(sourceOwned),
    quality.digestHtmlFormulaSource(releaseBuilt),
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(sourceOwned),
    quality.digestHtmlFormulaSource(releaseBuilt.replace('Maandalizi ya return', 'Maandalizi ya NIL return')),
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(sourceOwned),
    quality.digestHtmlFormulaSource(releaseBuilt.replace('itax-guide-engine.js', 'itax-guide-v2-engine.js')),
  );
  assert.notStrictEqual(
    quality.digestHtmlFormulaSource(sourceOwned),
    quality.digestHtmlFormulaSource(releaseBuilt.replace('/sw/zana/mwongozo-wa-itax/', '/sw/zana/njia-nyingine/')),
  );
});

test('all high-risk PAYE and VAT routes map to one formula and external source', function () {
  const verification = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-verification.json'), 'utf8'));
  const result = quality.checkHighRiskRouteTraceability(verification, artifacts.formulas);
  assert.ok(result.protectedRoutes >= 119, 'protected route coverage must not regress below the established baseline');
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

function withheldBFFixtures() {
  const policy = quality.readPayeAvailability(ROOT);
  return artifacts.fixtures.fixtures.filter((row) => row.formulaId === 'paye-server-bf').map((row) => ({
    ...row, operation: 'paye-withheld', expected: quality.payeWithheldExpected(policy), tolerance: 0,
    evidence: { registryId: null, title: policy.countries.BF.sourceLabel, url: null, kind: 'availability-hold', authorityStatus: 'review-required' },
    changeNote: 'availability-withheld-no-numeric-acceptance'
  }));
}

test('BF availability uses a typed exact noncalculable schema', function () {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/calculation-quality/calculation-quality.schema.json'), 'utf8'));
  assert.ok(schema.$defs.GoldenFixture.properties.operation.enum.includes('paye-withheld'));
  assert.strictEqual(schema.$defs.PayeWithheldExpected.additionalProperties, false);
  assert.strictEqual(schema.$defs.PayeWithheldExpected.properties.resolution.additionalProperties, false);
  const policy = quality.readPayeAvailability(ROOT);
  const expected = quality.payeWithheldExpected(policy);
  assert.deepStrictEqual(Object.keys(expected).sort(), schema.$defs.PayeWithheldExpected.required.slice().sort());
  assert.deepStrictEqual(Object.keys(expected.resolution).sort(), schema.$defs.PayeWithheldExpected.properties.resolution.required.slice().sort());
  for (const field of ['availability', 'calculable', 'reasonCode']) {
    assert.strictEqual(expected[field], schema.$defs.PayeWithheldExpected.properties[field].const);
  }
  for (const mutate of [p => { p.schemaVersion = 2; }, p => { p.countries.BF.status = 'available'; }, p => { p.countries.BF.reasonCode = 'OTHER'; }, p => { p.countries.NG = p.countries.BF; }]) {
    const bad = JSON.parse(JSON.stringify(policy)); mutate(bad);
    assert.throws(() => quality.payeWithheldExpected(bad), /Invalid explicit BF withheld policy/);
  }
});

test('BF public registry withholding rejects exposure and extra numeric results', function () {
  const policy = quality.readPayeAvailability(ROOT);
  const registry = require('../netlify/functions/_engines');
  assert.deepStrictEqual(quality.payeWithheldResult(registry, policy), quality.payeWithheldExpected(policy));
  let calculations = 0;
  const exposed = { ...registry, get: () => ({ calculate() { calculations += 1; return { tax: 0 }; } }) };
  assert.throws(() => quality.payeWithheldResult(exposed, policy), /remains exposed/);
  assert.strictEqual(calculations, 0, 'availability checks must never invoke a withheld engine');
  for (const overrides of [
    { getFormula: () => ({ formulaId: 'paye-server-bf' }) },
    { listCountryCodes: () => registry.listCountryCodes().concat('BF') },
    { listCountries: () => registry.listCountries().concat({ code: 'BF' }) },
  ]) assert.throws(() => quality.payeWithheldResult({ ...registry, ...overrides }, policy), /remains exposed/);
  for (const change of [{ ok: true }, { error: 'UNSUPPORTED_JURISDICTION' }, { jurisdiction: 'NG' }, { reasonCode: 'OTHER' }, { netAnnual: 0 }, { tax: undefined }]) {
    assert.throws(() => quality.payeWithheldResult({ ...registry, resolve: () => ({ ...registry.resolve('BF'), ...change }) }, policy), /resolution shape or reason/);
  }
});

test('BF withheld fixtures fail closed on malformed operation, expected shape or inputs', function () {
  const policy = quality.readPayeAvailability(ROOT);
  const runOne = (row) => quality.runGoldenFixtures({ ...artifacts, fixtures: { fixtures: [row] }, fixtureDeltas: { deltas: [] } }, ROOT);
  for (const row of withheldBFFixtures()) {
    quality.assertPayeWithheldFixture(row, policy);
    const valid = runOne(row);
    assert.strictEqual(valid.failed, 0);
    assert.deepStrictEqual(valid.passedByOperation, { payeNumeric: 0, withheldAvailability: 1, otherOperations: 0 });
    for (const change of [
      { operation: 'withheld-ish' }, { input: { ...row.input, grossAnnual: 1 } }, { tolerance: 0.01 },
      { expected: { ...row.expected, calculable: true } }, { expected: { ...row.expected, availability: 'available' } },
      { expected: { ...row.expected, reasonCode: 'OTHER' } }, { expected: { ...row.expected, netAnnual: 0 } },
      { expected: { ...row.expected, resolution: { ...row.expected.resolution, netTax: 0 } } },
      { evidence: { ...row.evidence, authorityStatus: 'official-verified' } },
    ]) assert.strictEqual(runOne({ ...row, ...change }).failed, 1, row.id + ' must reject ' + JSON.stringify(change));
  }
});

test('only the exact three historical BF numeric rows migrate to explicit withholding', function () {
  const policy = quality.readPayeAvailability(ROOT);
  const builder = require('../scripts/build-calculation-quality');
  // Retired historical oracles exist only to prove the narrow migration. They
  // are not accepted as current payroll results or authoritative examples.
  const historicalValues = {
    'paye-bf-zero': [0, 0, 0, 0],
    'paye-bf-defaults': [144400, 855600, 71300, 89400],
    'paye-bf-large-decimal': [291081400, 708918601, 59076550, 236081400],
  };
  const selectors = ['deductions.totalDeductions', 'result.netAnnual', 'result.netMonthly', 'tax.netTax'];
  const next = withheldBFFixtures();
  const previous = next.map((row) => ({ ...row, operation: 'paye-calculate', tolerance: 0.01,
    expected: Object.fromEntries(selectors.map((selector, index) => [selector, historicalValues[row.id][index]])),
    evidence: { authorityStatus: 'source-reviewed', kind: 'authority-link', registryId: null, title: 'Direction generale des impots - Burkina Faso', url: 'https://dgi.bf/' },
    changeNote: 'baseline-no-change' }));
  const registry = (rows) => ({ fixtures: rows });
  assert.deepStrictEqual(builder.preserveFixtureExpectations(registry(previous), registry(next), false), registry(next));
  for (let index = 0; index < next.length; index += 1) {
    assert.strictEqual(quality.isExplicitBFWithheldMigration(previous[index], next[index], policy), true);
    for (const change of [{ id: 'paye-ng-defaults' }, { formulaVersion: 'tampered' }, { input: { country: 'BF', grossAnnual: 1 } }, { expected: { 'tax.netTax': 0 } }]) {
      assert.strictEqual(quality.isExplicitBFWithheldMigration({ ...previous[index], ...change }, next[index], policy), false);
    }
  }
  const changed = { ...previous[0], expected: { ...previous[0].expected, 'tax.netTax': 1 } };
  const blocked = builder.preserveFixtureExpectations(registry([changed]), registry([next[0]]), false).fixtures[0];
  assert.deepStrictEqual(blocked.expected, changed.expected, 'an unreviewed historical oracle must not be silently replaced');
  assert.throws(() => quality.assertPayeWithheldFixture(blocked, policy), /Invalid BF withheld/);
  const ordinary = artifacts.fixtures.fixtures.find(row => row.formulaId === 'paye-server-ng' && row.operation === 'paye-calculate');
  const successor = { ...ordinary, expected: { changed: 1 }, formulaVersion: 'unreviewed', changeNote: 'unreviewed' };
  const preserved = builder.preserveFixtureExpectations(registry([ordinary]), registry([successor]), false).fixtures[0];
  for (const field of ['expected', 'formulaVersion', 'changeNote']) assert.deepStrictEqual(preserved[field], ordinary[field]);
});

test('golden fixtures cover required boundary classes and current results', function () {
  const classes = new Set(artifacts.fixtures.fixtures.flatMap((fixture) => fixture.caseClasses));
  for (const required of quality.REQUIRED_FIXTURE_CLASSES) {
    assert.ok(classes.has(required), 'missing fixture class ' + required);
  }

  const run = quality.runGoldenFixtures(artifacts, ROOT);
  assert.strictEqual(run.failed, 0, JSON.stringify(run.failures, null, 2));
  const available = require('../netlify/functions/_engines').listCountryCodes();
  assert.strictEqual(available.includes('BF'), false);
  const expectedAvailable = artifacts.formulas.formulas.filter(row => row.formulaFamily === 'paye-server')
    .flatMap(row => row.jurisdictions).filter(code => code !== 'BF').sort();
  assert.deepStrictEqual(available, expectedAvailable, 'every other configured public PAYE jurisdiction must remain available');
  for (const code of available) {
    for (const suffix of ['zero', 'defaults', 'large-decimal']) {
      const row = artifacts.fixtures.fixtures.find(item => item.id === 'paye-' + code.toLowerCase() + '-' + suffix);
      assert.ok(row && row.operation === 'paye-calculate', code + ' must retain each numeric boundary fixture');
    }
  }
  const withheld = artifacts.fixtures.fixtures.filter(row => row.operation === 'paye-withheld');
  assert.deepStrictEqual(withheld.map(row => row.id).sort(), ['paye-bf-defaults', 'paye-bf-large-decimal', 'paye-bf-zero']);
  const categories = {
    payeNumeric: artifacts.fixtures.fixtures.filter(row => row.operation === 'paye-calculate').length,
    withheldAvailability: 3,
    otherOperations: artifacts.fixtures.fixtures.filter(row => row.operation !== 'paye-calculate' && row.operation !== 'paye-withheld').length
  };
  assert.deepStrictEqual(run.passedByOperation, categories);
  assert.strictEqual(Object.values(categories).reduce((sum, count) => sum + count, 0), run.passed);
  for (const delta of artifacts.fixtureDeltas.deltas) {
    const fixture = artifacts.fixtures.fixtures.find((entry) => entry.id === delta.fixtureId);
    assert.ok(fixture, 'reviewed delta must identify a current fixture');
    assert.deepStrictEqual(fixture.expected, delta.after, 'reviewed result must match the current golden expectation');
  }
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

test('shared presentation cache hashes do not create protected formula drift', function () {
  const before = '<link rel="stylesheet" href="/assets/css/global.min.css?v=11111111">' +
    '<link rel="stylesheet" href="/assets/css/design-system.min.css?v=22222222">' +
    '<script src="/assets/js/components/related-tools.min.js?v=33333333"></script>';
  const after = '<link rel="stylesheet" href="/assets/css/global.min.css?v=aaaaaaaa">' +
    '<link rel="stylesheet" href="/assets/css/design-system.min.css?v=bbbbbbbb">' +
    '<script src="/assets/js/components/related-tools.min.js?v=cccccccc"></script>';
  assert.strictEqual(quality.digestHtmlFormulaSource(before), quality.digestHtmlFormulaSource(after));
});

test('shared page-refresh CSS cache changes preserve formulas and route protection', function () {
  const page = (hash, rate = '0.15') => '<script>const rate = ' + rate +
    '; const printHtml = \'<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=' + hash + '">\';</script>';
  const before = page('9ab47fa3');
  const after = page('f1530a1b');
  assert.strictEqual(quality.digestHtmlFormulaSource(before), quality.digestHtmlFormulaSource(after));
  for (const changed of [page('f1530a1b', '0.16'), after.replace('top-level-page-ui-refresh.css', 'calculator.css'), after.replace('f1530a1b', 'f1530a1b&mode=other')]) {
    assert.notStrictEqual(quality.digestHtmlFormulaSource(before), quality.digestHtmlFormulaSource(changed));
  }
});

test('typography token cache changes preserve reviewed digests without hiding calculator changes', function () {
  const page = (hash, rate = '0.15') => '<script>const rate = ' + rate +
    '; const printHtml = \'<link rel="stylesheet" href="/assets/css/tokens.min.css?v=' + hash + '">\';</script>';
  const before = page('f987f2a8');
  const after = page('7f33039a');
  assert.strictEqual(quality.digestHtmlFormulaSource(before), quality.digestHtmlFormulaSource(after));
  for (const changed of [page('7f33039a', '0.16'), after.replace('tokens.min.css', 'calculator.min.css'), after.replace('7f33039a', '7f33039a&mode=other')]) {
    assert.notStrictEqual(quality.digestHtmlFormulaSource(before), quality.digestHtmlFormulaSource(changed));
  }
  const shell = (hash) => '<link rel="stylesheet" href="/assets/css/tokens.min.css?v=' + hash + '">';
  assert.strictEqual(quality.digestHtmlFormulaSource(shell('f987f2a8')), quality.digestHtmlFormulaSource(shell('7f33039a')));
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
  assert.deepStrictEqual(first.fixtures.changes, [
    'business-roi-review-age-leap-next',
    'business-roi-review-age-leap-today',
    'business-roi-review-age-leap-year-boundary',
    'business-roi-review-age-march1-anniversary',
    'business-roi-review-age-ordinary-today',
    'business-roi-review-age-rolled-month',
    'business-roi-review-age-short-month',
    'business-roi-review-ics-en',
    'business-roi-review-ics-fr',
    'business-roi-review-ics-sw',
    'business-roi-review-time-cairo-gap',
    'business-roi-review-time-casablanca-gap',
    'business-roi-review-time-fold-earlier',
    'business-roi-review-time-fold-reject',
    'business-roi-review-time-invalid-calendar',
    'paye-gh-defaults',
    'paye-gh-large-decimal',
    'paye-ug-large-decimal',
    'paye-zm-defaults',
    'paye-zm-large-decimal'
  ]);
  const planningIds = ['formula-engines-morocco-paye', 'formula-engines-tunisia-paye', 'formula-assets-js-engines-ci-birth-leave', 'formula-assets-js-engines-senegal-child-leave', 'formula-assets-js-engines-ghana-maternity-leave'];
  for (const id of planningIds) {
    const formula = artifacts.formulas.formulas.find((item) => item.id === id);
    assert.strictEqual(formula.supportStatus, 'review-required');
    assert.match(formula.disclaimer, /assumptions|unconfirmed/);
  }
  const inflation = artifacts.formulas.formulas.find(item => item.id === 'formula-assets-js-lib-minimum-wage-inflation');
  assert.strictEqual(inflation.supportStatus, 'review-required');
  assert.strictEqual(inflation.effectiveDate, 'unknown');
  assert.match(inflation.verificationBasis, /CPI observations have no specified source/);
  assert.strictEqual(first.reviewBacklog.highRiskSources, planningIds.length + 1, 'documented legal and CPI source uncertainties remain visible');
  assert.ok(first.reviewBacklog.highRiskEffectiveDates > 0, 'unknown legacy effective dates must remain visible');
});

console.log('Calculation quality system tests passed.');
