'use strict';
const assert = require('assert');
const engine = require('../../assets/js/engines/ss-paye');
const server = require('../../netlify/functions/_engines/ss-paye');
function near(actual, expected, label) { assert.ok(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`); }
[[0,0],[20000,0],[20001,0.05],[40000,1000],[40001,1000.10],[57000,2700],[57001,2700.15],[90000,7650],[90001,7650.20],[100000,9650]].forEach(([taxable,pit]) => near(engine.pitMonthly(taxable).pit,pit,`PIT at ${taxable}`));
const fixtures = [
  {gross:0,employeeNsif:0,taxableIncome:0,pit:0,surtax:0,totalTax:0,net:0,employerNsif:0,employerCost:0},
  {gross:20000,employeeNsif:1600,taxableIncome:18400,pit:0,surtax:0,totalTax:0,net:18400,employerNsif:3400,employerCost:23400},
  {gross:25000,employeeNsif:2000,taxableIncome:23000,pit:150,surtax:45,totalTax:195,net:22805,employerNsif:4250,employerCost:29250},
  {gross:50000,employeeNsif:4000,taxableIncome:46000,pit:1600,surtax:480,totalTax:2080,net:43920,employerNsif:8500,employerCost:58500},
  {gross:100000,employeeNsif:8000,taxableIncome:92000,pit:8050,surtax:2415,totalTax:10465,net:81535,employerNsif:17000,employerCost:117000},
  {gross:1500000,employeeNsif:120000,taxableIncome:1380000,pit:265650,surtax:79695,totalTax:345345,net:1034655,employerNsif:255000,employerCost:1755000}
];
fixtures.forEach(f => { const r=engine.calculate({gross:f.gross}); assert.strictEqual(r.ok,true); ['gross','employeeNsif','taxableIncome','pit','surtax','totalTax','net','employerNsif','employerCost'].forEach(k=>near(r[k],f[k],`${k} at ${f.gross}`)); });
const noNsif=engine.calculate({gross:100000,includeNsif:false});
near(noNsif.employeeNsif,0,'no NSIF employee'); near(noNsif.taxableIncome,100000,'no NSIF base'); near(noNsif.pit,9650,'no NSIF PIT'); near(noNsif.surtax,2895,'no NSIF surtax'); near(noNsif.net,87455,'no NSIF net'); near(noNsif.employerNsif,0,'no NSIF employer');
assert.strictEqual(engine.calculate({gross:-1}).ok,false);
const api=server.calculate({gross:100000});
assert.strictEqual(api.deductions.nsif,96000); assert.strictEqual(api.tax.grossTax,96600); assert.strictEqual(api.tax.surtax,28980); assert.strictEqual(api.tax.netTax,125580); assert.strictEqual(api.result.netMonthly,81535); assert.strictEqual(api.employer.totalCostMonthly,117000);
assert.strictEqual(server.calculate({grossAnnual:0}).result.netAnnual,0);
assert.strictEqual(engine.formulaParameters.employeeNsifDeductibleFromPitBase,true); assert.strictEqual(engine.pitSurtaxRate,0.30); assert.strictEqual(engine.sourceCheckedOn,'2026-07-22');
console.log('South Sudan PIT, surtax, and NSIF official fixtures passed.');
