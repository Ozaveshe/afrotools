'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1984-63-195dfb651a24":"E","english-1984-64-8aab922ed7ae":"D","english-1984-65-42626ee94415":"A","english-1984-66-a9fd8fe973ac":"B","english-1984-67-dfcc301e6ee3":"A","english-1984-68-5940ed18f3f9":"C","english-1984-71-4a8cbdaba534":"B","english-1984-72-ff111cb89ff5":"B","english-1984-73-32f7202e8c17":"C","english-1984-75-7769c3b53b4c":"D","english-1984-76-d64ca575d4e1":"C","english-1984-79-205867705455":"A","english-1984-81-1414ad2fb9d8":"E"};
const canonicalNumbers={"english-1984-63-195dfb651a24":63,"english-1984-64-8aab922ed7ae":64,"english-1984-65-42626ee94415":65,"english-1984-66-a9fd8fe973ac":66,"english-1984-67-dfcc301e6ee3":67,"english-1984-68-5940ed18f3f9":68,"english-1984-71-4a8cbdaba534":71,"english-1984-72-ff111cb89ff5":72,"english-1984-73-32f7202e8c17":73,"english-1984-75-7769c3b53b4c":75,"english-1984-76-d64ca575d4e1":76,"english-1984-79-205867705455":79,"english-1984-81-1414ad2fb9d8":81};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
