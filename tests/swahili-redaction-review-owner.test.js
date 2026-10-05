const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),file=path.join(root,'scripts/build-swahili-document-pdf-lexicon.js');
const phrase='Confirm the final review checkbox before exporting the flattened redacted PDF.';
const expected='Weka tiki kuthibitisha ukaguzi wa mwisho kabla ya kuhamisha PDF. Sehemu ulizoficha zitafutwa, na kurasa zitahifadhiwa kama picha.';
async function run(id='pdf-redact',collision=null,badBoundary=false){
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/localization/sw-document-pdf-lexicon.json'),'utf8'));const raw=fs.readFileSync(path.join(root,'assets/js/pages/sw-document-pdf-lexicon.js'),'utf8');const match=raw.match(/Object\.freeze\((\{.*\})\);/s),combined=JSON.parse(match[1]);
 data.routes['pdf-redact'][phrase]='Synthetic historical review';combined[phrase]='Synthetic historical review';
 const otherTranslation='Synthetic translation owned by an unselected route';
 if(collision==='first'){data.routes={synthetic:{[phrase]:otherTranslation},...data.routes};combined[phrase]=otherTranslation;}
 if(collision==='last')data.routes.synthetic={[phrase]:otherTranslation};
 const before=structuredClone(data),beforeCombined=structuredClone(combined),writes=new Map(),messages=[];
 const jsonPath=path.join(root,'data/localization/sw-document-pdf-lexicon.json'),jsPath=path.join(root,'assets/js/pages/sw-document-pdf-lexicon.js');
 const fakeFs={...fs,readFileSync(p,...args){if(p===jsonPath)return JSON.stringify(data,null,2)+'\n';if(p===jsPath)return badBoundary?'invalid generated boundary':raw.replace(match[1],JSON.stringify(combined));return fs.readFileSync(p,...args);},writeFileSync(p,s){assert([jsonPath,jsPath].includes(p));writes.set(p,s);}};
 const proc={argv:['node',file,'--write','--sync-overrides='+id]};
 const scriptModule={exports:{}};
 const scriptRequire=name=>name==='fs'?fakeFs:name==='path'?path:name==='https'?{get(){throw Error('Network forbidden');}}:name==='acorn'?{}:name.includes('build-swahili-document')?{apps:[]}:name.includes('sw-document-pdf-localizer')?{}:require(name);
 scriptRequire.main=scriptModule;
 await vm.runInNewContext(fs.readFileSync(file,'utf8'),{require:scriptRequire,module:scriptModule,__filename:file,__dirname:path.dirname(file),process:proc,console:{log(){},error(text){messages.push(text);}}});
 return{before,beforeCombined,writes,messages,proc,jsonPath,jsPath};
}
function assertOnlySelectedOverrideChanged(r,changeCombined){
 assert.equal(r.proc.exitCode,undefined);assert.equal(r.writes.size,2);
 r.before.routes['pdf-redact'][phrase]=expected;if(changeCombined)r.beforeCombined[phrase]=expected;
 assert.deepEqual(JSON.parse(r.writes.get(r.jsonPath)),r.before);
 assert.deepEqual(JSON.parse(r.writes.get(r.jsPath).match(/Object\.freeze\((\{.*\})\);/s)[1]),r.beforeCombined);
}
test('bounded native review override changes one existing phrase and preserves every other entry',async()=>{assertOnlySelectedOverrideChanged(await run(),true);});
test('shared phrase preserves an earlier unselected route and its combined translation',async()=>{assertOnlySelectedOverrideChanged(await run('pdf-redact','first'),false);});
test('shared phrase updates its first owner without changing a later unselected route',async()=>{assertOnlySelectedOverrideChanged(await run('pdf-redact','last'),true);});
for(const [name,id,boundary] of [['unknown route','unknown',false],['empty route','',false],['invalid generated boundary','pdf-redact',true]])test('override rejects '+name+' without writes',async()=>{const r=await run(id,null,boundary);assert.equal(r.proc.exitCode,1);assert.equal(r.writes.size,0);assert(r.messages.length);});
