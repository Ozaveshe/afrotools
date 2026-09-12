const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1985-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const formulas={lastSecond:p=>p.a*(p.t-.5),centreFromHeavy:p=>p.light*p.length/(p.light+p.heavy),pressureRatio:p=>(p.air+p.d2)/(p.air+p.d1),hydraulic:p=>p.force*p.large/p.small,mixture:p=>(p.c1*p.t1+p.c2*p.t2)/(p.c1+p.c2),echo:p=>p.speed*p.time/2000,closedPipe:p=>p.speed/p.frequency/4*100,mirror:p=>1/(2/p.radius-1/p.object),refraction:p=>2*Math.asin(p.n*Math.sin(p.separation*Math.PI/360))*180/Math.PI,kettle:p=>p.voltage**2*p.seconds/p.energy,friction:p=>p.speed**2/(2*p.g*p.distance),elevator:p=>p.mass*(p.g-p.a)};
assert.deepEqual(batch.counts,{examined:40,candidates:29,held:11});
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const actual=pool.find(q=>q.id===r.id);assert(actual);
 if(!process.argv.includes('--integrated'))assert.deepEqual(actual,r.original_record);
 assert([14,15,16,17,18,19,20,23].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.year,r.source_year);
 assert.equal(q.has_diagram,false);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 assert(r.semantic_review.independent_reasoning.length>70);
 if(r.calculation){
  calculations++;assert.equal(q.verification.method,'ai-calculation-checked');const c=r.calculation,p=c.input;
  if(c.kind==='slopeDimensions'){
   const pressure=[1,-1,-2],reciprocalVolume=[0,-3,0];
   assert.deepEqual(pressure.map((v,i)=>v-reciprocalVolume[i]),[1,2,-2]);assert.equal(q.answer,'C');
  }else if(c.kind==='momentumDimensions'){
   const newton=[1,1,-2],second=[0,0,1];assert.deepEqual(newton.map((v,i)=>v+second[i]),[1,1,-1]);assert.equal(q.answer,'C');
  }else{
   assert(formulas[c.kind]);let v=formulas[c.kind](p);
   if(c.roundPlaces!==undefined)v=Number(v.toFixed(c.roundPlaces));assert(close(v,c.expected),r.id);
   if(c.kind==='mirror'){assert(v<0);assert.equal(q.answer,'A');assert(close(1/p.object+1/v,2/p.radius));}
   else {assert(close(c.options[q.answer],v));const matches=Object.entries(c.options).filter(([,n])=>n!==null&&close(n,v));assert.equal(matches.length,1);}
   if(c.kind==='lastSecond')assert(close(v,.5*p.a*(p.t**2-(p.t-1)**2)));
   if(c.kind==='centreFromHeavy')assert(close(p.light*(p.length-v),p.heavy*v));
   if(c.kind==='hydraulic')assert(close(v/p.large,p.force/p.small));
   if(c.kind==='mixture')assert(close(p.c1*(v-p.t1),p.c2*(p.t2-v)));
   if(c.kind==='kettle')assert(close(p.voltage**2/c.expected*p.seconds,p.energy));
   if(c.kind==='friction')assert(close(c.expected*p.g*p.distance,.5*p.speed**2));
   if(c.kind==='elevator')assert(close(p.mass*p.g-v,p.mass*p.a));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const mis=batch.records.find(r=>r.id==='physics-1986-1-a50772145f01');assert.equal(mis.candidate.year,1987);assert.equal(mis.source_pdf_page,23);
assert(!pool.some(q=>q.subject==='physics'&&q.year===1987&&q.num===1&&q.id!==mis.id),'Duplicate target year/number');
const pdf=process.argv.find(s=>s.startsWith('--pdf='));
if(pdf){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');}
console.log({pass:true,...batch.counts,calculations,conceptual,pdfHashChecked:!!pdf,limitation:'Conceptual evidence and AI reasoning preserved; checker does not machine-prove semantics.'});
