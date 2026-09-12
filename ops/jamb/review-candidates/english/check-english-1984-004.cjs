'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1983-29-099f8b5e2ed8":"C","english-1983-30-539dafad891c":"C","english-1983-31-d18316630466":"D","english-1983-32-6e83c8e5b6c8":"D","english-1983-33-3df37cb30927":"E","english-1983-34-ebf485b4f81a":"D","english-1983-35-d3fd820b4f9e":"B","english-1983-36-05f1ed3a675c":"A","english-1983-38-f722521fb787":"E","english-1983-39-62bfb9f91bdf":"B","english-1983-40-7d46d4a35057":"C","english-1983-41-3f47fa8800dd":"B","english-1983-42-55a9e5949882":"B","english-1983-43-f0b223f9e611":"B","english-1983-44-6f5a5009b81b":"E","english-1983-45-0e6af9f02a07":"C","english-1983-46-013b153ab2a3":"B","english-1983-47-14b082c85081":"C","english-1983-49-c7dac24bcc5a":"C"};
const canonicalNumbers={"english-1983-29-099f8b5e2ed8":29,"english-1983-30-539dafad891c":30,"english-1983-31-d18316630466":31,"english-1983-32-6e83c8e5b6c8":32,"english-1983-33-3df37cb30927":33,"english-1983-34-ebf485b4f81a":34,"english-1983-35-d3fd820b4f9e":35,"english-1983-36-05f1ed3a675c":36,"english-1983-38-f722521fb787":38,"english-1983-39-62bfb9f91bdf":39,"english-1983-40-7d46d4a35057":40,"english-1983-41-3f47fa8800dd":41,"english-1983-42-55a9e5949882":42,"english-1983-43-f0b223f9e611":43,"english-1983-44-6f5a5009b81b":44,"english-1983-45-0e6af9f02a07":45,"english-1983-46-013b153ab2a3":46,"english-1983-47-14b082c85081":47,"english-1983-49-c7dac24bcc5a":49};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:19,held:1,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
