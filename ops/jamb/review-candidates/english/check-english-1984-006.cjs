'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1983-70-4d8f1b3ca5e8":"C","english-1983-71-901c23100460":"A","english-1983-72-e0f7dec1939e":"B","english-1983-74-5e2d88d801e8":"D","english-1983-78-7256b5dedb80":"D","english-1983-82-e8178ca217b7":"A","english-1983-83-2174c07f5cff":"B","english-1983-84-1dcae7897da7":"B","english-1983-85-57a1546b2989":"C","english-1983-86-5160e178b139":"C","english-1983-89-4c290952529b":"A","english-1983-90-8ed4f05748cf":"C","english-1983-92-50cf0f18d615":"A","english-1983-93-86df72ead817":"B"};
const canonicalNumbers={"english-1983-70-4d8f1b3ca5e8":70,"english-1983-71-901c23100460":71,"english-1983-72-e0f7dec1939e":72,"english-1983-74-5e2d88d801e8":74,"english-1983-78-7256b5dedb80":78,"english-1983-82-e8178ca217b7":82,"english-1983-83-2174c07f5cff":83,"english-1983-84-1dcae7897da7":84,"english-1983-85-57a1546b2989":85,"english-1983-86-5160e178b139":86,"english-1983-89-4c290952529b":89,"english-1983-90-8ed4f05748cf":90,"english-1983-92-50cf0f18d615":92,"english-1983-93-86df72ead817":93};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:14,held:6,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
