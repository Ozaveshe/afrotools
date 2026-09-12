'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1987-68-ff63d189bebc":"B","english-1987-69-aa807c699d9f":"B","english-1987-70-fb4215e00bf5":"D","english-1987-71-f7016db02a90":"A","english-1987-74-0e364898e8e5":"D","english-1987-75-5a91ed47c08e":"B","english-1987-78-c19361dcd99a":"D","english-1987-79-be5715edb7af":"D","english-1987-80-d15da1426def":"A","english-1987-82-b087472b7435":"A","english-1987-83-6850b53bffe9":"D","english-1987-84-5014db32aee0":"A"};
const canonicalNumbers={"english-1987-68-ff63d189bebc":68,"english-1987-69-aa807c699d9f":69,"english-1987-70-fb4215e00bf5":70,"english-1987-71-f7016db02a90":71,"english-1987-74-0e364898e8e5":74,"english-1987-75-5a91ed47c08e":75,"english-1987-78-c19361dcd99a":78,"english-1987-79-be5715edb7af":79,"english-1987-80-d15da1426def":80,"english-1987-82-b087472b7435":82,"english-1987-83-6850b53bffe9":83,"english-1987-84-5014db32aee0":84};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
