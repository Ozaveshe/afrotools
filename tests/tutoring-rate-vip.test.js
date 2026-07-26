const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../tools/tutoring-rate/tutoring-rate-engine.js");

const base = {
  targetIncome: 300000, monthlyCosts: 40000, sessionsPerWeek: 10, weeksPerMonth: 4,
  lessonMinutes: 60, groupSize: 1, prepMinutes: 20, adminMinutes: 10, travelMinutes: 0,
  sessionCost: 1000, taxReserve: 15, riskReserve: 5, packageSessions: 5,
  packageDiscount: 5, proposedPrice: ""
};

test("calculates a transparent revenue floor from user inputs", () => {
  const result = engine.calculate(base);
  assert.equal(result.ok, true);
  assert.equal(result.sessionsMonthly, 40);
  assert.equal(result.variableCostsMonthly, 40000);
  assert.equal(result.requiredRevenueMonthly, 475000);
  assert.equal(result.requiredSessionRevenue, 11875);
});

test("group quote divides required session revenue, not the workload", () => {
  const solo = engine.calculate(base);
  const group = engine.calculate({ ...base, groupSize: 5 });
  assert.equal(group.perLearnerSession, solo.requiredSessionRevenue / 5);
  assert.equal(group.workHoursMonthly, solo.workHoursMonthly);
});

test("includes unbilled work in effective hourly income", () => {
  const result = engine.calculate(base);
  assert.equal(result.workMinutesSession, 90);
  assert.equal(result.workHoursMonthly, 60);
  assert.equal(result.effectiveWorkHourIncome, 5000);
});

test("rejects impossible reserve and invalid capacity assumptions", () => {
  assert.equal(engine.calculate({ ...base, taxReserve: 50, riskReserve: 30 }).ok, false);
  assert.equal(engine.calculate({ ...base, sessionsPerWeek: 0 }).ok, false);
  assert.equal(engine.calculate({ ...base, groupSize: 1.5 }).ok, false);
});

test("compares a proposed quote without calling it a market benchmark", () => {
  const result = engine.calculate({ ...base, proposedPrice: 12000 });
  assert.equal(result.comparison.proposedMonthlyRevenue, 480000);
  assert.equal(result.comparison.monthlyGap, 5000);
});
