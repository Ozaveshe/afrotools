const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1989-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1e-12,Math.abs(a),Math.abs(b));
const formulas={meltMinutes:p=>p.mass*p.latent/(p.voltage*p.current*60),soundFrequency:p=>p.speed/(2*p.halfWavelength),glassWavelength:p=>p.coefficient/p.index,convexSeparation:p=>p.radius/2*(1/p.magnification-1)*(1+p.magnification),resistivity:p=>p.resistance*p.area/p.length,divider:p=>p.voltage*p.target/p.resistors.reduce((a,b)=>a+b,0),shuntTotal:p=>1000*p.meterCurrent*(1+p.meterResistance/p.shunt),electrolysisCurrent:p=>p.mass/(p.equivalent*p.seconds),barometerHeight:p=>p.pressure/(p.density*p.g),resistanceTemperature:p=>100*(p.reading-p.low)/(p.high-p.low),copperIce:p=>1000*p.mass*p.c*p.delta/p.latent};
assert.deepEqual(batch.counts,{examined:40,candidates:23,held:17});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([34,35,36,37,38,39].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='powerForce'){
   const power=[1,2,-3],speed=[0,1,-1],force=[1,1,-2];
   const dimensions={A:power.map((x,i)=>x-speed[i]),B:speed,C:power.map((x,i)=>x+speed[i]),D:power.map((x,i)=>x-2*speed[i])};
   assert.deepEqual(Object.entries(dimensions).filter(([,d])=>JSON.stringify(d)===JSON.stringify(force)).map(([k])=>k),['A']);assert.equal(q.answer,c.expectedAnswer);
   for(const [P,v]of [[100,5],[4200,30],[7.5,1.5]])assert(close((P/v)*v,P));
  }else{
   assert(formulas[c.kind]);const raw=formulas[c.kind](p);const value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);
   assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
   if(c.kind==='meltMinutes')assert(close(raw*60*p.voltage*p.current,p.mass*p.latent));
   if(c.kind==='soundFrequency')assert(close(raw*2*p.halfWavelength,p.speed));
   if(c.kind==='glassWavelength')assert(close(raw*p.index,p.coefficient));
   if(c.kind==='convexSeparation'){const u=p.radius/2*(1/p.magnification-1),v=-p.magnification*u;assert(close(u-v,raw));assert(close(1/u+1/v,-2/p.radius));assert(u>0&&v<0);}
   if(c.kind==='resistivity')assert(close(raw*p.length/p.area,p.resistance));
   if(c.kind==='divider'){const total=p.resistors.reduce((a,b)=>a+b,0),current=p.voltage/total;assert(close(raw/p.target,current));assert(close(p.resistors.reduce((s,r)=>s+current*r,0),p.voltage));}
   if(c.kind==='shuntTotal')assert(close((raw/1000-p.meterCurrent)*p.shunt,p.meterCurrent*p.meterResistance));
   if(c.kind==='electrolysisCurrent')assert(close(raw*p.equivalent*p.seconds,p.mass));
   if(c.kind==='barometerHeight')assert(close(raw*p.density*p.g,p.pressure));
   if(c.kind==='resistanceTemperature')assert(close(p.low+(p.high-p.low)*raw/100,p.reading));
   if(c.kind==='copperIce')assert(close(raw/1000*p.latent,p.mass*p.c*p.delta));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001','physics-1988-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,60);assert.equal(new Set([...prior,...batch.records.filter(r=>r.status==='held').map(r=>r.id)]).size,77);
assert.equal(batch.records.filter(r=>r.candidate&&r.candidate.year!==r.original_record.year).length,0);
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:prior.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
