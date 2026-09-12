'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1980-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1980-83-b69af4b58489":"C","english-1980-84-a178ead7ff21":"B","english-1980-85-2cfc89151d6f":"B","english-1980-87-56fef45a4749":"C","english-1980-92-7391b3c5d0d7":"C","english-1980-93-6ada52f579e7":"C","english-1980-96-c78ca26ffbf6":"C","english-1979-1-0ce626f34953":"A"};
const canonicalNumbers={"english-1980-83-b69af4b58489":83,"english-1980-84-a178ead7ff21":84,"english-1980-85-2cfc89151d6f":85,"english-1980-87-56fef45a4749":87,"english-1980-92-7391b3c5d0d7":92,"english-1980-93-6ada52f579e7":93,"english-1980-96-c78ca26ffbf6":96,"english-1979-1-0ce626f34953":1};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:8,held:12,passages:1,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
