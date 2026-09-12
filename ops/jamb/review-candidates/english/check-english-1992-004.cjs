'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-34-2456d7670f9d":"B","english-1992-35-bbb06c919694":"B","english-1992-36-35acc3a91414":"C","english-1992-37-aa0484021c31":"B","english-1992-38-4245a5f19b60":"B","english-1992-38-a5a661bbcba7":"D","english-1992-39-94a50f9e4840":"B"};
const canonicalNumbers={"english-1992-34-2456d7670f9d":34,"english-1992-35-bbb06c919694":35,"english-1992-36-35acc3a91414":36,"english-1992-37-aa0484021c31":37,"english-1992-38-4245a5f19b60":38,"english-1992-38-a5a661bbcba7":38,"english-1992-39-94a50f9e4840":39};
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
