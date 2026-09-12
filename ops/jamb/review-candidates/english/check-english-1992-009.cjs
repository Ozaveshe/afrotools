'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-009.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-65-aa08eff5c965":"C","english-1992-66-76daa9693e83":"B","english-1992-66-8f212842c104":"C","english-1992-67-28cf549d8f8d":"B","english-1992-68-30014fe309ff":"B","english-1992-68-90d4fd1e5e26":"C","english-1992-68-ba87a62d5126":"A","english-1992-69-f070c18ac21d":"D","english-1992-69-079e1bc21a74":"C","english-1992-70-d99aeed6ec51":"A","english-1992-71-70a9b39f441a":"D","english-1992-72-721e5f27ab26":"C"};
const canonicalNumbers={"english-1992-65-aa08eff5c965":65,"english-1992-66-76daa9693e83":66,"english-1992-66-8f212842c104":66,"english-1992-67-28cf549d8f8d":67,"english-1992-68-30014fe309ff":68,"english-1992-68-90d4fd1e5e26":68,"english-1992-68-ba87a62d5126":68,"english-1992-69-f070c18ac21d":69,"english-1992-69-079e1bc21a74":69,"english-1992-70-d99aeed6ec51":70,"english-1992-71-70a9b39f441a":71,"english-1992-72-721e5f27ab26":72};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
