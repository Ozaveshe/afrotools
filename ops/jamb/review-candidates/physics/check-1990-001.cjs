const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1990-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
const formulas={imageHeight:p=>p.height*p.v/p.u,erectLens:p=>p.f*(1-1/p.m),tubeSpeed:p=>4*p.length*p.frequency,tubeFrequency:p=>p.speed/(4*p.length),parallelCells:p=>p.emf/(p.load+p.r/p.n),bridge:p=>p.standard*(p.total-p.length)/p.length,incline:p=>p.mass*p.g*Math.sin(p.angle*Math.PI/180)/p.efficiency,springLength:p=>p.l1+(p.target-p.f1)*(p.l2-p.l1)/(p.f2-p.f1),buoyantMass:p=>p.water+(p.water-p.liquid)/(p.rd-1),heatDifference:p=>p.mass*p.latent,heaterTime:p=>p.mass*p.c*p.delta/p.power,beats:p=>Math.abs(p.b-p.a)};
assert.deepEqual(batch.counts,{examined:40,candidates:34,held:6});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([39,40,41,42,43,44].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='mirrorRotation'){
   // Reflection vector r=d-2(d.n)n, with fixed incoming vector d.
   const reflect=a=>{const n=[Math.cos(a),Math.sin(a)],d=[-1,0],dot=d[0]*n[0]+d[1]*n[1];return [d[0]-2*dot*n[0],d[1]-2*dot*n[1]];};
   for(const angle of [.01,.07,.2]){const v=reflect(angle),base=reflect(0);const delta=Math.atan2(v[1],v[0])-Math.atan2(base[1],base[0]);assert(close(delta,2*angle));}
   assert.equal(p.factors[q.answer],2);assert.equal(q.answer,c.expectedAnswer);
  }else if(c.kind==='ammeterShunt'){
   const raw=p.ig*p.rg/(p.total-p.ig);assert(close(Number(raw.toFixed(c.roundPlaces)),c.expected));assert(close(raw*(p.total-p.ig),p.ig*p.rg));assert.equal(q.answer,c.expectedAnswer);assert(/shunt/.test(q.options[q.answer]));assert(/0.03/.test(q.options[q.answer]));
  }else if(c.kind==='divergingImage'){
   const v=1/(1/p.f-1/p.u);assert(close(v,c.expected));assert(close(1/v+1/p.u,1/p.f));assert(v<0);assert(-v/p.u>0&&-v/p.u<1);assert.equal(q.answer,c.expectedAnswer);
  }else{
   assert(formulas[c.kind]);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='imageHeight')assert(close(raw/p.height,p.v/p.u));
   if(c.kind==='erectLens'){const v=-p.m*raw;assert(v<0);assert(close(1/raw+1/v,1/p.f));}
   if(c.kind==='tubeSpeed')assert(close(raw/p.frequency,4*p.length));
   if(c.kind==='tubeFrequency')assert(close(p.speed/raw,4*p.length));
   if(c.kind==='parallelCells')assert(close(raw*p.load+(raw/p.n)*p.r,p.emf));
   if(c.kind==='bridge')assert(close(p.standard/raw,p.length/(p.total-p.length)));
   if(c.kind==='incline'){const s=7;assert(close(p.mass*p.g*s*Math.sin(p.angle*Math.PI/180)/(raw*s),p.efficiency));}
   if(c.kind==='springLength'){const k=(p.f2-p.f1)/(p.l2-p.l1),l0=p.l1-p.f1/k;assert(close(k*(raw-l0),p.target));assert(close(k*(p.l2-l0),p.f2));}
   if(c.kind==='buoyantMass'){const b=raw-p.water;assert(close(raw-p.rd*b,p.liquid));assert(b>0);}
   if(c.kind==='heatDifference'){const water=p.mass*p.c*p.delta,steam=p.mass*(p.latent+p.c*p.delta);assert(close(steam-water,raw));}
   if(c.kind==='heaterTime')assert(close(raw*p.power,p.mass*p.c*p.delta));
   if(c.kind==='beats'){assert(close((p.b-p.a)/raw,1));assert(close(Math.abs(Math.cos(Math.PI*(p.b-p.a)/raw)),1));}
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,77);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,83);
assert.equal(batch.records.filter(r=>r.candidate&&r.candidate.year!==r.original_record.year).length,0);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:prior.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
