const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/route-fares.js');

const basic = engine.calculate({ fare: 100, ridesPerDay: 2, days: 22, extraPerRide: 20, bufferPercent: 10 });
assert.equal(basic.totalRides, 44);
assert.equal(basic.base, 5280);
assert.equal(basic.buffer, 528);
assert.equal(basic.total, 5808);
assert.equal(basic.daily, 264);
assert.equal(basic.changePercent, null);

const changed = engine.calculate({ fare: 150, ridesPerDay: 1, days: 1, previousFare: 120 });
assert.equal(changed.changePercent, 25);
assert.throws(() => engine.calculate({ fare: 0, ridesPerDay: 2, days: 20 }), /Fare per ride/);
assert.throws(() => engine.calculate({ fare: 100, ridesPerDay: 0, days: 20 }), /Rides per day/);
assert.throws(() => engine.calculate({ fare: 100, ridesPerDay: 2, days: 0 }), /Travel days/);
assert.throws(() => engine.calculate({ fare: 100, ridesPerDay: 2, days: 20, bufferPercent: 101 }), /Buffer/);
assert.throws(() => engine.calculate({ fare: 100, ridesPerDay: 21, days: 20 }), /Rides per day/);
console.log('route-fares engine: 8 checks passed');
