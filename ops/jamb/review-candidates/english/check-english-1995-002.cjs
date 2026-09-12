'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1995-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1995-7-00750e40d782":"A","english-1995-8-eec18497f548":"A","english-1995-9-7105d8eaf670":"D","english-1995-11-a4a1dc832051":"C","english-1995-12-b6802151daca":"D","english-1995-13-0699a5aa73a5":"B","english-1995-14-69a4cf419467":"B","english-1995-15-6de06fea1f22":"A","english-1995-26-ca4f16189e39":"D"};
const canonicalNumbers={"english-1995-7-00750e40d782":7,"english-1995-8-eec18497f548":8,"english-1995-9-7105d8eaf670":9,"english-1995-11-a4a1dc832051":11,"english-1995-12-b6802151daca":12,"english-1995-13-0699a5aa73a5":13,"english-1995-14-69a4cf419467":14,"english-1995-15-6de06fea1f22":15,"english-1995-26-ca4f16189e39":26};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:9,held:11,passages:8,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
