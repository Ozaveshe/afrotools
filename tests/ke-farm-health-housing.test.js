'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
for (const file of ['engines/src/farm-payroll-engine.js','engines/farm-payroll-engine.js']) {
  test(file + ' Kenya monthly health and matched housing contributions', () => {
    const sandbox = vm.createContext({ window: {} });
    for (const f of ['data/agriculture/farm-payroll-data.js', file]) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), sandbox);
    }
    const { FarmPayrollEngine, FarmPayrollData } = sandbox.window.AfroTools;
    const wages = { workerType:'permanent', grossPay:30000, inKindHousing:5000, inKindFood:2000 };
    const calculate = inputs => FarmPayrollEngine.calculate({ ...wages, ...inputs }, FarmPayrollData.KE);
    for (const [base, shif] of [[5000,300],[10909.09,300],[10910,300.03],[120000,3300]]) {
      const result = calculate({shifSalary:base, housingLevySalary:20000});
      assert.equal(result.deductions.find(row=>row.name==='SHIF').amount,shif);
      assert.equal(result.deductions.find(row=>row.name==='Housing Levy').amount,300);
      assert.equal(result.employerContributions.find(row=>row.name==='Employer Housing Levy').amount,300);
      assert.equal(result.employerContributions.some(row=>row.name.includes('SHIF')),false);
    }
    assert.equal(calculate({}).netPay,26925);
    assert.equal(calculate({housingLevySalary:-1}).error,true);
    assert.equal(calculate({shifSalary:Infinity}).error,true);
  });
}
