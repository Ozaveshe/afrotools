'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2001-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2002-93-d5d83a0cd97a":"B","english-2002-94-f94ade2da6ac":"B","english-2001-1-7c74484d6b09":"A","english-2001-3-5acb80271a67":"B","english-2001-6-8788db20353a":"C","english-2001-7-abb030823f4b":"B","english-2001-8-6d1a9daae4bb":"D","english-2001-21-a056bcf30975":"A","english-2001-22-5c951adb174e":"C","english-2001-23-0a986af7a1fb":"B","english-2001-24-1744a5b3f9e1":"D","english-2001-25-5725515159a6":"A","english-2001-63-c11c39722d5a":"D"};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
