const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./physics-recovery-001.json'),inventory=require('./held-first-pass-inventory.json'),pool=require('../../../jamb/source-pool.json').questions;
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex'),pdfHash='10397b7eababca6e52d98f21e6c3c0e24f65a2ff5150021b495d87961d4b1121';
const close=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1,Math.abs(a),Math.abs(b));
const formulas={ruleWeight:p=>(p.rightForce*p.rightArm-p.leftForce*p.leftArm)/p.weightArm,capacitorNetwork:p=>1/(1/p.series+1/p.parallel.reduce((a,v)=>a+v)),parallelResistorPower:p=>p.knownPower*p.knownR/p.targetR,ruleMass:p=>p.load*(p.length-p.pivotFromRight-p.loadPosition)/(p.length/2-(p.length-p.pivotFromRight)),equilibrant:p=>Math.sqrt(p.F1**2+p.F2**2+2*p.F1*p.F2*Math.cos(p.degrees*Math.PI/180)),brewster:p=>p.n1*Math.sin(p.incidence*Math.PI/180)/Math.sin((90-p.incidence)*Math.PI/180),resistorNetwork:p=>p.V/(p.series+1/p.parallel.reduce((s,r)=>s+1/r,0))};
const required={
'1983-3':['P₃ points horizontally left','above the horizontal','below the horizontal','P₁ cos θ₁ = P₁ cos θ₂'],
'1983-5':['horizontal table','to the right','at rest'],
'1983-40':['Q above R','upwards from R to Q','south','horizontal plane'],
'1983-42':['Copper is above steel','contact is just above Q','series circuit','open gap','2.0 × 10⁻⁵','1.2 × 10⁻⁵'],
'1983-45':['horizontal','45°','downwards to the right','reflecting face','observer T'],
'1983-50':['inlet O is submerged','surface W','P is outside','open to the air'],
'1984-2':['70 cm','downward force of 0.1 N','60 cm','downward force of 0.4 N','85 cm','uniform'],
'1984-35':['4 μF capacitor connects X','intermediate node','three parallel branches','4 μF, a 3 μF and a 2 μF'],
'1985-44':['10 Ω','5 Ω','in parallel','40 W'],
'1986-9':['uniform','100 cm','55 cm from R','10 g','10 cm from Q'],
'1986-10':['5.0 N','10.0 N','60° above','equilibrium'],
'1986-27':['air','glass','60°','from the normal','perpendicular'],
'1986-39':['9.0 V','negligible internal resistance','5 Ω','in series','parallel','20 Ω']};
assert.deepEqual(batch.counts,{examined:15,candidates:13,held:2});assert.deepEqual(batch.records.map(r=>r.id),inventory.recommended_next_batch);assert.equal(new Set(batch.records.map(r=>r.id)).size,15);
let calculations=0,conceptual=0;
for(const r of batch.records){const prev=require('./'+r.recovery_of.file).records.find(p=>p.id===r.id);assert.equal(prev.status,'held');assert.equal(sha(prev),r.recovery_of.prior_record_sha256);assert.equal(prev.hold_reason,r.recovery_of.prior_hold_reason);assert.deepEqual(prev.original_record||prev.original,r.original_record);assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);assert.equal(r.source_pdf_page,inventory.entries.find(e=>e.id===r.id).source_pdf_page);
 if(r.status==='held'){assert(!r.candidate);assert(r.hold_reason.length>100);continue;}
 const q=r.candidate;assert.equal(r.status,'publication_candidate');assert.equal(q.id,r.id);assert.equal(q.subject,'physics');assert.equal(q.year,r.source_year);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.has_diagram,false);assert.equal(q.ai_explanation,q.explanation);assert(q.explanation.length>70);assert(r.semantic_review.independent_reasoning.length>70);assert.equal(Object.keys(q.options).length,q.format);assert(q.options[q.answer]);assert.equal(new Set(Object.values(q.options)).size,q.format);assert(!/\[PAGE|legacy|typo|repair|source note|nearest option|corrupt|original key|Fig\./i.test([q.question,q.explanation,...Object.values(q.options)].join(' ')));
 assert.equal(r.diagram_evidence.pdf_sha256,pdfHash);assert.equal(r.diagram_evidence.page,r.source_pdf_page);assert.equal(r.diagram_evidence.representation,'complete equivalent text');assert(r.diagram_evidence.visual_observation.length>100);const key=q.year+'-'+q.num;for(const text of required[key])assert(q.question.includes(text),key+' requires '+text);
 if(!r.calculation){conceptual++;assert.equal(q.verification.method,'ai-source-checked');assert(r.semantic_review.source_urls.length);assert(r.semantic_review.source_urls.every(u=>u.startsWith('https://')));continue;}
 calculations++;assert.equal(q.verification.method,'ai-calculation-checked');const c=r.calculation,p=c.input;
 if(c.kind==='forceComponents'){let counterexamples=0;for(const t1 of [20,35,60])for(const t2 of [25,45,70]){const a=t1*Math.PI/180,b=t2*Math.PI/180,P1=7,P2=P1*Math.sin(a)/Math.sin(b),P3=P1*Math.cos(a)+P2*Math.cos(b);assert(close(P1*Math.sin(a)-P2*Math.sin(b),0));assert(close(P1*Math.cos(a)+P2*Math.cos(b)-P3,0));if(!close(P1*Math.cos(a),P1*Math.cos(b)))counterexamples++;}assert(counterexamples>0);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'II and III only');}
 else if(c.kind==='fieldDirection'){const [a,b]=[p.current,p.radial],cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];assert(cross.every((v,i)=>close(v,c.expected[i])));assert.equal(cross[0],1);assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.E,'East');}
 else if(c.kind==='mirrorDirection'){const t=p.mirrorDegrees*Math.PI/180,v=p.objectDirection,reflected=[Math.cos(2*t)*v[0]+Math.sin(2*t)*v[1],Math.sin(2*t)*v[0]-Math.cos(2*t)*v[1]];assert(reflected.every((v,i)=>close(v,c.expected[i])));assert(close(Math.hypot(...reflected),Math.hypot(...v)));assert.equal(q.answer,c.expectedAnswer);assert.equal(q.options.D,'Vertical');}
 else{assert(formulas[c.kind]);const raw=formulas[c.kind](p),value=c.roundPlaces===undefined?raw:Number(raw.toFixed(c.roundPlaces));assert(close(value,c.expected),r.id);assert(close(c.options[q.answer],value));assert.equal(Object.values(c.options).filter(v=>close(v,value)).length,1);
 if(c.kind==='ruleWeight')assert(close(raw*p.weightArm+p.leftForce*p.leftArm,p.rightForce*p.rightArm));
 if(c.kind==='capacitorNetwork'){const Cp=p.parallel.reduce((a,v)=>a+v),Q=raw*13,Vs=Q/p.series,Vp=Q/Cp;assert(close(Vs+Vp,13));assert(close(p.parallel.reduce((s,C)=>s+C*Vp,0),Q));assert(raw<p.series);}
 if(c.kind==='parallelResistorPower')assert(close(raw*p.targetR,p.knownPower*p.knownR));
 if(c.kind==='ruleMass'){const pivot=p.length-p.pivotFromRight;assert.equal(pivot,45);assert(close(raw*(50-pivot),p.load*(pivot-p.loadPosition)));}
 if(c.kind==='equilibrant'){const rad=p.degrees*Math.PI/180,x=p.F1*Math.cos(rad)+p.F2,y=p.F1*Math.sin(rad);assert(close(Math.hypot(x,y),raw));assert(close(raw**2,175));}
 if(c.kind==='brewster'){const i=p.incidence*Math.PI/180,r=(90-p.incidence)*Math.PI/180;assert(close(p.n1*Math.sin(i),raw*Math.sin(r)));assert(close(Math.cos(i+r),0));}
 if(c.kind==='resistorNetwork'){const branchV=p.V-raw*p.series;assert(close(p.parallel.reduce((s,R)=>s+branchV/R,0),raw));assert(close(raw**2*p.series+p.parallel.reduce((s,R)=>s+branchV**2/R,0),p.V*raw));}
 }}
