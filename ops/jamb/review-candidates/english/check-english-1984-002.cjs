'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1984-90-f2a012f51f8a":"D","english-1984-91-69b0c9fd9f7e":"C","english-1984-92-d0bacd7ee494":"A","english-1984-94-8101524f2f60":"D","english-1984-96-f05dd4b1f550":"C","english-1984-99-7abdafde4a41":"D","english-1984-100-8535aeb10edc":"A","english-1984-100-6aa48473ee15":"A","english-1983-1-a853a351e0db":"E","english-1983-2-014094c27585":"B"};
const canonicalNumbers={"english-1984-90-f2a012f51f8a":90,"english-1984-91-69b0c9fd9f7e":91,"english-1984-92-d0bacd7ee494":92,"english-1984-94-8101524f2f60":94,"english-1984-96-f05dd4b1f550":96,"english-1984-99-7abdafde4a41":99,"english-1984-100-8535aeb10edc":100,"english-1984-100-6aa48473ee15":100,"english-1983-1-a853a351e0db":1,"english-1983-2-014094c27585":2};
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
