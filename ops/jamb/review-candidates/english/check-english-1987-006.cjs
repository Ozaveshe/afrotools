'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-5-74b2701f960d":"B","english-1986-6-030d2e4efc70":"C","english-1986-7-73f3b047fc2d":"D","english-1986-8-11c1cdd63316":"A","english-1986-9-6ce19205b30b":"D","english-1986-10-ccde0d98c2bd":"B","english-1986-11-f160cdd32a86":"B","english-1986-13-df0252549cfc":"B","english-1986-14-dfb04e63eea1":"A","english-1986-15-bc5a4d747354":"C"};
const canonicalNumbers={"english-1986-5-74b2701f960d":5,"english-1986-6-030d2e4efc70":6,"english-1986-7-73f3b047fc2d":7,"english-1986-8-11c1cdd63316":8,"english-1986-9-6ce19205b30b":9,"english-1986-10-ccde0d98c2bd":10,"english-1986-11-f160cdd32a86":11,"english-1986-13-df0252549cfc":13,"english-1986-14-dfb04e63eea1":14,"english-1986-15-bc5a4d747354":15};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
