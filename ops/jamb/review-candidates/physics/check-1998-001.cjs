const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./physics-1998-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const formulas={forceRatio:p=>p.m*p.a,young:p=>p.stress*p.initial/(p.final-p.initial),angular:p=>p.coefficient,melt:p=>p.mass*p.c*p.delta/p.latent,wave:p=>p.speed*p.cycles/p.length,gradient:p=>(p.hot-p.cold)/p.length,snell:p=>p.v1/p.v2*Math.sin(p.r),phasor:p=>Math.hypot(p.r,p.l),capacitorEnergy:p=>.5*(p.c1+p.c2)*p.v*p.v,inductiveFrequency:p=>p.x/(2*Math.PI*p.l),deBroglie:p=>p.h/(p.m*p.wavelength),resonantVoltage:p=>p.inductor,derivative:p=>2*p.coefficient*p.t};
assert.deepEqual(b.counts,{examined:40,candidates:31,held:9});assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);assert.deepEqual(b.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(480,520).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of b.records){assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([72,73,74,75,76,77,78].includes(r.source_pdf_page));assert.equal(r.source_year,r.original_record.year);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/diagram|shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
 if(c.kind==='slopes'){const a=(p.speeds[1]-p.speeds[0])/(p.times[1]-p.times[0]),d=(p.speeds[2]-p.speeds[3])/(p.times[3]-p.times[2]);assert.deepEqual([a,d],c.expected);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'4 m/s², 2 m/s²');assert.equal(a*20,d*40);}
 else if(c.kind==='cells'){assert.deepEqual([p.emf,p.r/p.n],c.expected);for(const current of [.1,.3,1])assert(close(p.emf-current*c.expected[1],p.emf-current/p.n*p.r));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'1.5 V, 1 Ω');assert(q.question.includes('matching polarities'));}
 else if(c.kind==='parallelPower'){for(const E of [3,7,12])for(const R1 of [2,5])for(const R2 of [3,11])assert(close((E*E/R1)/(E*E/R2),R2/R1));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'R₂/R₁');assert(q.question.includes('zero internal resistance'));assert(q.question.includes('separate parallel branches'));}
 else {assert(formulas[c.kind],c.kind);const value=formulas[c.kind](p);assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(x=>close(x,value)).length,1);
 if(c.kind==='forceRatio')assert(close(value/p.m,p.a));
 if(c.kind==='young')assert(close(value*(p.final-p.initial)/p.initial,p.stress));
 if(c.kind==='angular'){const T=2*Math.PI/value;assert(close(p.coefficient*T,2*Math.PI));}
 if(c.kind==='melt')assert(close(value*p.latent,p.mass*p.c*p.delta));
 if(c.kind==='wave'){assert(close(p.speed/value,p.length/p.cycles));assert(q.question.includes('three complete cycles'));}
 if(c.kind==='gradient')assert(close(p.cold+value*p.length,p.hot));
 if(c.kind==='snell')assert(close(value/p.v1,Math.sin(p.r)/p.v2));
 if(c.kind==='phasor'){assert(close(value*value-p.r*p.r,p.l*p.l));assert(q.question.includes('series loop'));assert(q.question.includes('6 V'));}
 if(c.kind==='capacitorEnergy'){assert(close(value,.5*p.c1*p.v**2+.5*p.c2*p.v**2));assert(q.question.includes('parallel'));assert(q.question.includes('positive plates at the same terminal'));}
 if(c.kind==='inductiveFrequency')assert(close(2*Math.PI*value*p.l,p.x));
 if(c.kind==='deBroglie'){assert(close(p.m*value*p.wavelength,p.h));assert(value<3e8*.001);}
 if(c.kind==='resonantVoltage'){assert.equal(value-p.inductor,0);assert.equal(Math.hypot(p.resistor,p.inductor-value),p.resistor);}
 if(c.kind==='derivative'){const h=.001,v=t=>p.constant+p.coefficient*t*t;assert(close((v(p.t+h)-v(p.t-h))/(2*h),value));}
 }}else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>/^https:\/\//.test(u)));}
}
assert.equal(diagrams,7);assert.equal(calculations,16);assert.equal(conceptual,15);
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001','physics-1997-001'].flatMap(n=>require('./'+n+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(b.prior_held_ids,prior);assert.equal(prior.length,119);assert.equal(new Set([...prior,...b.records.filter(r=>r.status==='held').map(r=>r.id)]).size,128);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log(JSON.stringify({pass:true,...b.counts,calculations,conceptual,diagrams,cumulativeHeld:128,limitation:'Conceptual citations and human-readable reasoning are evidence; this checker does not machine-prove their semantics.'}));
