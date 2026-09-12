'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-69-89cf70245812":"A","english-1990-70-92575f37692c":"D","english-1990-72-0ef56e268dea":"B","english-1990-73-ce1c204365c6":"C","english-1990-74-9f24f25cae91":"D","english-1990-76-24d8cffa2e65":"B","english-1990-77-c85471e12a88":"A","english-1990-78-7ff6f69d1c43":"C"};
const canonicalNumbers={"english-1990-69-89cf70245812":69,"english-1990-70-92575f37692c":70,"english-1990-72-0ef56e268dea":72,"english-1990-73-ce1c204365c6":73,"english-1990-74-9f24f25cae91":74,"english-1990-76-24d8cffa2e65":76,"english-1990-77-c85471e12a88":77,"english-1990-78-7ff6f69d1c43":78};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:8,held:12,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
