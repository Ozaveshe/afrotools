'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-33-166285f825de":"B","english-1991-34-3a2d024c5c3c":"B","english-1991-35-00daeee2fa61":"C","english-1991-36-575d470b6e9e":"A","english-1991-37-0e8d43546ba2":"A","english-1991-38-6293eb8a6a3f":"C","english-1991-39-f6e33449d259":"D","english-1991-40-bc30b6320027":"B","english-1991-41-94443d3f9650":"B","english-1991-42-f89e93e9de58":"D","english-1991-44-527a2d4f70bf":"C","english-1991-45-9e814247713b":"D"};
const canonicalNumbers={"english-1991-33-166285f825de":33,"english-1991-34-3a2d024c5c3c":34,"english-1991-35-00daeee2fa61":35,"english-1991-36-575d470b6e9e":36,"english-1991-37-0e8d43546ba2":37,"english-1991-38-6293eb8a6a3f":38,"english-1991-39-f6e33449d259":39,"english-1991-40-bc30b6320027":40,"english-1991-41-94443d3f9650":41,"english-1991-42-f89e93e9de58":42,"english-1991-44-527a2d4f70bf":44,"english-1991-45-9e814247713b":45};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
