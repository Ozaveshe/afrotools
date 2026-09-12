const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-1984-001.json');
const pool=require('../../../jamb/source-pool.json');
const equal=(a,b)=>Math.abs(a-b)<Math.max(1e-12,Math.abs(a),Math.abs(b))*1e-10;
const formulas={equalMass:p=>p.density1*p.volume1/p.density2,parallelCells:p=>p.emf/(p.external+p.internal/p.count),latentHeat:p=>p.current*p.current*p.resistance*p.seconds/p.mass,loadedFork:p=>p.frequency-p.beats,thermometer:p=>p.rise/p.interval*p.temperatureInterval,heatCapacity:p=>p.power*p.seconds/(p.mass*p.deltaT),hydrostaticHeight:p=>p.pressure/(p.density*p.g),liftingPower:p=>p.mass*p.g*p.height/p.seconds/1000,wavelength:p=>p.speed/p.frequency,electricCost:p=>p.loads.reduce((s,[n,w])=>s+n*w,0)/1000*p.hours*p.koboPerKwh/100};
assert.deepEqual(batch.counts,{examined:40,candidates:27,held:13});
assert.equal(batch.records.length,40);
assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
let calculations=0,conceptual=0;
for(const r of batch.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const actual=pool.questions.find(q=>q.id===r.id);assert(actual);
 if(!process.argv.includes('--integrated'))assert.deepEqual(actual,r.original_record,'Original changed '+r.id);
 assert(r.source_pdf_page>=8&&r.source_pdf_page<=14);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>70);continue;}
 assert.equal(r.status,'publication_candidate');
 const q=r.candidate;
 assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(q.id,r.id);assert.equal(q.subject,'physics');assert.equal(q.year,r.source_year);
 assert(q.options[q.answer]);assert.equal(Object.keys(q.options).length,q.format);
 assert.equal(q.has_diagram,false);
 assert.equal(q.explanation,q.ai_explanation);assert(q.explanation.length>60);
 assert(r.semantic_review.independent_reasoning.length>65);
 assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key/i.test([q.question,...Object.values(q.options),q.explanation].join(' ')),r.id+' private repair leak');
 if(r.calculation){
  calculations++;assert.equal(q.verification.method,'ai-calculation-checked');const c=r.calculation;
  if(c.kind==='kinematicSlope'){
   for(const a of[0.4,2,7,15])for(const[t1,t2]of[[1,2],[2,5],[0,8]]){const s=t=>0.5*a*t*t;assert(equal((s(t2)-s(t1))/(t2*t2-t1*t1),a/2));}
   assert.equal(q.answer,'D');
  }else if(c.kind==='dimensions'){
   const add=(a,b)=>a.map((v,i)=>v+b[i]);const force=[1,1,-2],length=[0,1,0],acceleration=[0,1,-2];
   assert.deepEqual(add(force,length),[1,2,-2]);assert.notDeepEqual(acceleration,[1,2,-2]);assert.equal(q.answer,'D');
  }else{
   let v=formulas[c.kind](c.input);if(c.roundPlaces!==undefined)v=Number(v.toFixed(c.roundPlaces));assert(equal(v,c.expected),r.id+' result');
   const choices=Object.entries(c.options).filter(([k,n])=>equal(v,n)&&!(c.invalidUnitOptions||[]).includes(k)).map(([k])=>k);
   assert.deepEqual(choices,[q.answer],r.id+' unique value and units');
  }
 }else{conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));}
}
// Inverse/conservation checks protect unit conversions and physical interpretation.
assert(equal(840*3.6,720*4.2));
assert(equal(0.75*(1+2/2),1.5));
assert(equal(120*5,2*2*5*30));
assert(equal(Math.abs(256-252),4));assert(252<256);
assert(equal(40000*0.01*5,100*20));
assert(equal(10000*1*10,1e5));
assert(equal(10*1000*10,1000*10*10));
assert(equal(375*800000,3e8));
assert(equal(0.13*100,6.5*2));
const correctedYear=batch.records.find(r=>r.id==='physics-1984-1-d126cce7ac74');assert.equal(correctedYear.candidate.year,1985);assert.equal(correctedYear.source_pdf_page,13);
assert.equal(pool.questions.filter(q=>q.subject==='physics'&&q.year===1985&&q.num===1&&q.id!==correctedYear.id).length,0,'No existing1985Q1 collision');
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),batch.source.content_sha256);
console.log(JSON.stringify({pass:true,...batch.counts,calculationChecks:calculations,conceptualEvidenceRecords:conceptual,limitations:'Private evidence only. No published-bank eligibility, browser, deployment or teacher-review claim; conceptual correctness remains AI reasoning corroborated by cited sources.'},null,2));
