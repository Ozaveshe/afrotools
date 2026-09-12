'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2001-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2001-64-eb690fa22121":"B","english-2001-65-3f270bf5174d":"A","english-2001-66-9db07ed29343":"C","english-2001-67-bfbb7d05e0fc":"B","english-2001-68-660c580ed793":"D","english-2001-69-717d386a38d5":"B","english-2001-70-fc873c4bef86":"B","english-2001-72-e000b8ece54c":"C","english-2001-73-c8a46aaf4b4c":"D","english-2001-74-ba0426c03534":"A","english-2001-75-a6c2fc53840b":"A","english-2001-76-77a17ffd1843":"C","english-2001-77-8f88c7c00d43":"B","english-2001-79-81612a79f824":"B","english-2001-80-515e5241441c":"A","english-2001-81-c2af8dfe8534":"A","english-2001-82-bb63ed3b2066":"C","english-2001-83-a4dbd0696ab6":"C"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,r.candidate.passage?1:0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
