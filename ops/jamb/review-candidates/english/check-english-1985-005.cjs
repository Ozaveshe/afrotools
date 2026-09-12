'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1984-21-8f57bd93d623":"B","english-1984-22-6f2dd3bff452":"B","english-1984-23-c64c0b172f31":"C","english-1984-24-1cc40100df1d":"C","english-1984-25-9b5c62cb2d50":"A","english-1984-26-77ba6a0a62b7":"B","english-1984-28-ddbed29d3a58":"A","english-1984-30-ee5f06f4b0bc":"D","english-1984-31-3e39b6593886":"C","english-1984-32-7bb2d71e4922":"A","english-1984-33-584fa18fe6d2":"B","english-1984-34-9304b1e699b0":"C","english-1984-36-91219c637989":"E","english-1984-37-4e27704253de":"E","english-1984-39-68bdb8083a28":"C","english-1984-42-1de881ae22f4":"D"};
const canonicalNumbers={"english-1984-21-8f57bd93d623":21,"english-1984-22-6f2dd3bff452":22,"english-1984-23-c64c0b172f31":23,"english-1984-24-1cc40100df1d":24,"english-1984-25-9b5c62cb2d50":25,"english-1984-26-77ba6a0a62b7":26,"english-1984-28-ddbed29d3a58":28,"english-1984-30-ee5f06f4b0bc":30,"english-1984-31-3e39b6593886":31,"english-1984-32-7bb2d71e4922":32,"english-1984-33-584fa18fe6d2":33,"english-1984-34-9304b1e699b0":34,"english-1984-36-91219c637989":36,"english-1984-37-4e27704253de":37,"english-1984-39-68bdb8083a28":39,"english-1984-42-1de881ae22f4":42};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:5,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
