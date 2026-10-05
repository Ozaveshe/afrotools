'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {compile,build,FILES} = require('../scripts/build-swahili-cv-application-pack-runtime');
const ROOT = path.resolve(__dirname,'..');

function generator(filename) {
  const document={readyState:'loading',addEventListener(){}};
  const context={window:{},document,console};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,filename),'utf8'),context);
  return context.window.CVApplicationPack.generatePack;
}

test('native pack generation preserves author collisions, machine keys and five tone contracts',()=>{
  const native=generator('sw/zana/mjenzi-cv/js/cv-application-pack.js');
  const english=generator('tools/cv-builder/js/cv-application-pack.js');
  const data={fn:'Global Compact',ln:'Māori',title:'Payment Instructions',summary:'Cover letter',skills:{h:'Balance Due',s:'Application Pack'},exps:[{t:'Cover letter',c:'Application Pack',d:'Payment Instructions 12%.'}],edus:[]};
  for(const tone of ['formal','confident','graduate','executive','diaspora']) {
    const target={role:'Cover letter',company:'Application Pack',jd:'',tone};
    const result=native(data,target);
    assert.deepEqual(Object.keys(result),Object.keys(english(data,target)));
    for(const key of ['coverLetter','emailMessage','recruiterMessage']) {
      for(const authored of ['Global Compact Māori','Cover letter','Application Pack','Payment Instructions 12%.']) assert.ok(result[key].includes(authored),`${tone}/${key} author slot`);
    }
    assert.ok(result.coverLetter.startsWith('Kwa timu ya uajiri ya Application Pack,'));
    assert.ok(result.emailMessage.startsWith('Mada: '));
    assert.ok(result.followupApplication.includes('Ninafuatilia maombi yangu'));
    assert.ok(result.followupInterview.includes('Asante kwa kupata muda'));
    assert.equal(/Dear |Kind regards|I am applying|Subject:|I hope you are well/.test(Object.values(result).join('\n')),false);
  }
  assert.equal(data.title,'Payment Instructions');
  assert.equal(data.exps[0].d,'Payment Instructions 12%.');
});

test('scoped compiler protects keys and stored status/tone/source values',()=>{
  const source='const values={"Cover letter":"Cover letter",status:"Saved",tone:"formal",source:"Application Pack",id:"Cover letter"}; const labels=["Cover letter","Saved"];';
  const compiled=compile(source,'cv-application-pack-polish.js').output;
  const value=vm.runInNewContext(compiled+'; ({values,labels})');
  assert.equal(value.values['Cover letter'],'Barua ya maombi ya kazi');
  assert.equal(value.values.status,'Saved');
  assert.equal(value.values.tone,'formal');
  assert.equal(value.values.source,'Application Pack');
  assert.equal(value.values.id,'Cover letter');
  assert.deepEqual(Array.from(value.labels),['Barua ya maombi ya kazi','Imehifadhiwa']);
});

test('shared awaited PDF writer retains empty and stale-edit guards with native messages',()=>{
  const source='async function exportPack(){if(!assets.length){status("Generate or write at least one asset before exporting.");return;}try{const bytes=await window.CVExportAtsPlainPdf.buildPdf(text);if(snapshot!==current){status("Application pack changed. Review it and export again.");return;}download(new window.Blob([bytes]),name,"application/pdf");}catch(error){status("PDF export is unavailable in this browser. Use TXT or DOC export.");}}';
  const result=compile(source,'cv-application-pack.js').output;
  assert.ok(result.includes('await window.CVExportAtsPlainPdf.buildPdf(text)'));
  assert.ok(result.includes('snapshot!==current'));
  assert.ok(result.includes('Tengeneza au andika angalau waraka mmoja'));
  assert.ok(result.includes('Kifurushi cha maombi ya kazi kimebadilika'));
  assert.throws(()=>compile(source.replace('download(new window.Blob','await window.CVExportAtsPlainPdf.buildPdf(text);download(new window.Blob'),'cv-application-pack.js'),/Unicode pack PDF owner changed/);
});

test('tracker author slots are protected without excluding country and ordinary copy',()=>{
  const owner=fs.existsSync(path.join(ROOT,'tools/cv-builder/js/src/cv-job-tracker.js'))
    ? 'tools/cv-builder/js/src/cv-job-tracker.js' : 'tools/cv-builder/js/cv-job-tracker.js';
  const result=compile(fs.readFileSync(path.join(ROOT,owner),'utf8'),'cv-job-tracker.js').output;
  assert.ok(result.includes('<strong translate=\\"no\\" data-cv-user-text>'));
  assert.ok(result.includes('</strong><span translate=\\"no\\" data-cv-user-text>'));
  assert.ok(result.includes('</span> · <span>'));
  assert.ok(result.includes('cv-tracker-note\\" translate=\\"no\\" data-cv-user-text'));
  assert.ok(result.includes('</b><span translate=\\"no\\" data-cv-user-text>'));
  assert.ok(result.includes('<option translate=\\"no\\" data-cv-user-text value=\\"'));
  assert.ok(result.includes('Haijaambatishwa'));
});

test('mobile document context survives form focus loss and ends on a main CV command',()=>{
  const active=new Set(),events=new Map(),windowEvents=new Map();
  const document={body:{classList:{add:value=>active.add(value),remove:value=>active.delete(value)}},
    querySelector:()=>({content:'cv-builder'}),querySelectorAll:()=>[],
    addEventListener:(name,handler)=>events.set(name,handler)};
  const window={innerWidth:320,innerHeight:844,addEventListener:(name,handler)=>windowEvents.set(name,handler)};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'assets/js/pages/sw-document-pdf-dom-stability.js'),'utf8'),{document,window,Element:{prototype:{}}});
  events.get('focusin')({target:{closest:selector=>selector.includes('.cv-job-tracker-panel')?{}:null}});
  assert.equal(active.has('sw-cv-document-controls-active'),true);
  events.get('focusin')({target:{closest:()=>null}});
  windowEvents.get('scroll')();
  assert.equal(active.has('sw-cv-document-controls-active'),true,'removed form focus must not move the dock before the next pointer click');
  events.get('click')({target:{closest:selector=>selector.includes('.cv-toolbar [data-action]')?{}:null}});
  assert.equal(active.has('sw-cv-document-controls-active'),false);
  const css=fs.readFileSync(path.join(ROOT,'assets/css/sw-cv-application-pack.css'),'utf8');
  assert.ok(css.includes('body.sw-cv-document-controls-active .cv-layout-action-bar'));
  assert.equal(css.includes(':focus-within'),false,'focus-driven position changes must not move a pointer target');
});

test('four generated modules and native route references match maintained owners',()=>{
  const result=build();
  assert.deepEqual(result.map(item=>item.filename),FILES);
  result.forEach(item=>assert.equal(item.sourceOwner,fs.existsSync(path.join(ROOT,'tools/cv-builder/js/src',item.filename))
    ? 'tools/cv-builder/js/src/'+item.filename : 'tools/cv-builder/js/'+item.filename));
  const page=fs.readFileSync(path.join(ROOT,'sw/zana/mjenzi-cv/index.html'),'utf8');
  FILES.forEach(file=>assert.ok(page.includes('/sw/zana/mjenzi-cv/js/'+file+'?v=')));
  assert.equal(page.includes('src="/tools/cv-builder/js/cv-application-pack.js'),false);
  assert.equal(page.includes('src="/tools/cv-builder/js/cv-application-pack-export.js'),false);
});
