const assert = require('assert');
const engine = require('../../assets/js/engines/import-duty-nigeria-engine.js');

assert.deepStrictEqual(engine.cetBands, [0, 5, 10, 20, 35]);
assert.strictEqual(engine.standardVatRate, 7.5);

const standard = engine.calculate({
  itemType: 'goods', itemName: 'Laptops', hsCode: '847130',
  fob: 1000, freight: 100, insurance: 20, customsValue: 0,
  dutyRate: 20, otherImportCharges: 50, vatRate: 7.5,
  portCharges: 30, clearingFee: 40, fxRate: 1600,
  classificationConfirmed: true, quoteConfirmed: true
});
assert.strictEqual(standard.valid, true);
assert.strictEqual(standard.cif, 1120);
assert.strictEqual(standard.duty, 224);
assert.strictEqual(standard.vatBase, 1394);
assert.strictEqual(standard.vat, 104.55);
assert.strictEqual(standard.totalUsd, 1568.55);
assert.strictEqual(standard.totalNgn, 2509680);
assert.strictEqual(standard.reviewRequired, false);

const assessed = engine.calculate({
  fob: 1000, freight: 100, insurance: 20, customsValue: 1500,
  dutyRate: 10, otherImportCharges: 0, vatRate: 7.5,
  portCharges: 0, clearingFee: 0, fxRate: 0
});
assert.strictEqual(assessed.customsValueSource, 'user');
assert.strictEqual(assessed.duty, 150);
assert.strictEqual(assessed.vatBase, 1650);
assert.strictEqual(assessed.vat, 123.75);
assert.strictEqual(assessed.totalUsd, 1393.75);
assert.strictEqual(assessed.totalNgn, null);
assert.strictEqual(assessed.reviewRequired, true);

assert.strictEqual(engine.calculate({ fob: -1, dutyRate: 20, vatRate: 7.5 }).valid, false);
assert.strictEqual(engine.calculate({ fob: 100, dutyRate: 101, vatRate: 7.5 }).valid, false);

console.log('Nigeria import-duty classification-first fixtures passed.');
