'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const plain = x => JSON.parse(JSON.stringify(x));
function browser(file) {
  const window = { AfroTools: {}, location: { pathname: '/__test__' } };
  const document = { readyState: 'loading', addEventListener() {} };
  vm.runInNewContext(read(file), { window, document, console, Intl, Date, Number, Math, Infinity, isFinite, isNaN }, { timeout: 1000 });
  return window.AfroTools;
}
const readable = browser('assets/js/engines/src/za-paye.js').engines.zaPAYE;
const served = browser('assets/js/engines/za-paye.js').engines.zaPAYE;
const french = browser('assets/js/pages/french-paye-parity.js').frenchPayeParity;
const server = require('../netlify/functions/_engines/za-paye');
const html = read('south-africa/za-paye.html');
const start = html.indexOf('const SARS_BANDS =');
const end = html.indexOf('function reverseCalc(', start);
assert.ok(start > 0 && end > start, 'actual readable inline calculation owner');
const context = vm.createContext({ Math, Number, isFinite, Infinity });
vm.runInContext(html.slice(start, end) + '\nthis.owner={calculate:computePAYE};', context, { timeout: 1000 });
const inline = context.owner;
function near(actual, expected, label, epsilon = 1e-7) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < epsilon, `${label}: ${actual} != ${expected}`);
}
// SARS PAYE-GEN-01-G21 revision1 p4:2027 assessment(1Mar2026—28Feb2027).
// Independent base-charge oracle; deliberately not an iteration over implementation bands.
const bases = [[0, 0, .18], [245100, 44118, .26], [383100, 79998, .31],
  [530200, 125599, .36], [695800, 185215, .39], [887000, 259783, .41], [1878600, 666339, .45]];
