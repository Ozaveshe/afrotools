'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1985-31-e2235d5f4633":"A","english-1985-32-eac6c6cbea75":"C","english-1985-33-44c6ba399eeb":"D","english-1985-36-e31a2ab82b56":"A","english-1985-37-c5fd7825984e":"B","english-1985-38-919e8ad022aa":"C","english-1985-40-7945041357db":"B","english-1985-41-030a37c95926":"A","english-1985-42-dba756363071":"D","english-1985-43-5447f34fede7":"B","english-1985-44-76e740cbe507":"C","english-1985-45-554f0bd4a724":"D","english-1985-46-94f5da512a97":"A","english-1985-47-3a61e17ae899":"E","english-1985-48-bf4fe0e2ec5a":"B","english-1985-49-c49a815d6220":"C","english-1985-50-ce4be534006a":"E"};
const canonicalNumbers={"english-1985-31-e2235d5f4633":31,"english-1985-32-eac6c6cbea75":32,"english-1985-33-44c6ba399eeb":33,"english-1985-36-e31a2ab82b56":36,"english-1985-37-c5fd7825984e":37,"english-1985-38-919e8ad022aa":38,"english-1985-40-7945041357db":40,"english-1985-41-030a37c95926":41,"english-1985-42-dba756363071":42,"english-1985-43-5447f34fede7":43,"english-1985-44-76e740cbe507":44,"english-1985-45-554f0bd4a724":45,"english-1985-46-94f5da512a97":46,"english-1985-47-3a61e17ae899":47,"english-1985-48-bf4fe0e2ec5a":48,"english-1985-49-c49a815d6220":49,"english-1985-50-ce4be534006a":50};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:17,held:3,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
