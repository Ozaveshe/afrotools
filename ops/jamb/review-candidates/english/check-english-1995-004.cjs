'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1995-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1995-43-6978427a2420":"B","english-1995-44-8e9a2d2c7dd0":"C","english-1995-47-dc6db44d52ed":"C","english-1995-48-71082fd4a9ea":"B","english-1995-49-0f7b9792bdf6":"A","english-1995-50-139b6b8c97f7":"C","english-1995-51-14192a2a270f":"A","english-1995-52-a0b75815a2e5":"C"};
const canonicalNumbers={"english-1995-43-6978427a2420":43,"english-1995-44-8e9a2d2c7dd0":44,"english-1995-47-dc6db44d52ed":47,"english-1995-48-71082fd4a9ea":48,"english-1995-49-0f7b9792bdf6":49,"english-1995-50-139b6b8c97f7":50,"english-1995-51-14192a2a270f":51,"english-1995-52-a0b75815a2e5":52};
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
