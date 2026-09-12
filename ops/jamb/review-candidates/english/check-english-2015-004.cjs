'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2015-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={2014:{3:'B',6:'B'},2015:{64:'B',65:'B',66:'A',70:'D',73:'B',74:'B',76:'A',77:'A',78:'D',79:'A',80:'B',85:'A',98:'C',99:'B'},2016:{66:'A',69:'D',70:'B',72:'B',73:'A',75:'B',76:'A',79:'B',81:'D',84:'A',85:'C',98:'D',99:'C'}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2014,2015,2016]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2015?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2014?2:0);
 }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:29,held:11,passages:2,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
