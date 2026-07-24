const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/backup-power-costs.js');

const result = engine.calculate({
  loadWatts: 1000, outageHours: 4, days: 26,
  fuelUsePerHour: 1, fuelPrice: 1000, generatorMaintenance: 10000,
  batterySystemCost: 1200000, batteryLifeMonths: 48, rechargeTariff: 200, roundTripEfficiency: 85, batteryMaintenance: 5000,
  solarSystemCost: 3000000, solarLifeMonths: 120, solarMaintenance: 10000
});
assert.equal(result.runtimeHours, 104);
assert.equal(result.backupEnergyKwh, 104);
assert.equal(result.generatorFuelUnits, 104);
assert.equal(result.generatorMonthly, 114000);
assert.ok(Math.abs(result.batteryRechargeKwh - 122.3529411764706) < 1e-9);
assert.ok(Math.abs(result.batteryMonthly - 54470.58823529412) < 1e-9);
assert.equal(result.solarMonthly, 35000);
assert.equal(result.lowestScenario, 'solar');
assert.equal(result.lowestMonthly, 35000);
assert.equal(result.annualLowestEquivalent, 420000);

assert.throws(() => engine.calculate({}), /Essential load/);
assert.throws(() => engine.calculate({ loadWatts: 0 }), /Essential load/);
assert.throws(() => engine.calculate({ loadWatts: 1, outageHours: 25 }), /Backup hours/);
assert.throws(() => engine.calculate({ loadWatts: 1, outageHours: 1, days: 32 }), /Backup days/);
assert.throws(() => engine.calculate({ loadWatts: 1, outageHours: 1, days: 1, fuelUsePerHour: -1 }), /Fuel use/);
assert.throws(() => engine.calculate({ loadWatts: 1, outageHours: 1, days: 1, fuelUsePerHour: 0, fuelPrice: 0, generatorMaintenance: 0, batterySystemCost: 0, batteryLifeMonths: 0 }), /Battery service life/);
assert.throws(() => engine.calculate({ loadWatts: 1, outageHours: 1, days: 1, fuelUsePerHour: 0, fuelPrice: 0, generatorMaintenance: 0, batterySystemCost: 0, batteryLifeMonths: 1, rechargeTariff: 0, roundTripEfficiency: 0 }), /round-trip efficiency/);

console.log('backup-power-costs engine: 17 checks passed');
