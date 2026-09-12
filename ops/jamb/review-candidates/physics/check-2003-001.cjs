const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./physics-2003-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const formulas={ammeter:p=>p.mass/(p.z*p.time)-p.reading,stopping:p=>p.energyEV*p.e/p.e,magneticAngle:p=>Math.asin(p.fraction)*180/Math.PI,decay:p=>p.initial*2**(-p.time/p.half),hydraulic:p=>p.load*p.area/p.effort,horizontal:p=>-p.left+p.right+(p.upper+p.lower)*Math.cos(p.angle*Math.PI/180),inductor:p=>.5*p.L*p.I**2,rlc:p=>p.V/Math.hypot(p.R,p.XL-p.XC),melt:p=>p.mass/p.ice-p.mass/p.water,hooke:p=>p.force*p.target/p.extension,specificHeat:p=>p.power*p.time/(p.mass*p.delta),parallelPower:p=>(p.V**2/p.R1)/(p.V**2/p.R2),seriesCap:p=>1/p.caps.reduce((s,c)=>s+1/c,0)};
assert.deepEqual(b.counts,{examined:38,candidates:29,held:9});assert.equal(b.records.length,38);assert.equal(new Set(b.records.map(r=>r.id)).size,38);assert.deepEqual(b.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(640,678).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0;
for(const r of b.records){assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([93,94,95,96,97].includes(r.source_pdf_page));assert.equal(r.source_year,r.original_record.year);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,b.source.pdf_sha256||'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/diagram above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
 if(c.kind==='lensIdentity'){for(const f of [.1,.3,2])for(const k of [1.2,2,4]){const u=k*f,v=1/(1/f-1/u);assert(close(v/u,v/f-1));assert(!close(v/u,v/f+1));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'v/f − 1');assert(q.question.includes('real image'));}
 else if(c.kind==='parallelVectors'){for(const a of [1,2,5])for(const k of [.5,3]){const P=[a,2*a],Q=P.map(v=>k*v);assert.equal(P[0]*Q[1]-P[1]*Q[0],0);assert(close(P.reduce((s,v,i)=>s+v*Q[i],0),Math.hypot(...P)*Math.hypot(...Q)));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'Be parallel');}
 else if(c.kind==='resonance'){for(const L of [.001,.1,2])for(const C of [1e-6,5e-5]){const w=1/Math.sqrt(L*C);assert(close(w*L,1/(w*C)));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'X_L = X_C');}
 else if(c.kind==='deBroglie'){const h=6.62607015e-34;for(const mass of [9.109e-31,1.67e-27])for(const speed of [1e3,1e6]){const momentum=mass*speed,lambda=h/momentum;assert(close(lambda*momentum,h));assert(close(h/(2*momentum),lambda/2));const photonExpression=h*299792458/(.5*mass*speed**2);assert(!close(lambda,photonExpression));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'λ = h/p');}
 else {assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(x=>close(x,value)).length,1);
 if(c.kind==='ammeter')assert(close((raw+p.reading)*p.z*p.time,p.mass));
 if(c.kind==='stopping')assert(close(raw*p.e,p.energyEV*p.e));
 if(c.kind==='magneticAngle'){assert(close(Math.sin(raw*Math.PI/180),p.fraction));assert.equal(Object.values(c.options).filter(a=>close(Math.sin(a*Math.PI/180),p.fraction)).length,1);}
 if(c.kind==='decay')assert(close(raw*2**(p.time/p.half),p.initial));
 if(c.kind==='hydraulic')assert(close(p.load/raw,p.effort/p.area));
 if(c.kind==='horizontal'){assert.equal(p.angle,60);assert(close(raw,-4+10+8/2+6/2));assert(q.question.includes('4 N horizontally left'));assert(q.question.includes('10 N horizontally right'));assert(q.question.includes('8 N at 60° above'));assert(q.question.includes('6 N at 60° below'));assert(r.diagram_evidence);}
 if(c.kind==='inductor')assert(close(2*raw/p.I**2,p.L));
 if(c.kind==='rlc')assert(close((raw*p.R)**2+(raw*(p.XL-p.XC))**2,p.V**2));
 if(c.kind==='melt'){assert(close((p.mass/p.ice-raw)*p.water,p.mass));assert(p.water>p.ice);}
 if(c.kind==='hooke')assert(close(raw/p.target,p.force/p.extension));
 if(c.kind==='specificHeat')assert(close(raw*p.mass*p.delta,p.power*p.time));
 if(c.kind==='parallelPower'){assert(q.question.includes('in parallel'));assert(q.question.includes('12 V'));assert.equal(p.V**2/p.R1,24);assert.equal(p.V**2/p.R2,48);assert(close(p.V*(p.V/p.R1+p.V/p.R2),72));assert(r.diagram_evidence);}
 if(c.kind==='seriesCap'){const [a,d,e]=p.caps;const series=(x,y)=>1/(1/x+1/y);const alternatives=[a+d+e,series(a,d)+e,series(a,e)+d,series(d,e)+a,series(a+d,e),series(a+e,d),series(d+e,a)];assert(alternatives.every(v=>v>raw));assert(close(raw,3/31));assert(raw<Math.min(...p.caps));assert(q.question.includes('one decimal place'));}
 }}else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>/^https:\/\//.test(u)));}
}
assert.equal(diagrams,2);assert.equal(calculations,17);assert.equal(conceptual,12);
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001','physics-1997-001','physics-1998-001','physics-2000-001','physics-2001-001','physics-2002-001'].flatMap(n=>require('./'+n+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(b.prior_held_ids,prior);assert.equal(prior.length,164);assert.equal(new Set([...prior,...b.records.filter(r=>r.status==='held').map(r=>r.id)]).size,173);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log(JSON.stringify({pass:true,...b.counts,calculations,conceptual,diagrams,cumulativeExamined:678,cumulativeCandidates:505,cumulativeHeld:173,limitation:'Conceptual source evidence is not machine proof of semantics.'}));
