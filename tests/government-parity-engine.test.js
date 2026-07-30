'use strict';

const assert = require('assert');
const engine = require('../assets/js/engines/government-parity-engine');

const pension = engine.calculatePension({
  currentBalance: 1000,
  monthlyContribution: 100,
  years: 1,
  annualRate: 0,
});
assert.equal(pension.ok, true);
assert.equal(pension.total, 2200);
assert.equal(pension.contributed, 2200);
assert.equal(engine.calculatePension({ currentBalance: 0, monthlyContribution: 1, years: 0, annualRate: 5 }).ok, false);

assert.deepEqual(engine.calculateLand({
  propertyValue: 100000,
  stampRate: 2,
  registrationRate: 1,
  fixedCosts: 1000,
  contingencyRate: 10,
}), {
  ok: true,
  stamp: 2000,
  registration: 1000,
  fixedCosts: 1000,
  contingency: 400,
  total: 4400,
});

const budget = engine.calculateBudget({ previousAmount: 100, currentAmount: 125, population: 5 });
assert.equal(budget.ok, true);
assert.equal(budget.changePercent, 25);
assert.equal(budget.currentPerPerson, 25);

assert.deepEqual(engine.calculatePermit({
  mainApplicants: 2,
  dependants: 1,
  mainFee: 100,
  dependantFee: 50,
  supportingCosts: 20,
  professionalCosts: 10,
  travelCosts: 10,
  otherCosts: 10,
  contingencyRate: 10,
}), {
  ok: true,
  mainTotal: 200,
  dependantTotal: 50,
  otherTotal: 50,
  contingency: 30,
  total: 330,
});
assert.equal(engine.calculatePermit({
  mainApplicants: 1.5,
  dependants: 0,
  mainFee: 0,
  dependantFee: 0,
  supportingCosts: 0,
  professionalCosts: 0,
  travelCosts: 0,
  otherCosts: 0,
  contingencyRate: 0,
}).ok, false);

const now = '2026-07-29T00:00:00.000Z';
const verifiedSource = {
  status: 'ok',
  httpStatus: 200,
  contentHash: 'verified-content-hash',
  changedSinceLastRun: false,
  checkedAt: '2026-07-23T00:00:00.000Z',
};
assert.deepEqual(engine.evaluateSourceFreshness(verifiedSource, 7, now), {
  available: true,
  mode: 'fresh_verified',
  reason: 'evidence_current',
  ageDays: 6,
  cadenceDays: 7,
});
assert.equal(engine.evaluateSourceFreshness({
  ...verifiedSource,
  checkedAt: '2026-07-21T00:00:00.000Z',
}, 7, now).mode, 'stale');
assert.equal(engine.evaluateSourceFreshness({
  status: 'ok',
  checkedAt: '2026-07-29T00:00:00.000Z',
}, 7, now).available, false);
assert.equal(engine.evaluateSourceFreshness({
  ...verifiedSource,
  status: 'blocked',
}, 7, now).mode, 'manual');
assert.equal(engine.evaluateSourceFreshness({
  ...verifiedSource,
  checkedAt: '2026-06-30T00:00:00.000Z',
}, 30, now).available, true);
assert.equal(engine.evaluateSourceFreshness({
  ...verifiedSource,
  checkedAt: '2026-06-28T00:00:00.000Z',
}, 30, now).mode, 'stale');

const currentElection = {
  dateStatus: 'official',
  sourceStatus: 'official',
  sources: [{
    type: 'official',
    url: 'https://elections.example.gov/notice',
    checkedAt: '2026-07-23',
  }],
};
assert.equal(engine.evaluateElectionFreshness(currentElection, '2026-07-23', 7, now).available, true);
assert.equal(engine.evaluateElectionFreshness({
  ...currentElection,
  sources: [{ ...currentElection.sources[0], checkedAt: '2026-07-21' }],
}, '2026-07-21', 7, now).mode, 'stale');
assert.equal(engine.evaluateElectionFreshness({
  ...currentElection,
  dateStatus: 'tentative',
}, '2026-07-23', 7, now).mode, 'manual');

assert.deepEqual(
  engine.verificationGaps([{ id: 'a' }, { id: 'b' }], ['a']),
  [{ id: 'b' }],
);
assert.equal(engine.createFoiDraft({ authority: '', subject: 'x', records: 'y' }).ok, false);
assert.match(
  engine.createFoiDraft({ authority: 'Autorité exemple', subject: 'Contrats', records: 'Contrats 2025' }).text,
  /aucune identité ni coordonnée/i,
);

console.log('French Government shared deterministic engine verified.');
