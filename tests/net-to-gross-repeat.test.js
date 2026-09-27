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
for(const file of ['assets/js/lib/src/net-to-gross.js','assets/js/lib/net-to-gross.js']) {
 for(const nssfEnabled of [false,true]) {
  for(const target of [1,1000,100000,335000,400000,500000,1000000,1500000,5000000,10000000]) {
   const nodes={grossSalary:{value:target},salarySlider:{value:target},sliderVal:{textContent:''},resLabel:{textContent:''},resAmount:{textContent:''},resGross:{textContent:''}};
   const window={CALC_MODE:'net',PERIOD:'monthly',fmt:n=>String(Math.round(n))};
   window._grossToNet=gross=>ugandaPaye.calculate({grossMonthly:gross,nssfEnabled,lstEnabled:false}).netMonthly;
   window.calculate=()=>{
    const gross=Number(nodes.grossSalary.value);
    const result=ugandaPaye.calculate({grossMonthly:gross,nssfEnabled,lstEnabled:false});
    window.RESULT={gross,monthly:gross,netMonthly:result.netMonthly,annualGross:result.grossAnnual,annualNet:result.netAnnual};
   };
   const document={documentElement:{lang:'en'},readyState:'complete',getElementById:id=>nodes[id],querySelector:()=>null,querySelectorAll:()=>[]};
   vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,setTimeout:fn=>fn()});
   window.calculate();
   const gross=window.RESULT.gross;
   assert.ok(Number.isInteger(gross),`${file} nssf=${nssfEnabled} target=${target} uses whole-UGX gross`);
   assert.ok(window._grossToNet(gross)>=target,`${file} nssf=${nssfEnabled} target=${target} reaches the requested net`);
   assert.ok(gross===0 || window._grossToNet(gross-1)<target,`${file} nssf=${nssfEnabled} target=${target} uses the smallest qualifying gross`);
   assert.equal(nodes.grossSalary.value,target,`${file} nssf=${nssfEnabled} target=${target} preserves the target`);
 }
}
}
const lstBreakpoints=ugandaPaye.formulaParameters.lstBands.map(band=>band.upTo).filter(Number.isFinite);
for(const route of ['uganda/ug-paye.html','fr/uganda/ug-paye.html']) {
 const html=fs.readFileSync(route,'utf8');
 const start=html.indexOf('window._grossToNet = function(g) {');
 assert.ok(start>=0,`${route} registers a reverse-calculation forward function`);
 const script=html.slice(start,html.indexOf('</script>',start));
 const toggles={nssf:true,lst:true,nonres:false};
 const page={window:{},isOn:key=>toggles[key],ugandaPayeEngine:()=>ugandaPaye};
 vm.runInNewContext(script,page);
 assert.deepEqual(Array.from(page.window._grossToNetBreakpoints()),lstBreakpoints,`${route} uses engine LST gross boundaries`);
 for(const regime of ['RESIDENT','NON_RESIDENT']) {
  toggles.nonres=regime==='NON_RESIDENT';
  for(const nssfEnabled of [false,true]) {
   toggles.nssf=nssfEnabled;
   for(const gross of [100000,335000,500000,1000000]) {
    const expected=ugandaPaye.calculate({grossMonthly:gross,regime,nssfEnabled,lstEnabled:true}).netMonthly;
    assert.equal(page.window._grossToNet(gross),expected,`${route} forward net matches displayed engine result for ${gross}`);
   }
  }
 }
 toggles.lst=false;
 assert.deepEqual(Array.from(page.window._grossToNetBreakpoints()),[],`${route} needs no LST boundaries when disabled`);
}
for(const file of ['assets/js/lib/src/net-to-gross.js','assets/js/lib/net-to-gross.js']) {
 for(const regime of ['RESIDENT','NON_RESIDENT']) {
  for(const nssfEnabled of [false,true]) {
   for(const expectedGross of lstBreakpoints) {
    const forward=gross=>ugandaPaye.calculate({grossMonthly:gross,regime,nssfEnabled,lstEnabled:true}).netMonthly;
    const target=forward(expectedGross);
    const nodes={grossSalary:{value:target},salarySlider:{value:target},sliderVal:{textContent:''},resLabel:{textContent:''},resAmount:{textContent:''},resGross:{textContent:''}};
    const window={CALC_MODE:'net',PERIOD:'monthly',fmt:n=>String(Math.round(n)),_grossToNet:forward,_grossToNetBreakpoints:()=>lstBreakpoints};
    window.calculate=()=>{
     const gross=Number(nodes.grossSalary.value);
     const result=ugandaPaye.calculate({grossMonthly:gross,regime,nssfEnabled,lstEnabled:true});
     window.RESULT={gross,monthly:gross,netMonthly:result.netMonthly,annualGross:result.grossAnnual,annualNet:result.netAnnual};
    };
    const document={documentElement:{lang:'en'},readyState:'complete',getElementById:id=>nodes[id],querySelector:()=>null,querySelectorAll:()=>[]};
    vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,setTimeout:fn=>fn()});
    window.calculate();
    assert.equal(window.RESULT.gross,expectedGross,`${file} ${regime} nssf=${nssfEnabled} LST edge ${expectedGross} uses earliest gross`);
    assert.ok(window.RESULT.netMonthly>=target,`${file} LST edge ${expectedGross} reaches requested net`);
   }
  }
 }
}
console.log('Shared net-to-gross repeat, target and Uganda annual checks passed in English, French and Swahili, source and generated output');
