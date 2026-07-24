(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackupPowerCostsEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, label, options) {
    var parsed = Number(value);
    var min = options && Number.isFinite(options.min) ? options.min : 0;
    var max = options && Number.isFinite(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
    }
    return parsed;
  }

  function calculate(input) {
    input = input || {};
    var loadWatts = number(input.loadWatts, 'Essential load', { min: 1, max: 10000000 });
    var outageHours = number(input.outageHours, 'Backup hours per day', { min: 0.1, max: 24 });
    var days = number(input.days, 'Backup days per month', { min: 1, max: 31 });
    var fuelUsePerHour = number(input.fuelUsePerHour, 'Fuel use per hour', { min: 0, max: 10000 });
    var fuelPrice = number(input.fuelPrice, 'Fuel price per unit', { min: 0, max: 1000000000 });
    var generatorMaintenance = number(input.generatorMaintenance, 'Generator monthly maintenance', { min: 0, max: 1000000000000 });
    var batterySystemCost = number(input.batterySystemCost, 'Battery system cost', { min: 0, max: 1000000000000 });
    var batteryLifeMonths = number(input.batteryLifeMonths, 'Battery service life', { min: 1, max: 600 });
    var rechargeTariff = number(input.rechargeTariff, 'Recharge tariff per kWh', { min: 0, max: 1000000000 });
    var roundTripEfficiency = number(input.roundTripEfficiency, 'Battery round-trip efficiency', { min: 1, max: 100 });
    var batteryMaintenance = number(input.batteryMaintenance, 'Battery monthly maintenance', { min: 0, max: 1000000000000 });
    var solarSystemCost = number(input.solarSystemCost, 'Solar backup system cost', { min: 0, max: 1000000000000 });
    var solarLifeMonths = number(input.solarLifeMonths, 'Solar planning life', { min: 1, max: 600 });
    var solarMaintenance = number(input.solarMaintenance, 'Solar monthly maintenance', { min: 0, max: 1000000000000 });

    var runtimeHours = outageHours * days;
    var backupEnergyKwh = loadWatts / 1000 * runtimeHours;
    var generatorFuelUnits = fuelUsePerHour * runtimeHours;
    var generatorMonthly = generatorFuelUnits * fuelPrice + generatorMaintenance;
    var batteryRechargeKwh = backupEnergyKwh / (roundTripEfficiency / 100);
    var batteryMonthly = batterySystemCost / batteryLifeMonths + batteryRechargeKwh * rechargeTariff + batteryMaintenance;
    var solarMonthly = solarSystemCost / solarLifeMonths + solarMaintenance;
    var scenarios = [
      { id: 'generator', monthly: generatorMonthly },
      { id: 'battery', monthly: batteryMonthly },
      { id: 'solar', monthly: solarMonthly }
    ].sort(function (a, b) { return a.monthly - b.monthly; });

    return {
      runtimeHours: runtimeHours,
      backupEnergyKwh: backupEnergyKwh,
      generatorFuelUnits: generatorFuelUnits,
      generatorMonthly: generatorMonthly,
      batteryRechargeKwh: batteryRechargeKwh,
      batteryMonthly: batteryMonthly,
      solarMonthly: solarMonthly,
      lowestScenario: scenarios[0].id,
      lowestMonthly: scenarios[0].monthly,
      annualLowestEquivalent: scenarios[0].monthly * 12
    };
  }

  return {
    lastUpdated: '2026-07-22',
    formulaParameters: {
      energy: 'load kW × backup hours per day × backup days',
      generator: 'runtime hours × fuel units per hour × entered fuel price + entered maintenance',
      battery: 'entered system cost ÷ entered life months + recharge kWh × entered grid tariff + entered maintenance',
      solar: 'entered system cost ÷ entered life months + entered maintenance',
      comparison: 'lowest modeled monthly equivalent only; not a sizing, payback or lifecycle-cost verdict'
    },
    roundingPolicy: { method: 'unrounded calculation; locale formatting at display', precision: 'full JavaScript number precision' },
    calculate: calculate
  };
});
