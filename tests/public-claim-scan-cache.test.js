'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const cache=require('../scripts/lib/public-claim-scan-cache');
function fixture(t){
  const temporary=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temporary,'claims-cache-test-'));
  t.after(()=>{const resolved=fs.realpathSync(root);assert.equal(path.dirname(resolved),temporary);assert.match(path.basename(resolved),/^claims-cache-test-/);fs.rmSync(resolved,{recursive:true,force:true});});
  const put=(name,value)=>{fs.writeFileSync(path.join(root,name),value);return path.join(root,name);};
  const absolute=put('a.html','first synthetic content'),scannerModule=put('scanner.js','synthetic scanner v1');put('evidence.json','{"synthetic":1}');
  const input={root,claims:{claims:[{key:'fixture',evidenceSources:['evidence.json','live-read:synthetic-proof']} ]},flows:{flows:[]},today:'2026-10-22',files:[{path:'a.html',absolute,content:'first synthetic content'}],validation:{ok:true,errors:[],warnings:[]},scannerModule,scannerSource:'synthetic scanner function v1'};
  const scope={directory:path.join(root,'runner','cache'),identity:{root,commit:'synthetic-source',runId:'synthetic-run',attempt:'1',job:'artifact',node:process.version,executionOptionsSha256:'synthetic-options'}};
  const result={ok:true,errors:[],warnings:[],rawHits:2,approvedHits:2,hits:[{claim:'fixture',file:'a.html',line:1,text:'synthetic'}]};
  return{root,put,input,scope,result,key:()=>cache.fingerprint(input)};
}
test('only a complete passing result is reused without rewriting proof time or fields',t=>{
  const f=fixture(t),key=f.key(),now=Date.now();assert.match(key,/^[a-f0-9]{64}$/);assert.equal(cache.read(f.scope,key,now),null);
  assert.equal(cache.write(f.scope,key,f.result,now),true);const filename=path.join(f.scope.directory,key+'.json'),before=fs.readFileSync(filename);
  assert.deepEqual(cache.read(f.scope,key,now+100),f.result);assert.deepEqual(fs.readFileSync(filename),before);
  const altered=cache.read(f.scope,key,now+200);altered.rawHits=0;assert.deepEqual(cache.read(f.scope,key,now+300),f.result);
  assert.equal(cache.write(f.scope,'a'.repeat(64),{...f.result,ok:false,errors:[{code:'synthetic_failure'}]},now),false);
  assert.equal(cache.read(f.scope,'a'.repeat(64),now),null);assert.equal(cache.write(f.scope,key,{ok:true},now),false);
});
test('all source bytes, paths, order and scan configuration invalidate the prior proof',t=>{
  const f=fixture(t),key=f.key();
  for(const [label,mutate]of [
    ['claim wording',v=>v.claims.claims[0].meaning='changed'],['claim regex',v=>v.claims.claims[0].detectionPatterns=['changed']],
    ['flow',v=>v.flows.flows.push({key:'changed',evidenceSources:[]})],['review date',v=>v.today='2026-10-23'],
    ['fresh validation warning',v=>v.validation.warnings.push({code:'changed'})],['runtime scanner source',v=>v.scannerSource+=' changed'],
    ['removed public file',v=>v.files=[]],['duplicate public file',v=>v.files.push({...v.files[0]})]
  ]){const v=structuredClone(f.input);mutate(v);assert.notEqual(cache.fingerprint(v),key,label);}
  const stale=structuredClone(f.input);stale.validation.ok=false;assert.equal(cache.fingerprint(stale),null);
  const projected=structuredClone(f.input);projected.files[0].content+=' changed';assert.equal(cache.fingerprint(projected),null,'a projection differing from raw bytes cannot reuse');
  const b=f.put('b.html','second synthetic content'),two=structuredClone(f.input);two.files.push({path:'b.html',absolute:b,content:'second synthetic content'});
  assert.notEqual(cache.fingerprint(two),key);assert.notEqual(cache.fingerprint({...two,files:[...two.files].reverse()}),cache.fingerprint(two));
  const wrong=structuredClone(f.input);wrong.files[0].path='another.html';assert.equal(cache.fingerprint(wrong),null);
  f.put('a.html','changed actual source');f.input.files[0].content='changed actual source';assert.notEqual(f.key(),key);
});
test('evidence and scanner implementation changes invalidate even unchanged public HTML',t=>{
  const f=fixture(t),key=f.key();f.put('evidence.json','{"synthetic":2}');assert.notEqual(f.key(),key);
  f.put('evidence.json','{"synthetic":1}');assert.equal(f.key(),key);f.put('scanner.js','synthetic scanner v2');assert.notEqual(f.key(),key);
  f.put('scanner.js','synthetic scanner v1');assert.equal(f.key(),key);
  const missing=structuredClone(f.input);missing.claims.claims[0].evidenceSources.push('missing.json');assert.equal(cache.fingerprint(missing),null);
  const outside=structuredClone(f.input);outside.claims.claims[0].evidenceSources.push('../outside');assert.equal(cache.fingerprint(outside),null);
  const liveId=structuredClone(f.input);liveId.claims.claims[0].evidenceSources[1]='live-read:another-synthetic-proof';assert.notEqual(cache.fingerprint(liveId),key);
});
test('different invalid UTF8 bytes cannot collide through the same decoded replacement character',t=>{
  const f=fixture(t);f.put('a.html',Buffer.from([255]));f.input.files[0].content='�';const first=f.key();assert.match(first,/^[a-f0-9]{64}$/);
  f.put('a.html',Buffer.from([254]));assert.notEqual(f.key(),first);
});
test('another run, attempt, job, commit, workspace or runtime never inherits the result',t=>{
  const f=fixture(t),key=f.key();cache.write(f.scope,key,f.result);
  for(const field of ['root','commit','runId','attempt','job','node','executionOptionsSha256']){const other=structuredClone(f.scope);other.identity[field]+='-changed';assert.equal(cache.read(other,key),null,field);}
});
test('expired, future, malformed, altered and oversized cache records fall back to recomputation',t=>{
  const f=fixture(t),key=f.key(),now=Date.now();cache.write(f.scope,key,f.result,now);const filename=path.join(f.scope.directory,key+'.json'),original=fs.readFileSync(filename,'utf8');
  assert.deepEqual(cache.read(f.scope,key,now+cache.MAX_AGE_MS),f.result);assert.equal(cache.read(f.scope,key,now+cache.MAX_AGE_MS+1),null);assert.equal(cache.read(f.scope,key,now-1),null);
  for(const [label,change]of [
    ['schema',v=>v.schema++],['input hash',v=>v.key='0'.repeat(64)],['result digest',v=>v.result.rawHits++],
    ['failed result',v=>v.result.ok=false],['invalid proof time',v=>v.createdAt='not a date']
  ]){const v=JSON.parse(original);change(v);fs.writeFileSync(filename,JSON.stringify(v));assert.equal(cache.read(f.scope,key,now),null,label);}
  fs.writeFileSync(filename,'not-json');assert.equal(cache.read(f.scope,key),null);fs.writeFileSync(filename,'x'.repeat(513*1024));assert.equal(cache.read(f.scope,key),null);
  const large={...f.result,hits:[{text:'x'.repeat(513*1024)}]};assert.equal(cache.write(f.scope,key,large),false);
});
test('missing metadata and non-producer environments cannot enable shared reuse',()=>{
  const base={GITHUB_ACTIONS:'true',GITHUB_JOB:'artifact',GITHUB_REPOSITORY:'Ozaveshe/afrotools',GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',GITHUB_SHA:'0'.repeat(40),GITHUB_WORKSPACE:path.resolve(__dirname,'..'),RUNNER_TEMP:os.tmpdir()};
  for(const [field,value]of [['GITHUB_ACTIONS','false'],['GITHUB_JOB','verify'],['GITHUB_REPOSITORY','other/repo'],['GITHUB_RUN_ID','invalid'],['GITHUB_RUN_ATTEMPT','0'],['GITHUB_SHA','invalid'],['GITHUB_WORKSPACE','other'],['RUNNER_TEMP','relative']]){
    assert.equal(cache.context(path.resolve(__dirname,'..'),{...base,[field]:value}),null,field);
  }
  assert.equal(cache.context(path.resolve(__dirname,'..'),base),null,'a missing or nonmatching Git identity stays uncached');
});
