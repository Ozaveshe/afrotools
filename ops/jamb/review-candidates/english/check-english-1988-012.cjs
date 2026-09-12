'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-012.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-87-1514ee1bbcb4":"C","english-1988-88-6752126dd6da":"C","english-1988-89-7193bfee4462":"C","english-1988-90-e5d47a53a0b0":"D","english-1988-90-98fc645082a6":"C","english-1988-91-9a3d424dc26f":"D","english-1988-92-e1f64fe36dd2":"A","english-1988-92-41ae8845dd6a":"D"};
const canonicalNumbers={"english-1988-87-1514ee1bbcb4":87,"english-1988-88-6752126dd6da":95,"english-1988-89-7193bfee4462":96,"english-1988-90-e5d47a53a0b0":97,"english-1988-90-98fc645082a6":90,"english-1988-91-9a3d424dc26f":91,"english-1988-92-e1f64fe36dd2":89,"english-1988-92-41ae8845dd6a":92};
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
