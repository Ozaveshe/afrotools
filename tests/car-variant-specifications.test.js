const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { validateRegistry, inspectVariant, auditResearch } = require('../scripts/car-variant-specifications');
const data = JSON.parse(fs.readFileSync(require.resolve('../data/cars/variant-specifications.json'), 'utf8'));
const copy = () => structuredClone(data);
const row = (trim, overrides = {}) => ({ vehicle_id: 'mercedes-e-class-2017', model_year: 2017, trim_label: trim, engine_cc: 1991, cylinders: 4, drivetrain: 'AWD', ...overrides });

test('reviewed facts have dated OEM sources, distinct variants and no prices', () => {
  assert.equal(validateRegistry(data).variants.length, 19);
  assert.equal(new Set(data.variants.map(x => x.vehicle_id)).size, 6);
  const bad = copy(); bad.variants[0].asking_price = 12000000;
  assert.throws(() => validateRegistry(bad), /Price/);
});
test('exact and nominal E300 displacement preserve explicit AWD', () => {
  for (const cc of [1991, 2000]) {
    const result = inspectVariant(row('E300 4Matic AWD Sedan (2.0L 4cyl 9A)', { engine_cc: cc }), data);
    assert.equal(result.status, 'plausible-manufacturer-variant');
    assert.equal(result.stock_verified, false);
    assert.equal(result.publishable, false);
  }
  assert.equal(inspectVariant(row('E300 4MATIC Sedan', { engine_cc: 2050 }), data).status, 'specification-conflict');
});
test('engine, cylinders, drivetrain and year contradictions require review', () => {
  for (const facts of [{ engine_cc: 3000 }, { cylinders: 6 }, { drivetrain: 'RWD' }, { model_year: 2018 }]) {
    assert.equal(inspectVariant(row('E300 4MATIC Sedan', facts), data).status, 'specification-conflict');
  }
});
test('bare E300 and another model or year do not acquire a default variant', () => {
  for (const facts of [row('E300'), row(null), row('E300 4MATIC Sedan', { vehicle_id: 'mercedes-e-class-2018' }), row('CLA250')]) {
    assert.equal(inspectVariant(facts, data).status, 'unresolved-variant');
  }
});
test('missing facts remain missing and C300 badge does not resolve drivetrain', () => {
  const result = inspectVariant({ vehicle_id: 'mercedes-c-class-2016', trim_label: 'C 300 (W205)', engine_cc: 2000, cylinders: 4 }, data);
  assert.equal(result.status, 'needs-specification-review');
  assert.deepEqual(result.missing, ['drivetrain']);
  const noEngine = inspectVariant(row('E300 RWD Sedan', { engine_cc: null, cylinders: null, drivetrain: null }), data);
  assert.equal(noEngine.status, 'needs-specification-review');
  assert.deepEqual(noEngine.missing, ['engine_cc', 'cylinders', 'drivetrain']);
});
test('private diagnostics use literal drive claims without filling the input or a bare badge', () => {
  const payload = { listings: [{ source_listing_id: 'drive1', vehicle_id: 'mercedes-e-class-2017', model_year: 2017, trim_label: 'E300 4Matic AWD Sedan (2.0L 4cyl 9A)' }], contexts: [{ source_listing_id: 'drive1', engine_display: '2000cc', cylinders_display: '4' }] };
  assert.equal(auditResearch(payload, data)[0].status, 'plausible-manufacturer-variant');
  assert.equal(payload.contexts[0].drivetrain_claim, undefined);
  payload.contexts[0].drivetrain_claim = 'RWD';
  assert.equal(auditResearch(payload, data)[0].status, 'specification-conflict');
  payload.listings[0].trim_label = 'E300';
  assert.equal(auditResearch(payload, data)[0].status, 'unresolved-variant');
});

