const assert = require('assert');
const engine = require('../../assets/js/engines/bj-paye.js');
const server = require('../../netlify/functions/_engines/bj-paye.js');

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.01, `${label}: expected ${expected}, received ${actual}`);
}

near(engine.calculate({ grossMonthly: 60000 }).itsMonthly, 0, 'first band exempt');
near(engine.calculate({ grossMonthly: 150000 }).baseItsMonthly, 9000, 'second boundary');
near(engine.calculate({ grossMonthly: 250000 }).baseItsMonthly, 24000, 'third boundary');
near(engine.calculate({ grossMonthly: 500000 }).baseItsMonthly, 71500, 'fourth boundary');
near(engine.calculate({ grossMonthly: 600000 }).baseItsMonthly, 101500, 'top band');

const standard = engine.calculate({ grossMonthly: 500000, month: 'standard', riskRate: 0.01 });
near(standard.employeeCnssMonthly, 18000, 'employee CNSS');
near(standard.taxBaseMonthly, 500000, 'CNSS is not subtracted from ITS base');
near(standard.employerCnssMonthly, 82000, 'minimum employer total');
near(standard.netMonthly, 410500, 'standard net');
near(standard.itsAnnual, 862000, 'annual ITS includes March and June levies');

near(engine.calculate({ grossMonthly: 500000, month: 'march' }).ortbLevy, 1000, 'March ORTB levy');
near(engine.calculate({ grossMonthly: 500000, month: 'june' }).ortbLevy, 3000, 'June ORTB levy');
near(engine.calculate({ grossMonthly: 60000, month: 'june' }).ortbLevy, 0, 'June first-band exemption');
near(engine.calculate({ grossMonthly: 500000, riskRate: 0.04 }).employerCnssMonthly, 97000, 'maximum employer risk rate');

const reversed = engine.reverse({ netMonthly: standard.netMonthly, month: 'standard', riskRate: 0.01 });
near(reversed.grossMonthly, 500000, 'reverse calculation');
assert.strictEqual(engine.sourceCheckedOn, '2026-07-22');
assert.strictEqual(engine.formulaParameters.employeeCnssDeductibleFromItsBase, false);
const serverResult = server.calculate({ grossMonthly: 500000, month: 'standard', riskRate: 0.01 });
near(serverResult.result.netMonthly, standard.netMonthly, 'server monthly parity');
near(serverResult.result.netAnnual, standard.netAnnual, 'server annual parity');
near(serverResult.employer.totalCostMonthly, standard.employerCostMonthly, 'server employer parity');

console.log('Benin PAYE official monthly fixtures passed.');
