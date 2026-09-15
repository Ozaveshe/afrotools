'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../engines/src/morocco-paye');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('2026 IR boundary liabilities are continuous and use marginal slices',()=>{
 for(const [income,tax,rate] of [[40000,0,.1],[60000,2000,.2],[80000,6000,.3],[100000,12000,.34],[180000,39200,.37]]){near(api.tax(income).tax,tax);near(api.tax(income+.01).tax,tax+.01*rate);}
 near(api.tax(200000).tax,46600);
});
test('ordinary monthly salary derives professional expenses from gross and caps contribution base',()=>{
 const r=api.calculate(10000,'monthly');for(const [k,v]of Object.entries({annualGross:120000,cnss:3225.6,amo:2712,professional:30000,taxable:84062.4,incomeTax:7218.72,annualNet:106843.68,employerCNSS:6465.6,employerFamily:7680,employerAMO:4932,employerTraining:1920}))near(r[k],v);
 const a=api.calculate(120000,'annual');for(const k of ['cnss','amo','professional','incomeTax','annualNet'])near(a[k],r[k]);
 near(api.calculate(6000,'monthly').cnss,3225.6);near(api.calculate(6000.01,'monthly').cnss,3225.6);
 near(api.calculate(78000,'annual').professional,27300);near(api.calculate(78000.01,'annual').professional,19500.0025);near(api.calculate(200000,'annual').professional,35000);
});
test('dependent relief is a tax credit and switches are explicit scenarios',()=>{
 const r=api.calculate(120000,'annual',{dependents:6});near(r.familyRelief,3600);near(r.incomeTax,3618.72);
 near(api.calculate(30000,'annual',{dependents:6}).familyRelief,0);
 const bare=api.calculate(120000,'annual',{cnss:false,amo:false});near(bare.cnss,0);near(bare.amo,0);near(bare.professional,30000);near(bare.incomeTax,9000);assert.equal(bare.cnssIncluded,false);assert.equal(bare.amoIncluded,false);
});
test('reverse reaches target at the minimal cent on either side of expense discontinuity',()=>{
 for(const period of ['annual','monthly'])for(const dependents of [0,1,6])for(const flags of [{},{cnss:false,amo:false}])for(const target of [0,1000,5000,6500,65000,70000,1000000]){const options={dependents,...flags},gross=api.reverse(target,period,options),factor=period==='monthly'?12:1;assert.ok(api.calculate(gross,period,options).annualNet+1e-7>=target*factor);if(gross>0)assert.ok(api.calculate(gross-.01,period,options).annualNet<target*factor+1e-7);}
 const peak=api.calculate(78000,'annual').annualNet,g=api.reverse(peak,'annual');assert.equal(g,78000);
});
test('invalid salaries/options fail; adapters preserve ordinary results and metadata',()=>{
 for(const value of [NaN,Infinity,-1,'100',1e11])assert.throws(()=>api.calculate(value,'annual'));
 for(const dependents of [-1,7,1.5,'2'])assert.throws(()=>api.calculate(10000,'annual',{dependents}));
 assert.throws(()=>api.calculate(10000,'weekly'));assert.throws(()=>api.calculate(10000,'annual',{cnss:'false'}));
 const sw=require('../engines/src/sw-final-paye-engine');near(sw.calculatePaye('ma-paye',{gross:120000}).net,106843.68);
 const context={window:{AfroTools:{moroccoPaye:api}}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../engines/src/francophone-paye-engine'),'utf8'),context);const legacy=context.window.FrancoPayeEngine;near(legacy.calculate('MA',120000).netAnnual,106843.68);assert.equal(legacy.COUNTRY_CONFIG.MA.slug,'maroc');assert.equal(legacy.calculate('MA',120000).flag,'🇲🇦');
});
