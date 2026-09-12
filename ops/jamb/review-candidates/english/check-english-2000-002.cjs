'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2000-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2000-48-9fae10a7fb5e":"C","english-2000-49-a37a714aa832":"B","english-2000-50-e2b70ed722b1":"A","english-2000-52-cce65f6e91bb":"C","english-2000-53-224896e1d95d":"D","english-2000-55-01c0b8938cc4":"C","english-2000-56-323d34f7f4e5":"A","english-2000-58-9d958149eba4":"D","english-2000-59-40d65a949233":"A","english-2000-60-fb6e033e2e79":"C","english-2000-61-7a9fa843e0f3":"C","english-2000-62-8a2f7b83990a":"B","english-2000-64-b465ba498309":"B","english-2000-66-125caed52033":"D","english-2000-67-9a359ef028e4":"B"};
const canonicalNumbers={"english-2000-48-9fae10a7fb5e":38,"english-2000-49-a37a714aa832":29,"english-2000-50-e2b70ed722b1":30,"english-2000-52-cce65f6e91bb":33,"english-2000-53-224896e1d95d":46,"english-2000-55-01c0b8938cc4":47,"english-2000-56-323d34f7f4e5":37,"english-2000-58-9d958149eba4":36,"english-2000-59-40d65a949233":40,"english-2000-60-fb6e033e2e79":39,"english-2000-61-7a9fa843e0f3":34,"english-2000-62-8a2f7b83990a":43,"english-2000-64-b465ba498309":98,"english-2000-66-125caed52033":97,"english-2000-67-9a359ef028e4":96};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
