'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),mod=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.join(__dirname,'check-batch.cjs'),local=mod.createRequire(file),code=fs.readFileSync(file,'utf8'),{questionFingerprint}=local('../../../../scripts/lib/jamb-content-trust');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const mutation of ['number','source','import','options','year']){const id='046',index=1;
  const b=structuredClone(local('./batch-'+id+'.json')),r=b.records[index];
  if(mutation==='number'){r.actual_source_number=51;r.candidate.num=51;}if(mutation==='source'){const source=b.sources[0];r.source_id=source.source_id;r.source_pdf_sha256=source.sha256;r.source_pdf_page=6;r.source_pdf_pages=[6];r.actual_source_number=22;r.candidate.num=22;}if(mutation==='import')r.imported_source_locator.question_number=3;
  if(mutation==='options')[r.candidate.options.A,r.candidate.options.C]=[r.candidate.options.C,r.candidate.options.A];if(mutation==='year'){r.candidate.year=1985;r.actual_source_year=1985;}r.content_sha256=questionFingerprint(r.candidate);
  b.integration_allowlist.find(row=>row.id===r.id).candidate_content_sha256=r.content_sha256;
  const selection=JSON.stringify(b.records,null,2)+'\n';b.selection_sha256=hash(selection);
  const pool=structuredClone(local('../../source-pool.json'));
  for(const row of [...b.prior_batches.flatMap(p=>local('./'+p.file).records),...b.records])if(row.publication_candidate)pool.questions[pool.questions.findIndex(q=>q.id===row.id)]=structuredClone(row.candidate);
  const wrapped=m=>m==='node:fs'?{...fs,readFileSync:(p,...args)=>{
    const name=String(p);
    if(name.endsWith('source-pool.json'))return JSON.stringify(pool);
    if(name.endsWith('batch-'+id+'-selection.json'))return args.length?selection:Buffer.from(selection);
    if(name.endsWith('batch-'+id+'.json'))return JSON.stringify(b);
    return fs.readFileSync(p,...args);
  }}:local(m);
  assert.throws(()=>vm.runInNewContext(code,{require:wrapped,__dirname,process:{argv:['node',file,id,'--integrated']},console:{log(){}}}),/Source boundary/);
}
console.log('Five rehashed shifted-number, swapped-source, original-locator, reordered-options and wrong-year fixtures rejected by source boundary guard');
