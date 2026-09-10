'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const server = require('../netlify/functions/_engines/ng-paye');
const html = fs.readFileSync('nigeria/ng-salary-tax.html', 'utf8');
function fn(name) { const start=html.indexOf('function '+name+'('); const rest=html.slice(start); const end=rest.indexOf('\nfunction ',1); return rest.slice(0,end<0?undefined:end).replace(/<\/script>[\s\S]*/, ''); }
function browserEngine(file) {const ctx={window:{}}; vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx);return ctx.window.AfroTools.engines.ngPAYE;}
const shared=browserEngine('assets/js/engines/ng-paye.js');
const readable=browserEngine('assets/js/engines/src/ng-paye.js');
function route(interest, rent=0, enabled=true) {const ctx={document:{getElementById:id=>({value:id==='homeloanAmt'?String(interest):id==='annualRent'?String(rent):'0'})},isOn:id=>id==='homeloan'&&enabled,parseNum:s=>parseFloat(s)||0}; vm.createContext(ctx);vm.runInContext(['readHomeLoanInterest','calcPITA','calcNTA','getMarginalRate'].map(fn).join('\n'),ctx);return ctx;}
// Independently derived from s30 and Fourth Schedule: (3m - interest - 800k) * 15%.
for (const [interest,taxable,tax] of [[0,3000000,330000],[400000,2600000,270000],[500000,2500000,255000],[600000,2400000,240000],[2200000,800000,0]]) {
 test(`NTA qualifying interest ${interest}: route, built browser, readable owner and server agree`,()=>{
   const results=[route(interest).calcNTA(3000000),shared.calcNTA(3000000,{homeLoanInterest:interest}),readable.calcNTA(3000000,{homeLoanInterest:interest})];
   for(const r of results){assert.equal(r.homeloan,interest);assert.equal(r.taxable,taxable);assert.equal(r.tax,tax);}
   const r=server.calculate({grossAnnual:3000000,pension:false,nhf:false,nhis:false,mortgageInterest:interest});assert.equal(r.deductions.mortgageInterest,interest);assert.equal(r.tax.taxableIncome,taxable);assert.equal(r.tax.netTax,tax);
 });
}
test('rent relief retains separate 500k ceiling',()=>{for(const rent of [2000000,2500000,4000000]) {const expected=Math.min(rent*.2,500000);assert.equal(route(600000,rent).calcNTA(3000000).rentRelief,expected);assert.equal(shared.calcNTA(3000000,{homeLoanInterest:600000,annualRent:rent}).rentRelief,expected);assert.equal(server.calculate({grossAnnual:3000000,pension:false,nhf:false,mortgageInterest:600000,annualRent:rent}).deductions.rentRelief,expected);}});
test('non-qualifying property: disable deduction, not a claimed eligibility determination',()=>{assert.equal(route(600000,0,false).calcNTA(3000000).tax,330000);assert.match(html,/Exclude principal repayments and interest for rental or other non-qualifying property/);});
test('PITA historical cap unchanged; invalid NTA interest rejected',()=>{for(const interest of [400000,500000,600000]){assert.equal(route(interest).calcPITA(3000000).homeloan,Math.min(interest,500000));assert.equal(shared.calcPITA(3000000,{homeLoanInterest:interest}).homeloan,Math.min(interest,500000));}for(const input of ['-1','invalid','600000abc','1,2','Infinity'])assert.ok(Number.isNaN(route(0).readHomeLoanInterest(input)));for(const v of [-1,Infinity,NaN])assert.throws(()=>shared.calcNTA(3000000,{homeLoanInterest:v}));assert.equal(route(0).readHomeLoanInterest('600,000.25'),600000.25);});
