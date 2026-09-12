'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1993-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1993-27-11a5c7fc452f":"C","english-1993-28-f9754ef03875":"D","english-1993-30-9a40c9a95c99":"B","english-1993-31-8475563516ef":"D","english-1993-32-8d893be70181":"B","english-1993-33-022f64c0a15f":"B","english-1993-34-1b459a689589":"C","english-1993-35-fbdee88f658f":"A","english-1993-36-295dd28bf4e5":"C","english-1993-37-347627e3300c":"A","english-1993-38-0996ccf82cae":"C","english-1993-39-52cdafb39d77":"B","english-1993-41-e0a8f5299f68":"A","english-1993-42-f8efd27c31b6":"D","english-1993-43-f6d06d016d70":"C","english-1993-46-16fe19daafc2":"C","english-1993-47-80cd1e2cf0a9":"A"};
const canonicalNumbers={"english-1993-27-11a5c7fc452f":27,"english-1993-28-f9754ef03875":28,"english-1993-30-9a40c9a95c99":30,"english-1993-31-8475563516ef":31,"english-1993-32-8d893be70181":32,"english-1993-33-022f64c0a15f":33,"english-1993-34-1b459a689589":34,"english-1993-35-fbdee88f658f":35,"english-1993-36-295dd28bf4e5":36,"english-1993-37-347627e3300c":37,"english-1993-38-0996ccf82cae":38,"english-1993-39-52cdafb39d77":39,"english-1993-41-e0a8f5299f68":41,"english-1993-42-f8efd27c31b6":42,"english-1993-43-f6d06d016d70":43,"english-1993-46-16fe19daafc2":46,"english-1993-47-80cd1e2cf0a9":47};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:17,held:3,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
