'use strict';
const assert = require('assert');
const engine = require('../../assets/js/engines/gh-vat.js');

assert.strictEqual(engine.EFFECTIVE_FROM, '2026-01-01');
assert.strictEqual(engine.GOODS_REGISTRATION_THRESHOLD, 750000);
assert.deepStrictEqual(engine.calculate({ amount: 1000 }), { mode:'add',rateKind:'standard',effectiveRate:20,base:1000,vat:150,nhil:25,getfund:25,totalTax:200,gross:1200 });
assert.deepStrictEqual(engine.calculate({ amount: 1200, mode:'extract' }), { mode:'extract',rateKind:'standard',effectiveRate:20,base:1000,vat:150,nhil:25,getfund:25,totalTax:200,gross:1200 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rateKind:'zero' }), { mode:'add',rateKind:'zero',effectiveRate:0,base:1000,vat:0,nhil:0,getfund:0,totalTax:0,gross:1000 });
assert.deepStrictEqual(engine.calculate({ amount: 1000, rateKind:'scenario', rate:10 }), { mode:'add',rateKind:'scenario',effectiveRate:10,base:1000,vat:100,nhil:0,getfund:0,totalTax:100,gross:1100 });
assert.deepStrictEqual(engine.calculateInvoice([{ description:'A',quantity:2,unitPrice:500 }]), { mode:'add',rateKind:'standard',effectiveRate:20,base:1000,vat:150,nhil:25,getfund:25,totalTax:200,gross:1200,lines:[{description:'A',quantity:2,unitPrice:500,base:1000}] });
assert.strictEqual(engine.classify('confirmed-zero').treatment, 'zero-rated');
assert.strictEqual(engine.classify('confirmed-exempt').treatment, 'exempt');
assert.strictEqual(engine.classify('confirmed-relieved').treatment, 'relieved');
assert.throws(() => engine.calculate({ amount:-1 }), /non-negative/);
assert.throws(() => engine.calculate({ amount:1, rateKind:'scenario', rate:101 }), /between 0 and 100/);
console.log('Ghana Act 1151 VAT and levy fixtures passed.');
