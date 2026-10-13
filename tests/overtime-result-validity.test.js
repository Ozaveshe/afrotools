const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '../tools/overtime-calc/index.html'), 'utf8');
const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function calculate()'));
assert(code, 'Calculator controller exists');
function fixture() {
  const nodes = new Map(), timers = [], alerts = [], calls = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {value:'',textContent:'',innerHTML:'',style:{},children:[],attrs:{},listeners:{},
      classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},
      appendChild(v){this.children.push(v);},addEventListener(k,f){(this.listeners[k]||(this.listeners[k]=[])).push(f);},
      dispatch(k){(this.listeners[k]||[]).forEach(f=>f());},scrollIntoView(){}});
    return nodes.get(id);
  }
  const context={document:{getElementById:node,querySelector:node,createElement:()=>node('option'+nodes.size)},
    OVERTIME_RULES:{NG:{name:'Synthetic country',currency:'XXX',symbol:'X',flag:'',standardHours:{law:'Fixture'}}},
    AfroTools:{HREngine:{calculateOvertime(input){calls.push(input);return {hourlyRate:1,overtimePay:20,totalPay:120};}}},
    alert:message=>alerts.push(message),setTimeout:fn=>timers.push(fn),Date,Number,console};
  vm.createContext(context);vm.runInContext(code,context);
  context.renderResults=()=>{node('results').style.display='';};
  node('monthly-salary').value='100';node('ot-hours').value='20';node('day-type').value='weekday';
  function seed(){context.lastResult={};context.lastRule={};context.lastInputs={};node('results').style.display='';node('wa-share-btn').attrs.href='synthetic';node('dispute-letter').textContent='synthetic';}
  function cleared(){assert.strictEqual(context.lastResult,null);assert.strictEqual(context.lastInputs,null);assert.strictEqual(context.buildOvertimeSummary(),'');assert.strictEqual(node('results').style.display,'none');assert.ok(!node('wa-share-btn').attrs.href);assert.strictEqual(node('dispute-letter').textContent,'');}
  return {context,node,timers,alerts,calls,seed,cleared};
}
for(const id of ['monthly-salary','ot-hours','day-type']) for(const event of ['input','change']) {
  const f=fixture();f.seed();f.node(id).dispatch(event);f.cleared();
}
{const f=fixture();f.seed();f.context.onCountryChange();f.cleared();}
for(const value of ['', '-1', 'Infinity']) {const f=fixture();f.seed();f.node('monthly-salary').value=value;f.context.calculate();f.cleared();assert.strictEqual(f.timers.length,0);assert.strictEqual(f.alerts.length,1);}
{const f=fixture();f.context.calculate();f.node('ot-hours').value='30';f.node('ot-hours').dispatch('input');f.timers.forEach(fn=>fn());f.cleared();assert.strictEqual(f.calls.length,0,'Cancelled snapshot must not calculate');}
{const f=fixture();f.context.calculate();f.node('monthly-salary').value='200';f.node('monthly-salary').dispatch('input');f.context.calculate();f.timers.forEach(fn=>fn());assert.strictEqual(f.calls.length,1);assert.strictEqual(f.context.lastInputs.monthlySalary,200);assert.strictEqual(f.node('results').style.display,'');}
console.log('PASS: 12 overtime result validity scenarios');

(async function () {
  for (const mode of ['modern-success', 'fallback-success', 'fallback-false', 'fallback-throw', 'modern-denied']) {
    const f=fixture();let removed=0,restored=0;
    f.context.navigator={clipboard:mode==='modern-success'?{writeText:()=>Promise.resolve()}:mode==='modern-denied'?{writeText:()=>Promise.reject(new Error('denied'))}:undefined};
    f.context.document.createElement=()=>({value:'',style:{},select(){}});
    f.context.document.body={appendChild(){},removeChild(){removed++;}};
    f.context.document.activeElement={focus(){restored++;}};
    f.context.document.execCommand=()=>{if(mode==='fallback-throw')throw Error('unavailable');return mode==='fallback-success';};
    assert.strictEqual(await f.context.copyOvertimeText('Synthetic result'),['modern-success','fallback-success'].includes(mode),mode);
    assert.strictEqual(removed,mode==='modern-success'?0:1,mode+': temporary field removed');
    assert.strictEqual(restored,mode==='modern-success'?0:1,mode+': focus restored');
  }
  console.log('PASS: 5 clipboard capability and failure scenarios');
})().catch(error=>{console.error(error);process.exitCode=1;});
