'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1987-25-68b9fe1d0b4a":"A","english-1987-26-06463189906f":"D","english-1987-27-1eeed10631a0":"B","english-1987-28-28f7b8f38a6f":"C","english-1987-29-fdf1a0b2f8e4":"A","english-1987-30-eb17adf0bcfc":"B","english-1987-31-040c531f49b5":"A","english-1987-34-c2cf37becb61":"D","english-1987-36-a02405e67888":"C","english-1987-37-ddb4f8ee6d76":"A","english-1987-39-602d7d21338c":"D","english-1987-40-1c65e6a0fcc2":"B","english-1987-41-3933e84c1ff8":"B","english-1987-42-a1824a82e3ad":"B","english-1987-43-578876d6fd51":"B","english-1987-44-c43e58f6da88":"D"};
const canonicalNumbers={"english-1987-25-68b9fe1d0b4a":25,"english-1987-26-06463189906f":26,"english-1987-27-1eeed10631a0":27,"english-1987-28-28f7b8f38a6f":28,"english-1987-29-fdf1a0b2f8e4":29,"english-1987-30-eb17adf0bcfc":30,"english-1987-31-040c531f49b5":31,"english-1987-34-c2cf37becb61":34,"english-1987-36-a02405e67888":36,"english-1987-37-ddb4f8ee6d76":37,"english-1987-39-602d7d21338c":39,"english-1987-40-1c65e6a0fcc2":40,"english-1987-41-3933e84c1ff8":41,"english-1987-42-a1824a82e3ad":42,"english-1987-43-578876d6fd51":43,"english-1987-44-c43e58f6da88":44};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:1,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
