'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-9-daf269c0683a":"C","english-1988-11-82b6955fbbe6":"C","english-1988-12-fabe567d7948":"D","english-1988-13-32f0a8818180":"B","english-1988-14-3a7322bfc091":"C","english-1988-15-b6acdcab6aab":"B","english-1988-15-c786a9566990":"C","english-1988-17-9f3bafc53726":"C"};
const canonicalNumbers={"english-1988-9-daf269c0683a":9,"english-1988-11-82b6955fbbe6":11,"english-1988-12-fabe567d7948":12,"english-1988-13-32f0a8818180":13,"english-1988-14-3a7322bfc091":14,"english-1988-15-b6acdcab6aab":15,"english-1988-15-c786a9566990":15,"english-1988-17-9f3bafc53726":17};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:8,held:12,passages:8,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
