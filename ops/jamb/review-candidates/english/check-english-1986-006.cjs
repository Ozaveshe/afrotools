'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-57-1014a86b1d17":"C","english-1986-58-8ca7075e1d49":"D","english-1986-59-e16f3b34318f":"C","english-1986-60-e199eb891d87":"B","english-1986-61-59788ae693dc":"A","english-1986-63-95382de23353":"C","english-1986-64-b013efb6b13b":"D","english-1986-65-6346c000188c":"B"};
const canonicalNumbers={"english-1986-57-1014a86b1d17":57,"english-1986-58-8ca7075e1d49":58,"english-1986-59-e16f3b34318f":59,"english-1986-60-e199eb891d87":60,"english-1986-61-59788ae693dc":61,"english-1986-63-95382de23353":63,"english-1986-64-b013efb6b13b":64,"english-1986-65-6346c000188c":65};
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
