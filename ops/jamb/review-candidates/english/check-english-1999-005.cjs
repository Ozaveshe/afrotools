'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1999-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1999-79-f365f88aa7ca":"B","english-1999-81-978d5e523c34":"A","english-1999-82-ee7a0ab98662":"D","english-1999-86-172dcb53be47":"B"};
const canonicalNumbers={"english-1999-79-f365f88aa7ca":79,"english-1999-81-978d5e523c34":81,"english-1999-82-ee7a0ab98662":82,"english-1999-86-172dcb53be47":86};
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
 assert.equal(ids.size,10);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:10,candidates:4,held:6,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
