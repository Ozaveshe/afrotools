'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sources = ['assets/js/lib/pdf-template.js', 'assets/js/lib/src/pdf-template.js'];
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function fixture(file, options = {}) {
  const effects = [], gates = [], scripts = [];
  const doc = new Proxy({
    splitTextToSize: v => [String(v)],
    save: name => { effects.push(['save', name]); options.onSave?.(); },
    output: () => { effects.push(['blob']); return new Blob(['pdf']); },
    text: v => { effects.push(['text', v]); options.onText?.(); }
  }, { get: (o, k) => k in o ? o[k] : () => {} });
  const window = {
    location: { pathname: '/tools/report/' },
    AfroTools: { toast: { success: () => effects.push(['toast']) } },
    dispatchEvent: () => { effects.push(['event']); options.onEvent?.(); },
    gtag: () => effects.push(['analytics']),
    AfroPdfDownloadGate: { guardPromise: async payload => {
      gates.push(payload); return options.gate ? options.gate(payload) : { context: { id: 'allowed' } };
    } }
  };
  if (!options.delayedLoader) window.jspdf = { jsPDF: function () { return doc; } };
  const document = {
    createElement: () => ({}),
    querySelector: selector => selector === 'save-to-vault' ? { setFile: () => effects.push(['vault']) } : null,
    head: { appendChild: script => { scripts.push(script); } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), {
    window, document, Blob, CustomEvent: class { constructor(type, config) { this.type=type;this.detail=config.detail; } },
    Date, setTimeout, clearTimeout, console
  }, { timeout: 1000 });
  return { window, effects, gates, scripts, api: window.AfroTools.pdf, finishLoader() {
    window.jspdf = { jsPDF: function () { return doc; } }; scripts.at(-1).onload();
  } };
}
for (const file of sources) {
  test(`legacy default API, normalization, gate and success effects: ${file}`, { timeout: 1000 }, async () => {
    const f=fixture(file), input={title:'Caf\u00e9 \u2192 report',toolId:'report',currency:'ZAR',summary:[['Total','R 1']],sections:[{heading:'Values',rows:[['A','B']]}]};
    const result=await f.api.generate(input);
    assert.deepEqual(Object.keys(f.api).sort(), ['generate','loadJsPDF']);
    assert.deepEqual(Object.keys(result).sort(), ['blob','fileName','gateContext']);
    assert.equal(f.gates.length,1); assert.equal(f.gates[0].reportConfig.title,'Cafe -> report');
    assert.equal(input.title,'Caf\u00e9 \u2192 report');
    assert.deepEqual(f.effects.filter(e=>e[0]!=='text').map(e=>e[0]),['save','blob','event','vault','analytics','toast']);
  });
  test(`legacy denial and existing bypass classification: ${file}`, { timeout: 1000 }, async () => {
    const denied=fixture(file,{gate:()=>null}); assert.equal((await denied.api.generate({title:'Report'})).blocked,true);
    assert.equal(denied.effects.length,0);
    for (const input of [{skipGate:true},{noGate:true},{toolId:'za-paye'},{category:'salary-tax'}]) {
      const f=fixture(file); await f.api.generate(input); assert.equal(f.gates.length,0);assert.ok(f.effects.some(e=>e[0]==='save'));
    }
    const vat=fixture(file); await vat.api.generate({toolId:'vat'}); assert.equal(vat.gates.length,1);
  });
  test(`stale before gate or throwing predicate has no effects: ${file}`, { timeout: 1000 }, async () => {
    for (const isCurrent of [()=>false,()=>{throw Error('stale');}]) {
      const f=fixture(file), result=await f.api.generate({title:'Report'},{isCurrent});
      assert.equal(result.cancelled,true);assert.equal(result.saved,false);assert.equal(f.gates.length,0);assert.equal(f.effects.length,0);
    }
  });
  test(`gate delay invalidation never loads or saves and callback is not gate data: ${file}`, { timeout: 1000 }, async () => {
    const wait=deferred(); let current=true;
    const f=fixture(file,{gate:()=>wait.promise,delayedLoader:true});
    const pending=f.api.generate({title:'Report'},{isCurrent:()=>current});
    await Promise.resolve(); current=false;wait.resolve({context:{id:'allowed'}});
    assert.equal((await pending).cancelled,true);assert.equal(f.scripts.length,0);assert.equal(f.effects.length,0);
    assert.equal('isCurrent' in f.gates[0].reportConfig,false);
  });
  test(`loader delay invalidation never constructs or saves: ${file}`, { timeout: 1000 }, async () => {
    let current=true;const f=fixture(file,{delayedLoader:true});
    const pending=f.api.generate({skipGate:true},{isCurrent:()=>current});
    for(let i=0;i<8&&!f.scripts.length;i++)await Promise.resolve();
    assert.equal(f.scripts.length,1);current=false;f.finishLoader();
    assert.equal((await pending).cancelled,true);assert.equal(f.effects.length,0);
  });
  test(`render-time invalidation is checked immediately before irreversible save: ${file}`, { timeout: 1000 }, async () => {
    let current=true;const f=fixture(file,{onText:()=>{current=false;}});
    assert.equal((await f.api.generate({skipGate:true},{isCurrent:()=>current})).cancelled,true);
    assert.equal(f.effects.some(e=>e[0]==='save'),false);assert.equal(f.effects.some(e=>e[0]==='toast'),false);
  });
  test(`gate-bootstrap invalidation does not open a late account dialog: ${file}`, {timeout:1000}, async()=>{
    let current=true;const f=fixture(file);delete f.window.AfroPdfDownloadGate;
    const pending=f.api.generate({title:'Report'},{isCurrent:()=>current});
    assert.equal(f.scripts.length,1);assert.match(f.scripts[0].src,/pdf-download-gate/);
    current=false;let calls=0;f.window.AfroPdfDownloadGate={guardPromise:async()=>{calls++;return{};}};f.scripts[0].onload();
    assert.equal((await pending).cancelled,true);assert.equal(calls,0);assert.equal(f.effects.length,0);
  });
  test(`invalidation inside a completed save or event suppresses later success publication: ${file}`, {timeout:1000}, async()=>{
    let current=true;const saved=fixture(file,{onSave:()=>{current=false;}});
    const a=await saved.api.generate({skipGate:true},{isCurrent:()=>current});assert.equal(a.saved,true);assert.equal(a.stale,true);
    assert.deepEqual(saved.effects.filter(e=>e[0]!=='text').map(e=>e[0]),['save']);
    current=true;const emitted=fixture(file,{onEvent:()=>{current=false;}});
    const b=await emitted.api.generate({skipGate:true},{isCurrent:()=>current});assert.equal(b.stale,true);
    assert.deepEqual(emitted.effects.filter(e=>e[0]!=='text').map(e=>e[0]),['save','blob','event']);
  });
}
