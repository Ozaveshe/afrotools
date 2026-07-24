const assert = require('assert');
const engine = require('../engines/src/ke-stamp-duty-engine.js');

const baseTransfer = {
  instrumentDate: '2026-07-23',
  mode: 'transfer',
  transactionType: 'sale',
  location: 'municipality',
  consideration: 15000000,
  marketValue: 15000000
};

let result = engine.calculate(baseTransfer);
assert.equal(result.ok, true);
assert.equal(result.dutiableValue, 15000000);
assert.equal(result.transferDuty, 600000);
assert.equal(result.payable, 600000);

result = engine.calculate({ ...baseTransfer, location: 'other' });
assert.equal(result.ok, true);
assert.equal(result.transferDuty, 300000);

result = engine.calculate({ ...baseTransfer, consideration: 12000000, marketValue: 15000000 });
assert.equal(result.dutiableValue, 15000000);
assert.equal(result.transferDuty, 600000);

result = engine.calculate({
  ...baseTransfer,
  transactionType: 'gift',
  consideration: 0,
  marketValue: 5000000
});
assert.equal(result.dutiableValue, 5000000);
assert.equal(result.transferDuty, 200000);

assert.equal(engine.conveyanceDuty(1, 'municipality'), 20);
assert.equal(engine.conveyanceDuty(500, 'municipality'), 20);
assert.equal(engine.conveyanceDuty(501, 'municipality'), 40);
assert.equal(engine.conveyanceDuty(2001, 'municipality'), 120);
assert.equal(engine.conveyanceDuty(1, 'other'), 10);
assert.equal(engine.conveyanceDuty(501, 'other'), 20);

const baseLease = {
  instrumentDate: '2026-07-23',
  mode: 'lease',
  location: 'municipality',
  termType: 'definite',
  termYears: 0.5,
  annualRent: 120000,
  premium: 0
};

result = engine.calculate(baseLease);
assert.equal(result.ok, true);
assert.equal(result.rentDuty, 600);
assert.equal(result.payable, 600);

result = engine.calculate({ ...baseLease, termYears: 2 });
assert.equal(result.rentDuty, 1200);

result = engine.calculate({ ...baseLease, termYears: 5 });
assert.equal(result.rentDuty, 2400);

result = engine.calculate({ ...baseLease, termType: 'indefinite', termYears: '' });
assert.equal(result.rentDuty, 2400);
assert.equal(result.termYears, null);

result = engine.calculate({ ...baseLease, termYears: 2, premium: 1000000 });
assert.equal(result.rentDuty, 1200);
assert.equal(result.premiumDuty, 40000);
assert.equal(result.payable, 41200);

assert.deepEqual(
  engine.calculate({ ...baseTransfer, instrumentDate: '2026-07-24' }),
  { ok: false, error: 'unsupported_date' }
);
assert.equal(engine.calculate({ ...baseTransfer, location: 'urban' }).error, 'invalid_location');
assert.equal(engine.calculate({ ...baseTransfer, marketValue: 0 }).error, 'invalid_transfer_values');
assert.equal(engine.calculate({ ...baseLease, annualRent: 0 }).error, 'invalid_lease_values');
assert.equal(engine.calculate({ ...baseLease, termYears: 0 }).error, 'invalid_term');

console.log('Kenya Stamp Duty engine: 28 checks passed');
