const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./physics-2002-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const formulas={capacitiveFrequency:p=>1/(2*Math.PI*p.C*p.X),decayPercent:p=>100*2**(-p.halves),photon:p=>p.h*p.f,lever:p=>p.load*p.loadArm/p.effortArm,barSpeed:p=>Math.sqrt(p.Y/p.density),inverseSquare:p=>1/p.scale**2,heatCapacity:p=>p.power*p.time/p.delta,magnification:p=>p.image/p.object,conductionArea:p=>p.heat/(p.time*p.k*p.gradient),humidity:p=>100*p.actual/p.saturated,resistorLimit:p=>p.limit*1.5,massEnergy:p=>p.mass*p.fraction*p.c**2,acPower:p=>p.peak**2/2*p.R};
assert.deepEqual(b.counts,{examined:40,candidates:30,held:10});assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);assert.deepEqual(b.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(600,640).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of b.records){assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([89,90,91,92,93].includes(r.source_pdf_page));assert.equal(r.source_year,r.original_record.year);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/shown above/i.test(q.question));}
 if(r.source_table){assert.equal(r.source_table.saturationMmHg[r.source_table.temperatureC.indexOf(20)],17.5);assert.deepEqual(r.source_table.usedRow,{temperatureC:20,saturationMmHg:17.5});}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
 if(c.kind==='nuclearParticle'){assert.deepEqual([p.productA.reduce((a,v)=>a+v)-p.initialA,p.productZ.reduce((a,v)=>a+v)-p.initialZ],c.expected);assert.deepEqual(c.expected,[1,0]);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'Neutron');}
 else if(c.kind==='transmissionScaling'){for(const P of [100,1000])for(const R of [1,3])for(const V of [10,20]){const loss=(P/V)**2*R,loss2=(P/(2*V))**2*R;assert(close(loss2,loss/4));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'Resistive heating in the transmission conductors');}
 else if(c.kind==='closedPipe'){for(const l of [.1,.5,1])for(const v of [300,340]){const f=v/(4*l);assert(close(v/f,4*l));assert(close(Math.sin(2*Math.PI*l/(v/f)),1));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'v/(4l)'.replace(/(\d)(?=[A-Za-z])/g,'$1 '));assert(q.question.includes('closed at one end'));}
 else {assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.significantFigures?Number(raw.toPrecision(c.significantFigures)):c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(x=>close(x,value)).length,1);
 if(c.kind==='capacitiveFrequency')assert(close(1/(2*Math.PI*raw*p.C),p.X));
 if(c.kind==='decayPercent')assert(close(raw*2**p.halves,100));
 if(c.kind==='photon')assert(close(raw/p.f,p.h));
 if(c.kind==='lever')assert(close(raw*p.effortArm,p.load*p.loadArm));
 if(c.kind==='barSpeed')assert(close(raw**2*p.density,p.Y));
 if(c.kind==='inverseSquare')assert(close(raw*p.scale*p.scale,1));
 if(c.kind==='heatCapacity')assert(close(raw*p.delta,p.power*p.time));
 if(c.kind==='magnification')assert(close(raw*p.object,p.image));
 if(c.kind==='conductionArea')assert(close(raw*p.k*p.gradient,p.heat/p.time));
 if(c.kind==='humidity'){assert(close(raw/100*p.saturated,p.actual));assert(r.source_table);}
 if(c.kind==='resistorLimit'){const I=Math.sqrt(p.limit/p.R),powers=[I*I*p.R,(I/2)**2*p.R,(I/2)**2*p.R];assert(powers.every(v=>v<=p.limit));assert(close(powers.reduce((a,v)=>a+v),raw));assert((I*1.001)**2*p.R>p.limit);assert(q.question.includes('in parallel'));assert(q.question.includes('in series'));}
 if(c.kind==='massEnergy')assert(close(raw/p.c**2,p.mass*p.fraction));
 if(c.kind==='acPower'){let sum=0;const n=10000;for(let i=0;i<n;i++)sum+=(p.peak*Math.sin(2*Math.PI*(i+.5)/n))**2*p.R;assert(close(sum/n,raw));}
 }}else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>/^https:\/\//.test(u)));}
}
assert.equal(diagrams,1);assert.equal(calculations,17);assert.equal(conceptual,13);
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001','physics-1997-001','physics-1998-001','physics-2000-001','physics-2001-001'].flatMap(n=>require('./'+n+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(b.prior_held_ids,prior);assert.equal(prior.length,154);assert.equal(new Set([...prior,...b.records.filter(r=>r.status==='held').map(r=>r.id)]).size,164);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log(JSON.stringify({pass:true,...b.counts,calculations,conceptual,diagrams,cumulativeHeld:164,limitation:'Conceptual source evidence is not machine proof of semantics.'}));