assert.equal(calculations,10);assert.equal(conceptual,3);
assert.deepEqual(batch.prior_held_ids,inventory.entries.map(e=>e.id));assert.deepEqual(batch.recovered_ids,batch.records.filter(r=>r.candidate).map(r=>r.id));assert.equal(batch.recovered_ids.length,13);assert.deepEqual(batch.remaining_held_ids,batch.prior_held_ids.filter(id=>!batch.recovered_ids.includes(id)));assert.equal(batch.remaining_held_ids.length,160);
// This recovery is an exact allowlist, never a blanket exemption for held records.
function validateHeldPool(currentPool,integrated){for(const item of inventory.entries){const prev=require('./'+item.prior_evidence_file).records.find(r=>r.id===item.id),original=prev.original_record||prev.original,current=currentPool.find(q=>q.id===item.id);assert(current);const recovery=batch.records.find(r=>r.id===item.id&&r.candidate),allowed=[questionFingerprint(original)];if(integrated&&recovery)allowed.push(recovery.content_sha256);assert(allowed.includes(questionFingerprint(current)),'Unapproved held content change: '+item.id);}}
validateHeldPool(pool,process.argv.includes('--integrated'));
// Prove that allowing recovered IDs does not allow another held record to drift.
const protectedId=batch.remaining_held_ids[0],mutated=pool.map(q=>q.id===protectedId?{...q,question:q.question+' Invalid unchecked alteration.'}:q);assert.throws(()=>validateHeldPool(mutated,true),/Unapproved held content change/);
const recoveredPool=pool.map(q=>batch.records.find(r=>r.id===q.id&&r.candidate)?.candidate||q);validateHeldPool(recoveredPool,true);assert.throws(()=>validateHeldPool(recoveredPool,false),/Unapproved held content change/);
const pdf=process.argv.find(a=>a.startsWith('--pdf='));if(pdf)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf.slice(6))).digest('hex'),pdfHash);
console.log(JSON.stringify({pass:true,...batch.counts,calculations,conceptual,sourceDiagrams:13,remainingHeld:160,projectedCandidates:518,protectedHeldMutationRejected:true,limitation:'Candidates only; conceptual checks do not machine-prove meaning.'}));
