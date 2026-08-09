const assert = require('assert');
const Engine = require('../assets/js/engines/sw-transport-planning-engine');

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.02, `${label}: expected ${expected}, got ${actual}`);
}

const cases = [
  ['rideFare', { base: 1, distance: 10, perKm: 2, minutes: 20, perMin: 0.5, booking: 1, surge: 1.5 }, 48],
  ['bodaIncome', { trips: 10, nauli: 5, mafuta: 10, maintenance: 2, owner: 3, days: 24 }, 35],
  ['matatuFare', { base: 1, distance: 10, perKm: 0.2, peak: 20, transfers: 1, days: 20 }, 184],
  ['deliveryCost', { base: 2, distance: 10, perKm: 1, waiting: 3, platform: 10, margin: 20 }, 19.8],
  ['vehicleRegistration', { baseFee: 100, roadTax: 50, inspection: 20, plates: 10, late: 5 }, 185],
  ['roadworthiness', { inspectionFee: 20, repairBuffer: 100 }, 75, { yes: 3, total: 4 }],
  ['vehicleDepreciation', { purchase: 10000, annualRate: 10, years: 2, mileageAdj: 5, age: 4 }, 7695],
  ['lastMileDelivery', { packages: 100, failed: 10, fuelDay: 300, wagesDay: 500, overheadDay: 100, targetFaida: 20, riders: 2 }, 12],
  ['parkingFee', { hourly: 2, hours: 4, days: 20, monthlyPass: 120, penalties: 10 }, 130],
  ['routeCost', { mafuta: 100, dereva: 50, tolls: 20, maintenance: 30, distance: 100, loadTons: 2 }, 200],
  ['tollCalc', { tolls: 3, feeEach: 5, trips: 20, returnTrip: 2, tagDiscount: 10 }, 540],
  ['trackerRoi', { install: 100, subscription: 10, fuelSpend: 100, fuelSaving: 10, insurancePunguzo: 50, lossAvoided: 200 }, 150]
];

for (const [kind, input, expected, checklist] of cases) {
  const result = Engine.calculate(kind, input, checklist);
  assert.strictEqual(result.ok, true, `${kind} accepts its valid oracle`);
  close(result.primary.value, expected, kind);
  assert.ok(result.sub && result.note && result.metrics.length >= 4, `${kind} returns a useful result contract`);
}

const loan = Engine.calculate('loanVsCash', {
  price: 10000, deposit: 2000, fees: 500, rate: 12, months: 12, cashReturn: 5
});
assert.strictEqual(loan.ok, true, 'loan-vs-cash oracle calculates');
close(loan.metrics[3].value, Engine.payment(8500, 12, 12), 'loan monthly payment');

for (const kind of cases.map((row) => row[0]).concat('loanVsCash')) {
  const refused = Engine.calculate(kind, {}, { yes: 0, total: 0 });
  assert.strictEqual(refused.ok, false, `${kind} fails closed without required inputs`);
  assert.ok(refused.error, `${kind} explains invalid input`);
}

console.log('sw-transport-remaining-engine.test.js passed');
