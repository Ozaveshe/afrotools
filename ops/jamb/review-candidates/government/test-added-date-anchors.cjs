'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),mod=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.join(__dirname,'check-batch.cjs'),local=mod.createRequire(file),code=fs.readFileSync(file,'utf8'),{questionFingerprint}=local('../../../../scripts/lib/jamb-content-trust');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const [id,index,from,to] of [['040',3,'1998','1999'],['041',6,'2002','2003'],['041',7,'2003','2004'],['044',35,'2005','2006']]){
  const b=structuredClone(local('./batch-'+id+'.json')),r=b.records[index];
  assert.ok(r.candidate.question.includes(from));r.candidate.question=r.candidate.question.replace(from,to);
  r.content_sha256=questionFingerprint(r.candidate);
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
  assert.throws(()=>vm.runInNewContext(code,{require:wrapped,__dirname,process:{argv:['node',file,id,'--integrated']},console:{log(){}}}),/Unsupported added date anchor/);
}
console.log('Four rehashed, publication-shaped wrong-date fixtures rejected by the semantic anchor guard');
