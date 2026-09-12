'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-46-ea5b67a4bae2":"C","english-1991-49-cf8f3ee5e942":"C","english-1991-51-40da15d10f80":"B","english-1991-52-f6129657126f":"B","english-1991-53-c4d6522302e8":"D","english-1991-54-ee70bbc46079":"D","english-1991-55-e2572468844c":"C","english-1991-56-8b2b0caa3295":"C"};
const canonicalNumbers={"english-1991-46-ea5b67a4bae2":46,"english-1991-49-cf8f3ee5e942":49,"english-1991-51-40da15d10f80":51,"english-1991-52-f6129657126f":52,"english-1991-53-c4d6522302e8":53,"english-1991-54-ee70bbc46079":54,"english-1991-55-e2572468844c":55,"english-1991-56-8b2b0caa3295":56};
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
