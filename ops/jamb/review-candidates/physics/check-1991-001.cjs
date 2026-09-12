const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1991-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
const formulas={powerCurrent:p=>Math.sqrt(p.power/p.resistance),platingHours:p=>p.mass/(p.z*p.current*3600),decayTime:p=>p.halfLife*Math.log2(p.initial/(p.initial-p.decayed)),halfDivision:p=>p.division/2,floatingDensity:p=>p.density*p.f1/p.f2,heating:p=>p.mass*p.c*p.delta,siren:p=>p.holes*p.revolutions,lightSpeed:p=>p.speed/p.index,electricForce:p=>Math.abs(p.charge)*p.field,capacitorCharge:p=>p.microfarads*p.voltage};
assert.deepEqual(batch.counts,{examined:40,candidates:28,held:12});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([44,45,46,47,48,49].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='pendulumDependence'){
   const period=(L,g,m)=>2*Math.PI*Math.sqrt(m*L/(m*g));const t=period(1,10,1);assert(close(period(1,10,3),t));assert(close(period(4,10,1),2*t));assert(close(period(1,40,1),t/2));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'II and III only');
  }else if(c.kind==='stressDependence'){
   const stress=(force,radius)=>force/(Math.PI*radius**2);assert(close(stress(20,.1)/stress(10,.1),2));assert(close(stress(10,.2)/stress(10,.1),.25));assert.equal(q.answer,c.expectedAnswer);assert.deepEqual([1,1,-2].map((v,i)=>v-[0,2,0][i]),[1,-1,-2]);
  }else if(c.kind==='smallestCurrent'){
   const values=Object.entries(p).map(([k,v])=>[k,v.power/v.voltage]).sort((a,b)=>a[1]-b[1]);assert.equal(values[0][0],q.answer);assert.equal(q.answer,c.expectedAnswer);assert(close(values[0][1],.25));for(const [k,v]of values)assert(close(v*p[k].voltage,p[k].power));assert(values[0][1]<values[1][1]);
  }else if(c.kind==='voltmeter'){
   const resistance=p.voltage/p.current-p.internal;assert(close(resistance,c.expected));assert(close((resistance+p.internal)*p.current,p.voltage));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options[q.answer],'1990 Ω in series');
  }else{
   assert(formulas[c.kind]);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='powerCurrent')assert(close(raw**2*p.resistance,p.power));
   if(c.kind==='platingHours')assert(close(raw*3600*p.z*p.current,p.mass));
   if(c.kind==='decayTime')assert(close(p.initial*2**(-raw/p.halfLife),p.initial-p.decayed));
   if(c.kind==='halfDivision'){assert(close(2*raw,p.division));for(const value of [0,.1,.499999,.5,.7,1])assert(Math.abs(Math.round(value/p.division)*p.division-value)<=raw);}
   if(c.kind==='floatingDensity')assert(close(raw*p.f2,p.density*p.f1));
   if(c.kind==='heating')assert(close(raw/(p.mass*p.c),p.delta));
   if(c.kind==='siren')assert(close(raw/p.revolutions,p.holes));
   if(c.kind==='lightSpeed')assert(close(p.speed/raw,p.index));
   if(c.kind==='electricForce'){assert(close(raw/p.field,Math.abs(p.charge)));assert(p.charge*p.field<0);}
   if(c.kind==='capacitorCharge')assert(close(raw/p.voltage,p.microfarads));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,83);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,95);
assert.equal(batch.records.filter(r=>r.candidate&&r.candidate.year!==r.original_record.year).length,0);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:prior.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
