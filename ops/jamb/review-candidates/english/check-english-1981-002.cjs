'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1981-27-e8d5d5ecea37":"B","english-1981-30-7fa6fa789cc0":"C","english-1981-32-be7a81fc0497":"C","english-1981-33-22be60f9abd2":"A","english-1981-35-5e58370118f8":"C","english-1981-37-a7cdc206ec0d":"E","english-1981-38-3e20e8d77823":"B","english-1981-40-4fe5297b7315":"E","english-1981-42-07b43c4c4fb7":"C","english-1981-43-03c1da28d911":"C","english-1981-46-261b37139329":"C","english-1981-47-d3f300e44fc8":"E"};
const canonicalNumbers={"english-1981-27-e8d5d5ecea37":27,"english-1981-30-7fa6fa789cc0":30,"english-1981-32-be7a81fc0497":32,"english-1981-33-22be60f9abd2":33,"english-1981-35-5e58370118f8":35,"english-1981-37-a7cdc206ec0d":37,"english-1981-38-3e20e8d77823":38,"english-1981-40-4fe5297b7315":40,"english-1981-42-07b43c4c4fb7":42,"english-1981-43-03c1da28d911":43,"english-1981-46-261b37139329":46,"english-1981-47-d3f300e44fc8":47};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
