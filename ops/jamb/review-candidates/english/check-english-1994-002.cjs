'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1994-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1994-30-4b4d89059dad":"C","english-1994-31-97e53db97743":"D","english-1994-32-f29eb67d5092":"C","english-1994-33-0d1de3cbfdca":"B","english-1994-34-9af95a25ae49":"D","english-1994-35-3f052eca81a1":"C","english-1994-36-6d1d0cb17b10":"B","english-1994-37-7b4ae5330123":"B","english-1994-39-07c98e68dd0f":"C","english-1994-40-12dc3150785a":"C","english-1994-41-57e83590d28a":"B","english-1994-42-442c4c39dff6":"C","english-1994-43-69baec0ebc62":"C","english-1994-44-5645f82a1082":"C","english-1994-45-a521a3fb84fb":"D","english-1994-46-13fc36c99fc5":"C","english-1994-47-a28080898e50":"A","english-1994-49-4ab69550f443":"B"};
const canonicalNumbers={"english-1994-30-4b4d89059dad":30,"english-1994-31-97e53db97743":31,"english-1994-32-f29eb67d5092":32,"english-1994-33-0d1de3cbfdca":33,"english-1994-34-9af95a25ae49":34,"english-1994-35-3f052eca81a1":35,"english-1994-36-6d1d0cb17b10":36,"english-1994-37-7b4ae5330123":37,"english-1994-39-07c98e68dd0f":39,"english-1994-40-12dc3150785a":40,"english-1994-41-57e83590d28a":41,"english-1994-42-442c4c39dff6":42,"english-1994-43-69baec0ebc62":43,"english-1994-44-5645f82a1082":44,"english-1994-45-a521a3fb84fb":45,"english-1994-46-13fc36c99fc5":46,"english-1994-47-a28080898e50":47,"english-1994-49-4ab69550f443":49};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
