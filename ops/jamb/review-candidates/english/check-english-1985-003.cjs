'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1985-72-c77cbc5e0c11":"E","english-1985-73-c2f9a1a4b4d4":"A","english-1985-75-a2d7f1229424":"E","english-1985-76-faf6727dc823":"C","english-1985-77-38e6e5b5d108":"A","english-1985-78-52ec47ad143e":"C","english-1985-80-194693e601aa":"D","english-1985-86-756cb0e03ad1":"A","english-1985-88-e526e2a87e92":"D","english-1985-90-0124bdbe4794":"C","english-1985-91-e1654a844067":"A"};
const canonicalNumbers={"english-1985-72-c77cbc5e0c11":72,"english-1985-73-c2f9a1a4b4d4":73,"english-1985-75-a2d7f1229424":75,"english-1985-76-faf6727dc823":76,"english-1985-77-38e6e5b5d108":77,"english-1985-78-52ec47ad143e":78,"english-1985-80-194693e601aa":80,"english-1985-86-756cb0e03ad1":86,"english-1985-88-e526e2a87e92":88,"english-1985-90-0124bdbe4794":90,"english-1985-91-e1654a844067":91};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
