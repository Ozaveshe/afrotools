'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1989-96-256ff6fe9714":"B","english-1989-97-44b084b47e43":"A","english-1988-1-04600bbd73f4":"D","english-1988-1-970a04e7fcca":"A","english-1988-2-bbb19ef043fa":"B","english-1988-2-016adcc3eaad":"A","english-1988-3-b5111c82345d":"A","english-1988-3-0983295c850e":"C","english-1988-4-f971ca292ae9":"B","english-1988-4-2333a2306667":"D","english-1988-6-8da024304b13":"A","english-1988-8-e47d0646f8e1":"B"};
const canonicalNumbers={"english-1989-96-256ff6fe9714":96,"english-1989-97-44b084b47e43":97,"english-1988-1-04600bbd73f4":1,"english-1988-1-970a04e7fcca":1,"english-1988-2-bbb19ef043fa":2,"english-1988-2-016adcc3eaad":2,"english-1988-3-b5111c82345d":3,"english-1988-3-0983295c850e":3,"english-1988-4-f971ca292ae9":4,"english-1988-4-2333a2306667":4,"english-1988-6-8da024304b13":6,"english-1988-8-e47d0646f8e1":8};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
