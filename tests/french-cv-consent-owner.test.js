'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('scoped reviewed French lexicon generation works offline, honors reviewed copy and preserves other routes',()=>{
  const root=path.resolve(__dirname,'..'),directory=path.join(root,'artifacts');fs.mkdirSync(directory,{recursive:true});
  const fixture=fs.mkdtempSync(path.join(directory,'cv-lexicon-owner-'));
  for(const file of ['scripts/build-french-document-pdf-lexicon.js','assets/js/lib/fr-document-pdf-localizer.js']){
    fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(fixture,file));
  }
  function json(file,value){fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.writeFileSync(path.join(fixture,file),JSON.stringify(value,null,2)+'\n');}
  const unchanged={'Existing document copy':'Texte existant du document'};
  json('data/localization/fr-document-pdf-parity.json',{apps:[{id:'cv-builder',englishFile:'cv.html'},{id:'other-route',englishFile:'missing-unselected.html'}]});
  json('data/localization/fr-document-pdf-language-allowlist.json',{globalExactTerms:[],routeExactTerms:{}});
  json('data/localization/fr-document-pdf-lexicon-overrides.json',{routes:{'cv-builder':{'Optional cloud backup':'Sauvegarde cloud facultative'}}});
  json('data/localization/fr-document-pdf-lexicon.json',{routes:{'cv-builder':{'Optional cloud backup':'Ancien texte','Retained reviewed copy':'Texte conservé'},'other-route':unchanged}});
  fs.writeFileSync(path.join(fixture,'cv.html'),'<p>Optional cloud backup</p><p>Unreviewed text stays out of this bounded translation update.</p>');
  fs.writeFileSync(path.join(fixture,'deny-network.cjs'),"require('https').get=()=>{throw Error('External translation request forbidden in this test');};");
  function run(args){return spawnSync(process.execPath,['-r',path.join(fixture,'deny-network.cjs'),path.join(fixture,'scripts/build-french-document-pdf-lexicon.js'),...args],{encoding:'utf8',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});}
  const result=run(['--write','--app=cv-builder','--reviewed-only']);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/0 unique strings/);
  const output=JSON.parse(fs.readFileSync(path.join(fixture,'data/localization/fr-document-pdf-lexicon.json')));
  assert.deepEqual(output.routes['other-route'],unchanged);assert.equal(output.routes['cv-builder']['Optional cloud backup'],'Sauvegarde cloud facultative');assert.equal(output.routes['cv-builder']['Retained reviewed copy'],'Texte conservé');
  assert.equal(run(['--app=cv-builder','--reviewed-only']).status,0);assert.equal(run(['--reviewed-only']).status,1);assert.equal(run(['--app=unknown','--reviewed-only']).status,1);
});
