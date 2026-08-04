const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-education-affordability-parity.json');

assert.equal(manifest.apps.length, 8);
assert.equal(new Set(manifest.apps.map(app => app.id)).size, 8);
assert.equal(new Set(manifest.apps.map(app => app.slug)).size, 8);
execFileSync(process.execPath, ['scripts/build-sw-education-affordability-parity.js', '--check'], { cwd: root, stdio: 'inherit' });

for (const app of manifest.apps) {
  const route = path.join(root, 'sw/zana', app.slug, 'index.html');
  const html = fs.readFileSync(route, 'utf8');
  assert.match(html, /^<!doctype html>\n<html\b[^>]*\blang="sw"[^>]*>/);
  assert.ok(html.includes(`https://afrotools.com/sw/zana/${app.slug}/`));
  assert.ok(html.includes(`href="https://afrotools.com${app.english}"`));
  assert.ok(html.includes(`src="${app.engine}`));
  assert.ok(html.includes(`/assets/img/tools/${app.image}`));
  assert.ok(fs.existsSync(path.join(root, 'assets/img/tools', app.image)));
  assert.ok(!/<iframe\b/i.test(html));
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  assert.ok(!/Calculate|Download|Reset|Privacy|Results|School option|Save locally/.test(visible));
  assert.ok(html.includes('Pakua JSON') && html.includes('Pakua TXT') && html.includes('Pakua PDF'));
  for (const field of app.fields) assert.ok(html.includes(`name="${field[0]}"`));
}

const school = require('../tools/school-fees/school-fees-engine.js').calculate({ school: 'A', currency: 'KES', tuition: 120000, extras: 24000, monthlySupport: 15000, rhythm: 3 });
assert.equal(school.annual, 144000); assert.equal(school.monthlyReserve, 12000); assert.equal(school.paymentChunk, 48000);
const helb = require('../tools/ke-helb/helb-engine.js').calculate({ balance: 120000, annualRate: 12, monthlyPayment: 11000, extraPayment: 0 });
assert.equal(helb.valid, true); assert.equal(helb.firstMonthInterest, 1200);
const budget = require('../tools/student-budget/student-budget-engine.js').calculate({ periodMonths: 4, monthlyIncome: 1000, periodFunding: 500, monthlyExpenses: { housing: 300, food: 200, transport: 100 }, periodExpenses: { tuition: 1000, setup: 100 } });
assert.equal(budget.totalResources, 4500); assert.equal(budget.totalExpenses, 3500); assert.equal(budget.balance, 1000);
const salary = require('../tools/teacher-salary/teacher-salary-engine.js').validate({ baseMonthly: 100000, allowancesMonthly: 20000, deductionsMonthly: 15000, weeklyHours: 40, workingWeeks: 48 });
assert.equal(salary.grossCashMonthly, 120000); assert.equal(salary.estimatedTakeHomeMonthly, 105000);
const loan = require('../tools/student-loan-repay/student-loan-engine.js').compare({ principal: 100000, annualRate: 12, months: 36, extraPayment: 1000 });
assert.ok(loan.plan.payoffMonths < loan.baseline.payoffMonths);
const tutor = require('../tools/tutoring-rate/tutoring-rate-engine.js').calculate({ targetIncome: 300000, monthlyCosts: 40000, sessionsPerWeek: 10, weeksPerMonth: 4, lessonMinutes: 60, groupSize: 1, prepMinutes: 20, adminMinutes: 10, travelMinutes: 0, sessionCost: 1000, taxReserve: 15, riskReserve: 5, packageSessions: 5, packageDiscount: 5, proposedPrice: '' });
assert.equal(tutor.requiredSessionRevenue, 11875);
const savings = require('../tools/edu-savings/edu-savings-engine.js').calculate({ todayCost: 10000, months: 12, inflationRate: 0, currentSavings: 1000, monthlyContribution: 500, annualGrowthRate: 0, timing: 'end' });
assert.equal(savings.projectedFund, 7000); assert.equal(savings.requiredMonthlyContribution, 750);
const abroad = require('../tools/study-abroad-cost/study-cost-engine.js').calculate({ months: 18, tuitionAnnual: 10000, tuitionYears: 2, accommodationMonthly: 500, livingMonthly: 300, insuranceAnnual: 1200, governmentFees: 400, setupCosts: 1000, confirmedAid: 5000, availableFunds: 12000, upfrontTuition: 5000, otherUpfront: 600, refundableDeposit: 1000 });
assert.equal(abroad.gross, 37600); assert.equal(abroad.fundingGap, 20600); assert.equal(abroad.upfrontCash, 8000);
console.log('Swahili education affordability parity: 8/8 source owners and engine oracles passed');
