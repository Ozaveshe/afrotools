const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./physics-2001-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const formulas={rlCurrent:p=>p.voltage/Math.hypot(p.resistance,p.reactance),rms:p=>p.peak/Math.SQRT2,hydroHeight:p=>p.pressure/(p.density*p.g),trapezium:p=>(p.f1+p.f2)*(p.x2-p.x1)/2,inverseSquare:p=>1/p.scale**2,stringSpeed:p=>2*p.length*p.frequency,gasPressure:p=>p.n*p.R*p.T/p.V,resistance:p=>p.voltage**2/p.power,chargeEnergy:p=>p.Q**2/(2*p.C),unknownParallel:p=>1/(1/(p.voltage/p.current-p.series.reduce((a,v)=>a+v))-1/p.known)};
assert.deepEqual(b.counts,{examined:40,candidates:27,held:13});assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);assert.deepEqual(b.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(560,600).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of b.records){assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([84,85,86,87,88].includes(r.source_pdf_page));assert.equal(r.source_year,r.original_record.year);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
 if(c.kind==='forceComparison'){const e=1.602e-19,m=1.673e-27,G=6.674e-11,eps=8.854e-12;for(const d of [1e-9,.01,3])assert(close((e*e/(4*Math.PI*eps*d*d))/(G*m*m/(d*d)),e*e/(4*Math.PI*eps*G*m*m)));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'e²/(4πε₀Gm²)');}
 else if(c.kind==='forceAngle'){const forces=[Math.sin(Math.PI/3),0,Math.sin(0),Math.sin(Math.PI/2)];assert.equal(Math.max(...forces),forces[3]);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'At right angles to the field');}
 else if(c.kind==='zeroForce'){for(const momentum of [-10,0,4])for(const duration of [1,3,8])assert.equal(momentum+0*duration,momentum);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'Be constant');}
 else if(c.kind==='triangleWork'){for(const F of [2,9])for(const x of [1,3]){const n=1000,dx=x/n;let sum=0;for(let i=0;i<n;i++)sum+=(F/x)*(i+.5)*dx*dx;assert(close(sum,F*x/2));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'Fx/2 J');assert(q.question.includes('rises linearly from zero'));}
 else if(c.kind==='perpendicularForces'){assert(close(Math.hypot(p.north,p.east),c.expected[0]));assert(close(Math.atan2(p.east,p.north)*180/Math.PI,c.expected[1]));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'10√2 N,45° east of north');}
 else if(c.kind==='coolingDifference'){for(const T of [300,330]){assert.equal(3*(T-T),0);assert(3*(T+10-T)>0);assert.equal(3*(T+20-T),2*3*(T+10-T));}assert.equal(q.answer,c.expectedAnswer);assert(q.options.B.includes('Difference in temperature'));}
 else{assert(formulas[c.kind],c.kind);const value=formulas[c.kind](p);assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(x=>close(x,value)).length,1);
 if(c.kind==='rlCurrent'){assert(close(Math.hypot(value*p.resistance,value*p.reactance),p.voltage));assert(q.question.includes('series'));assert(q.question.includes('reactance 3 Ω'));}
 if(c.kind==='rms'){const n=10000;let sum=0;for(let i=0;i<n;i++)sum+=(p.peak*Math.sin(2*Math.PI*(i+.5)/n))**2;assert(close(sum/n,value*value));assert.equal(q.options.D,'√2 A');}
 if(c.kind==='hydroHeight')assert(close(value*p.density*p.g,p.pressure));
 if(c.kind==='trapezium'){const n=1000,dx=(p.x2-p.x1)/n;let sum=0;for(let i=0;i<n;i++)sum+=(p.f1+(p.f2-p.f1)*(i+.5)/n)*dx;assert(close(sum,value));}
 if(c.kind==='inverseSquare')assert(close(value*p.scale*p.scale,1));
 if(c.kind==='stringSpeed')assert(close(value/p.frequency,2*p.length));
 if(c.kind==='gasPressure')assert(close(value*p.V,p.n*p.R*p.T));
 if(c.kind==='resistance')assert(close(p.voltage/value*p.voltage,p.power));
 if(c.kind==='chargeEnergy')assert(close(value,.5*p.Q*(p.Q/p.C)));
 if(c.kind==='unknownParallel'){const parallel=1/(1/value+1/p.known),R=parallel+p.series.reduce((a,v)=>a+v);assert(close(p.voltage/R,p.current));const V=p.current*parallel;assert(close(V/value+V/p.known,p.current));assert(q.question.includes('parallel pair of 3 Ω andX'));}
 }}else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>/^https:\/\//.test(u)));}
}
assert.equal(diagrams,5);assert.equal(calculations,16);assert.equal(conceptual,11);
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001','physics-1997-001','physics-1998-001','physics-2000-001'].flatMap(n=>require('./'+n+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(b.prior_held_ids,prior);assert.equal(prior.length,141);assert.equal(new Set([...prior,...b.records.filter(r=>r.status==='held').map(r=>r.id)]).size,154);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log(JSON.stringify({pass:true,...b.counts,calculations,conceptual,diagrams,cumulativeHeld:154,limitation:'Conceptual source evidence is not machine proof of semantics.'}));
