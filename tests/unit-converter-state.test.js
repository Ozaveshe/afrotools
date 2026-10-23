const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../tools/unit-converter/index.html'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, '../engines/src/business-roi-engine.js'), 'utf8');
const controller = html.match(/<script>\s*(\/\/ ═+[\s\S]*?)<\/script>/)[1];
const linear = {length:'len',weight:'wgt',area:'area',volume:'vol',speed:'spd',cooking:'cook',data:'data',energy:'engy',power:'pwr',pressure:'pres',time:'time',angle:'ang',frequency:'freq',force:'force',torque:'torque',flow:'flow',density:'dens',electric:'elec'};

function fixture() {
  const elements = {}, listeners = [], clipboard = [], storage = new Map();
  function element(value = '') {
    let current=String(value); return {get value(){return current;},set value(v){current=String(v);},textContent:'',innerHTML:'',style:{},validity:{badInput:false},attrs:{},classList:{add(){},remove(){},toggle(){}},
      setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(type,fn){(this.listeners ||= {})[type]=fn;},appendChild(){}};
  }
  for (const m of html.matchAll(/<input\b([^>]*\bid="([^"]+)"[^>]*)>/g)) elements[m[2]]=element(m[1].match(/\bvalue="([^"]*)"/)?.[1] || '');
  for (const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options=[...m[2].matchAll(/<option\b([^>]*)>([^<]*)<\/option>/g)].map(o=>({value:o[1].match(/value="([^"]*)"/)[1],text:o[2],selected:/\bselected\b/.test(o[1])}));
    const el=elements[m[1]]=element(options.find(o=>o.selected)?.value || options[0].value);el.options=options;
    Object.defineProperty(el,'selectedIndex',{get(){return options.findIndex(o=>o.value===this.value);}});
  }
  for (const prefix of [...Object.values(linear),'tmp','fuel']) elements[prefix+'Formula']=element();
  for (const id of ['barStrip','catBar','historyList']) elements[id]=element();
  let panel=null;
  const document={getElementById:id=>elements[id],querySelector:s=>s.startsWith('[data-productivity-handoff=')?panel:element(),querySelectorAll:s=>s==='input.result'?[...Object.values(linear),'tmp','fuel'].map(p=>elements[p+'To']):[],addEventListener(type,fn,capture){listeners.push({type,fn,capture});}};
  const ctx={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{clipboard:{writeText:v=>{clipboard.push(v);return Promise.resolve();}}},IntersectionObserver:class{observe(){}},setTimeout:()=>0,Date,console};ctx.window=ctx;ctx.scrollTo=()=>{};vm.createContext(ctx);vm.runInContext(engine,ctx,{filename:'business-roi-engine.js'});vm.runInContext(controller,ctx,{filename:'unit-converter-inline.js'});
  function mountBrief() {
    const output=element();output.textContent='Previously refreshed valid brief';const status=element();
    const buttons=['refresh','copy','download','save'].map(action=>({dataset:{prodAction:action},disabled:false,closest:()=>panel}));
    panel={querySelector:s=>s==='[data-prod-output]'?output:status,querySelectorAll:()=>buttons};
    return {output,status,buttons,click(action){const button=buttons.find(b=>b.dataset.prodAction===action);const event={target:{closest:()=>button},blocked:false,preventDefault(){this.blocked=true;},stopImmediatePropagation(){this.blocked=true;}};listeners.filter(l=>l.type==='click'&&l.capture).forEach(l=>l.fn(event));return event;}};
  }
  return {ctx,e:elements,storage,clipboard,mountBrief};
}

for (const [tab,prefix] of Object.entries(linear)) test(`${tab}: blank/nonfinite clears, zero converts, valid recovers without losing history`,()=>{
  const f=fixture(),i=f.e[prefix+'From'],o=f.e[prefix+'To'];
  i.value='7';f.ctx.cvt(prefix);const before=f.storage.get('uc-history');
  i.value='';f.ctx.cvt(prefix);assert.equal(o.value,'');assert.doesNotMatch(f.e[prefix+'Formula'].textContent,/NaN|Infinity|1 .* =/);assert.equal(f.storage.get('uc-history'),before);
  i.value='Infinity';f.ctx.cvt(prefix);assert.equal(o.value,'');assert.equal(f.storage.get('uc-history'),before);
  i.value='0';f.ctx.cvt(prefix);assert.equal(Number(o.value),0);
  i.value='10';f.ctx.cvt(prefix);assert.equal(Number(o.value),Number((10*Number(f.e[prefix+'FromU'].value)/Number(f.e[prefix+'ToU'].value)).toPrecision(8)));assert.equal(i.attrs['aria-invalid'],undefined);
});

test('temperature: blank is not freezing; genuine0/-40 and valid recovery preserve formula',()=>{
  const f=fixture();f.e.tmpFrom.value='';f.ctx.cvtTemp();assert.equal(f.e.tmpTo.value,'');assert.doesNotMatch(f.e.tmpFormula.textContent,/NaN|32/);
  f.e.tmpFrom.value='NaN';f.ctx.cvtTemp();assert.equal(f.e.tmpTo.value,'');
  f.e.tmpFrom.value='0';f.ctx.cvtTemp();assert.equal(Number(f.e.tmpTo.value),32);
  f.e.tmpFrom.value='-40';f.ctx.cvtTemp();assert.equal(Number(f.e.tmpTo.value),-40);
  f.e.tmpFrom.value='100';f.ctx.cvtTemp();assert.equal(Number(f.e.tmpTo.value),212);
});

test('fuel: zero/negative/blank/nonfinite clears prior12kmL result, then10 recovers',()=>{
  const f=fixture();f.ctx.preFuel(12,'kml','l100');assert.equal(Number(f.e.fuelTo.value),8.33333);
  for (const value of ['0','-1','','Infinity']) {f.e.fuelFrom.value=value;f.ctx.cvtFuel();assert.equal(f.e.fuelTo.value,'');assert.match(f.e.fuelFormula.textContent,/greater than zero/);}
  f.e.fuelFrom.value='10';f.ctx.cvtFuel();assert.equal(Number(f.e.fuelTo.value),10);assert.match(f.e.fuelFormula.textContent,/10 km\/L = 10 L\/100km/);
});

test('overflow clears finite-input result rather than exporting Infinity',()=>{
  const f=fixture();f.e.lenFrom.value='1e308';f.e.lenFromU.value='1000';f.e.lenToU.value='0.0254';f.ctx.cvt('len');assert.equal(f.e.lenTo.value,'');assert.match(f.e.lenFormula.textContent,/finite result/);
});

test('invalid results cannot copy, create history, or retain a shareable brief',()=>{
  const f=fixture(),b=f.mountBrief();f.e.lenFrom.value='';f.ctx.cvt('len');
  assert.equal(b.output.textContent,'Enter a valid amount to prepare a conversion brief.');assert.ok(b.buttons.every(x=>x.disabled));assert.ok(b.click('download').blocked);
  f.e.lenTo.listeners.click.call(f.e.lenTo);assert.deepEqual(f.clipboard,[]);
});

test('valid edit invalidates old brief; explicit refresh re-enables current actions',()=>{
  const f=fixture(),b=f.mountBrief();f.e.lenFrom.value='2';f.ctx.cvt('len');assert.match(b.output.textContent,/Conversion changed/);assert.ok(b.buttons.filter(x=>x.dataset.prodAction!=='refresh').every(x=>x.disabled));
  assert.equal(b.click('refresh').blocked,false);assert.ok(b.buttons.every(x=>!x.disabled));
  f.e.lenFrom.value='3';f.ctx.cvt('len');assert.match(b.output.textContent,/Conversion changed/);assert.ok(b.buttons.find(x=>x.dataset.prodAction==='copy').disabled);
});

test('tab switch invalidates old result context; swaps preserve real zero',()=>{
  const f=fixture(),b=f.mountBrief();f.ctx.activateTab('temp');assert.match(b.output.textContent,/Conversion changed/);
  f.e.lenFrom.value='0';f.ctx.cvt('len');f.ctx.swp('len');assert.equal(Number(f.e.lenTo.value),0);
});


test('Rankine advertised pairs convert in both directions, including zero absolute temperature',()=>{
  const f=fixture();
  for (const [value,from,to,expected] of [[0,'C','R',491.67],[491.67,'R','C',0],[32,'F','R',491.67],[491.67,'R','F',32],[273.15,'K','R',491.67],[491.67,'R','K',273.15],[0,'R','K',0],[0,'R','C',-273.15],[0,'R','F',-459.67],[0,'R','R',0]]) {
    f.ctx.preTmp(value,from,to);assert.equal(Number(f.e.tmpTo.value),expected,`${value}${from} to${to}`);
  }
});

test('absolute-zero guards preserve exact boundaries and legitimate negativeC/F, with recovery',()=>{
  const f=fixture();
  for (const [unit,boundary,below] of [['C',-273.15,-273.1500000001],['F',-459.67,-459.6700000001],['K',0,-0.0000000001],['R',0,-0.0000000001]]) {
    f.ctx.preTmp(boundary,unit,'K');assert.equal(Number(f.e.tmpTo.value),0,unit+' exact boundary');
    f.ctx.preTmp(below,unit,'K');assert.equal(f.e.tmpTo.value,'');assert.match(f.e.tmpFormula.textContent,/absolute zero/);assert.equal(f.e.tmpFrom.value,String(below));
    f.ctx.preTmp(boundary,unit,'K');assert.equal(Number(f.e.tmpTo.value),0);assert.equal(f.e.tmpFrom.attrs['aria-invalid'],undefined);
  }
  f.ctx.preTmp(-40,'C','F');assert.equal(Number(f.e.tmpTo.value),-40);
  f.ctx.preTmp(-40,'F','C');assert.equal(Number(f.e.tmpTo.value),-40);
});

test('ordinaryC/F/K pairs keep expected answers and invalid absolute temperature disables stale brief',()=>{
  const f=fixture(),b=f.mountBrief();
  for (const [value,from,to,expected] of [[0,'C','F',32],[100,'C','K',373.15],[32,'F','C',0],[32,'F','K',273.15],[273.15,'K','C',0],[273.15,'K','F',32]]) {
    f.ctx.preTmp(value,from,to);assert.equal(Number(f.e.tmpTo.value),expected);
  }
  f.ctx.activateTab('temp');f.ctx.preTmp(-1,'R','F');assert.equal(f.e.tmpTo.value,'');assert.ok(b.buttons.every(x=>x.disabled));assert.ok(b.click('download').blocked);
  f.ctx.preTmp(0,'C','R');assert.equal(Number(f.e.tmpTo.value),491.67);assert.equal(b.click('refresh').blocked,false);assert.ok(b.buttons.every(x=>!x.disabled));
});
