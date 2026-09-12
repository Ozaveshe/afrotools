'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1999-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2000-88-d88317f9bfe0":"C","english-2000-89-06e72dc5e7be":"B","english-2000-90-b9228f254423":"C","english-2000-91-b9164a0988ad":"A","english-2000-92-b1e930cffcc1":"B","english-1999-2-6c9229b9ccce":"C","english-1999-3-6e68fecf5e4f":"D","english-1999-4-4824444afe81":"C","english-1999-6-6d7b18315d86":"C","english-1999-8-96a62d63d0b3":"B","english-1999-9-aa978f1f5fe4":"C","english-1999-11-0a4806e763f9":"D","english-1999-14-586c1f967ed2":"C","english-1999-26-167233e1feee":"C","english-1999-28-ec38d50b0237":"A"};
const canonicalNumbers={"english-2000-88-d88317f9bfe0":63,"english-2000-89-06e72dc5e7be":76,"english-2000-90-b9228f254423":73,"english-2000-91-b9164a0988ad":74,"english-2000-92-b1e930cffcc1":64,"english-1999-2-6c9229b9ccce":2,"english-1999-3-6e68fecf5e4f":4,"english-1999-4-4824444afe81":5,"english-1999-6-6d7b18315d86":6,"english-1999-8-96a62d63d0b3":8,"english-1999-9-aa978f1f5fe4":9,"english-1999-11-0a4806e763f9":11,"english-1999-14-586c1f967ed2":14,"english-1999-26-167233e1feee":26,"english-1999-28-ec38d50b0237":28};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:8,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
