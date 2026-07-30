'use strict';
const assert = require('node:assert/strict');
const engine = require('../engines/src/cooperative-engine');

const base = {
  coopType: 'agri', method: 'patronage', revenue: 10000000, expenses: 6500000,
  members: 120, myProduce: 1200, totalProduce: 85000, myShares: 50000,
  totalShares: 3500000, marketPrice: 450, saccoRate: 0, hybridPatronagePct: 50,
  allocations: { reserve: 25, education: 5, dividend: 50, social: 5, retained: 15 },
};
const patronage = engine.calculate(base);
assert.equal(patronage.ok, true);
assert.equal(patronage.surplus, 3500000);
assert.equal(patronage.amounts.dividend, 1750000);
assert.equal(patronage.memberDividend, 1200 / 85000 * 1750000);
assert.equal(patronage.comparison.independentRevenue, 540000);

const shares = engine.calculate({ ...base, coopType: 'sacco', method: 'shares', saccoRate: 12.5 });
assert.equal(shares.memberDividend, 50000 / 3500000 * 1750000);
assert.equal(shares.saccoInterest, 6250);
assert.equal(shares.comparison, null);

const hybrid = engine.calculate({ ...base, method: 'hybrid', hybridPatronagePct: 35 });
assert.equal(hybrid.hybrid.patronagePool, 612500);
assert.equal(hybrid.hybrid.sharePool, 1137500);
assert.equal(hybrid.memberDividend, 1200 / 85000 * 612500 + 50000 / 3500000 * 1137500);

assert.equal(engine.calculate({ ...base, revenue: 0 }).status, 'missing-revenue');
assert.equal(engine.calculate({ ...base, members: 0 }).status, 'missing-members');
assert.equal(engine.calculate({ ...base, allocations: { ...base.allocations, dividend: 49.4 } }).status, 'allocation-not-100');
assert.equal(engine.calculate({ ...base, allocations: { ...base.allocations, dividend: 49.6 } }).ok, true);
assert.equal(engine.calculate({ ...base, expenses: 10000001 }).status, 'negative-surplus');
assert.equal(engine.calculate({ ...base, totalProduce: 0 }).status, 'missing-total-produce');
assert.equal(engine.calculate({ ...base, method: 'shares', totalShares: 0 }).status, 'missing-total-shares');
assert.equal(engine.calculate({ ...base, method: 'hybrid', totalProduce: 0, totalShares: 0 }).status, 'missing-hybrid-totals');
console.log('PASS Cooperative engine branch and rounding invariants');
