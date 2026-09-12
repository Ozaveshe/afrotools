'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-19-502561f36d02":"B","english-1991-21-1d26645e5dac":"A","english-1991-22-d7f5388e9267":"D","english-1991-23-a53797a62533":"A","english-1991-24-e4c0b6ca9e2c":"C","english-1991-26-bf4bb91120a2":"B","english-1991-27-6c6640496efb":"D","english-1991-28-0504fed3d3a4":"C","english-1991-29-d915745ad496":"D","english-1991-31-1e970b612d11":"A"};
const canonicalNumbers={"english-1991-19-502561f36d02":19,"english-1991-21-1d26645e5dac":21,"english-1991-22-d7f5388e9267":22,"english-1991-23-a53797a62533":23,"english-1991-24-e4c0b6ca9e2c":24,"english-1991-26-bf4bb91120a2":26,"english-1991-27-6c6640496efb":27,"english-1991-28-0504fed3d3a4":28,"english-1991-29-d915745ad496":29,"english-1991-31-1e970b612d11":31};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:5,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
