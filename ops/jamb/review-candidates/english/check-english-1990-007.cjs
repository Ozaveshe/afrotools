'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-007.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-92-7b51ea5c7abc":"B","english-1990-94-5da8bbd3472b":"B","english-1990-96-97e91a0b183b":"A","english-1990-97-f28b5160c5c5":"A","english-1990-98-ac22c8009851":"A","english-1990-99-a426d9c910d0":"B","english-1990-99-d00b948b0df6":"C","english-1990-100-1da0b7cd9460":"C","english-1989-6-2b8d2d272aff":"A","english-1989-7-d4e1643b23fc":"C"};
const canonicalNumbers={"english-1990-92-7b51ea5c7abc":92,"english-1990-94-5da8bbd3472b":94,"english-1990-96-97e91a0b183b":96,"english-1990-97-f28b5160c5c5":97,"english-1990-98-ac22c8009851":98,"english-1990-99-a426d9c910d0":99,"english-1990-99-d00b948b0df6":99,"english-1990-100-1da0b7cd9460":100,"english-1989-6-2b8d2d272aff":6,"english-1989-7-d4e1643b23fc":7};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:2,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
