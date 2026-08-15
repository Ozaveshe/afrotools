'use strict';

const assert = require('assert');
const engine = require('../engines/src/electricity-cost-engine.js');
const dataset = require('../data/energy/electricity-tariffs.json');

assert.equal(engine.validateDataset(dataset).valid, true);
assert.equal(new Set(dataset.records.map((record) => record.tariff_id)).size, dataset.records.length);

const ugStandard = dataset.records.find((record) => record.tariff_id === 'ug-uedcl-domestic-standard-q3-2026');
const ugLifeline = dataset.records.find((record) => record.tariff_id === 'ug-uedcl-domestic-lifeline-q3-2026');
const tzD1 = dataset.records.find((record) => record.tariff_id === 'tz-tanesco-d1');

assert.deepStrictEqual(engine.recordStatus(ugStandard, '2026-08-15', 45).available, true);
assert.deepStrictEqual(engine.recordStatus(ugStandard, '2026-10-01', 45).reason, 'expired');
assert.equal(engine.recordStatus(null, '2026-08-15', 45).reason, 'unsupported');

const flatBill = engine.calculateBill(ugStandard, 10);
assert.equal(flatBill.ok, true);
assert.equal(flatBill.total, 7794);
assert.equal(flatBill.effective_rate, 779.4);

const boundary15 = engine.calculateBill(ugLifeline, 15);
assert.equal(boundary15.total, 3750);
assert.equal(boundary15.tier_breakdown.length, 1);
const boundary16 = engine.calculateBill(ugLifeline, 16);
assert.equal(boundary16.total, 4529.4);
assert.equal(boundary16.tier_breakdown.length, 2);
assert.equal(engine.calculateBill(ugLifeline, 30).total, 15441);
assert.equal(engine.calculateBill(tzD1, 75).total, 7500);
assert.equal(engine.calculateBill(tzD1, 100).total, 16250);

const synthetic = {
  ...ugStandard,
  tariff_id: 'synthetic',
  tiers: [{ from: 0, up_to: null, rate: 10, label: 'Flat' }],
  fixed_charge: 50,
  levies: [{ id: 'levy', label: 'Levy', type: 'percent', value: 5 }],
  taxes: [{ id: 'tax', label: 'Tax', type: 'percent', value: 10 }],
  minimum_charge: 0,
  prepaid_deductions: [{ id: 'vend', label: 'Vending', type: 'fixed', value: 20 }]
};
const chargeBill = engine.calculateBill(synthetic, 10);
assert.equal(chargeBill.energy_charge, 100);
assert.equal(chargeBill.fixed_charge, 50);
assert.equal(chargeBill.levies[0].amount, 7.5);
assert.equal(chargeBill.taxes[0].amount, 15.75);
assert.equal(chargeBill.total, 173.25);

const units = engine.calculateUnits(ugStandard, 10000);
assert.equal(units.ok, true);
assert.equal(units.units, 12.8304);
assert(Math.abs(engine.calculateBill(ugStandard, units.units).energy_charge - 10000) < 0.1);
const deductedUnits = engine.calculateUnits(synthetic, 1020, { extra_deductions: [{ id: 'extra', label: 'Extra', type: 'percent', value: 10 }] });
assert.equal(deductedUnits.amount_after_prepaid_deductions, 898);
assert.equal(deductedUnits.amount_for_energy, 727.49);
assert.equal(deductedUnits.fixed_charge, 50);
assert(Math.abs(deductedUnits.units - 72.749) < 0.001);
assert.equal(deductedUnits.total_charged, 898);

assert.equal(engine.calculateBill(null, 100).ok, false);
assert.equal(engine.calculateBill(ugStandard, 0).ok, false);
assert.equal(engine.calculateBill(ugStandard, -5).ok, false);
assert.equal(engine.calculateUnits(ugStandard, 0).ok, false);
assert.equal(engine.calculateUnits(ugStandard, -5).ok, false);
assert.equal(engine.round(1.005, 2), 1.01);

const custom = engine.customRateRecord({ country_code: 'GH', country_name: 'Ghana', currency: 'GHS', rate: 2.5, fixed_charge: 10 });
assert.equal(custom.status, 'custom');
assert.equal(engine.calculateBill(custom, 20).total, 60);
const customWithTax = engine.customRateRecord({ currency: 'GHS', rate: 2.5, fixed_charge: 10, tax_percent: 10 });
assert.equal(engine.calculateBill(customWithTax, 20).total, 66);
assert.equal(engine.calculateUnits(customWithTax, 66).units, 20);
assert.equal(engine.customRateRecord({ rate: 0 }), null);
assert.match(engine.formatMoney(1000, 'UGX'), /1,000/);

const ugRows = engine.recordsForCountry(dataset, 'UG');
assert.equal(ugRows.length, 3);
assert.equal(new Set(ugRows.map((record) => record.provider_id)).size, 1);
assert.equal(new Set(ugRows.map((record) => record.customer_class)).size, 3);
assert.equal(engine.recordsForCountry(dataset, 'GH').length, 0);

console.log('Electricity cost engine verified: flat/tiered boundaries, charges, both directions, freshness, fallback and provider/class resolution.');
