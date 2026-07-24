'use strict';
const assert = require('assert');
const engine = require('../../assets/js/engines/ng-vat.js');

assert.deepStrictEqual(engine.calculate({ amount: 1000 }), { mode: 'add', rate: 7.5, rateKind: 'standard', net: 1000, vat: 75, gross: 1075 });
assert.deepStrictEqual(engine.calculate({ amount: 1075, mode: 'extract' }), { mode: 'extract', rate: 7.5, rateKind: 'standard', net: 1000, vat: 75, gross: 1075 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rate: 0 }), { mode: 'add', rate: 0, rateKind: 'zero', net: 1000, vat: 0, gross: 1000 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rate: 12, rateKind: 'scenario' }), { mode: 'add', rate: 12, rateKind: 'scenario', net: 1000, vat: 120, gross: 1120 });
assert.deepStrictEqual(engine.calculate({ amount: 10.01 }), { mode: 'add', rate: 7.5, rateKind: 'standard', net: 10.01, vat: 0.75, gross: 10.76 });
assert.deepStrictEqual(engine.calculateInvoice([{ description: 'A', quantity: 2, unitPrice: 500 }, { description: 'B', quantity: 1, unitPrice: 1000 }], 7.5), { mode: 'add', rate: 7.5, rateKind: 'standard', net: 2000, vat: 150, gross: 2150, lines: [{ description: 'A', quantity: 2, unitPrice: 500, net: 1000 }, { description: 'B', quantity: 1, unitPrice: 1000, net: 1000 }] });
assert.deepStrictEqual(engine.classify('medical-products-services'), { treatment: 'zero-rated', rate: 0, section: 'NTA 2025 s187' });
assert.deepStrictEqual(engine.classify('shared-road-transport'), { treatment: 'exempt', rate: null, section: 'NTA 2025 s186' });
assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
assert.throws(() => engine.calculate({ amount: 1, rate: 101 }), /between 0 and 100/);
console.log('Nigeria VAT 2026 pure-engine fixtures passed.');