test('Elantra ECO nominal1.4L and C4503.0L stay distinct from starter bands', () => {
  const eco = inspectVariant({ vehicle_id: 'hyundai-elantra-2020', trim_label: 'eco', engine_cc: 1400, cylinders: 4 }, data);
  assert.equal(eco.issues.length, 0);
  assert.equal(eco.variant_id, 'hyundai-elantra-2020-us-eco');
  const amg = inspectVariant({ vehicle_id: 'mercedes-c-class-2016', trim_label: 'C 450 AMG 4MATIC (W205)', engine_cc: 3000, cylinders: 6, drivetrain: 'AWD' }, data);
  assert.equal(amg.status, 'plausible-manufacturer-variant');
  assert.equal(inspectVariant({ vehicle_id: 'hyundai-elantra-2020', trim_label: 'eco', engine_cc: 2000, cylinders: 4 }, data).status, 'specification-conflict');
});
test('Civic sedan and hatchback labels retain distinct engines and unresolved bare badges', () => {
  const civic = (trim, cc) => inspectVariant({ vehicle_id: 'honda-civic-2022', model_year: 2022, trim_label: trim, engine_cc: cc, cylinders: 4 }, data);
  assert.equal(civic('Sport Sedan', 1996).issues.length, 0);
  assert.equal(civic('Sport Sedan', 1500).status, 'specification-conflict');
  assert.equal(civic('Sport Touring', 1498).variant_id, 'honda-civic-2022-us-sport-touring-hatchback');
  assert.equal(civic('Sport Touring', 2000).status, 'specification-conflict');
  for (const badge of ['Sport', 'Touring', 'LX', 'EX']) assert.equal(civic(badge, 1500).status, 'unresolved-variant');
  const missing = inspectVariant({ vehicle_id: 'honda-civic-2010', trim_label: 'EX Sedan' }, data);
  assert.deepEqual(missing.missing, ['engine_cc', 'cylinders', 'drivetrain']);
  assert.equal(missing.publishable, false);
});

test('CR-V petrol AWD does not acquire a hybrid, plug-in or equipment alias', () => {
  const crv = (trim, cc, drive = 'AWD') => inspectVariant({ vehicle_id: 'honda-cr-v-2023', model_year: 2023, trim_label: trim, engine_cc: cc, cylinders: 4, drivetrain: drive }, data);
  assert.equal(crv('EX-L AWD', 1498).status, 'plausible-manufacturer-variant');
  assert.equal(crv('EX-L AWD', 2000).status, 'specification-conflict');
  assert.equal(crv('Sport Touring Hybrid AWD', 1993).status, 'plausible-manufacturer-variant');
  assert.equal(crv('Sport Touring Hybrid AWD', 1993, 'FWD').status, 'specification-conflict');
  for (const trim of ['EX-L AWD w/o BSI', 'PHEV 2.0 AWD', 'Sport']) assert.equal(crv(trim, 2000).status, 'unresolved-variant');
  assert.equal(crv('Sport Touring Hybrid AWD', 1993).stock_verified, false);
});

test('source identity, invalid facts and colliding aliases fail validation', () => {
  let bad = copy(); bad.variants[1].aliases.push('SE'); assert.throws(() => validateRegistry(bad), /Ambiguous/);
  bad = copy(); bad.variants[0].model_year = 2021; assert.throws(() => validateRegistry(bad), /year/);
  bad = copy(); bad.sources['mbusa-2016-c-class-us'].document_code = null; assert.throws(() => validateRegistry(bad), /identity/);
  bad = copy(); bad.sources['hyundai-2020-elantra-us'].url += '?contact=private'; assert.throws(() => validateRegistry(bad), /URL/);
  bad = copy(); bad.sources['hyundai-2020-elantra-us'].checked_at = '2100-01-01T00:00:00Z'; assert.throws(() => validateRegistry(bad), /timestamp/);
});
test('research diagnostics retain missing fields and reject ambiguous context', () => {
  const payload = { listings: [{ source_listing_id: 'synthetic1', vehicle_id: 'mercedes-e-class-2017', model_year: 2017, trim_label: 'E300 RWD Sedan' }], contexts: [{ source_listing_id: 'synthetic1', engine_display: null, cylinders_display: null }] };
  const result = auditResearch(payload, data)[0];
  assert.equal(result.status, 'needs-specification-review');
  assert.equal(result.publishable, false);
  assert.equal(payload.contexts[0].engine_display, null);
  payload.contexts.push({ ...payload.contexts[0] });
  assert.throws(() => auditResearch(payload, data), /unambiguous/);
});
