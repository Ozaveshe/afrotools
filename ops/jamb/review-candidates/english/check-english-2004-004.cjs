'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2004-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{"57":"D","58":"C","59":"C","61":"D","62":"C","63":"D","64":"A","65":"D","66":"C","67":"D","68":"A","69":"B","70":"A","71":"D"},"2005":{"59":"D","65":"B","67":"B","68":"C","69":"B","70":"D","71":"B"},"2006":{"57":"C","58":"A","59":"D","60":"D","61":"D","71":"C"}};
const keysById={"english-2004-57-13cb6efd48e4":"D","english-2004-57-4d6d4cdaf5b8":"C","english-2004-58-0e48802d9df8":"D","english-2004-58-79021becbfee":"C","english-2004-58-8760a1a5544f":"A","english-2004-59-3148f24a3a05":"C","english-2004-59-5347206a671b":"D","english-2004-59-d716782523e6":"D","english-2004-60-1e6c8d1aa856":"D","english-2004-61-c7cbd7e02044":"D","english-2004-61-93417615a1c3":"D","english-2004-62-95c5181d9b91":"C","english-2004-63-0878631e60dd":"D","english-2004-64-331f54c488a0":"A","english-2004-65-b9eb84430f53":"D","english-2004-65-0d83a55571ff":"B","english-2004-66-1404d3e0a286":"C","english-2004-67-8b908351cbdf":"D","english-2004-67-98ec1871a3ed":"B","english-2004-68-3752b6647419":"A","english-2004-68-c5392878ce1b":"C","english-2004-69-bb608712bbf4":"C","english-2004-69-9828cebe4cf5":"B","english-2004-69-ed0eb3ac74fb":"B","english-2004-70-b4d7ca92c2b5":"D","english-2004-70-b2ba1cad2571":"A","english-2004-70-53e2160bf6fb":"D","english-2004-71-d4db9bc7fe6c":"A","english-2004-71-6500875d4cbb":"D","english-2004-71-bd8caa7df607":"B","english-2004-71-907ae19b6086":"C"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:31,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
