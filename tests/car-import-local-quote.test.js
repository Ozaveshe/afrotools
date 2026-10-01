const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const Engine = require('../assets/js/lib/car-import-cost-engine');
const Source = require('../assets/js/lib/src/car-import-cost-engine');
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const data = Engine.mergeData(read('data/trade/car-import-cost-core.json'), ['gh', 'ng', 'ke'].map(code => read(`data/trade/car-import-cost-${code}.json`)), { GHS: 14.89, NGN: 1535.5, KES: 129.45 });
const input = { countryCode: 'GH', make: 'Honda', model: 'CR-V', year: 2016, sourceMarket: 'japan', engineCc: 2400, asOfDate: '2026-09-27' };

test('missing or invalid local quote produces no price or savings recommendation', () => {
  for (const localDealerPriceUsd of [undefined, 0, -1, NaN, Infinity]) {
    const result = Engine.calculate({ ...input, localDealerPriceUsd }, data);
    assert.equal(result.localComparator.status, 'quote-required');
    assert.equal(result.localComparator.localDealerEstimateUsd, null);
    assert.equal(result.localComparator.importSavingsUsd, null);
    assert.equal(result.localComparator.cheaperOption, null);
    assert.ok(!result.sourceMarketCompare.some(row => row.sourceMarket === 'local-dealer'));
    assert.equal(result.resale, undefined);
  }
});

test('entered quotes compare in both directions and handle equal costs', () => {
  const baseline = Engine.calculate(input, data).totals.onRoadUsd;
  for (const [delta, option] of [[1000, 'import'], [-1000, 'buy-locally'], [0, 'same-cost']]) {
    const result = Engine.calculate({ ...input, localDealerPriceUsd: baseline + delta }, data);
    assert.equal(result.localComparator.status, 'planning-comparison');
    assert.equal(result.localComparator.importSavingsUsd, delta);
    assert.equal(result.localComparator.cheaperOption, option);
    assert.equal(result.sourceMarketCompare.find(row => row.sourceMarket === 'local-dealer').onRoadUsd, baseline + delta);
  }
});

test('rule review or import ineligibility prevents a savings recommendation', () => {
  for (const change of [
    { countryCode: 'NG' },
    { countryCode: 'KE', driveSide: 'left', customsValueUsd: 10000 },
    { asOfDate: '2028-01-01' }
  ]) {
    const result = Engine.calculate({ ...input, ...change, localDealerPriceUsd: 50000 }, data);
    assert.equal(result.localComparator.status, 'review-required');
    assert.equal(result.localComparator.importSavingsUsd, null);
    assert.equal(result.localComparator.cheaperOption, null);
  }
});

test('readable source and generated engine return identical results', () => {
  const { calculatedAt: generatedAt, ...generated } = Engine.calculate({ ...input, localDealerPriceUsd: 20000 }, data);
  const { calculatedAt: sourceAt, ...source } = Source.calculate({ ...input, localDealerPriceUsd: 20000 }, data);
  assert.ok(Date.parse(generatedAt) && Date.parse(sourceAt));
  assert.deepEqual(generated, source);
});
