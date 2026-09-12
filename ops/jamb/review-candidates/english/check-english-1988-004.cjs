'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-29-8ef66f91e290":"B","english-1988-30-a67483c66cc5":"D","english-1988-32-a3c2d78e02a5":"A","english-1988-33-4ba3c4b4f50b":"A","english-1988-34-4f17230b7616":"B","english-1988-35-f2392c8b1ad8":"A"};
const canonicalNumbers={"english-1988-29-8ef66f91e290":29,"english-1988-30-a67483c66cc5":30,"english-1988-32-a3c2d78e02a5":32,"english-1988-33-4ba3c4b4f50b":33,"english-1988-34-4f17230b7616":34,"english-1988-35-f2392c8b1ad8":35};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
