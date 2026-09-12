'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2002-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2002-76-e55db902d3eb":"D","english-2002-77-f880cf4dbda1":"A","english-2002-79-81590bf94613":"A","english-2002-80-90b3c937198d":"D","english-2002-81-6430ede496e6":"D","english-2002-82-52a5e1b50915":"C","english-2002-83-14c40e83f582":"C","english-2002-84-8ec0518e83aa":"D","english-2002-85-9adfdfd23c82":"A","english-2002-87-1b5380030042":"B","english-2002-89-fac89fd10b82":"C","english-2002-90-0b92816a1cd3":"D","english-2002-91-840a693cb6b3":"D","english-2002-92-e86f94946059":"A"};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:14,held:6,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
