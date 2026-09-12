'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1998-009.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1998-65-8a6668dc7fe8":"D","english-1998-67-e51555975d9c":"A","english-1998-68-d8208e13505a":"A","english-1998-69-254fbe5f6f2b":"B","english-1998-70-747cc8cdd23e":"A","english-1998-71-8870838dafcc":"B","english-1998-71-c9eb45683f6d":"B"};
const canonicalNumbers={"english-1998-65-8a6668dc7fe8":65,"english-1998-67-e51555975d9c":67,"english-1998-68-d8208e13505a":68,"english-1998-69-254fbe5f6f2b":69,"english-1998-70-747cc8cdd23e":70,"english-1998-71-8870838dafcc":71,"english-1998-71-c9eb45683f6d":71};
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
