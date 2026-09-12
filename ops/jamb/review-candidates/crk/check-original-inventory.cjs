'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {questionFingerprint:fp,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const inventory=require('./original-inventory.json');
function verify(pool,ledger=require('../../../../data/jamb/review-ledger.json')){
 const rows=pool.filter(q=>q.subject==='crk');
 const recovery=require('./check-recovery-integrity.cjs'),recoveries=recovery.load().rows;
 assert.equal(rows.length,1020);assert.equal(inventory.original_count,1020);
 assert.equal(new Set(rows.map(q=>q.id)).size,1020);
 assert.equal(fp(rows.map(q=>q.id)),inventory.original_ids_sha256);
 const seen=new Set(),slots=new Set(),reviewed=new Map();let candidates=0,held=0;
 for(const f of fs.readdirSync(__dirname).filter(f=>/^crk-wave\d+\.json$/.test(f)).sort()){
  const batch=JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
  for(const r of [...batch.records,...batch.held_records]){assert.ok(!seen.has(r.id),'duplicate original intake');seen.add(r.id);}
  for(const r of batch.records){const slot=r.actual_source_year+':'+r.actual_source_number;assert.ok(!slots.has(slot),'duplicate printed year/number');slots.add(slot);reviewed.set(r.id,{row:r,batch});}
  candidates+=batch.records.length;held+=batch.held_records.length;
 }
 const reconstructed=rows.map((q,i)=>{
  const pinned=inventory.records[i];assert.equal(q.id,pinned.id);
  if(fp(q)===pinned.original_content_sha256)return q;
  if(recoveries.has(q.id))return recovery.accepted(q,recoveries.get(q.id),ledger);
  const entry=reviewed.get(q.id);assert.ok(entry,'changed original without a candidate');
  assert.equal(fp(q),entry.row.content_sha256,'current row must equal exact candidate');
  assert.equal(fp(entry.row.candidate),entry.row.content_sha256);
  assert.equal(ledger.questions?.[q.id]?.source_id,entry.batch.source_id);
  assert.equal(ledger.sources?.[entry.batch.source_id]?.content_sha256,inventory.source.content_sha256);
  assert.equal(assessQuestion(q,ledger).state,'eligible','changed candidate needs accepted evidence');
  assert.equal(fp(entry.row.original_record),pinned.original_content_sha256);
  return entry.row.original_record;
 });
 assert.deepEqual(reconstructed.map(q=>({id:q.id,original_content_sha256:fp(q)})),inventory.records,'original CRK inventory changed');
 assert.deepEqual([...seen].sort(),rows.slice(0,seen.size).map(q=>q.id).sort(),'batches must cover consecutive original inventory');
 return {passed:true,originals:1020,examined:seen.size,candidates,held,remaining:1020-seen.size,next_id:rows[seen.size]?.id||null,scope:'Pinned original inventory with exact accepted integrated candidates and cumulative coverage'};
}
module.exports={verify};
if(require.main===module)console.log(JSON.stringify(verify(require('../../source-pool.json').questions)));
