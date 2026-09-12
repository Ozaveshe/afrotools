'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1982-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1983-94-0c35382244e8":"D","english-1983-97-7d53ec9bf6d0":"C","english-1983-98-3930246eddad":"D","english-1982-1-b47d1202dbd5":"E","english-1982-3-f1b76eaf6ac2":"A","english-1982-4-107fb0b57400":"D","english-1982-5-955472ef1555":"C"};
const canonicalNumbers={"english-1983-94-0c35382244e8":94,"english-1983-97-7d53ec9bf6d0":97,"english-1983-98-3930246eddad":98,"english-1982-1-b47d1202dbd5":1,"english-1982-3-f1b76eaf6ac2":3,"english-1982-4-107fb0b57400":4,"english-1982-5-955472ef1555":5};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:7,held:13,passages:4,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
