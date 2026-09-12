'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),mod=require('node:module'),assert=require('node:assert/strict');
const file=path.join(__dirname,'check-batch-001.cjs'),local=mod.createRequire(file),batch=local('./batch-001.json'),code=fs.readFileSync(file,'utf8');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json')));
function run({integrated=false,missing=false,badPdf=false,alterHeld=false,alterCandidate=false}={}){
 const pool=JSON.parse(JSON.stringify(original));
 if(integrated)for(const r of batch.records)if(r.publication_candidate)pool.questions[pool.questions.findIndex(q=>q.id===r.id)]=JSON.parse(JSON.stringify(r.candidate));
 if(alterHeld)pool.questions.find(q=>q.id===batch.records.find(r=>!r.publication_candidate).id).answer='Z';
 if(alterCandidate)pool.questions.find(q=>q.id===batch.records.find(r=>r.publication_candidate).id).answer='Z';
 const wrapped=id=>id==='node:fs'?{...fs,existsSync:p=>String(p).endsWith('.pdf')?!missing:fs.existsSync(p),readFileSync:(p,...args)=>String(p).endsWith('source-pool.json')?JSON.stringify(pool):String(p).endsWith('.pdf')&&badPdf?Buffer.from('wrong source'):fs.readFileSync(p,...args)}:local(id);
 vm.runInNewContext(code,{require:wrapped,__dirname,process:{argv:['node',file,...integrated?['--integrated']:[]]},console});
}
run();run({integrated:true});run({integrated:true,missing:true});
assert.throws(()=>run({missing:true}),/requires original PDF/);assert.throws(()=>run({integrated:true,badPdf:true}),/Expected values/);assert.throws(()=>run({integrated:true,alterHeld:true}),/pool drift/);assert.throws(()=>run({integrated:true,alterCandidate:true}),/pool drift/);
console.log('Economics001 portability and negative source/held/candidate tests passed.');
