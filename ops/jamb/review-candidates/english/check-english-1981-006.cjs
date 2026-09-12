'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1980-18-e558d5bf5780":"C","english-1980-19-1fb7a2bd9b53":"E","english-1980-21-56862b949960":"B","english-1980-25-dd473b32a5e3":"A","english-1980-34-1102a14aa357":"C","english-1980-37-82a15e0ca364":"C"};
const canonicalNumbers={"english-1980-18-e558d5bf5780":18,"english-1980-19-1fb7a2bd9b53":19,"english-1980-21-56862b949960":21,"english-1980-25-dd473b32a5e3":25,"english-1980-34-1102a14aa357":34,"english-1980-37-82a15e0ca364":37};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:4,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
