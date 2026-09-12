'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-27-0fbab6dbe1d6":"B","english-1986-28-281dbbd1bb69":"A","english-1986-29-ca5ae5b29008":"D","english-1986-30-a6b77fce4e1c":"B","english-1986-32-e8b86afacaa8":"D"};
const canonicalNumbers={"english-1986-27-0fbab6dbe1d6":27,"english-1986-28-281dbbd1bb69":28,"english-1986-29-ca5ae5b29008":29,"english-1986-30-a6b77fce4e1c":30,"english-1986-32-e8b86afacaa8":32};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:5,held:15,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
