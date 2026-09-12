'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-21-184aa0071ff3":"C","english-1990-22-ba19876b8a94":"B","english-1990-23-32693aa62038":"B","english-1990-24-9a692973ddef":"D","english-1990-25-9e639ee08f06":"B","english-1990-26-9aeacdea6377":"B","english-1990-27-006ca30b8c71":"B","english-1990-28-c7119699b7b6":"B","english-1990-29-788c55ac4a9d":"D","english-1990-30-6ab673442be8":"A","english-1990-31-a6b6f2faa099":"B","english-1990-32-faeb131c0685":"D","english-1990-33-1232cbcb505b":"A"};
const canonicalNumbers={"english-1990-21-184aa0071ff3":21,"english-1990-22-ba19876b8a94":22,"english-1990-23-32693aa62038":23,"english-1990-24-9a692973ddef":24,"english-1990-25-9e639ee08f06":25,"english-1990-26-9aeacdea6377":26,"english-1990-27-006ca30b8c71":27,"english-1990-28-c7119699b7b6":28,"english-1990-29-788c55ac4a9d":29,"english-1990-30-6ab673442be8":30,"english-1990-31-a6b6f2faa099":31,"english-1990-32-faeb131c0685":32,"english-1990-33-1232cbcb505b":33};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:5,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
