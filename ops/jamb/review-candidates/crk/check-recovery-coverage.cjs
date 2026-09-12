'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const recovery=require('./check-recovery-integrity.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function verify(pool,ledger,receipt=require('./recovery-coverage.json')){
 const integrity=recovery.verify(pool,ledger),firstpass=require('./check-firstpass-coverage.cjs').verify(pool,ledger);
 assert.equal(receipt.firstpass_coverage_sha256,sha(fs.readFileSync(path.join(__dirname,'firstpass-coverage.json'))));
 assert.deepEqual(receipt.batches,require('./recovery-pins.cjs'));
 const holds=fs.readdirSync(__dirname).filter(f=>/^crk-wave\d+\.json$/.test(f)).flatMap(f=>require('./'+f).held_records);
 assert.equal(holds.length,215);assert.equal(new Set(holds.map(h=>h.id)).size,215);
 assert.deepEqual(receipt.original_hold_ids,holds.map(h=>h.id));
 const actual=[];
 for(const pin of receipt.batches){const b=require('./'+pin.file);for(const r of [...b.records,...b.held_records])actual.push({id:r.id,original_content_sha256:r.original_content_sha256,batch:pin.file,disposition:r.candidate?'recovered':'held',candidate_content_sha256:r.candidate?r.content_sha256:null,source_year:r.candidate?r.actual_source_year:r.actual_year,source_number:r.candidate?r.actual_source_number:r.num});}
 actual.sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual(receipt.dispositions,actual,'exact recovery dispositions');
 assert.deepEqual(actual.map(r=>r.id),holds.map(h=>h.id).sort((a,b)=>a.localeCompare(b)),'complete first-pass hold coverage');
 for(const r of actual)assert.equal(r.original_content_sha256,holds.find(h=>h.id===r.id).original_content_sha256);
 assert.equal(integrity.examined,215);assert.equal(firstpass.candidates,805);
 assert.deepEqual(receipt.counts,{originals:1020,firstpass_candidates:805,firstpass_holds:215,recovery_examined:215,recovered:integrity.recovered,candidates:805+integrity.recovered,held:215-integrity.recovered,remaining:0,next_id:null});
 return {passed:true,...receipt.counts,integrated_recoveries:integrity.integrated};
}
module.exports={verify};
if(require.main===module){const i=process.argv.indexOf('--source-root'),root=i<0?path.resolve(__dirname,'../../../..'):path.resolve(process.argv[i+1]);console.log(JSON.stringify(verify(require(path.join(root,'ops/jamb/source-pool.json')).questions,require(path.join(root,'data/jamb/review-ledger.json')))));}
