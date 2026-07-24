'use strict';
const assert = require('assert');
const engine = require('../engines/src/investment-return-engine.js');

function close(actual, expected, label, tolerance) {
  assert.ok(Math.abs(actual - expected) <= (tolerance == null ? 0.01 : tolerance), `${label}: expected ${expected}, got ${actual}`);
}

const zeroRate = engine.project({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 0, years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0 });
close(zeroRate.finalValue, 2200, 'zero-rate value');
close(zeroRate.totalContributed, 2200, 'zero-rate contributions');
close(zeroRate.projectedGain, 0, 'zero-rate gain');

const monthlyEnd = engine.project({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12, years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 6 });
close(monthlyEnd.finalValue, 2395.0753, 'monthly end-of-month value');
close(monthlyEnd.effectiveAnnualRate, Math.pow(1.01, 12) - 1, 'effective annual return', 1e-10);
close(monthlyEnd.realEffectiveAnnualRate, Math.pow(1.01, 12) / 1.06 - 1, 'real annual return', 1e-10);

const monthlyBeginning = engine.project({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12, years: 1, compoundsPerYear: 12, contributionTiming: 'beginning', inflationRatePercent: 0 });
close(monthlyBeginning.finalValue, 2407.7578, 'monthly beginning-of-month value');
assert.ok(monthlyBeginning.finalValue > monthlyEnd.finalValue, 'beginning timing should receive one extra month of growth');

const annualLumpSum = engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: 12, years: 1, compoundsPerYear: 1, contributionTiming: 'end', inflationRatePercent: 0 });
close(annualLumpSum.finalValue, 1120, 'annual compounding lump sum');
close(annualLumpSum.lumpSumCagr, 0.12, 'lump-sum CAGR', 1e-10);

const loss = engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: -10, years: 1, compoundsPerYear: 1, contributionTiming: 'end', inflationRatePercent: 0 });
close(loss.finalValue, 900, 'negative-return scenario');
assert.ok(loss.projectedGain < 0);

const sensitivity = engine.sensitivity({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 10, years: 2, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 4 }, 2);
assert.deepStrictEqual(sensitivity.map(item => item.annualRatePercent), [8, 10, 12]);
assert.ok(sensitivity[0].finalValue < sensitivity[1].finalValue && sensitivity[1].finalValue < sensitivity[2].finalValue);
assert.deepStrictEqual(engine.sensitivity({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: 1000, years: 1, compoundsPerYear: 1, contributionTiming: 'end', inflationRatePercent: 0 }, 2).map(item => item.annualRatePercent), [998, 1000, 1000]);

assert.throws(() => engine.project({ initialInvestment: 0, monthlyContribution: 0, annualRatePercent: 10, years: 1 }), /Enter an initial investment/);
assert.throws(() => engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: -100, years: 1 }), /above -100/);
assert.throws(() => engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: 10, years: 0 }), /between one month/);
console.log('investment-return-engine.test.js passed');
