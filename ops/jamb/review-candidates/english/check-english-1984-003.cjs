'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1983-3-90f35878e24b":"D","english-1983-4-65dc3bdd248b":"C","english-1983-6-aca80bcd6e0d":"D","english-1983-7-631c67b9ff95":"D","english-1983-8-6c26e94e13be":"B","english-1983-9-df052addc854":"E","english-1983-12-55e668b41ef8":"B","english-1983-13-b74ffe00cb8a":"A","english-1983-16-b847c13ae600":"B","english-1983-17-f501cc831e64":"D","english-1983-18-48f3ede319ba":"C","english-1983-22-7e99cf60727f":"C","english-1983-25-e25fdc1fb3fc":"C","english-1983-26-98915618ea4b":"C","english-1983-27-c8d6946aabaa":"E","english-1983-28-67485e55053d":"D"};
const canonicalNumbers={"english-1983-3-90f35878e24b":3,"english-1983-4-65dc3bdd248b":4,"english-1983-6-aca80bcd6e0d":6,"english-1983-7-631c67b9ff95":7,"english-1983-8-6c26e94e13be":8,"english-1983-9-df052addc854":9,"english-1983-12-55e668b41ef8":12,"english-1983-13-b74ffe00cb8a":13,"english-1983-16-b847c13ae600":16,"english-1983-17-f501cc831e64":17,"english-1983-18-48f3ede319ba":18,"english-1983-22-7e99cf60727f":22,"english-1983-25-e25fdc1fb3fc":25,"english-1983-26-98915618ea4b":26,"english-1983-27-c8d6946aabaa":27,"english-1983-28-67485e55053d":28};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:13,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
