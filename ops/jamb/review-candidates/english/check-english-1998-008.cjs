'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1998-008.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1998-55-c169275f381e":"D","english-1998-56-1373cd3b26ea":"D","english-1998-57-17b9e0e0d32a":"B","english-1998-58-dfbc917b4ca1":"C","english-1998-59-b2883363c0a4":"A","english-1998-61-67e8b1ac5112":"B","english-1998-62-a6d4c07fe47a":"D","english-1998-63-b1efdd43d6cd":"C","english-1998-64-ddc8be23dd65":"D"};
const canonicalNumbers={"english-1998-55-c169275f381e":55,"english-1998-56-1373cd3b26ea":56,"english-1998-57-17b9e0e0d32a":57,"english-1998-58-dfbc917b4ca1":58,"english-1998-59-b2883363c0a4":59,"english-1998-61-67e8b1ac5112":61,"english-1998-62-a6d4c07fe47a":62,"english-1998-63-b1efdd43d6cd":63,"english-1998-64-ddc8be23dd65":64};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:9,held:11,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
