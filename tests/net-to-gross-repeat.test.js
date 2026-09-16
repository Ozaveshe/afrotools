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
  assert.ok(Math.abs(window.RESULT.netMonthly-1000)<1);
  window.setPeriod('annual'); assert.equal(nodes.resAmount.textContent,String(first*12));
 }
}
console.log('Shared net-to-gross repeat and annual checks passed in English, French and Swahili, source and generated output');
