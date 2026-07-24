const assert = require('assert');
const engine = require('../../assets/js/engines/pan-african-vat');
const pack = require('../../data/vat-business-tax/pan-african-vat-presets.json');
const sourceLedger = require('../../data/vat-business-tax/official-sources.json');

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: expected ${expected}, received ${actual}`);
}

for (const rate of [0, 7.5, 15, 20, 100]) {
  const added = engine.calculateSingle({ amount: 1000, rate, mode: 'add' });
  assert.strictEqual(added.ok, true);
  near(added.vat, 1000 * rate / 100, `add VAT at ${rate}%`);
  const extracted = engine.calculateSingle({ amount: added.total, rate, mode: 'extract' });
  near(extracted.net, 1000, `add/extract inverse at ${rate}%`);
  near(extracted.vat, added.vat, `inverse VAT at ${rate}%`);
}

for (const value of ['', '   ', null, undefined, 'not-a-number', Infinity, -1]) {
  assert.strictEqual(engine.calculateSingle({ amount: value, rate: 15 }).ok, false, `reject amount ${String(value)}`);
}
for (const value of ['', '   ', null, undefined, 'not-a-number', Infinity, -1, 100.01]) {
  assert.strictEqual(engine.calculateSingle({ amount: 100, rate: value }).ok, false, `reject rate ${String(value)}`);
}

const invoice = engine.calculateInvoice({ items: [
  { description: 'Standard', amount: 0.1, rate: 7.5, treatment: 'standard' },
  { description: 'Zero', amount: 0.2, treatment: 'zero-rated' },
  { description: 'Exempt', amount: 0.3, treatment: 'exempt' }
] });
assert.strictEqual(invoice.ok, true);
near(invoice.subtotal, 0.6, 'invoice preserves full-precision subtotal');
near(invoice.vat, 0.0075, 'invoice preserves unrounded line VAT');
assert.deepStrictEqual(invoice.display, { subtotal: 0.6, vat: 0.01, total: 0.61 });
assert.strictEqual(invoice.lines[1].rate, 0);
assert.strictEqual(invoice.lines[2].rate, 0);
assert.strictEqual(engine.calculateInvoice({ items: [{ amount: 10, treatment: 'standard' }] }).ok, false, 'standard line requires rate');

const withholding = engine.calculateWithholdingScenario({ netAmount: 1000, vatRate: 20, withholdingPercent: 25 });
assert.strictEqual(withholding.ok, true);
near(withholding.vat, 200, 'withholding base VAT');
near(withholding.retainedVat, 50, 'neutral retained VAT scenario');
near(withholding.supplierReceives, 1150, 'neutral supplier receipt scenario');

const comparison = engine.compareRateScenarios({ amount: 1000, scenarios: [{ label: 'A', rate: 7.5 }, { label: 'B', rate: 20 }] });
assert.strictEqual(comparison.ok, true);
near(comparison.percentagePointSpread, 12.5, 'rate-scenario percentage-point spread');
assert.strictEqual(Object.prototype.hasOwnProperty.call(comparison, 'savings'), false, 'no cross-currency savings claim');

assert.strictEqual(Object.keys(pack.countries).length, 54, 'pack covers all 54 African markets');
const statusCounts = Object.values(pack.countries).reduce((counts, country) => {
  counts[country.status] = (counts[country.status] || 0) + 1;
  return counts;
}, {});
assert.deepStrictEqual(statusCounts, {
  'authority-bound-planning-preset': 15,
  'authority-source-gap': 36,
  'unverified-no-vat-claim': 3
});
assert.strictEqual(pack.datasetReviewed, sourceLedger.datasetReviewed, 'pack review date follows the source ledger');
const authorityBoundCodes = sourceLedger.sources.map((source) => source.country).sort();
const presetCodes = Object.entries(pack.countries)
  .filter(([, country]) => country.status === 'authority-bound-planning-preset')
  .map(([code]) => code)
  .sort();
assert.deepStrictEqual(presetCodes, authorityBoundCodes, 'presets exist only for authority-bound ledger rows');
for (const source of sourceLedger.sources) {
  assert.strictEqual(pack.countries[source.country].source.url, source.url, `${source.country} source URL matches ledger`);
}

const nigeria = engine.getCountryPreset(pack, 'ng');
assert.strictEqual(nigeria.ok, true);
assert.strictEqual(nigeria.rate, 7.5);
assert.strictEqual(nigeria.source.url, 'https://www.firs.gov.ng/');
assert.strictEqual(nigeria.reviewedOn, '2026-05-03');

for (const code of ['GW', 'SO', 'ER', 'LY']) {
  const missing = engine.getCountryPreset(pack, code);
  assert.strictEqual(missing.ok, false, `${code} must not silently receive a preset`);
  assert.match(missing.error, /Enter the rate from your authority notice/);
}

for (const [code, country] of Object.entries(pack.countries)) {
  if (country.status === 'authority-bound-planning-preset') {
    assert.strictEqual(typeof country.standardRate, 'number', `${code} preset rate`);
    assert.match(country.source.url, /^https:\/\//, `${code} official source URL`);
  } else {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(country, 'standardRate'), false, `${code} gap has no legacy rate`);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(country, 'source'), false, `${code} gap has no invented source`);
  }
}

console.log('Pan-African VAT custom-rate engine and 54-market preset/gap contract passed.');
