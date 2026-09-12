'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2000-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2001-99-230a86bc4bd6":"D","english-2000-1-9cdfd62a1388":"A","english-2000-2-b9709a1ffaf4":"B","english-2000-3-d4bad420a5e4":"B","english-2000-4-e65998b28c99":"D","english-2000-6-65c7f005e2f4":"B","english-2000-8-333cc5627e87":"C","english-2000-11-48b7cd304284":"A","english-2000-12-75bcaaa208dd":"A","english-2000-13-2edb6adbd5b5":"C","english-2000-41-ded3a4321ca5":"A","english-2000-42-47bc69343d16":"C","english-2000-44-130e4c50001c":"B","english-2000-45-a3754e623d5d":"C","english-2000-46-ffc8e4fad374":"A","english-2000-47-80be77ac8e19":"A"};
const canonicalNumbers={"english-2001-99-230a86bc4bd6":99,"english-2000-1-9cdfd62a1388":15,"english-2000-2-b9709a1ffaf4":14,"english-2000-3-d4bad420a5e4":11,"english-2000-4-e65998b28c99":13,"english-2000-6-65c7f005e2f4":5,"english-2000-8-333cc5627e87":2,"english-2000-11-48b7cd304284":7,"english-2000-12-75bcaaa208dd":10,"english-2000-13-2edb6adbd5b5":9,"english-2000-41-ded3a4321ca5":28,"english-2000-42-47bc69343d16":31,"english-2000-44-130e4c50001c":27,"english-2000-45-a3754e623d5d":35,"english-2000-46-ffc8e4fad374":45,"english-2000-47-80be77ac8e19":26};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:9,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
