'use strict';
// Private, bounded readability amendment. Only whitespace may change in public copy.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../../../..');
const clean=s=>s.replace(/([a-z])(?=\d)/g,'$1 ').replace(/([a-z])(?=N\d)/g,'$1 ').replace(/([a-z])(?=[XYZ]\b)/g,'$1 ').replace(/(\d)(?=[A-Za-z])/g,'$1 ');
const strip=s=>s.replace(/\s/g,'');
let changed=0;
for(let i=13;i<=18;i++){
 const id=String(i).padStart(3,'0'),file=path.join(__dirname,`batch-${id}-review.json`),before=JSON.parse(fs.readFileSync(path.join(__dirname,`batch-${id}.json`))),review=JSON.parse(fs.readFileSync(file));
 for(const d of Object.values(review))if(d.answer){for(const key of ['question','explanation'])if(d[key]){const old=d[key];d[key]=clean(old);assert.equal(strip(d[key]),strip(old));if(old!==d[key])changed++;}if(d.options)d.options=d.options.map(s=>{const out=clean(s);assert.equal(strip(out),strip(s));if(out!==s)changed++;return out;});}
 fs.writeFileSync(file,JSON.stringify(review,null,2)+'\n');
 cp.execFileSync(process.execPath,[path.join(__dirname,'build-reviewed-batch.cjs'),id],{cwd:root});
 const after=JSON.parse(fs.readFileSync(path.join(__dirname,`batch-${id}.json`)));
 assert.deepEqual(before.counts,after.counts);
 for(let n=0;n<before.records.length;n++){
  const a=before.records[n],b=after.records[n];assert.equal(a.id,b.id);assert.deepEqual(a.original_record,b.original_record);assert.equal(a.original_content_sha256,b.original_content_sha256);
  if(!a.publication_candidate){assert.deepEqual(a,b);continue;}
  const aq=structuredClone(a.candidate),bq=structuredClone(b.candidate);
  for(const q of [aq,bq]){for(const key of ['question','explanation','ai_explanation'])if(q[key])q[key]=strip(q[key]);for(const key of Object.keys(q.options))q.options[key]=strip(q.options[key]);}
  assert.deepEqual(aq,bq,'Non-whitespace candidate mutation '+a.id);
 }
}
console.log(`Whitespace-only teaching copy pass: ${changed} fields changed; originals, holds, keys and non-whitespace semantics unchanged.`);
