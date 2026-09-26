'use strict';
const assert=require('assert'), fs=require('fs'), vm=require('vm');
for(const file of ['assets/js/lib/src/net-to-gross.js','assets/js/lib/net-to-gross.js']) {
 for(const lang of ['en','fr','sw']) {
  const nodes={grossSalary:{value:1000},salarySlider:{value:1000},sliderVal:{textContent:''},resLabel:{textContent:''},resAmount:{textContent:''},resGross:{textContent:''}};
  const window={CALC_MODE:'net',PERIOD:'monthly',fmt:n=>String(Math.round(n)),_grossToNet:n=>n*.8};
  window.calculate=()=>{const gross=Number(nodes.grossSalary.value);window.RESULT={gross,monthly:gross,netMonthly:gross*.8,annualGross:gross*12,annualNet:gross*.8*12};};
  window.setPeriod=period=>{window.PERIOD=period;};
  const document={documentElement:{lang},readyState:'complete',getElementById:id=>nodes[id],querySelector:()=>null,querySelectorAll:()=>[]};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,setTimeout:fn=>fn()});
  window.calculate(); const first=window.RESULT.gross;
  assert.equal(nodes.grossSalary.value,1000,`${file} ${lang} preserves desired net`);
  window.calculate(); assert.equal(window.RESULT.gross,first,`${file} ${lang} repeat is stable`);
  assert.ok(window.RESULT.netMonthly>=1000,`${file} ${lang} reaches the requested net`);
  window.setPeriod('annual'); assert.equal(nodes.resAmount.textContent,String(first*12));
 }
}
const ugandaPaye=require('../assets/js/engines/ug-paye');
for(const file of ['assets/js/lib/src/net-to-gross.js','assets/js/lib/net-to-gross.js']) {
 const nodes={grossSalary:{value:1500000},salarySlider:{value:1500000},sliderVal:{textContent:''},resLabel:{textContent:''},resAmount:{textContent:''},resGross:{textContent:''}};
 const window={CALC_MODE:'net',PERIOD:'annual',fmt:n=>String(Math.round(n))};
 window._grossToNet=gross=>ugandaPaye.calculate({grossMonthly:gross,nssfEnabled:true,lstEnabled:false}).netMonthly;
 window.calculate=()=>{
  const gross=Number(nodes.grossSalary.value);
  const result=ugandaPaye.calculate({grossMonthly:gross,nssfEnabled:true,lstEnabled:false});
  window.RESULT={gross,monthly:gross,netMonthly:result.netMonthly,annualGross:result.grossAnnual,annualNet:result.netAnnual};
 };
 window.setPeriod=period=>{window.PERIOD=period;};
 const document={documentElement:{lang:'en'},readyState:'complete',getElementById:id=>nodes[id],querySelector:()=>null,querySelectorAll:()=>[]};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,setTimeout:fn=>fn()});
 window.calculate();
 const firstGross=window.RESULT.gross;
 assert.ok(Number.isInteger(firstGross),`${file} uses a whole-UGX gross`);
 assert.ok(window._grossToNet(firstGross)>=1500000,`${file} reaches the requested monthly take-home`);
 assert.ok(window._grossToNet(firstGross-1)<1500000,`${file} uses the smallest whole-UGX gross that reaches the target`);
 assert.ok(window.RESULT.netMonthly>=1500000,`${file} reaches the requested monthly take-home`);
 assert.equal(nodes.resAmount.textContent,String(window.RESULT.annualGross),`${file} annual headline uses calculated gross`);
 assert.match(nodes.resGross.textContent,new RegExp(`Gross: ${window.RESULT.annualGross}/year`),`${file} annual summary uses calculated gross`);
 assert.equal(nodes.grossSalary.value,1500000,`${file} preserves desired net after annual calculation`);
 window.calculate();
 assert.equal(window.RESULT.gross,firstGross,`${file} repeated calculation keeps the same gross`);
}
console.log('Shared net-to-gross repeat, target and Uganda annual checks passed in English, French and Swahili, source and generated output');
