const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1997-001.json'),pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
const formulas={refractiveIndex:p=>p.vacuum/p.material,parallelCells:p=>p.emf/(p.internal/p.count+p.load),voltage:p=>p.work/p.charge,bridgeLength:p=>p.length*p.left/(p.left+p.right),seriesCharge:p=>p.capacitance/p.count*p.voltage,energyHours:p=>p.power*p.hours*3600,acFrequency:p=>p.omega/(2*p.pi),wheelEffort:p=>p.load/(p.efficiency*p.wheel/p.axle),strain:p=>p.extension/p.length,totalPressure:p=>p.surface+p.density*p.g*p.depth,volumeExpansion:p=>p.volume*(1+3*p.alpha*p.delta),meltWaterGrams:p=>1000*p.ice*p.latent/(p.c*p.temperature),soundTemperature:p=>p.speed*Math.sqrt(p.t2/p.t1),coulomb:p=>p.k*p.q1*p.q2/p.distance**2,networkResistance:p=>p.lead.reduce((a,b)=>a+b)+1/(1/p.direct+1/p.path.reduce((a,b)=>a+b)),electricalWork:p=>p.charge*p.voltage,jouleHeating:p=>p.current**2*p.resistance*p.time,resonance:p=>1/(2*Math.PI*Math.sqrt(p.L*p.C)),depositMass:p=>p.z*p.charge,massEnergy:p=>p.mass*p.c**2};
assert.deepEqual(batch.counts,{examined:40,candidates:36,held:4});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);assert.deepEqual(batch.records.map(r=>r.id),pool.filter(q=>q.subject==='physics').slice(440,480).map(q=>q.id));
let calculations=0,conceptual=0,diagrams=0,yearFixes=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);const original=pool.find(q=>q.id===r.id);assert(original);if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);assert([67,68,69,70,71,72,73].includes(r.source_pdf_page));
 if(r.source_year!==r.original_record.year){yearFixes++;assert.equal(r.source_year,1999);assert.equal(r.source_pdf_page,73);assert(!pool.some(p=>p.subject==='physics'&&p.year===1999&&p.num===r.original_record.num&&p.id!==r.id));}
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.diagram_evidence){diagrams++;assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.pdf_sha256,'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');assert(r.diagram_evidence.visual_observation.length>100);assert(!/diagram|figure|shown above/i.test(q.question));}
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='inductorPhase'){for(const t of [.1,.5,1]){const w=2,L=3,I=4,v=L*I*w*Math.cos(w*t);assert(close(v,L*I*w*Math.sin(w*t+Math.PI/2)));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'Lags the voltage by 90°');}
  else if(c.kind==='forceGraphs'){const F=12;for(const m of [1,2,4,8]){const a=F/m;assert(close(a*m,F));assert(close(a/(1/m),F));}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.A,'III and IV only');assert(q.question.includes('IV. a versus m: decreasing inverse curve'));}
  else if(c.kind==='apparentShift'){for(const t of [1,3,5])for(const n of [1,1.3,1.5,2]){const d=t-t/n;assert(close(d,t*(1-1/n)));assert(d>=0);if(n>1){assert(d>0);assert(!close(d,t*(1+1/n)));assert(!close(d,t*(1/n-1)));}}assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.C,'t(1 − 1/n)');}
  else{
   assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='refractiveIndex')assert(close(raw*p.material,p.vacuum));
   if(c.kind==='parallelCells'){const terminal=raw*p.load,each=(p.emf-terminal)/p.internal;assert(close(each*p.count,raw));assert(q.question.includes('matching polarities'));}
   if(c.kind==='voltage')assert(close(raw*p.charge,p.work));
   if(c.kind==='bridgeLength')assert(close(raw/(p.length-raw),p.left/p.right));
   if(c.kind==='seriesCharge'){assert(close(p.count*raw/p.capacitance,p.voltage));assert(q.question.includes('initially uncharged'));}
   if(c.kind==='energyHours')assert(close(raw/p.power/3600,p.hours));
   if(c.kind==='acFrequency')assert(close(2*p.pi*raw,p.omega));
   if(c.kind==='wheelEffort')assert(close((p.load/raw)/(p.wheel/p.axle),p.efficiency));
   if(c.kind==='strain')assert(close(raw*p.length,p.extension));
   if(c.kind==='totalPressure')assert(close((raw-p.surface)/(p.density*p.g),p.depth));
   if(c.kind==='volumeExpansion'){assert(close(raw-p.volume,3*p.alpha*p.volume*p.delta));assert.equal(Number((p.volume*(1+p.alpha*p.delta)**3).toFixed(2)),15.09);}
   if(c.kind==='meltWaterGrams')assert(close(raw/1000*p.c*p.temperature,p.ice*p.latent));
   if(c.kind==='soundTemperature')assert(close(raw**2/p.t2,p.speed**2/p.t1));
   if(c.kind==='coulomb')assert(close(raw*p.distance**2,p.k*p.q1*p.q2));
   if(c.kind==='networkResistance'){const I=3,leadV=I*p.lead.reduce((a,b)=>a+b),parallelV=I*(raw-p.lead.reduce((a,b)=>a+b));assert(close(parallelV/p.direct+parallelV/p.path.reduce((a,b)=>a+b),I));assert(close(leadV+parallelV,I*raw));assert(q.question.includes('one 3 Ω resistor, and three 2 Ω resistors in series'));assert(q.question.includes('Terminal P connects through 1 Ω'));assert(q.question.includes('terminal Q through 1 Ω'));assert(r.diagram_evidence.visual_observation.includes('No switch, cell'));}
   if(c.kind==='electricalWork')assert(close(raw/p.charge,p.voltage));
   if(c.kind==='jouleHeating')assert(close(raw/p.time/p.resistance,p.current**2));
   if(c.kind==='resonance'){const w=2*Math.PI*raw;assert(close(w*p.L,1/(w*p.C)));assert(close(Math.hypot(p.resistance,w*p.L-1/(w*p.C)),p.resistance));assert(q.question.includes('series circuit containing a 15 Ω resistor, 5 μF capacitor and 8 mH ideal inductor'));assert(q.question.includes('sinusoidal source'));assert.equal(q.options.D,'2500/π Hz');assert(r.diagram_evidence.visual_observation.includes('No switch or branch'));}
   if(c.kind==='depositMass')assert(close(raw/p.z,p.charge));
   if(c.kind==='massEnergy')assert(close(raw/p.c**2,p.mass));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001','physics-1993-001','physics-1994-001','physics-1995-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,115);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,119);assert.equal(calculations,23);assert.equal(conceptual,13);assert.equal(diagrams,4);assert.equal(yearFixes,2);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,diagramEquivalents:diagrams,yearFixes,cumulativeHeld:119,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
