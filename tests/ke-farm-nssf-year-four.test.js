'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const engine of ['engines/src/farm-payroll-engine.js', 'engines/farm-payroll-engine.js']) {
  test(engine + ' applies matched Kenya Year 4 tiers to monthly pensionable wages', () => {
    const context = vm.createContext({ window: {} });
    for (const file of ['data/agriculture/farm-payroll-data.js', engine]) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    const api = context.window.AfroTools;
    const countries = Object.values(api).find(value => value.KE);
    const input = { workerType: 'permanent', grossPay: 30000, inKindHousing: 5000, inKindFood: 2000, numWorkers: 1 };
    for (const [wages, first, second] of [[0,0,0],[5000,300,0],[9000,540,0],[30000,540,1260],[108000,540,5940],[200000,540,5940]]) {
      const result = api.FarmPayrollEngine.calculate({ ...input, nssfMonthlyWages: wages }, countries.KE);
      for (const rows of [result.deductions, result.employerContributions]) {
        assert.equal(rows[0].amount, first);
        assert.equal(rows[1].amount, second);
      }
    }
    const ordinary = api.FarmPayrollEngine.calculate(input, countries.KE);
    assert.equal(ordinary.deductions[1].amount, 1260);
    assert.equal(ordinary.netPay, 26627.5);
    const invalid = api.FarmPayrollEngine.calculate({ ...input, nssfMonthlyWages: -1 }, countries.KE);
    assert.equal(invalid.field, 'nssfMonthlyWages');
  });
}
