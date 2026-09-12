'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-82-2efa9d62774e":"D","english-1990-83-6132ee1727b6":"A","english-1990-84-ad5306110a3c":"D","english-1990-85-cf33037020d2":"C","english-1990-88-e60097c366ed":"B","english-1990-89-c7846fcef718":"B","english-1990-90-d5602b80fb1e":"D"};
const canonicalNumbers={"english-1990-82-2efa9d62774e":82,"english-1990-83-6132ee1727b6":83,"english-1990-84-ad5306110a3c":84,"english-1990-85-cf33037020d2":85,"english-1990-88-e60097c366ed":88,"english-1990-89-c7846fcef718":89,"english-1990-90-d5602b80fb1e":90};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:7,held:13,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
