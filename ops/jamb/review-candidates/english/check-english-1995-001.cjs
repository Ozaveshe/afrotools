'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1995-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1997-63-fb5294a21887":"A","english-1997-65-65a2425146cf":"D","english-1997-66-8ec5f3ee9810":"D","english-1997-67-1a37171b3b84":"D","english-1997-68-bcbb853bc5ee":"B","english-1997-70-e69629801654":"C","english-1997-86-6b03f245f73a":"C","english-1995-1-a49223982f9e":"C","english-1995-1-42973d9e9892":"A","english-1995-2-a4eb8a03115a":"B","english-1995-3-fc6aad739dc5":"C","english-1995-4-b256ff085b3f":"C","english-1995-6-6fa8c810cb9f":"C"};
const canonicalNumbers={"english-1997-63-fb5294a21887":63,"english-1997-65-65a2425146cf":65,"english-1997-66-8ec5f3ee9810":66,"english-1997-67-1a37171b3b84":67,"english-1997-68-bcbb853bc5ee":68,"english-1997-70-e69629801654":70,"english-1997-86-6b03f245f73a":86,"english-1995-1-a49223982f9e":1,"english-1995-1-42973d9e9892":1,"english-1995-2-a4eb8a03115a":2,"english-1995-3-fc6aad739dc5":3,"english-1995-4-b256ff085b3f":4,"english-1995-6-6fa8c810cb9f":6};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:6,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
