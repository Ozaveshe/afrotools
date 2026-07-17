const assert = require('assert');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const engine = require(path.join(repoRoot, 'assets/js/engines/solar-roi-engine.js'));

function approx(actual, expected, tolerance, message) {
  assert(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

const normal = engine.calculate({
  systemKw: 5,
  avgSunHours: 5.5,
  monthlyElectricitySpend: 90000,
  monthlyGeneratorFuelSpend: 60000,
  outageHoursPerDay: 6,
  tariffPerKwh: 68,
  fuelPricePerLitre: 700,
  fuelBaselinePerLitre: 700,
  installCostPerKw: 725000,
  batteryCostTotal: 1200000,
  annualMaintenance: 125000,
  depositPct: 20,
  annualInterestRatePct: 18,
  loanTermMonths: 36,
  includeFinancing: true,
  dailyLoadKwh: 15,
  peakLoadKw: 5,
  generatorSizeKva: 7.5,
  generatorPowerFactor: .8,
  backupHours: 8,
  panelWatt: 550,
  tariffEscalationPct: 5,
  fuelEscalationPct: 8,
  panelDegradationPct: .6,
  batteryReplacementYear: 8,
  inverterReplacementAllowancePct: 10,
  discountRatePct: 10
});

assert.strictEqual(normal.annualCashflows.length, 25, 'default analysis returns 25 annual cashflow rows');
assert(normal.simplePaybackYears > 0, 'simple payback is positive');
assert(normal.discountedPaybackYears === null || normal.discountedPaybackYears >= normal.simplePaybackYears, 'discounted payback is no earlier than simple payback');
assert(normal.tenYearNetSavings !== normal.twentyFiveYearNetSavings, '10-year and 25-year net savings are separate horizons');
assert(normal.finance.monthlyPayment > 0, 'finance monthly payment is calculated');
assert(normal.finance.totalInterestPaid > 0, 'total interest paid is calculated');
assert(normal.firstYearCashflow < normal.firstYearProjectCashflow, 'financed owner cashflow includes loan payments');
assert(normal.npv !== 0, 'NPV is calculated');
assert(normal.irr === null || Number.isFinite(normal.irr), 'IRR is either feasible or null');
assert(normal.lcoe > 0, 'LCOE is positive');
assert(normal.co2AvoidedKg > 0, 'CO2 avoided is positive');
assert(normal.generatorLitresAvoided > 0, 'generator litres avoided is positive');
assert(normal.generatorRunHoursAvoided > 0, 'generator run-hours avoided is positive');
assert(normal.roofAreaSqm > 0, 'roof area estimate is positive');
assert(normal.panelCount > 0, 'panel count is positive');
assert.strictEqual(normal.sizing.selectedSystemPanelCount, 10, 'selected system panel count uses system size and panel wattage');
assert(normal.sizing.selectedSystemRoofAreaSqm > 0, 'selected system roof area is calculated');
assert.strictEqual(normal.sizing.panelAreaSqm, 2.6, 'panel area assumption is exposed');
assert(normal.suggestedInverterKw > 0, 'suggested inverter size is positive');
assert.strictEqual(normal.sizing.generatorKw, 6, 'generator kVA converts to usable kW with power factor');
assert(normal.sizing.suggestedInverterContinuousKw >= normal.sizing.peakLoadKw, 'continuous inverter rating covers peak load');
assert(normal.sizing.inverterHeadroomPct >= 0, 'inverter headroom is exposed');
assert(normal.sizing.generatorLoadRatio > 0, 'generator load ratio is exposed');
assert(normal.suggestedBatteryUsableKwh > 0, 'suggested battery usable capacity is positive');
assert(normal.suggestedBatteryNominalKwh >= normal.suggestedBatteryUsableKwh, 'nominal battery estimate is at least usable capacity');
assert(normal.sizing.suggestedBatteryNominalKwh >= normal.sizing.suggestedBatteryUsableKwh, 'sizing exposes nominal and usable battery capacity');

const expectedPayment = engine.monthlyLoanPayment(normal.finance.principal, 18, 36);
approx(normal.finance.monthlyPayment, expectedPayment, .01, 'monthly payment matches finance helper');

const zero = engine.calculate({
  systemKw: 0,
  monthlyElectricitySpend: 0,
  monthlyGeneratorFuelSpend: 0,
  tariffPerKwh: 0,
  fuelPricePerLitre: 0,
  installCostPerKw: 0,
  batteryCostTotal: 0,
  annualMaintenance: 0,
  analysisYears: 10,
  dailyLoadKwh: 0,
  peakLoadKw: 0,
  generatorSizeKva: 0
});

assert.strictEqual(zero.annualCashflows.length, 10, 'zero case respects analysisYears');
assert.strictEqual(zero.systemCost, 0, 'zero case has zero system cost');
assert.strictEqual(zero.simplePaybackYears, null, 'zero case has no payback');
assert.strictEqual(zero.discountedPaybackYears, 0, 'zero initial cost has immediate discounted payback');
assert.strictEqual(zero.npv, 0, 'zero case NPV is zero');
assert.strictEqual(zero.lcoe, null, 'zero generation has no LCOE');
assert.strictEqual(zero.panelCount, 0, 'zero PV has zero panel count');
assert.strictEqual(zero.sizing.selectedSystemPanelCount, 0, 'zero selected system has zero selected-panel count');

const extreme = engine.calculate({
  systemKw: 250,
  avgSunHours: 7,
  monthlyElectricitySpend: 50000000,
  monthlyGeneratorFuelSpend: 30000000,
  outageHoursPerDay: 24,
  tariffPerKwh: 1000,
  fuelPricePerLitre: 2500,
  fuelBaselinePerLitre: 2500,
  installCostPerKw: 900000,
  batteryCostTotal: 80000000,
  annualMaintenance: 9000000,
  depositPct: 100,
  annualInterestRatePct: 35,
  loanTermMonths: 1,
  includeFinancing: true,
  dailyLoadKwh: 2500,
  peakLoadKw: 500,
  generatorSizeKva: 700,
  backupHours: 24,
  tariffEscalationPct: 15,
  fuelEscalationPct: 20,
  panelDegradationPct: 2,
  analysisYears: 25
});

assert(Number.isFinite(extreme.npv), 'extreme case NPV remains finite');
assert(Number.isFinite(extreme.twentyFiveYearNetSavings), 'extreme case 25-year savings remains finite');
assert.strictEqual(extreme.finance.principal, 0, '100% deposit leaves no financed principal');
assert.strictEqual(extreme.finance.totalInterestPaid, 0, 'no principal means no interest');
assert(extreme.panelCount > 0, 'extreme case still sizes panels');
assert(extreme.suggestedInverterKw > 0, 'extreme case still sizes inverter');

const missing = engine.calculate({});

assert.strictEqual(missing.annualCashflows.length, 25, 'missing input falls back to default horizon');
assert.strictEqual(missing.systemCost, 0, 'missing cost inputs do not invent system cost');
assert.strictEqual(missing.simplePaybackYears, null, 'missing savings have no simple payback');
assert.strictEqual(missing.finance.monthlyPayment, 0, 'missing finance inputs do not create payment');
assert.strictEqual(missing.sizing.sunHours, 5, 'missing sun hours uses planning default');
assert.strictEqual(missing.lcoe, null, 'missing generation has no LCOE');

const explicitZeroMaintenance = engine.calculate({
  systemKw: 1,
  avgSunHours: 5,
  monthlyElectricitySpend: 100000,
  tariffPerKwh: 100,
  installCostPerKw: 100000,
  batteryCostTotal: 0,
  annualMaintenance: 0
});

assert.strictEqual(explicitZeroMaintenance.annualCashflows[0].maintenance, 0, 'explicit zero maintenance is preserved');

const quickCountry = engine.calculateCountryQuick({
  systemKW: 3,
  currentMonthlyBill: 45000
}, 'NG', {
  countries: {
    NG: {
      name: 'Nigeria',
      currency: 'NGN',
      currencySymbol: 'NGN ',
      usdRate: 1650,
      electricityTariff: { residential: 68 },
      solar: {
        avgSunHours: 5.5,
        systems: {
          '3kW': { total: 2900000 }
        }
      },
      fuel: { petrol: 700 }
    }
  }
});

assert.strictEqual(quickCountry.error, undefined, 'legacy country quick adapter calculates without error');
assert(quickCountry.paybackYears.includes('years'), 'legacy adapter returns country page payback string');
assert(quickCountry.roi25yr.startsWith('NGN '), 'legacy adapter returns localized 25-year value');
assert(quickCountry.raw.annualCashflows.length === 25, 'legacy adapter exposes raw clean-engine result');

function assertDecision(input, expectedLabel) {
  const decision = engine.decisionEngine(input);
  assert.strictEqual(decision.label, expectedLabel, `decision label for ${expectedLabel}`);
  assert.strictEqual(decision.reasons.length, 3, `${expectedLabel} returns three reasons`);
  assert.strictEqual(decision.nextSteps.length, 3, `${expectedLabel} returns three next steps`);
  assert(decision.headline && decision.headline.length > 20, `${expectedLabel} has a plain-English headline`);
  return decision;
}

assertDecision({
  monthlyElectricitySpend: 0,
  monthlyGeneratorFuelSpend: 0,
  outageHoursPerDay: 6
}, 'Too little data');

assertDecision({
  paybackYears: 4,
  outageHoursPerDay: 5,
  monthlyGeneratorFuelSpend: 60000,
  monthlyElectricitySpend: 90000,
  financeMonthlyPayment: 0,
  netMonthlyAfterMaintenance: 110000,
  batteryNeed: 'Good',
  systemAffordability: 'Lower',
  fuelAvoidedLitresPerMonth: 35
}, 'Strong solar case');

assertDecision({
  paybackYears: 6,
  outageHoursPerDay: 2,
  monthlyGeneratorFuelSpend: 5000,
  monthlyElectricitySpend: 70000,
  financeMonthlyPayment: 0,
  netMonthlyAfterMaintenance: 50000,
  batteryNeed: 'Basic',
  systemAffordability: 'Lower',
  fuelAvoidedLitresPerMonth: 4
}, 'Solar is good, battery optional');

assertDecision({
  paybackYears: 6.5,
  outageHoursPerDay: 8,
  monthlyGeneratorFuelSpend: 90000,
  monthlyElectricitySpend: 35000,
  financeMonthlyPayment: 0,
  netMonthlyAfterMaintenance: 45000,
  batteryNeed: 'Strong',
  systemAffordability: 'Moderate',
  fuelAvoidedLitresPerMonth: 45
}, 'Battery-first backup case');

assertDecision({
  paybackYears: 4.5,
  outageHoursPerDay: 5,
  monthlyGeneratorFuelSpend: 40000,
  monthlyElectricitySpend: 80000,
  financeMonthlyPayment: 150000,
  netMonthlyAfterMaintenance: 90000,
  batteryNeed: 'Good',
  systemAffordability: 'High',
  fuelAvoidedLitresPerMonth: 20
}, 'Quote needed before decision');

assertDecision({
  paybackYears: 11,
  outageHoursPerDay: 9,
  monthlyGeneratorFuelSpend: 30000,
  monthlyElectricitySpend: 20000,
  financeMonthlyPayment: 0,
  netMonthlyAfterMaintenance: 15000,
  batteryNeed: 'Strong',
  systemAffordability: 'High',
  fuelAvoidedLitresPerMonth: 8
}, 'Weak ROI but strong resilience case');

console.log('solar-roi-engine.test.js passed');
