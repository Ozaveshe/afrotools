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

test('four generated modules and native route references match maintained owners',()=>{
  const result=build();
  assert.deepEqual(result.map(item=>item.filename),FILES);
  const page=fs.readFileSync(path.join(ROOT,'sw/zana/mjenzi-cv/index.html'),'utf8');
  FILES.forEach(file=>assert.ok(page.includes('/sw/zana/mjenzi-cv/js/'+file+'?v=')));
  assert.equal(page.includes('src="/tools/cv-builder/js/cv-application-pack.js'),false);
  assert.equal(page.includes('src="/tools/cv-builder/js/cv-application-pack-export.js'),false);
});
