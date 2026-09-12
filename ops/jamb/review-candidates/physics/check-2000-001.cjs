const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./physics-2000-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const formulas={powerScale:p=>p.force*p.speed,effort:p=>p.load/(p.vr*p.efficiency),reactance:p=>2*Math.PI*p.f*p.L,halfLife:p=>p.time/Math.log2(1/p.fraction),stopping:p=>p.photon-p.work,faraday:p=>p.turns*p.rate,cableLoss:p=>(p.power/p.voltage)**2*p.resistance,displacement:p=>Math.sqrt(4*p.sphereRadius**3/(3*p.rise)),convexImage:p=>1/(2/p.radius+1/p.object),networkCurrent:p=>p.voltage/(p.series.reduce((a,v)=>a+v,0)+1/p.parallel.reduce((a,v)=>a+1/v,0)),parallelEnergyRatio:p=>p.p/p.q,closedFlux:p=>p.E*p.side**2-p.E*p.side**2};
assert.deepEqual(b.counts,{examined:40,candidates:27,held:13});assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);assert.deepEqual(b.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(520,560).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of b.records){assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([78,79,80,81,82,83,84].includes(r.source_pdf_page));assert.equal(r.source_year,r.original_record.year);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
 if(c.kind==='parallelCharges'){const charges=p.capacitances.map(C=>C*p.voltage);assert.deepEqual(charges,c.expected);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'100 μC and 200 μC');assert.equal(charges[0]/p.capacitances[0],charges[1]/p.capacitances[1]);assert(q.question.includes('parallel'));}
 else if(c.kind==='seriesVoltages'){const I=p.emf/(p.internal+p.resistors.reduce((a,v)=>a+v));p.resistors.forEach((R,i)=>assert(close(I*R,c.expected[i])));assert(close(c.expected.reduce((a,v)=>a+v)+I*p.internal,p.emf));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'1 V and 2/3 V');assert(q.question.includes('internal resistance 1 Ω'));}
 else if(c.kind==='efficiencyInequality'){for(const vr of [2,5,8])for(const eta of [.1,.75,.99]){const ma=eta*vr;assert(ma<vr);assert(close(ma/vr,eta));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'Velocity ratio exceeds mechanical advantage');}
 else if(c.kind==='surfaceSnell'){for(const alpha of [.3,.5,.7])for(const beta of [.1,.2])assert(close(Math.sin(Math.PI/2-alpha)/Math.sin(beta),Math.cos(alpha)/Math.sin(beta)));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'cosα/sinβ');assert(q.question.includes('with the surface'));assert(q.question.includes('with the normal'));}
 else if(c.kind==='seriesCapacitors'){const ce=1/p.capacitances.reduce((a,C)=>a+1/C,0),charge=ce*p.voltage;const vs=p.capacitances.map(C=>charge/C);assert.deepEqual(vs,c.expected);assert.equal(vs.reduce((a,v)=>a+v),p.voltage);vs.forEach((v,i)=>assert.equal(v*p.capacitances[i],charge));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'6V, 2V and 4V'.replace(/(\d)(?=[A-Za-z])/g,'$1 '));assert(q.question.includes('Initially uncharged'));}
 else{assert(formulas[c.kind],c.kind);const value=formulas[c.kind](p);assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(x=>close(x,value)).length,1);
 if(c.kind==='powerScale')assert(close(value/p.force,p.speed));
 if(c.kind==='effort')assert(close(p.load/(value*p.vr),p.efficiency));
 if(c.kind==='reactance')assert(close(value/(2*Math.PI*p.L),p.f));
 if(c.kind==='halfLife')assert(close(2**(-p.time/value),p.fraction));
 if(c.kind==='stopping')assert.equal(value+p.work,p.photon);
 if(c.kind==='faraday')assert(close(value/p.turns,p.rate));
 if(c.kind==='cableLoss'){const I=p.power/p.voltage;assert(close(value/I,I*p.resistance));assert(value<p.power);}
 if(c.kind==='displacement')assert(close(Math.PI*value**2*p.rise,4/3*Math.PI*p.sphereRadius**3));
 if(c.kind==='convexImage'){assert(close(1/p.object-1/value,-2/p.radius));assert(value<p.radius/2);}
 if(c.kind==='networkCurrent'){const branchV=p.voltage-value*p.series.reduce((a,v)=>a+v,0);assert(close(p.parallel.reduce((a,R)=>a+branchV/R,0),value));assert(q.question.includes('10 Ω'));assert(q.question.includes('5 Ω'));}
 if(c.kind==='parallelEnergyRatio')for(const V of [3,7,12])assert(close((.5*p.p*V*V)/(.5*p.q*V*V),value));
 if(c.kind==='closedFlux'){for(const E of [2,9])for(const L of [.5,2]){const fluxes=[E*L*L,-E*L*L,0,0,0,0];assert.equal(fluxes.reduce((a,v)=>a+v),0);}assert(q.question.includes('net outward'));}
 }}else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>/^https:\/\//.test(u)));}
}
assert.equal(diagrams,11);assert.equal(calculations,17);assert.equal(conceptual,10);
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001','physics-1997-001','physics-1998-001'].flatMap(n=>require('./'+n+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(b.prior_held_ids,prior);assert.equal(prior.length,128);assert.equal(new Set([...prior,...b.records.filter(r=>r.status==='held').map(r=>r.id)]).size,141);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log(JSON.stringify({pass:true,...b.counts,calculations,conceptual,diagrams,cumulativeHeld:141,limitation:'Conceptual source evidence is not machine proof of semantics.'}));
