'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..');
const {questionFingerprint:fp,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function inspect(originals,batches){
 const originalsById=new Map(originals.map(q=>[q.id,q]));
 assert.equal(originalsById.size,originals.length,'duplicate original English ID');
 const seen=new Set(),canonical=new Set(),dispositions=[];let candidates=0,held=0;
 for(const {file,batch} of batches){
  // The first eight-record candidate predates the examined_count field.
  const examined=batch.examined_count===undefined&&file==='english-2020-001.json'?batch.source.records:batch.examined_count;
  assert.equal(examined,(batch.records||[]).length+(batch.held_records||[]).length,file+' accounting');
  for(const [state,records] of [['candidate',batch.records||[]],['held',batch.held_records||[]]])for(const r of records){
   assert.ok(originalsById.has(r.id),'unknown original ID '+r.id);
   assert.ok(!seen.has(r.id),'duplicate disposition '+r.id);seen.add(r.id);
   assert.equal(r.original_content_sha256,fp(originalsById.get(r.id)),'original fingerprint '+r.id);
   if(state==='candidate'){
    assert.equal(r.candidate.id,r.id,'candidate ID changed');
    assert.equal(fp(r.original_record),r.original_content_sha256,'stored original changed');
    assert.equal(fp(r.candidate),r.content_sha256,'candidate fingerprint '+r.id);
    const key=r.candidate.year+':'+r.candidate.num;
    assert.ok(!canonical.has(key),'duplicate printed source number '+key);canonical.add(key);candidates++;
   }else {assert.ok(typeof r.reason==='string'&&r.reason.trim().length>15,'missing private hold reason '+r.id);held++;}
   dispositions.push([r.id,state,file]);
  }
 }
 const missing=originals.filter(q=>!seen.has(q.id)).map(q=>q.id);assert.deepEqual(missing,[],'unexamined original IDs');
 return {original_records:originals.length,examined:seen.size,candidates,held,remaining:missing.length,batch_files:batches.length,duplicate_original_dispositions:0,duplicate_printed_source_numbers:0,original_ids_sha256:sha(JSON.stringify(originals.map(q=>q.id).sort())),original_fingerprints_sha256:sha(JSON.stringify(originals.map(q=>[q.id,fp(q)]).sort((a,b)=>a[0].localeCompare(b[0])))),dispositions_sha256:sha(JSON.stringify(dispositions.sort((a,b)=>a[0].localeCompare(b[0]))))};
}
function reconstructOriginals(current,batches,ledger={questions:{},sources:{}}){
 const candidates=new Map(),held=new Map();
 for(const {batch} of batches){
  for(const r of batch.records||[]){assert.ok(!candidates.has(r.id),'duplicate candidate ID');candidates.set(r.id,{r,batch});}
  for(const r of batch.held_records||[])held.set(r.id,r);
 }
 return current.map(q=>{
  const entry=candidates.get(q.id),hash=fp(q);
  if(!entry){if(held.has(q.id))assert.equal(hash,held.get(q.id).original_content_sha256,'held current fingerprint '+q.id);return q;}
  const {r,batch}=entry;
  assert.equal(fp(r.original_record),r.original_content_sha256,'stored original changed');
  assert.equal(fp(r.candidate),r.content_sha256,'stored candidate changed');
  if(hash===r.original_content_sha256)return q;
  assert.equal(hash,r.content_sha256,'current row is neither original nor exact candidate '+q.id);
  const review=ledger.questions?.[q.id],source=ledger.sources?.[review?.source_id];
  assert.equal(review?.source_id,batch.source_id,'accepted source identity '+q.id);
  assert.equal(source?.content_sha256,batch.source.content_sha256,'accepted source fingerprint '+q.id);
  assert.equal(source?.source_file,batch.source.source_file,'accepted source file '+q.id);
  const result=assessQuestion(q,ledger);
  assert.equal(result.state,'eligible','accepted matching ledger required '+q.id+': '+result.reasons.join(','));
  return r.original_record;
 });
}
function load(sourceRoot=root){
 const batches=fs.readdirSync(__dirname).filter(f=>/^english.*\.json$/.test(f)).sort().map(file=>({file,batch:JSON.parse(fs.readFileSync(path.join(__dirname,file)))}));
 const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'original-coverage-receipt.json')));
 assert.deepEqual(batches.map(({file})=>({file,sha256:sha(fs.readFileSync(path.join(__dirname,file)))})),receipt.batch_manifest,'pinned batch manifest');
 const current=JSON.parse(fs.readFileSync(path.join(sourceRoot,'ops/jamb/source-pool.json'))).questions.filter(q=>q.subject==='english');
 const ledgerPath=path.join(sourceRoot,'data/jamb/review-ledger.json');
 const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath)):{questions:{},sources:{}};
 return {originals:reconstructOriginals(current,batches,ledger),batches};
}
function verify(sourceRoot=root){const {originals,batches}=load(sourceRoot),receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'original-coverage-receipt.json'))),actual=inspect(originals,batches);assert.deepEqual(actual,receipt.coverage);return {passed:true,...actual,scope:receipt.scope};}
module.exports={inspect,load,verify,sha,reconstructOriginals};
if(require.main===module){const args=process.argv.slice(2);assert.ok(args.length===0||(args.length===2&&args[0]==='--source-root'),'usage: check-original-coverage.cjs [--source-root PATH]');console.log(JSON.stringify(verify(args.length?path.resolve(args[1]):root),null,2));}
