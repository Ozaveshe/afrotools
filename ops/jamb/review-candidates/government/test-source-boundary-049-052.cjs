'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),mod=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.join(__dirname,'check-batch.cjs'),local=mod.createRequire(file),code=fs.readFileSync(file,'utf8'),{questionFingerprint}=local('../../../../scripts/lib/jamb-content-trust'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');let fixtures=0;
for(const id of ['049','050','051','052']){const original=local('./batch-'+id+'.json');for(const mutation of ['number','source','import','year',...original.counts.candidates?['options']:[]]){
 const b=structuredClone(original),r=b.records.find(r=>r.candidate)||b.records[0];
 if(mutation==='number'){r.actual_source_number=99;if(r.candidate)r.candidate.num=99;}
 if(mutation==='source'){const s=b.sources.find(s=>s.source_id!==r.source_id);r.source_id=s.source_id;r.source_pdf_sha256=s.sha256;}
 if(mutation==='import')r.imported_source_locator.question_number=99;
 if(mutation==='year'){r.actual_source_year=1970;if(r.candidate)r.candidate.year=1970;}
 if(mutation==='options')[r.candidate.options.A,r.candidate.options.C]=[r.candidate.options.C,r.candidate.options.A];
 if(r.candidate){r.content_sha256=questionFingerprint(r.candidate);const allow=b.integration_allowlist.find(a=>a.id===r.id);allow.candidate_content_sha256=r.content_sha256;allow.source_id=r.source_id;}
 const selection=JSON.stringify(b.records,null,2)+'\n';b.selection_sha256=hash(selection);const pool=structuredClone(local('../../source-pool.json'));
 for(const row of [...b.prior_batches.flatMap(p=>local('./'+p.file).records),...b.records])if(row.publication_candidate)pool.questions[pool.questions.findIndex(q=>q.id===row.id)]=structuredClone(row.candidate);
 const wrapped=m=>m==='node:fs'?{...fs,readFileSync:(p,...args)=>{const name=String(p);if(name.endsWith('source-pool.json'))return JSON.stringify(pool);if(name.endsWith('batch-'+id+'-selection.json'))return args.length?selection:Buffer.from(selection);if(name.endsWith('batch-'+id+'.json'))return JSON.stringify(b);return fs.readFileSync(p,...args);}}:local(m);
 assert.throws(()=>vm.runInNewContext(code,{require:wrapped,__dirname,process:{argv:['node',file,id,'--integrated']},console:{log(){}}}),/Source boundary/);fixtures++;
}}
console.log(fixtures+' fully rehashed 049-052 source/number/year/import/options mutations rejected, including the all-held batch');
