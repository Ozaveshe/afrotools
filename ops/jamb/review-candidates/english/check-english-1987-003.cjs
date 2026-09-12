'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1987-45-8b63c623c5a5":"C","english-1987-46-17302f52c87e":"D","english-1987-47-7bc2a80da9cd":"B","english-1987-48-7ca5278950a5":"D","english-1987-49-36d317720f1b":"B","english-1987-50-73c8ae64dfa8":"C","english-1987-51-2c8523704797":"B","english-1987-52-f05883a8720d":"B","english-1987-53-448d2dfac9a1":"D","english-1987-54-810a207f4732":"D","english-1987-55-cb6868da29d5":"C","english-1987-56-6b222754d261":"C","english-1987-57-25f57f58a7d5":"C","english-1987-59-61f44a696a95":"D","english-1987-60-dc5712175688":"C"};
const canonicalNumbers={"english-1987-45-8b63c623c5a5":45,"english-1987-46-17302f52c87e":46,"english-1987-47-7bc2a80da9cd":47,"english-1987-48-7ca5278950a5":48,"english-1987-49-36d317720f1b":49,"english-1987-50-73c8ae64dfa8":50,"english-1987-51-2c8523704797":51,"english-1987-52-f05883a8720d":52,"english-1987-53-448d2dfac9a1":53,"english-1987-54-810a207f4732":54,"english-1987-55-cb6868da29d5":55,"english-1987-56-6b222754d261":56,"english-1987-57-25f57f58a7d5":57,"english-1987-59-61f44a696a95":59,"english-1987-60-dc5712175688":60};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
