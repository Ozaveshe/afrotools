const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/import-landed-cost-engine.js');

const root = path.resolve(__dirname, '..');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'data/trade/import-rules.json'), 'utf8'));
const fx = JSON.parse(fs.readFileSync(path.join(root, 'data/forex/latest.json'), 'utf8'));
const options = { fxSnapshot: fx, asOfDate: fx.timestamp.slice(0, 10) };

function close(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.02, `${label}: expected ${expected}, got ${actual}`);
}

function base(destination, extra = {}) {
  return Object.assign({
    destination,
    origin: 'JP',
    goodsType: 'general',
    sourceCurrency: rules.markets[destination].currency,
    purchaseValue: 1000,
    freight: 100,
    insurance: 10,
    quantity: 10,
    dutyRate: 20,
    exciseRate: 0,
    classificationConfirmed: true
  }, extra);
}

const nigeria = engine.calculate(base('NG'), rules, options);
assert.strictEqual(nigeria.valid, true);
assert.strictEqual(nigeria.fxFreshness, 'fresh');
assert.strictEqual(nigeria.fxReferenceSource, fx.source);
assert.strictEqual(nigeria.fxReferenceTimestamp, fx.timestamp);
close(nigeria.cifLocal, 1110, 'Nigeria CIF');
close(nigeria.duty, 222, 'Nigeria duty');
close(nigeria.levyItems.find((item) => item.id === 'ciss').amount, 10, 'Nigeria CISS');
close(nigeria.levyItems.find((item) => item.id === 'etls').amount, 5.55, 'Nigeria ETLS');
close(nigeria.levyItems.find((item) => item.id === 'surcharge').amount, 15.54, 'Nigeria surcharge');
close(nigeria.vatBase, 1363.09, 'Nigeria VAT base order');
close(nigeria.vat, 102.23, 'Nigeria VAT');
close(nigeria.landedCostLocal, 1465.32, 'Nigeria landed total');
close(nigeria.landedCostPerUnit, 146.53, 'Nigeria unit cost');

const kenya = engine.calculate(base('KE'), rules, options);
close(kenya.levyItems.find((item) => item.id === 'idf').amount, 27.75, 'Kenya IDF');
close(kenya.levyItems.find((item) => item.id === 'rdl').amount, 22.2, 'Kenya RDL');
close(kenya.vatBase, 1332, 'Kenya VAT excludes IDF and RDL');
close(kenya.vat, 213.12, 'Kenya VAT');
close(kenya.landedCostLocal, 1595.07, 'Kenya landed total');

const kenyaExcise = engine.calculate(base('KE', { exciseRate: 10 }), rules, options);
close(kenyaExcise.exciseBase, 1332, 'Kenya excise base');
close(kenyaExcise.excise, 133.2, 'Kenya excise');
close(kenyaExcise.vatBase, 1465.2, 'Kenya VAT includes excise');

const ghana = engine.calculate(base('GH'), rules, options);
close(ghana.vatBase, 1332, 'Ghana shared VAT base');
close(ghana.levyItems.find((item) => item.id === 'nhil').base, 1332, 'Ghana NHIL base');
close(ghana.levyItems.find((item) => item.id === 'getfund').base, 1332, 'Ghana GETFund base');
close(ghana.vat, 199.8, 'Ghana VAT');

const southAfrica = engine.calculate(base('ZA'), rules, options);
close(southAfrica.customsUplift, 111, 'South Africa 10% ATV uplift');
close(southAfrica.vatBase, 1443, 'South Africa VAT base');
close(southAfrica.vat, 216.45, 'South Africa VAT');

const beln = engine.calculate(base('ZA', { origin: 'BW' }), rules, options);
close(beln.customsUplift, 0, 'BELN origin removes uplift');
close(beln.vatBase, 1332, 'BELN VAT base');
assert(beln.warnings.includes('vat-uplift-origin-exception'));

const fixedExciseAndCharges = engine.calculate(base('GH', {
  dutyRate: 0,
  exciseFixedLocal: 50,
  otherStatutoryLocal: 25,
  clearingAgent: 40,
  portTerminal: 30,
  storage: 20,
  inlandHaulage: 10,
  inspection: 5,
  documentation: 4,
  bankRemittance: 3,
  miscellaneous: 2
}), rules, options);
close(fixedExciseAndCharges.excise, 50, 'fixed excise');
close(fixedExciseAndCharges.otherStatutory, 25, 'fixed statutory charge');
close(fixedExciseAndCharges.optionalCostsTotal, 114, 'user assumption total');

