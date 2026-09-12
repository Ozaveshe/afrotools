'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2018-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={
 2015:{1:'D'},
 2018:{55:'A',56:'D',57:'A',58:'B',59:'C',60:'C',61:'C',72:'A',73:'D',74:'B',78:'D'},
 2019:{54:'B',57:'A',59:'A',61:'B',62:'A',63:'C',65:'B',68:'B',69:'D',71:'A',72:'B',75:'B',76:'A',77:'B',80:'D',83:'A',84:'D',85:'A',96:'D',97:'D',98:'A',99:'C'}
};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q]));
 const ids=new Set();
 for(const year of [2015,2018,2019]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2018?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2015?1:0);
 }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id),'Duplicate candidate ID');ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);
 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id),'Duplicate held ID');ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:34,held:6,passages:1,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
