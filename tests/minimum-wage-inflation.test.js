const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const context={};vm.runInNewContext(fs.readFileSync('assets/js/lib/minimum-wage-inflation.js','utf8'),context);const summarize=context.AfroTools.minimumWageInflation.summarize;
for(const [nominal,cpi,direction,real,change] of [[150,120,'gain',125,25],[90,120,'loss',75,-25],[120,120,'unchanged',100,0]]){
 const r=summarize({points:[{year:2020,nominal:100,cpi:100},{year:2024,nominal,cpi}]});assert.equal(r.direction,direction);assert.equal(r.real,real);assert.equal(r.change,change);assert.equal(r.lastYear,2024);
}
assert.equal(summarize({points:[{year:2020,nominal:100,cpi:80},{year:2024,nominal:150,cpi:120}]}).real,100);
assert.equal(summarize({points:[{nominal:100,cpi:100},{nominal:150,cpi:0}]}),null);
console.log('Minimum-wage inflation independent gain/loss/zero/index-base/invalid fixtures: PASS');
