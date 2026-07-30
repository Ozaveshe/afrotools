'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const engine = require('../assets/js/engines/property-assumption');

const fixtures = [
  ['stamp-duty', { value: 100000, rate: 2.5, fixed: 500 }, { kind: 'duty', total: 3000 }],
  ['rental-yield', { value: 100000, rent: 1000, costs: 2000 }, { kind: 'yield', netAnnual: 10000, yieldPercent: 10 }],
  ['building-materials', { quantity: 10, unitCost: 100, fixed: 50, contingency: 10 }, { kind: 'cost', total: 1155 }],
  ['construction-budget', { quantity: 10, unitCost: 100, fixed: 50, contingency: 10 }, { kind: 'cost', total: 1155 }],
  ['survey-cost', { quantity: 10, unitCost: 100, fixed: 50, contingency: 10 }, { kind: 'cost', total: 1155 }],
  ['property-valuation', { area: 100, comparable: 1500, adjustment: 10 }, { kind: 'valuation', total: 165000 }],
  ['rent-affordability', { income: 5000, rent: 1200, ratio: 30, advance: 2 }, { kind: 'affordability', rent: 1200, boundary: 1500, upfront: 2400 }],
  ['property-mgmt-fees', { rent: 2000, rate: 8, fixed: 50 }, { kind: 'management', total: 210 }],
  ['dev-feasibility', { revenue: 500000, land: 100000, build: 200000, professional: 20000, finance: 15000, other: 5000 }, { kind: 'development', margin: 160000, totalCost: 340000 }],
  ['property-cgt', { sale: 300000, basis: 180000, costs: 20000, exemption: 10000, rate: 10 }, { kind: 'tax', gain: 90000, tax: 9000 }],
  ['service-charge', { annual: 12000, units: 10, reserve: 10 }, { kind: 'service', perUnit: 1320 }],
  ['short-let-calc', { nightly: 100, nights: 200, expenses: 5000 }, { kind: 'shortlet', netAnnual: 15000 }],
  ['agent-commission', { value: 200000, rate: 5, tax: 10 }, { kind: 'commission', total: 11000 }],
  ['plot-converter', { value: 1, from: 'hectare', to: 'sqm' }, { kind: 'converter', input: 1, from: 'hectare', to: 'sqm', converted: 10000 }],
  ['diaspora-property', { budget: 100000, fx: 15, price: 1200000, costs: 100000 }, { kind: 'diaspora', localBudget: 1500000, required: 1300000, difference: 200000 }],
  ['offplan-vs-ready', { ready: 250000, offplan: 200000, carrying: 10000, delay: 6, rent: 2000 }, { kind: 'offplan', ready: 250000, offplanTotal: 222000, difference: -28000 }],
  ['rental-agreement', { landlord: 'A', tenant: 'B', address: '1 Test Road', start: '2026-08-01', duration: 12, rent: 1000, deposit: 2000 }, { kind: 'agreement', landlord: 'A', tenant: 'B', address: '1 Test Road', start: '2026-08-01', duration: 12, rent: 1000, deposit: 2000 }],
  ['land-title-check', { checked: 3 }, { kind: 'checklist', checked: 3 }],
  ['tenant-screening', { checked: 2 }, { kind: 'checklist', checked: 2 }],
  ['building-permit', { checked: 4 }, { kind: 'checklist', checked: 4 }]
];

test('shared property engine preserves English owner fixture outputs', () => {
  for (const [tool, input, expected] of fixtures) {
    const result = engine.calculate(tool, input);
    assert.equal(result.ok, true, tool);
    for (const [key, value] of Object.entries(expected)) {
      if (typeof value === 'number') {
        assert(Math.abs(result[key] - value) < 1e-9, `${tool}:${key}`);
      } else {
        assert.equal(result[key], value, `${tool}:${key}`);
      }
    }
  }
});

test('shared property engine fails closed on empty, invalid and out-of-range inputs', () => {
  assert.equal(engine.calculate('stamp-duty', { value: '', rate: 2, fixed: 0 }).ok, false);
  assert.equal(engine.calculate('rental-yield', { value: 0, rent: 1000, costs: 0 }).ok, false);
  assert.equal(engine.calculate('property-cgt', { sale: 100, basis: 0, costs: 0, exemption: 0, rate: 101 }).ok, false);
  assert.equal(engine.calculate('short-let-calc', { nightly: 50, nights: 366, expenses: 0 }).ok, false);
  assert.equal(engine.calculate('plot-converter', { value: 1, from: 'plot', to: 'sqm' }).ok, false);
  assert.equal(engine.calculate('rental-agreement', { landlord: '', tenant: 'B', address: 'x', start: '2026-01-01', duration: 12, rent: 1, deposit: 1 }).ok, false);
});
