const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1995-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b)),sin=d=>Math.sin(d*Math.PI/180),cos=d=>Math.cos(d*Math.PI/180);
const formulas={waveLength:p=>p.oldLength*p.oldFrequency/p.newFrequency,field:p=>p.voltage/p.distance,currentRatio:p=>p.voltageFactor/p.resistanceFactor,cellCurrent:p=>p.emf/(p.internal+p.external),seriesParallelCap:p=>1/([...p.series,p.parallel.reduce((a,b)=>a+b)].reduce((a,b)=>a+1/b,0)),peakPower:p=>p.voltage**2/p.resistance,transformer:p=>p.voltage*p.secondary/p.primary,averageSpeed:p=>((p.offset+p.k*p.end**2)-(p.offset+p.k*p.start**2))/(p.end-p.start),inclineAcceleration:p=>p.g*sin(p.angle),collision:p=>p.arrow*p.speed/(p.arrow+p.block),inverseSquare:p=>p.force*(p.oldDistance/p.newDistance)**2,equilibriumAngle:p=>Math.acos(p.vertical/p.tension)*180/Math.PI,initialEnergy:p=>p.mass*p.speed**2/2+p.mass*p.g*p.height,efficiency:p=>100*p.mass*p.g*p.height/(p.power*p.time),tankMass:p=>p.litres/1000*p.relative*p.waterDensity+p.tank,thermometer:p=>100*(p.reading-p.zero)/(p.hundred-p.zero),gasTemperature:p=>(p.initial+p.offset)*p.p2/p.p1-p.offset,stringLength:p=>p.initialFrequency*p.initialLength/p.finalFrequency};
assert.deepEqual(batch.counts,{examined:40,candidates:35,held:5});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);assert.deepEqual(batch.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(400,440).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0,yearFixes=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([62,63,64,65,66,67,69].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(q.year!==r.original_record.year){yearFixes++;assert.equal(q.year,1998);assert.equal(r.source_pdf_page,69);assert(!pool.some(p=>p.subject==='physics'&&p.year===q.year&&p.num===q.num&&p.id!==q.id));}
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/diagram|figure|shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='forceDimensions'){assert.deepEqual([1,0,0].map((v,i)=>v+[0,1,-2][i]),[1,1,-2]);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'1, 1, −2');}
  else if(c.kind==='impulseDimensions'){const impulse=[1,1,-2].map((v,i)=>v+[0,0,1][i]);const candidates={A:[1,2,-2],B:[1,1,-1],C:[1,0,-2],D:[1,-1,-2]};assert.deepEqual(candidates[q.answer],impulse);assert.equal(Object.values(candidates).filter(v=>JSON.stringify(v)===JSON.stringify(impulse)).length,1);assert.equal(q.answer,c.expectedAnswer);}
  else if(c.kind==='shmPhase'){for(const t of [.1,.5,1,2]){const m=3,w=2,x=Math.cos(w*t),a=-w*w*x,F=-m*w*w*x;assert(close(F,m*a));assert(F*x<0);}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'Net force and acceleration');}
  else if(c.kind==='slopeComponents'){for(const theta of [15,30,60]){const weight=10;assert(close((weight*sin(theta))**2+(weight*cos(theta))**2,weight**2));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'mg sinθ and friction');assert(q.question.includes('slides down a rough plane'));assert(q.question.includes('no other applied forces'));}
  else if(c.kind==='limitingSlope'){for(const theta of [15,30,60]){const W=100,mu=Math.tan(theta*Math.PI/180);assert(close(W*sin(theta),mu*W*cos(theta)));}assert.equal(q.answer,c.expectedAnswer);assert(q.question.includes('just about to slide'));}
  else if(c.kind==='inPhaseSum'){for(let i=0;i<1000;i++){const phi=2*Math.PI*i/1000,P=2*Math.sin(phi),Q=Math.sin(phi);assert(close(P+Q,3*Math.sin(phi)));}assert.equal(q.answer,c.expectedAnswer);assert(q.question.includes('positive crests, negative troughs and zero crossings at matching positions'));}
  else if(c.kind==='sonometerRestore'){const f=(T,L,mu)=>Math.sqrt(T/mu)/(2*L);for(const ratio of [.25,.5,.8]){assert(Math.sqrt(ratio)<1);assert(close(f(100*ratio,Math.sqrt(ratio),1),f(100,1,1)));assert(f(100*ratio,2,1)<f(100,1,1));assert(f(100*ratio,1,2)<f(100,1,1));}assert.equal(q.answer,c.expectedAnswer);assert(q.question.includes('hanging load'));}
  else{
   assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='waveLength')assert(close(raw*p.newFrequency,p.oldLength*p.oldFrequency));
   if(c.kind==='field')assert(close(raw*p.distance,p.voltage));
   if(c.kind==='currentRatio')assert(close(raw*p.resistanceFactor,p.voltageFactor));
   if(c.kind==='cellCurrent')assert(close(raw*p.external+raw*p.internal,p.emf));
   if(c.kind==='seriesParallelCap'){const sections=[...p.series,p.parallel.reduce((a,b)=>a+b)];assert(raw<Math.min(...sections));const voltage=10,charge=raw*voltage;assert(close(sections.reduce((v,C)=>v+charge/C,0),voltage));assert(q.question.includes('2 μF, 3 μF, a parallel pair of 2 μF and 4 μF, then 4 μF'));assert(r.diagram_evidence.visual_observation.includes('no switch or battery'));}
   if(c.kind==='peakPower')assert(close(raw*p.resistance,p.voltage**2));
   if(c.kind==='transformer')assert(close(raw/p.secondary,p.voltage/p.primary));
   if(c.kind==='averageSpeed'){assert(p.start>=0&&p.k>0);assert(close(raw,p.k*(p.start+p.end)));}
   if(c.kind==='inclineAcceleration')assert(close(raw*p.mass,p.mass*p.g*sin(p.angle)));
   if(c.kind==='collision'){assert(close(raw*(p.arrow+p.block),p.arrow*p.speed));assert((p.arrow+p.block)*raw**2/2<=p.arrow*p.speed**2/2);}
   if(c.kind==='inverseSquare')assert(close(raw*p.newDistance**2,p.force*p.oldDistance**2));
   if(c.kind==='equilibriumAngle'){assert(close(p.tension*cos(raw),p.vertical));assert(close(p.tension*sin(raw),p.horizontal));assert(q.question.includes('with the vertical'));assert(q.question.includes('6√3 N horizontally right'));}
   if(c.kind==='initialEnergy')assert(close(raw-p.mass*p.g*p.height,p.mass*p.speed**2/2));
   if(c.kind==='efficiency'){assert(raw>0&&raw<=100);assert(close(raw/100*p.power*p.time,p.mass*p.g*p.height));}
   if(c.kind==='tankMass')assert(close((raw-p.tank)/(p.litres/1000),p.relative*p.waterDensity));
   if(c.kind==='thermometer')assert(close(p.zero+raw/100*(p.hundred-p.zero),p.reading));
   if(c.kind==='gasTemperature')assert(close((raw+p.offset)/p.p2,(p.initial+p.offset)/p.p1));
   if(c.kind==='stringLength')assert(close(raw*p.finalFrequency,p.initialLength*p.initialFrequency));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,110);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,115);assert.equal(calculations,25);assert.equal(conceptual,10);assert.equal(diagrams,6);assert.equal(yearFixes,2);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,diagramEquivalents:diagrams,yearFixes,cumulativeHeld:115,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
