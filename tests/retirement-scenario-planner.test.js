'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const planner = require('../assets/js/engines/retirement-scenario-planner.js');

const now = '2026-07-22T12:00:00Z';
const fixture = {
  currency: 'KES',
  currentAge: 35,
  targetAge: 60,
  balance: 1000000,
  monthlyContribution: 10000,
  annualSpending: 600000,
  otherAnnualIncome: 120000,
  realReturnPct: 0,
  withdrawalRatePct: 4,
  assumptionSource: 'My adviser review notes',
  assumptionDate: '2026-07-20'
};

function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

const result = planner.calculate(fixture, now);
assert.equal(result.ok, true);
assert.equal(result.months, 300);
assert.equal(result.targetAnnualPortfolioIncome, 480000);
assert.equal(result.targetFund, 12000000);
assert.equal(result.projectedFund, 4000000);
assert.equal(result.gap, -8000000);
close(result.requiredMonthlyContribution, 36666.666666666664);
assert.equal(result.contributedPrincipal, 4000000);
assert.equal(result.modeledGrowth, 0);
assert.equal(result.modeledAnnualSpendingCapacity, 280000);
assert.equal(result.crossMonth, null);
assert.equal(result.crossAge, null);

const covered = planner.calculate({
  ...fixture,
  balance: 1,
  monthlyContribution: 0,
  annualSpending: 100000,
  otherAnnualIncome: 120000
}, now);
assert.equal(covered.ok, true);
assert.equal(covered.targetFund, 0);
assert.equal(covered.requiredMonthlyContribution, 0);
assert.equal(covered.crossMonth, 0);
assert.equal(covered.crossAge, 35);

const fv = planner.futureValue(1000, 100, 0.06, 24);
const monthlyRate = Math.pow(1.06, 1 / 12) - 1;
const factor = Math.pow(1 + monthlyRate, 24);
close(fv.value, 1000 * factor + 100 * ((factor - 1) / monthlyRate));

assert.equal(planner.calculate({...fixture, targetAge: 35}, now).error, 'invalid_age');
assert.equal(planner.calculate({...fixture, balance: -1}, now).error, 'invalid_amount');
assert.equal(planner.calculate({...fixture, currency: 'K'}, now).error, 'invalid_assumption');
assert.equal(planner.calculate({...fixture, realReturnPct: 31}, now).error, 'invalid_assumption');
assert.equal(planner.calculate({...fixture, withdrawalRatePct: 0}, now).error, 'invalid_assumption');
assert.equal(planner.calculate({...fixture, assumptionDate: '2025-07-20'}, now).error, 'invalid_evidence');
assert.equal(planner.calculate({...fixture, assumptionDate: '2026-07-23'}, now).error, 'invalid_evidence');
assert.equal(planner.validDate('2026-07-22', now), true);
assert.equal(planner.validDate('2025-07-22', now), true);
assert.equal(planner.validDate('2025-07-21', now), false);

const root = path.resolve(__dirname, '..');
const routes = [
  'tools/retirement-planner/index.html',
  'fr/tools/planificateur-retraite/index.html',
  'sw/zana/mpango-wa-kustaafu-mapema/index.html'
];
for (const route of routes) {
  const html = fs.readFileSync(path.join(root, route), 'utf8');
  assert.match(html, /data-retirement-planner/);
  assert.match(html, /retirement-scenario-planner\.js/);
  assert.match(html, /investor\.gov\/financial-tools-calculators\/calculators\/savings-goal-calculator/);
  assert.doesNotMatch(html, /\.netlify\/functions\/ai-advisor|Treasury Bills|Barista FIRE|Fat FIRE|Lean FIRE|15 African countries/i);
}

const controller = fs.readFileSync(path.join(root, 'assets/js/pages/retirement-planner-vip.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|localStorage|sessionStorage|analytics/i);
assert.match(controller, /retirement-scenario\.csv/);
assert.match(controller, /retirement-scenario\.json/);
assert.match(controller, /noGate:true/);
assert.match(controller, /skipGate:true/);

console.log('retirement-scenario-planner: all checks passed');
