const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../assets/js/lib/ng-farm-payroll-contributions.js');
const fixture = { sector: 'private', pension: 'standard', pensionablePay: '60000', health: 'basic', healthBasicPay: '40000', housing: 'participating', housingMonthlyIncome: '100000' };
test('separate scheme bases reconcile employee and employer contributions', () => {
  const r = calculate(fixture); assert.equal(r.valid, true);
  assert.deepEqual(r.rows.map(x => [x.employeeKobo, x.employerKobo]), [[480000,600000],[200000,400000],[250000,0]]);
  assert.equal(r.employeeKobo, 930000); assert.equal(r.employerKobo, 1000000);
});
test('consolidated health uses its own basis and split', () => {
  const r=calculate({...fixture, health:'consolidated', healthConsolidatedPay:'100000'});
  assert.deepEqual([r.rows[1].employeeKobo,r.rows[1].employerKobo],[175000,325000]);
});
test('private housing nonparticipant receives no automatic housing deduction', () => {
  const r=calculate({...fixture,housing:'not-participating',housingMonthlyIncome:undefined});
  assert.equal(r.employeeKobo,680000); assert.equal(r.rows.some(x=>x.scheme==='housing'),false);
});
test('explicit non-applicable schemes need no unused salary bases', () => {
  const r=calculate({sector:'private',pension:'not-applicable',health:'not-applicable',housing:'not-participating'});
  assert.equal(r.valid,true); assert.equal(r.employeeKobo,0); assert.equal(r.employerKobo,0);
});
for(const field of ['pension','health','housing']) for(const value of [undefined,'unknown','toString','__proto__']) test(`${field} ${value} cannot silently become zero`,()=>{
  const r=calculate({...fixture,[field]:value}); assert.equal(r.valid,false);assert.equal(r.field,field);assert.equal(r.employeeKobo,undefined);
});
for(const value of ['', '0', '-1', '1e3', 'Infinity', '1,000', '1.234', null, {}, '90071992547410']) test(`invalid basis ${String(value)}`,()=>{
  const r=calculate({...fixture,pensionablePay:value});assert.equal(r.valid,false);assert.equal(r.field,'pensionablePay');
});
test('rounds fractional contributions to kobo without float errors',()=>{
  const r=calculate({...fixture,pensionablePay:'0.05',health:'not-applicable',housing:'not-participating'});
  assert.equal(r.rows[0].employeeKobo,0);assert.equal(r.rows[0].employerKobo,1);
});
test('worker type and quantity do not decide scheme applicability or change per-worker contributions',()=>{
  for(const workerType of ['permanent','casual','seasonal','piece_rate'])assert.deepEqual(calculate({...fixture,workerType,numWorkers:100}),calculate(fixture));
});
test('unknown or public sector requires a supported model',()=>{
  for(const sector of [undefined,'public','self-employed'])assert.equal(calculate({...fixture,sector}).valid,false);
});
test('pure calculation leaves input unchanged and retains source identifiers',()=>{
  const input=Object.freeze({...fixture}); const r=calculate(input);
  assert.deepEqual(r.rows.map(x=>x.sourceId),['pencom-faq-2023','nhia-faq','bfa-gazette-2023']);
  assert.equal(r.eligibility,'user-confirmed');assert.equal(r.currentLawVerified,false);
});
