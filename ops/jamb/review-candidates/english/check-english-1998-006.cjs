'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1998-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1998-37-9e5abd4f15c4":"B","english-1998-38-dc72d4bbab0e":"D","english-1998-39-a7c399079488":"A","english-1998-40-77df314feeab":"B","english-1998-44-104f924cbabf":"A","english-1998-45-a4958cdadd4b":"D","english-1998-46-6de65218716f":"C"};
const canonicalNumbers={"english-1998-37-9e5abd4f15c4":37,"english-1998-38-dc72d4bbab0e":38,"english-1998-39-a7c399079488":39,"english-1998-40-77df314feeab":40,"english-1998-44-104f924cbabf":44,"english-1998-45-a4958cdadd4b":45,"english-1998-46-6de65218716f":46};
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
