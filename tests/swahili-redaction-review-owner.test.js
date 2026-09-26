const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),file=path.join(root,'scripts/build-swahili-document-pdf-lexicon.js');
const phrase='Confirm the final review checkbox before exporting the flattened redacted PDF.';
const expected='Weka tiki kuthibitisha ukaguzi wa mwisho kabla ya kuhamisha PDF. Sehemu ulizoficha zitafutwa, na kurasa zitahifadhiwa kama picha.';
async function run(id='pdf-redact',ambiguous=false,badBoundary=false){
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/localization/sw-document-pdf-lexicon.json'),'utf8'));const raw=fs.readFileSync(path.join(root,'assets/js/pages/sw-document-pdf-lexicon.js'),'utf8');const match=raw.match(/Object\.freeze\((\{.*\})\);/s),combined=JSON.parse(match[1]);
 data.routes['pdf-redact'][phrase]='Synthetic historical review';combined[phrase]='Synthetic historical review';if(ambiguous)data.routes.synthetic={[phrase]:'Synthetic historical review'};
 const before=structuredClone(data),beforeCombined=structuredClone(combined),writes=new Map(),messages=[];
 const jsonPath=path.join(root,'data/localization/sw-document-pdf-lexicon.json'),jsPath=path.join(root,'assets/js/pages/sw-document-pdf-lexicon.js');
 const fakeFs={...fs,readFileSync(p,...args){if(p===jsonPath)return JSON.stringify(data,null,2)+'\n';if(p===jsPath)return badBoundary?'invalid generated boundary':raw.replace(match[1],JSON.stringify(combined));return fs.readFileSync(p,...args);},writeFileSync(p,s){assert([jsonPath,jsPath].includes(p));writes.set(p,s);}};
 const proc={argv:['node',file,'--write','--sync-overrides='+id]};
 await vm.runInNewContext(fs.readFileSync(file,'utf8'),{require:name=>name==='fs'?fakeFs:name==='path'?path:name==='https'?{get(){throw Error('Network forbidden');}}:name==='acorn'?{}:name.includes('build-swahili-document')?{apps:[]}:name.includes('sw-document-pdf-localizer')?{}:require(name),__dirname:path.dirname(file),process:proc,console:{log(){},error(text){messages.push(text);}}});
 return{before,beforeCombined,writes,messages,proc,jsonPath,jsPath};
}
test('bounded native review override changes one existing phrase and preserves every other entry',async()=>{const r=await run();assert.equal(r.proc.exitCode,undefined);assert.equal(r.writes.size,2);r.before.routes['pdf-redact'][phrase]=expected;r.beforeCombined[phrase]=expected;assert.deepEqual(JSON.parse(r.writes.get(r.jsonPath)),r.before);assert.deepEqual(JSON.parse(r.writes.get(r.jsPath).match(/Object\.freeze\((\{.*\})\);/s)[1]),r.beforeCombined);});
for(const [name,id,ambiguous,boundary] of [['unknown route','unknown',false,false],['empty route','',false,false],['ambiguous shared phrase','pdf-redact',true,false],['invalid generated boundary','pdf-redact',false,true]])test('override rejects '+name+' without writes',async()=>{const r=await run(id,ambiguous,boundary);assert.equal(r.proc.exitCode,1);assert.equal(r.writes.size,0);assert(r.messages.length);});
