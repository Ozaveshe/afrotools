'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-007.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-66-51038b8315e0":"D","english-1986-67-3984bf214b63":"A","english-1986-68-fea30b4855ba":"C","english-1986-70-584cb29ad1bc":"C","english-1986-71-38ca5a03a0bc":"B","english-1986-72-80426e6b0fb6":"A","english-1986-73-f8fbdc2ec3dd":"C"};
const canonicalNumbers={"english-1986-66-51038b8315e0":66,"english-1986-67-3984bf214b63":67,"english-1986-68-fea30b4855ba":68,"english-1986-70-584cb29ad1bc":70,"english-1986-71-38ca5a03a0bc":71,"english-1986-72-80426e6b0fb6":72,"english-1986-73-f8fbdc2ec3dd":73};
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
