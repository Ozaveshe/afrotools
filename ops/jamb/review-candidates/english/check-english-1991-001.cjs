'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-1-3629e53e0d38":"D","english-1991-2-c9151480b9f9":"B","english-1991-4-08440df16830":"C","english-1991-6-025dc91d38d3":"B","english-1991-7-10273fdb28f7":"D","english-1991-8-722fa2344de2":"C","english-1991-9-d8154f0ac00c":"C","english-1991-10-70994668c30d":"C","english-1991-11-28a1fac1a046":"C","english-1991-12-c1969a78b6db":"B","english-1991-13-e55b848bfb01":"D","english-1991-14-bb010829545b":"D","english-1991-16-2d3e90f8dbc5":"D","english-1991-17-7fca6f936e73":"B"};
const canonicalNumbers={"english-1991-1-3629e53e0d38":1,"english-1991-2-c9151480b9f9":2,"english-1991-4-08440df16830":4,"english-1991-6-025dc91d38d3":6,"english-1991-7-10273fdb28f7":7,"english-1991-8-722fa2344de2":8,"english-1991-9-d8154f0ac00c":9,"english-1991-10-70994668c30d":10,"english-1991-11-28a1fac1a046":11,"english-1991-12-c1969a78b6db":12,"english-1991-13-e55b848bfb01":13,"english-1991-14-bb010829545b":14,"english-1991-16-2d3e90f8dbc5":16,"english-1991-17-7fca6f936e73":17};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:14,held:6,passages:14,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
