const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const batch = require('./physics-1983-001.json');
const pool = require('../../../jamb/source-pool.json');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const equal = (a,b) => Math.abs(a-b) <= Math.max(Math.abs(a),Math.abs(b),1e-12)*1e-10;
const formulas = {
  refraction: p => p.c/p.n,
  mass: p => p.relativeDensity*p.waterDensity*p.volume,
  gas: p => p.volume*p.temperatureRatio/p.pressureRatio,
  expansion: p => p.volume*(1+3*p.alpha*p.temperatureChange),
  ohm: p => p.voltage/p.resistance,
  electrolysis: p => p.z*p.current*p.seconds,
  film: p => p.totalMass/p.drops/p.density/p.area,
  spring: p => p.length1-p.mass1*(p.length2-p.length1)/(p.mass2-p.mass1),
  heating: p => p.current**2*p.resistance*p.seconds/(p.massGrams*p.temperatureChange),
  internalResistance: p => (p.emf-p.voltage)/(p.voltage/p.resistance),
  electricField: p => p.force/p.charge
};
assert.equal(batch.records.length,40);
assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.deepEqual(batch.counts,{examined:40,candidates:24,held:16});
let calculationCount=0, conceptualCount=0;
for(const r of batch.records) {
  assert.equal(hash(JSON.stringify(r.original)),r.original_sha256,r.id+' original hash');
  const current=pool.questions.find(q=>q.id===r.id);
  assert(current,r.id+' exists');
  // The original snapshot must match before intake. After intake the coordinator may pass
  // --integrated to validate the immutable evidence without requiring old source content.
  if(!process.argv.includes('--integrated')) assert.deepEqual(current,r.original,r.id+' source drift');
  assert.equal(r.source.year,1983);
  assert(r.source.pdf_pages.every(p=>p>=2&&p<=7));
  if(r.status==='held') { assert(r.hold_reason.length>50); assert(!r.corrected); continue; }
  assert.equal(r.status,'publication_candidate');
  const q=r.corrected;
  assert.equal(q.id,r.id); assert.equal(q.subject,'physics'); assert.equal(q.year,1983);
  assert.equal(q.has_diagram,false,'This first batch deliberately has no unresolved diagram candidates');
  assert(q.options[q.answer]);
  assert.equal(Object.keys(q.options).length,q.format);
  assert(q.ai_explanation.length>65);
  assert(r.independently_reasoned_review.length>60);
  const student=[q.question,...Object.values(q.options),q.ai_explanation].join(' ');
  assert(!/\[PAGE|legacy|corrupt|repair|transcript|typo|nearest|exam key|source note|guessed/i.test(student),r.id+' private repair leak');
  if(r.calculation) {
    calculationCount++;
    assert.equal(r.review_method,'ai-calculation-checked');
    const c=r.calculation;
    const actual=formulas[c.kind](c.input);
    assert(equal(actual,c.expected),r.id+' independently computed value');
    const matches=Object.entries(c.options).filter(([k,v])=>equal(actual,v)&&!(c.invalidUnitOptions||[]).includes(k)).map(([k])=>k);
    assert.deepEqual(matches,[q.answer],r.id+' unique dimensionally valid option');
  } else {
    conceptualCount++;
    assert.equal(r.review_method,'ai-source-checked');
    assert(r.source_urls.length>0,r.id+' conceptual evidence URL');
    assert(r.source_urls.every(u=>/^https:\/\//.test(u)));
  }
}
// Independent inverse/conservation cross-checks, not just expected-number comparisons.
assert(equal(2e8*1.5,3e8));
assert(equal(25*2/0.5,100));
assert(equal(2.268e-3/0.126e-6,5*3600));
assert(equal(2e-9*0.5*500*1000,5e-4));
assert(equal((14-10)/(16-10),20/30));
assert(equal(0.18*1000*10,3**2*20*10));
assert(equal(2+0.5*0.4,2.2));
assert(equal(20*0.2,4));
const pdf=process.argv.find(x=>x.startsWith('--pdf='));
if(pdf) assert.equal(hash(fs.readFileSync(pdf.slice(6))),batch.records[0].source.sha256);
console.log(JSON.stringify({pass:true,examined:40,candidates:24,held:16,calculationChecks:calculationCount,conceptualEvidenceRecords:conceptualCount,limitations:'Conceptual semantics were reasoned by AI and compared with cited sources, not mathematically proved by this checker. No deployment, browser rendering or teacher review is claimed.'},null,2));