function oracle(amount) {
  for (let i = bases.length - 1; i >= 0; i--) {
    if (amount > bases[i][0] || i === 0) return bases[i][1] + (amount - bases[i][0]) * bases[i][2];
  }
}
for (const [amount, expected] of [[0, 0], [245100, 44118], [383100, 79998],
  [530200, 125599], [695800, 185215], [887000, 259783], [1878600, 666339], [2000000, 720969]]) {
  test(`2027 SARS published annual base charge at R${amount}`, () => {
    for (const engine of [readable, served, inline]) near(engine.calculate(amount, { uif: false }).grossTax, expected, 'gross tax');
    assert.equal(server.calculate({ grossAnnual: amount, uif: false }).tax.grossTax, Math.round(expected));
  });
}
test('all six band boundaries preserve cents on either side', () => {
  for (const boundary of bases.slice(1).map(x => x[0])) for (const delta of [-.01, 0, .01]) {
    const amount = boundary + delta;
    for (const engine of [readable, served, inline]) near(engine.calculate(amount).grossTax, oracle(amount), `${amount}`);
    assert.equal(server.calculate({ grossAnnual: amount }).tax.grossTax, Math.round(oracle(amount)));
  }
});
for (const [ageGroup, age, threshold, rebate] of [['under65',35,99000,17820],['65to74',65,153250,27585],['75plus',75,171300,30834]]) {
  test(`current rebate and threshold ${ageGroup}`, () => {
    for (const engine of [readable, served, inline]) {
      const zero = engine.calculate(threshold, { ageGroup, uif: false });
      near(zero.paye, 0, 'threshold tax'); assert.equal(zero.threshold, threshold); assert.equal(zero.rebate, rebate);
      near(engine.calculate(threshold + 1, { ageGroup }).paye, .18, 'one rand over threshold');
    }
    assert.equal(server.calculate({ grossAnnual: threshold, age, uif: false }).tax.netTax, 0);
    assert.equal(Object.values(server.calculate({ grossAnnual: 500000, age }).tax.reliefs).reduce((a,b)=>a+b,0), rebate);
  });
}
test('current medical scheme credits apply once per covered member', () => {
  for (const [medMembers, monthly] of [[0,0],[1,376],[2,752],[3,1006],[5,1514]]) for (const engine of [readable, served, inline]) {
    const value = engine.calculate(1000000, { medMembers, uif:false });
    assert.equal(value.mtcMonthly, monthly); assert.equal(value.mtcAnnual, monthly*12);
    near(value.paye, Math.max(0,oracle(1000000)-17820-monthly*12), 'medical PAYE');
  }
});
test('retirement remains27.5percent with current R430000 annual cap', () => {
  for (const engine of [readable, served, inline]) {
    near(engine.calculate(100000,{retirement:500000}).retirement,27500,'percentage retirement cap');
    assert.equal(engine.calculate(2000000,{retirement:500000}).retirement,430000);
    assert.equal(engine.calculate(2000000,{retirement:420000}).retirement,420000);
  }
  assert.equal(server.calculate({grossAnnual:2000000,retirement:500000}).tax.taxableIncome,1570000);
  assert.equal(readable.optimizeRetirement(2000000).maxAmount,430000);
});
test('UIF still respects R17712monthly remuneration ceiling', () => {
  for (const engine of [readable, served, inline]) {
    near(engine.calculate(120000).uif,1200,'uncapped UIF');
    near(engine.calculate(1000000).uif,2125.44,'capped UIF');
    near(engine.calculate(1000000,{uif:false}).uif,0,'disabled employee UIF');
  }
  assert.equal(server.calculate({grossAnnual:1000000}).deductions.uif,2125);
});
test('current-only period is explicit without changing frequency or legacy API year semantics', () => {
  const expected={assessmentYear:2027,label:'2026/27',effectiveFrom:'2026-03-01',effectiveTo:'2027-02-28',inputBasis:'annual',currency:'ZAR',method:'annual-marginal-formula-estimate',monthlyBasis:'annual-estimate-divided-by-12'};
  for(const engine of [readable,served,inline]) assert.deepEqual(plain(engine.calculate(500000).taxPeriod),expected);
  assert.deepEqual(plain(server.calculate({grossAnnual:500000}).meta.taxPeriod),expected);
  assert.equal(server.getOptions().regimes[0].key,'STANDARD');
  assert.match(server.getOptions().regimes[0].label,/2026\/27/);
  assert.equal(french.configs['za-paye'].period,'annual');
  assert.deepEqual(plain(french.calculate(french.configs['za-paye'],500000/12).taxPeriod),{...expected,inputBasis:'monthly'});
});
test('French supported default case and served engine agree across all bands', () => {
  for(const amount of [99000,245100,383100,530200,695800,887000,1878600,2000000]) {
    const fr=french.calculate(french.configs['za-paye'],amount/12),en=readable.calculate(amount);
    near(fr.taxMonthly,en.paye/12,'French PAYE');near(fr.netMonthly,en.netMonthly,'French net');near(fr.employeeMonthly,en.uif/12,'French UIF');
  }
});
test('invalid amounts fail before producing financial results; zero remains supported by pure engine', () => {
  for(const amount of [-1,NaN,Infinity,-Infinity,'',null]) {
    assert.equal(readable.validate(amount).valid,false);
    for(const engine of [readable,served,inline]) assert.throws(()=>engine.calculate(amount));
    assert.throws(()=>server.calculate({grossAnnual:amount}));
    assert.throws(()=>french.calculate(french.configs['za-paye'],amount));
  }
  for(const engine of [readable,served,inline]) assert.equal(engine.calculate(0).paye,0);
  assert.equal(server.calculate({grossAnnual:0}).result.effectiveRate,'0.00%');
});
test('malformed optional deductions cannot silently invert tax or create nonfinite outputs', () => {
  for(const retirement of [-1,Infinity,NaN]) {
    for(const engine of [readable,served,inline]) assert.throws(()=>engine.calculate(500000,{retirement}));
    assert.throws(()=>server.calculate({grossAnnual:500000,retirement}));
  }
  for(const medMembers of [-1,.5,Infinity,NaN]) for(const engine of [readable,served,inline]) assert.throws(()=>engine.calculate(500000,{medMembers}));
});
test('reverse and optimizer preserve their existing shapes with current tax parameters', () => {
  for(const target of [100000,500000,1000000]) {
    const gross=readable.reverseCalc(target);near(readable.calculate(gross).netAnnual,target,'reverse',1);
    const srv=server.reverseCalculate({netAnnual:target});near(srv.result.netAnnual,target,'server reverse',2);
  }
  const optimized=readable.optimizeRetirement(1000000);
  assert.ok(optimized.optimalAmount<=275000 && optimized.taxSaving>=0);
});
test('visible period/export labels and source evidence do not repeat the false two-pot exemption', () => {
  assert.ok(/Tax Calculator 2026\/27/.test(html),'visible current year');assert.ok(/PAYE Computation \(SARS 2026\/27\)/.test(html),'PDF period');assert.ok(/Tax Summary 2026\/27/.test(html),'export period');
  assert.ok(!/first R2,000 of savings pot withdrawals is tax-free/i.test(html),'no false exemption');
  assert.ok(/minimum withdrawal/i.test(html),'minimum explained');
  const entry=Object.values(JSON.parse(read('data/tool-verification.json')).tools).find(x=>x.tool_id==='za-paye');
  assert.ok(entry.source_urls.some(x=>x.includes('guide-for-employers-in-respect-of-employees-tax-2027')));
  assert.ok(entry.source_urls.every(x=>!x.includes('value-added-tax')));
});


test('actual English PDF handler passes current estimate, period and computed results to PDF owner', async () => {
  const pdfStart=html.indexOf('async function downloadPdf() {');
  const pdfEnd=html.indexOf('function whatsappShare()',pdfStart);
  assert.ok(pdfStart>0 && pdfEnd>pdfStart);
  let captured;
  const result=readable.calculate(120000,{uif:false});
  const ctx=vm.createContext({RESULT:result,CHART:null,console,
    document:{getElementById(){return null;}},
    fmt:value=>'R '+Number(value).toFixed(2),pct:value=>(value*100).toFixed(2)+'%',
    AfroTools:{pdf:{async generate(options){captured=options;}}}});
  vm.runInContext(html.slice(pdfStart,pdfEnd),ctx,{timeout:1000});
  await ctx.downloadPdf();
  assert.ok(captured,'actual handler invoked the PDF adapter');
  assert.match(captured.subtitle,/2026\/27/);
  assert.match(captured.disclaimer,/annual.*formula.*estimate/i);
  assert.match(captured.disclaimer,/divided by 12.*differ.*SARS banded payroll tables/i);
  assert.equal(captured.heroStats.find(x=>x.label==='PAYE Tax').value,'R 3780.00');
  assert.equal(captured.heroStats.find(x=>x.label==='Monthly Take-Home').value,'R 9685.00');
  assert.ok(captured.legalSources.some(x=>x.includes('(2027), revision 1')));
});
