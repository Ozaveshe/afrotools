const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1993-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
assert.deepEqual(batch.counts,{examined:40,candidates:32,held:8});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
const formulas={
 projectileHeight:p=>(p.speed*Math.sin(p.angle*Math.PI/180))**2/(2*p.g),
 stoppingDistance:p=>p.kmh/3.6*p.seconds/2,
 immersedTension:p=>p.mass*p.g-p.fraction*p.mass/p.objectDensity*p.liquidDensity*p.g,
 pressureFactor:p=>p.temperatureRatio/p.volumeRatio,
 mixTemperature:p=>(p.hotMass*p.hot+p.coldMass*p.cold)/(p.hotMass+p.coldMass),
 latentHeat:p=>p.heat/p.mass,antinodes:p=>p.wavelength/2,radarKm:p=>p.speed*p.time/2000,
 lensDistance:p=>1/(1/p.f-1/p.u),internalResistance:p=>(p.v1-p.v2)/(p.i2-p.i1),
 seriesParallelCurrent:p=>p.voltage/(p.series+1/(1/p.branch1.reduce((a,b)=>a+b)+1/p.branch2.reduce((a,b)=>a+b))),
 seriesCapVoltage:p=>p.voltage*p.other/(p.target+p.other),ratedVoltage:p=>Math.sqrt(p.power*p.resistance),
 inductiveReactance:p=>2*Math.PI*p.frequency*p.henries,decayedFraction:p=>1-2**(-p.halfLives),
 beamTension:p=>p.weight/(2*Math.sin(p.angle*Math.PI/180)),fallEnergy:p=>p.mass*p.g*p.height
};
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([49,50,51,52,53,54,55].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='sineRms'){
   const n=4096,mean=Array.from({length:n},(_,i)=>Math.sin(2*Math.PI*i/n)**2).reduce((a,b)=>a+b)/n;
   assert(close(mean,.5));assert(close(Math.sqrt(mean),1/Math.sqrt(2)));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'Iᵣₘₛ = I₀/√2');
  }else if(c.kind==='powerDimensions'){
   const force=[1,1,-2],others=[[0,0,1],[0,1,0],[0,1,-2],[0,1,-1]];
   const hits=others.map((d,i)=>({key:'ABCD'[i],dims:d.map((v,j)=>v+force[j])})).filter(x=>JSON.stringify(x.dims)==='[1,2,-3]');assert.deepEqual(hits.map(x=>x.key),[q.answer]);assert.equal(q.answer,c.expectedAnswer);
  }else if(c.kind==='forceAngle'){
   const theta=Math.atan2(p.across,p.along),ratio=p.across/p.along;
   assert(close(Math.tan(theta),ratio));assert(!close(Math.sin(theta),ratio));assert(!close(Math.cos(theta),ratio));assert(!close(1/Math.tan(theta),ratio));assert.equal(q.answer,c.expectedAnswer);
  }else if(c.kind==='mirrorMagnification'){
   const matches=[0,0,0,0];for(const u of [7,9,15,30]){const radius=10,v=1/(2/radius-1/u),m=v/u;[v/radius-1,2*v/radius-1,u/radius-1,2*u/radius-1].forEach((n,i)=>{if(close(m,n))matches[i]++;});assert(close(m,2*v/radius-1));}
   assert.deepEqual(matches.map((n,i)=>n===4?'ABCD'[i]:null).filter(Boolean),['B']);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.B,'2 v/r −1');
  }else if(c.kind==='nuclearNumbers'){
   const result=[p.mass-4*p.alpha,p.protons+p.beta-2*p.alpha];assert.deepEqual(c.options[q.answer],result);assert.equal(Object.values(c.options).filter(v=>JSON.stringify(v)===JSON.stringify(result)).length,1);assert.equal(q.answer,c.expectedAnswer);assert.equal(result[0]+4*p.alpha,p.mass);assert.equal(result[1]-p.beta+2*p.alpha,p.protons);
  }else{
   assert(formulas[c.kind],c.kind);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='projectileHeight')assert(close(2*p.g*raw,(p.speed*Math.sin(p.angle*Math.PI/180))**2));
   if(c.kind==='stoppingDistance')assert(close(2*raw/p.seconds,p.kmh/3.6));
   if(c.kind==='immersedTension')assert(close(raw+p.fraction*p.mass/p.objectDensity*p.liquidDensity*p.g,p.mass*p.g));
   if(c.kind==='pressureFactor')assert(close(raw*p.volumeRatio/p.temperatureRatio,1));
   if(c.kind==='mixTemperature')assert(close(p.hotMass*(p.hot-raw),p.coldMass*(raw-p.cold)));
   if(c.kind==='latentHeat')assert(close(raw*p.mass,p.heat));
   if(c.kind==='antinodes')assert(close(2*raw,p.wavelength));
   if(c.kind==='radarKm')assert(close(2*raw*1000/p.speed,p.time));
   if(c.kind==='lensDistance')assert(close(1/p.u+1/raw,1/p.f));
   if(c.kind==='internalResistance')assert(close(p.v1+p.i1*raw,p.v2+p.i2*raw));
   if(c.kind==='seriesParallelCurrent'){const vb=p.voltage-raw*p.series;assert(close(vb/p.branch1.reduce((a,b)=>a+b)+vb/p.branch2.reduce((a,b)=>a+b),raw));assert.equal(q.has_diagram,false);assert(q.question.includes('two parallel branches'));}
   if(c.kind==='seriesCapVoltage'){assert(close(p.target*raw,p.other*(p.voltage-raw)));assert.equal(q.has_diagram,false);assert(q.question.includes('initially uncharged'));assert(q.question.includes('20 μF'));}
   if(c.kind==='ratedVoltage')assert(close(raw**2/p.resistance,p.power));
   if(c.kind==='inductiveReactance')assert(close(raw/(2*Math.PI*p.henries),p.frequency));
   if(c.kind==='decayedFraction')assert(close(raw+2**(-p.halfLives),1));
   if(c.kind==='beamTension')assert(close(raw*Math.sin(p.angle*Math.PI/180)*p.length,p.weight*p.length/2));
   if(c.kind==='fallEnergy')assert(close(raw/(p.mass*p.g),p.height));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
 if(q.year!==r.original_record.year){assert((q.year===1994&&r.source_pdf_page===55)||(q.year===1992&&r.source_pdf_page===50));assert(!pool.some(p=>p.subject==='physics'&&p.year===q.year&&p.num===q.num&&p.id!==q.id));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001','physics-1989-001','physics-1990-001','physics-1991-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,95);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,103);
assert.equal(batch.records.filter(r=>r.candidate&&r.candidate.year!==r.original_record.year).length,4);assert.equal(batch.records.filter(r=>r.source_year!==r.original_record.year).length,6);assert.equal(calculations,22);assert.equal(conceptual,10);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:prior.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
