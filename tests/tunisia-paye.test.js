const test=require('node:test'),assert=require('node:assert/strict');
const source=require('../engines/src/tunisia-paye'),built=require('../engines/tunisia-paye');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [name,api]of Object.entries({source,built})){
 test(name+': independent cumulative tax at every threshold and either side',()=>{
  const points=[[5000,0,0,.15],[10000,750,.15,.25],[20000,3250,.25,.30],[30000,6250,.30,.33],[40000,9550,.33,.36],[50000,13150,.36,.38],[70000,20750,.38,.40]];
  for(const [income,due,before,after]of points){near(api.tax(income).tax,due);near(api.tax(income-.001).tax,due-.001*before);near(api.tax(income+.001).tax,due+.001*after);}near(api.tax(80000).tax,24750);
 });
 test(name+': independently worked annual, monthly and both deductibility treatments',()=>{
  const r=api.calculate(12000,'annual');near(r.mandatory,1161.6);near(r.professional,1083.84);near(r.taxable,9754.56);near(r.irpp,713.184);near(r.css,48.7728);near(r.annualNet,10076.4432);near(r.employerSubtotal,14048.4);
  const monthly=api.calculate(1000,'monthly');near(monthly.annualNet/12,839.7036);
  const off=api.calculate(12000,'annual',{jobLossDeductible:false});near(off.professional,1089.84);near(off.taxable,9808.56);near(off.irpp,721.284);near(off.css,49.0428);near(off.annualNet,10068.0732);near(off.mandatory,r.mandatory);
  const capped=api.calculate(36000,'annual');near(capped.professional,2000);near(capped.taxable,30515.2);near(capped.irpp,6420.016);near(capped.css,152.576);near(capped.annualNet,25942.608);
 });
 test(name+': CSS threshold, zero and inverse handle the discontinuity',()=>{
  for(const deductible of [true,false]){const options={jobLossDeductible:deductible},threshold=5000/((deductible?.9032:.9082)*.9);near(api.calculate(threshold,'annual',options).css,0);assert.ok(api.calculate(threshold+.001,'annual',options).css>25);
   for(const period of ['annual','monthly'])for(const target of [0,100,460,461,462,463,5500,5535,5540,5550,5560,10000]){const gross=api.reverse(target,period,options),net=api.calculate(gross,period,options).annualNet/(period==='monthly'?12:1);assert.ok(net>=target-1e-9);if(gross>.001)assert.ok(api.calculate(gross-.001,period,options).annualNet/(period==='monthly'?12:1)<target+1e-8);}}
  near(api.calculate(0,'annual').annualNet,0);for(const n of [-1,NaN,Infinity,'100'])assert.throws(()=>api.calculate(n,'annual'));assert.throws(()=>api.calculate(100,'weekly'));
 });
}
test('legacy Swahili entry delegates to the same Tunisia source without altering other profiles',()=>{const legacy=require('../engines/src/sw-final-paye-engine');near(legacy.calculatePaye('tn-paye',{gross:12000}).net,10076.4432);assert.equal(legacy.PAYE_PROFILES['tn-paye'].confidence,'statutory-with-deductibility-assumption');});
test('all four generated outputs remain source owned',()=>{require('../scripts/build-tunisia-paye').run(false);});
