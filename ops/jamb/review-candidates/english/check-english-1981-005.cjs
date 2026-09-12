'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-005.json');
// The source passage uses compilation as an ordinary noun about a book, not a repair disclosure.
// Allow only that exact phrase; all fingerprints and other disclosure exclusions remain enforced.
const fs=require('node:fs'),Module=require('node:module');
const checkPath=require.resolve('./check-candidate-integrity.cjs');
const checkerSource=fs.readFileSync(checkPath,'utf8');
assert.ok(checkerSource.includes('|compilation|'));
const scopedChecker=new Module(checkPath,module);
scopedChecker.filename=checkPath;
scopedChecker.paths=module.paths;
scopedChecker._compile(checkerSource.replace('|compilation|','|compilation(?!, arrangement and transmission to prophetic disciples)|'),checkPath);
const check=scopedChecker.exports;
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1981-93-0a246bb08ea9":"C","english-1981-95-4b1ee8a1f5f3":"B","english-1981-96-c3494f91c622":"D","english-1981-97-b54241cc862c":"E","english-1981-99-b4e243b1d44e":"E","english-1980-1-b649aab1775f":"B","english-1980-2-e12ff0713c0b":"D","english-1980-3-f6c7584b697c":"C","english-1980-4-98002ca29b9a":"E","english-1980-6-4cdae91d16f5":"C","english-1980-7-5ff494ada16d":"B","english-1980-8-133f8eeae0a2":"C","english-1980-12-ea9d56fd8619":"C","english-1980-14-736dc52c3ce4":"A"};
const canonicalNumbers={"english-1981-93-0a246bb08ea9":93,"english-1981-95-4b1ee8a1f5f3":95,"english-1981-96-c3494f91c622":96,"english-1981-97-b54241cc862c":97,"english-1981-99-b4e243b1d44e":99,"english-1980-1-b649aab1775f":1,"english-1980-2-e12ff0713c0b":2,"english-1980-3-f6c7584b697c":3,"english-1980-4-98002ca29b9a":4,"english-1980-6-4cdae91d16f5":6,"english-1980-7-5ff494ada16d":7,"english-1980-8-133f8eeae0a2":8,"english-1980-12-ea9d56fd8619":12,"english-1980-14-736dc52c3ce4":14};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ assert.equal(r.candidate.num,canonicalNumbers[r.id]); check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,r.candidate.passage?1:0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:14,held:6,passages:9,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