close(engine.calculateCustomsBase(1000, 100, 10, 0), 1110, 'pure customs base');
close(engine.calculateAdValoremDuty(1110, 20), 222, 'pure ad valorem duty');
close(engine.calculateFixedDuty(75), 75, 'pure fixed duty');
close(engine.calculateTieredDuty(1500, [{ upTo: 1000, rate: 10 }, { upTo: null, rate: 20 }]), 200, 'pure tiered duty');

const zeroLogistics = engine.calculate(base('NG', { freight: 0, insurance: 0 }), rules, options);
close(zeroLogistics.cifLocal, 1000, 'zero freight and insurance');

const fromJpy = engine.calculate(base('NG', {
  sourceCurrency: 'JPY',
  purchaseValue: fx.rates.JPY * 1000,
  freight: 0,
  insurance: 0,
  dutyRate: 0
}), rules, options);
close(fromJpy.purchaseValueLocal, fx.rates.NGN * 1000, 'JPY to NGN conversion');
close(fromJpy.fxRate, fx.rates.NGN / fx.rates.JPY, 'derived cross rate');

const override = engine.calculate(base('KE', { sourceCurrency: 'USD', fxRate: 140 }), rules, options);
assert.strictEqual(override.fxSource, 'user-override');
assert.notStrictEqual(override.fxImpactLocal, 0);
assert.strictEqual(override.referenceFxRate, fx.rates.KES);

const comparison = engine.compare(base('NG'), base('NG', { purchaseValue: 1200, freight: 80 }), rules, options);
assert.strictEqual(comparison.valid, true);
assert.strictEqual(comparison.compatible, true);
assert(comparison.differenceLocal > 0);

const crossCountry = engine.compare(base('NG'), base('GH'), rules, options);
assert.strictEqual(crossCountry.compatible, false);
assert.strictEqual(crossCountry.differenceLocal, null);

const vehicle = engine.calculate(base('NG', { goodsType: 'vehicle' }), rules, options);
assert.strictEqual(vehicle.valid, false);
assert.strictEqual(vehicle.unsupported, true);
assert.strictEqual(vehicle.route, '/tools/car-import-cost/');

const unsupported = engine.calculate(base('NG', { destination: 'UG' }), rules, options);
assert.strictEqual(unsupported.valid, false);
assert.strictEqual(unsupported.unsupported, true);

const staleRules = JSON.parse(JSON.stringify(rules));
staleRules.markets.NG.lastVerified = '2026-01-01';
const stale = engine.calculate(base('NG'), staleRules, options);
assert.strictEqual(stale.stale, true);
assert.strictEqual(stale.confidence, 'stale');
assert(stale.warnings.includes('stale-rule'));

const staleFxSnapshot = Object.assign({}, fx, { timestamp: '2026-01-01T00:00:00.000Z' });
const staleFx = engine.calculate(base('NG'), rules, { fxSnapshot: staleFxSnapshot, asOfDate: '2026-08-15' });
assert.strictEqual(staleFx.fxFreshness, 'stale');
assert.strictEqual(staleFx.fxStale, true);
assert(staleFx.warnings.includes('stale-fx'));

const platformStaleFxSnapshot = Object.assign({}, fx, { timestamp: '2026-08-09T00:00:00.000Z' });
const platformStaleFx = engine.calculate(base('NG'), rules, { fxSnapshot: platformStaleFxSnapshot, asOfDate: '2026-08-15' });
assert.strictEqual(platformStaleFx.fxFreshness, 'stale');
assert(platformStaleFx.warnings.includes('stale-fx'));

const boundary = engine.calculate(base('NG', { dutyRate: 100, exciseRate: 100 }), rules, options);
assert.strictEqual(boundary.valid, true);
assert.strictEqual(engine.calculate(base('NG', { dutyRate: 100.01 }), rules, options).valid, false);
assert.strictEqual(engine.calculate(base('NG', { purchaseValue: -1 }), rules, options).valid, false);

console.log('import-landed-cost-engine.test.js passed');
