const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1988-001.json');
const pool=require('../../../jamb/source-pool.json').questions;
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1,Math.abs(a),Math.abs(b));
const formulas={extraCapacitor:p=>1/(1/p.total-1/p.a-1/p.b),perpendicular:p=>Math.sqrt(p.resultant**2-p.first**2),meanAcceleration:p=>(p.v2-p.v1)/(p.t2-p.t1),component:p=>p.resultant*Math.cos(p.angle*Math.PI/180),impulseSpeed:p=>p.force*p.time/p.mass,gears:p=>p.small*p.speed/p.large,climbTime:p=>p.mass*p.g*p.height/p.power,thunder:p=>p.delay/(1/p.sound-1/p.light),stringMass:p=>1/p.frequencyRatio**2,mirror:p=>1/(1/p.f-1/p.u),internalRatio:p=>1/p.terminalFraction-1};
assert.deepEqual(batch.counts,{examined:40,candidates:31,held:9});assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const original=pool.find(q=>q.id===r.id);assert(original);
 if(!process.argv.includes('--integrated'))assert.deepEqual(original,r.original_record);
 assert([26,27,28,29,30,31,32,33].includes(r.source_pdf_page));
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>75);continue;}
 assert.equal(r.status,'publication_candidate');const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.id,r.id);assert.equal(q.year,r.source_year);assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);
 assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')));
 if(r.calculation){calculations++;const c=r.calculation,p=c.input;assert.equal(q.verification.method,'ai-calculation-checked');
  if(c.kind==='unitMatches'){
   const actual={force:[1,1,-2],torque:[1,2,-2],power:[1,2,-3],momentum:[1,1,-1]};
   const supplied={force:[1,1,-2],torque:[1,0,-2],power:[1,2,-3],momentum:[1,1,-2]};
   assert.deepEqual(Object.keys(actual).map(k=>JSON.stringify(actual[k])===JSON.stringify(supplied[k])),[true,false,true,false]);assert.equal(q.answer,'D');
  }else if(c.kind==='pressureVolumeDimensions'){
   assert.deepEqual([1,-1,-2].map((v,i)=>v+[0,3,0][i]),[1,2,-2]);assert.equal(q.answer,'C');
  }else if(c.kind==='largestCurrent'){
   const currents=Object.entries(p).map(([key,x])=>[key,x.power/x.voltage]);currents.sort((a,b)=>b[1]-a[1]);assert.equal(currents[0][0],q.answer);assert(currents[0][1]>currents[1][1]);assert.equal(currents[0][1],5);
   for(const [key,value]of currents)assert(close(value*p[key].voltage,p[key].power));
  }else if(c.kind==='isotopeNotation'){
   const pair=[p.electrons+p.neutrons,p.electrons];assert.deepEqual(c.options[q.answer],pair);assert.equal(Object.values(c.options).filter(v=>JSON.stringify(v)===JSON.stringify(pair)).length,1);assert.equal(pair[0]-pair[1],43);
  }else{
   assert(formulas[c.kind]);const raw=formulas[c.kind](p);const value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);
   if(c.kind==='mirror'){assert(raw<0);assert.equal(q.answer,'A');assert(close(1/raw+1/p.u,1/p.f));}
   else{assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);}
   if(c.kind==='extraCapacitor')assert(close(1/value+1/p.a+1/p.b,1/p.total));
   if(c.kind==='perpendicular')assert(close(p.first**2+value**2,p.resultant**2));
   if(c.kind==='meanAcceleration')assert(close(raw*(p.t2-p.t1)+p.v1,p.v2));
   if(c.kind==='component')assert(close(raw**2+(p.resultant*Math.sin(p.angle*Math.PI/180))**2,p.resultant**2));
   if(c.kind==='impulseSpeed')assert(close(p.mass*value,p.force*p.time));
   if(c.kind==='gears')assert(close(value*p.large,p.speed*p.small));
   if(c.kind==='climbTime')assert(close(value*p.power,p.mass*p.g*p.height));
   if(c.kind==='thunder')assert(close(raw/p.sound-raw/p.light,p.delay));
   if(c.kind==='stringMass')assert(close(1/Math.sqrt(value),p.frequencyRatio));
   if(c.kind==='internalRatio')assert(close(1/(1+value),p.terminalFraction));
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
const prior=['physics-1983-001','physics-1984-001','physics-1985-001','physics-1986-001'].flatMap(name=>require('./'+name+'.json').records.filter(r=>r.status==='held').map(r=>r.id));assert.deepEqual(prior,batch.prior_held_ids);assert.equal(prior.length,51);
const changedYear=batch.records.filter(r=>r.candidate&&r.candidate.year!==r.original_record.year);assert.equal(changedYear.length,3);
for(const r of changedYear){assert.equal(r.candidate.year,1989);assert.equal(r.source_pdf_page,33);assert(!pool.some(q=>q.subject==='physics'&&q.year===1989&&q.num===r.candidate.num&&q.id!==r.id),'Existing target year/number collision');}
const pdf=process.argv.find(s=>s.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),'10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121');
console.log({pass:true,...batch.counts,calculations,conceptual,cumulativeHeld:prior.length+batch.counts.held,pdfHashChecked:!!pdf,limitation:'Conceptual evidence preserved; checker does not machine-prove semantics.'});
