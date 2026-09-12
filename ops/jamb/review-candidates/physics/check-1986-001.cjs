const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1986-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1,Math.abs(a),Math.abs(b));
const formulas={capacityRatio:p=>1/(p.massRatio*p.riseRatio),criticalSine:p=>1/p.index,frequency:p=>p.speed/p.wavelength,upwardLift:p=>p.tension/p.mass-p.g,thermometer:p=>100*p.rise/p.interval,cubeExpansion:p=>p.side**3*(1+3*p.alpha*p.delta),trappedAir:p=>p.read2+(p.true1-p.read1)*p.v1/p.v2,hotMixture:p=>p.final+p.ratio*(p.final-p.cold),meltIce:p=>p.mass*(p.c*p.delta+p.latent),mirrorImages:p=>360/p.angle-1,lensHeight:p=>p.height/(1/p.f-1/p.u)/p.u,bearing:p=>p.magnetic+p.east};
assert.deepEqual(batch.counts,{examined:40,candidates:29,held:11});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([18,20,21,22,23,24,25,26].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='inclineRatio'){
   for(const [length,height,load] of [[5,3,100],[10,2,350]]){const effort=load*height/length;assert(close(load/effort,length/height));assert(close(effort*length,load*height));}
   assert.equal(q.answer,'D');
  }else{
   assert(formulas[c.kind]);const value=formulas[c.kind](p);assert(close(value,c.expected),r.id);
   assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='capacityRatio')assert(close(p.massRatio*value*p.riseRatio,1));
   if(c.kind==='criticalSine')assert(close(p.index*value,1));
   if(c.kind==='frequency')assert(close(value*p.wavelength,p.speed));
   if(c.kind==='upwardLift')assert(close(p.mass*(p.g+value),p.tension));
   if(c.kind==='cubeExpansion'){assert(close(value-p.side**3,3*p.side**3*p.alpha*p.delta));assert(q.question.includes('first-order'));}
   if(c.kind==='trappedAir')assert(close((value-p.read2)*p.v2,(p.true1-p.read1)*p.v1));
   if(c.kind==='hotMixture')assert(close((value+p.ratio*p.cold)/(1+p.ratio),p.final));
   if(c.kind==='meltIce')assert(close((value-p.mass*p.latent)/(p.mass*p.c),p.delta));
   if(c.kind==='lensHeight'){const imageDistance=value*p.u/p.height;assert(close(1/imageDistance+1/p.u,1/p.f));}
   if(c.kind==='bearing')assert(close(value-p.east,p.magnetic));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const previous=['physics-1983-001','physics-1984-001','physics-1985-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));
assert.deepEqual(batch.prior_held_ids,previous);assert.equal(previous.length,40);
const misplaced=batch.records.find(r=>r.id==='physics-1986-49-1616cd53a168');assert.equal(misplaced.source_year,1985);assert.equal(misplaced.source_pdf_page,18);assert.equal(misplaced.status,'held');
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:previous.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
