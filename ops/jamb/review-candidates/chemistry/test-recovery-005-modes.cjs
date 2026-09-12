'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),mod=require('node:module'),assert=require('node:assert/strict');
const file=path.join(__dirname,'check-recovery-005.cjs'),local=mod.createRequire(file),batch=local('./recovery-005.json');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))),code=fs.readFileSync(file,'utf8');
function run({integrated=false,missing=false,badPdf=false,alterHeld=false,alterPrior=false}={}){
 const pool=JSON.parse(JSON.stringify(original));
 if(integrated)for(const r of [...batch.prior_recoveries.flatMap(p=>local('./'+p.file).records),...batch.records])if(r.publication_candidate)pool.questions[pool.questions.findIndex(q=>q.id===r.id)]=JSON.parse(JSON.stringify(r.candidate));
 if(alterHeld){const id=batch.records.find(r=>!r.publication_candidate).id;pool.questions.find(q=>q.id===id).answer='Z';}
 if(alterPrior)pool.questions.find(q=>q.id===batch.prior_recoveries[0].integration_allowlist[0].id).answer='Z';
 const wrapped=id=>id==='node:fs'?{...fs,existsSync:p=>String(p).endsWith('.pdf')?(!missing):fs.existsSync(p),readFileSync:(p,...args)=>String(p).endsWith('source-pool.json')?JSON.stringify(pool):String(p).endsWith('.pdf')&&badPdf?Buffer.from('wrong source'):fs.readFileSync(p,...args)}:local(id);
 vm.runInNewContext(code,{require:wrapped,__dirname,process:{argv:['node',file,...integrated?['--integrated']:[]]},console});
}
run();run({integrated:true});run({integrated:true,missing:true});
assert.throws(()=>run({missing:true}),/requires the original source PDF/);
assert.throws(()=>run({integrated:true,badPdf:true}),/Expected values/);
assert.throws(()=>run({integrated:true,alterHeld:true}),/integrated drift/);
assert.throws(()=>run({integrated:true,alterPrior:true}),/Prior recovery drift/);
console.log('Recovery005 mode tests: local and portable integration pass; absent pre-intake PDF, wrong PDF and unauthorized held mutation correctly rejected.');
