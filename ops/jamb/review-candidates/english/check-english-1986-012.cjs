'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-012.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1985-8-82c80a40ab34":"D","english-1985-9-a9e4bf924298":"B","english-1985-11-6309d3a71456":"E","english-1985-12-024be26e8c4d":"B","english-1985-14-b1e10fea4984":"B","english-1985-16-ad27044caf79":"A","english-1985-17-0cc393d217da":"D","english-1985-18-092da3c1ec1c":"E","english-1985-19-3c8550be30cd":"A","english-1985-21-9f01608f5cd2":"C","english-1985-22-99fd0c5a2cb4":"A","english-1985-23-7218a6ac1060":"E","english-1985-24-324f97d5f868":"B","english-1985-25-b9e22f2f3adc":"D","english-1985-28-6d7757b17e53":"E","english-1985-29-c2e28d493160":"C","english-1985-30-560a7a3e0af8":"E"};
const canonicalNumbers={"english-1985-8-82c80a40ab34":8,"english-1985-9-a9e4bf924298":9,"english-1985-11-6309d3a71456":11,"english-1985-12-024be26e8c4d":12,"english-1985-14-b1e10fea4984":14,"english-1985-16-ad27044caf79":16,"english-1985-17-0cc393d217da":17,"english-1985-18-092da3c1ec1c":18,"english-1985-19-3c8550be30cd":19,"english-1985-21-9f01608f5cd2":21,"english-1985-22-99fd0c5a2cb4":22,"english-1985-23-7218a6ac1060":23,"english-1985-24-324f97d5f868":24,"english-1985-25-b9e22f2f3adc":25,"english-1985-28-6d7757b17e53":28,"english-1985-29-c2e28d493160":29,"english-1985-30-560a7a3e0af8":30};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:17,held:3,passages:14,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
