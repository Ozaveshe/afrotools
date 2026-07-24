'use strict';
const assert = require('assert');
const engine = require('../../assets/js/engines/ke-vat.js');

assert.deepStrictEqual(engine.calculate({ amount: 1000 }), { mode: 'add', rate: 16, rateKind: 'standard', net: 1000, vat: 160, gross: 1160 });
assert.deepStrictEqual(engine.calculate({ amount: 1160, mode: 'extract' }), { mode: 'extract', rate: 16, rateKind: 'standard', net: 1000, vat: 160, gross: 1160 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rate: 0 }), { mode: 'add', rate: 0, rateKind: 'zero', net: 1000, vat: 0, gross: 1000 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rate: 12, rateKind: 'scenario' }), { mode: 'add', rate: 12, rateKind: 'scenario', net: 1000, vat: 120, gross: 1120 });
assert.deepStrictEqual(engine.calculateInvoice([{ description: 'A', quantity: 2, unitPrice: 500 }], 16), { mode: 'add', rate: 16, rateKind: 'standard', net: 1000, vat: 160, gross: 1160, lines: [{ description: 'A', quantity: 2, unitPrice: 500, net: 1000 }] });
assert.deepStrictEqual(engine.classify('confirmed-zero'), { treatment: 'zero-rated', rate: 0, source: 'VAT Act Second Schedule' });
assert.deepStrictEqual(engine.classify('confirmed-exempt'), { treatment: 'exempt', rate: null, source: 'VAT Act First Schedule' });
assert.deepStrictEqual(engine.calculateWithholding(1000, true), { applicable: true, rate: 2, withheld: 20 });
assert.deepStrictEqual(engine.calculateWithholding(1000, false), { applicable: false, rate: 2, withheld: 0 });
assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
assert.throws(() => engine.calculate({ amount: 1, rate: 101 }), /between 0 and 100/);
console.log('Kenya VAT pure-engine fixtures passed.');
