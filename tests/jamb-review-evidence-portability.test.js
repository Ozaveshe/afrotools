'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),D=path.join(root,'ops/jamb/review-candidates');
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'jamb-evidence-portability-'));}
function cleanup(dir){const resolved=path.resolve(dir);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('jamb-evidence-portability-'));fs.rmSync(resolved,{recursive:true,force:true});}
test('Literature held replay uses the current checkout ledger and trust implementation',()=>{
 const dir=temp();try{
  const subject=path.join(dir,'ops/jamb/review-candidates/literature'),lib=path.join(dir,'scripts/lib'),data=path.join(dir,'data/jamb');for(const p of [subject,lib,data])fs.mkdirSync(p,{recursive:true});
  for(const f of ['jamb-content-trust.js','jamb-visual-assets.js'])fs.copyFileSync(path.join(root,'scripts/lib',f),path.join(lib,f));
  fs.copyFileSync(path.join(D,'literature/check-held-state.cjs'),path.join(subject,'check-held-state.cjs'));
  const b=require('../ops/jamb/review-candidates/literature/literature-recovery-001.json'),r=b.records.find(r=>r.candidate),original={id:r.id,original_record:r.original_record,original_content_sha256:r.original_content_sha256};
  fs.writeFileSync(path.join(subject,'literature-recovery-001.json'),JSON.stringify(b));fs.writeFileSync(path.join(dir,'input.json'),JSON.stringify({original,current:r.candidate}));
  fs.writeFileSync(path.join(dir,'run.cjs'),"const x=require('./input.json');require('./ops/jamb/review-candidates/literature/check-held-state.cjs').check(x.original,x.current);");
  const current=require('../data/jamb/review-ledger.json'),ledger=structuredClone(current),file=path.join(data,'review-ledger.json'),run=()=>cp.spawnSync(process.execPath,[path.join(dir,'run.cjs'),'--integrated'],{cwd:dir,encoding:'utf8'}),write=()=>fs.writeFileSync(file,JSON.stringify(ledger));
  write();assert.equal(run().status,0);
  const accepted=structuredClone(ledger.questions[r.id]);assert.ok(accepted);
  delete ledger.questions[r.id];write();assert.notEqual(run().status,0,'must not fall back to another checkout accepted ledger');
  ledger.questions[r.id]={...accepted,content_sha256:'0'.repeat(64)};write();assert.notEqual(run().status,0);
  ledger.questions[r.id]=structuredClone(accepted);ledger.questions[r.id].answer_review.status='held';write();assert.notEqual(run().status,0);
  ledger.questions[r.id]=accepted;write();assert.equal(run().status,0);
  fs.writeFileSync(path.join(lib,'jamb-content-trust.js'),fs.readFileSync(path.join(lib,'jamb-content-trust.js'),'utf8')+"\nmodule.exports.assessQuestion=()=>({state:'held'});\n");
  assert.notEqual(run().status,0,'current checkout publication gate must be used');
 }finally{cleanup(dir);}
});
test('Chemistry historical first-pass replay needs no private PDF but keeps source and pool guards',()=>{
 const dir=temp();try{
  const records=fs.readdirSync(path.join(D,'chemistry')).filter(f=>/^batch-\d{3}\.json$/.test(f)).flatMap(f=>require(path.join(D,'chemistry',f)).records);
  const original={questions:records.map(r=>r.original_record)},integrated={questions:records.map(r=>r.publication_candidate?r.candidate:r.original_record)},file=path.join(dir,'pool.json'),pdf=path.join(dir,'missing.pdf'),script=path.join(D,'chemistry/check-first-pass.cjs');
  const run=(mode=true)=>cp.spawnSync(process.execPath,[script,...mode?['--integrated']:[],'--pool='+file,'--pdf='+pdf],{encoding:'utf8'});
  fs.writeFileSync(file,JSON.stringify(integrated));const pass=run();assert.equal(pass.status,0,pass.stderr);assert.match(pass.stdout,/private PDF unavailable/);
  fs.writeFileSync(file,JSON.stringify(original));assert.notEqual(run(false).status,0,'pre-intake must require original PDF');
  fs.writeFileSync(file,JSON.stringify(integrated));fs.writeFileSync(pdf,'wrong source');assert.notEqual(run().status,0,'existing wrong PDF must fail');fs.unlinkSync(pdf);
  integrated.questions[0].question+=' mutation';fs.writeFileSync(file,JSON.stringify(integrated));assert.notEqual(run().status,0,'pool fingerprints remain strict');
 }finally{cleanup(dir);}
});
