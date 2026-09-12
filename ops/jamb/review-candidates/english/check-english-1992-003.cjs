'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-27-3ff1f1ae0034":"A","english-1992-28-c0cef288335f":"B","english-1992-29-a21f7c60df8e":"B","english-1992-30-09426ed73844":"A","english-1992-31-5e8b86959bb7":"D","english-1992-32-c54e4b7959f9":"D","english-1992-33-12791ad40678":"C"};
const canonicalNumbers={"english-1992-27-3ff1f1ae0034":27,"english-1992-28-c0cef288335f":28,"english-1992-29-a21f7c60df8e":29,"english-1992-30-09426ed73844":30,"english-1992-31-5e8b86959bb7":31,"english-1992-32-c54e4b7959f9":32,"english-1992-33-12791ad40678":33};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:7,held:13,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
