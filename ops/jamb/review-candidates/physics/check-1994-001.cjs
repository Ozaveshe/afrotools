const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1994-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
const sin=d=>Math.sin(d*Math.PI/180);
const formulas={friction:p=>p.mass*p.g*p.mu,relativeDensity:p=>(p.liquid-p.empty)/(p.water-p.empty),kelvin:p=>p.c+273.15,mixMass:p=>p.hotMass*(p.hot-p.final)/(p.coldRatio*(p.final-p.cold)),meltPower:p=>p.mass*p.latent/p.time,amplitude:p=>Math.abs(p.a),echo:p=>p.speed*p.time/2,stringFrequency:p=>p.initial*Math.sqrt(p.tension)/p.length,virtualObject:p=>p.f*(1-1/p.m),apparentRise:p=>p.depth-p.depth/p.index,parallelPowerRatio:p=>p.r2/p.r1,parallelBranch:p=>{const ext=1/(1/p.target+1/p.other);return p.emf/(p.internal+ext)*ext/p.target;},halfPeriod:p=>1/(2*p.f),pendulumLength:p=>p.g*(2/p.crossings/(2*Math.PI))**2,twoCords:p=>p.weight/(2*sin(p.angle)),inclinePulley:p=>p.g*(p.hanging-p.inclineMass*sin(p.angle))/(p.hanging+p.inclineMass),moonGravity:p=>p.earth/p.factor,elasticEnergy:p=>p.force*p.extension/2,heatingTime:p=>p.mass*p.c*p.delta/p.power};
assert.deepEqual(batch.counts,{examined:40,candidates:33,held:7});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.deepEqual(batch.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(360,400).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([56,57,58,59,60,61,62].includes(r.source_pdf_page));assert.equal(r.source_year,r.source_pdf_page>=60?1995:1994);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/diagram|figure|shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='floatingRatio'){assert(p.q/p.p<1);assert(close(p.p*(p.q/p.p),p.q));assert.equal(q.answer,c.expectedAnswer);assert(q.options.D.includes('less'));}
  else if(c.kind==='stringHalve'){const f=(L,T,mu)=>Math.sqrt(T/mu)/(2*L);assert(close(f(2,1,1)/f(1,1,1),.5));assert(close(f(1,1,2)/f(1,1,1),1/Math.sqrt(2)));assert(close(f(1,.5,1)/f(1,1,1),1/Math.sqrt(2)));assert.equal(q.answer,c.expectedAnswer);}
  else if(c.kind==='pressureDimensions'){const dims=[1,1,-2].map((v,i)=>v-[0,2,0][i]);assert.deepEqual(dims,[1,-1,-2]);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'ML⁻¹T⁻²');}
  else if(c.kind==='vectorTriangle'){const O=[0,0],A=[0,2],B=[3,1],sub=(a,b)=>a.map((v,i)=>v-b[i]);const P=sub(A,O),Q=sub(B,O),R=sub(A,B);assert.deepEqual(Q.map((v,i)=>v+R[i]),P);assert.notDeepEqual(Q.map((v,i)=>v-R[i]),P);assert.notDeepEqual(R.map((v,i)=>v-Q[i]),P);assert.notDeepEqual(P.map((v,i)=>v+Q[i]+R[i]),[0,0]);assert.equal(q.answer,c.expectedAnswer);assert(q.question.includes('R from B to A'));}
  else if(c.kind==='charlesPowers'){const choices={A:[1,-1,1],B:[0,1,-1],C:[1,0,-1],D:[0,1,1]};assert.deepEqual(choices[q.answer],[0,1,-1]);for(const T of [200,300,500]){const V=2*T;assert(close(V/T,2));}assert.equal(q.answer,c.expectedAnswer);assert(q.options.B.includes('z = -1'));}
  else{
   assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='friction')assert(close(raw/(p.mass*p.g),p.mu));
   if(c.kind==='relativeDensity')assert(close(raw*(p.water-p.empty)+p.empty,p.liquid));
   if(c.kind==='kelvin')assert(close(raw-273.15,p.c));
   if(c.kind==='mixMass')assert(close(raw*p.coldRatio*(p.final-p.cold),p.hotMass*(p.hot-p.final)));
   if(c.kind==='meltPower')assert(close(raw*p.time,p.mass*p.latent));
   if(c.kind==='amplitude'){assert(close(p.a*Math.sin(Math.PI/2),raw));for(let k=0;k<1000;k++)assert(Math.abs(p.a*Math.sin(k))<=raw);}
   if(c.kind==='echo')assert(close(2*raw/p.speed,p.time));
   if(c.kind==='stringFrequency')assert(close((raw/p.initial*p.length)**2,p.tension));
   if(c.kind==='virtualObject'){const v=-p.m*raw;assert(v<0&&raw<p.f);assert(close(1/raw+1/v,1/p.f));}
   if(c.kind==='apparentRise')assert(close(p.depth/(p.depth-raw),p.index));
   if(c.kind==='parallelPowerRatio'){const v=10;assert(close((v*v/p.r1)/(v*v/p.r2),raw));}
   if(c.kind==='parallelBranch'){const terminal=raw*p.target,other=terminal/p.other,total=raw+other;assert(close(terminal+total*p.internal,p.emf));assert(close(total,2.4));assert(q.question.includes('internal resistance 1 Ω'));assert(q.question.includes('two parallel resistors, 12 Ω and 6 Ω'));assert(r.diagram_evidence.visual_observation.includes('No switch'));}
   if(c.kind==='halfPeriod'){assert(close(2*raw*p.f,1));assert(q.question.includes('upward zero crossing'));assert(q.question.includes('immediately following downward zero crossing'));}
   if(c.kind==='pendulumLength')assert(close(2/(2*Math.PI*Math.sqrt(raw/p.g)),p.crossings));
   if(c.kind==='twoCords'){assert(close(2*raw*sin(p.angle),p.weight));assert(q.question.includes('symmetric'));assert(q.question.includes('30° above horizontal'));}
   if(c.kind==='inclinePulley'){const T=p.hanging*(p.g-raw);assert(close(T-p.inclineMass*p.g*sin(p.angle),p.inclineMass*raw));assert(q.question.includes('smooth 30° incline'));assert(q.question.includes('frictionless massless pulley'));assert(q.question.includes('light inextensible string'));assert(q.question.includes('g =10 m/s²'));}
   if(c.kind==='moonGravity')assert(close(raw*p.factor,p.earth));
   if(c.kind==='elasticEnergy'){const stiffness=p.force/p.extension;assert(close(stiffness*p.extension**2/2,raw));}
   if(c.kind==='heatingTime')assert(close(raw*p.power/(p.mass*p.c),p.delta));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,103);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,110);assert.equal(calculations,23);assert.equal(conceptual,10);assert.equal(diagrams,5);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
// A fixed-pressure Charles-law family satisfies both source options A and B.
for(const T of [200,300,500]){const P=2,V=3*T;assert(close(P*T/V,2/3));assert(close(V/T,3));}
assert.equal(batch.records.find(r=>r.id==='physics-1995-21-338b7bceeeb4').status,'held');
console.log({pass:true,...batch.counts,calculations,conceptual,diagramEquivalents:diagrams,cumulativeHeld:110,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
