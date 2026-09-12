'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {questionFingerprint:fp}=require('../../../../scripts/lib/jamb-content-trust');
const sourceSha='dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264';
function verify(batch,pool,integrated=false){
 assert.equal(batch.records.length,1);const r=batch.records[0],q=r.candidate;
 assert.equal(r.id,'mathematics-1984-24-693441758bb1');
 assert.equal(r.original_content_sha256,'d1bf0b2d9c50cafdeb316c73d113e5a536c39d1353c872c9dfd367f3ad9da063');
 assert.equal(fp(r.original_record),r.original_content_sha256);
 assert.equal(fp(q),r.content_sha256);
 assert.equal(batch.source.content_sha256,sourceSha);assert.equal(r.source_pdf_sha256,sourceSha);
 assert.deepEqual([q.subject,q.year,q.num,r.source_year,r.source_pdf_page,r.source_question_number],['mathematics',1984,24,1984,6,24]);
 assert.equal(q.question,'Find a factor which is common to all three binomial expressions 4a² − 9b², a³ + 27b³ and (4a + 6b)².');
 assert.deepEqual(q.options,{A:'4a + 6b',B:'4a − 6b',C:'2a + 3b',D:'2a − 3b',E:'none'});
 // Substitution into a homogeneous polynomial tests divisibility by alpha*a+beta*b.
 // Multiplying by alpha^degree gives exact integer remainder numerators.
 const coefficients={A:[4,6],B:[4,-6],C:[2,3],D:[2,-3]},remainders={};
 for(const [letter,[alpha,beta]] of Object.entries(coefficients))remainders[letter]=[4*beta**2-9*alpha**2,(-beta)**3+27*alpha**3,(-4*beta+6*alpha)**2];
 assert.deepEqual(r.calculation.linear_coefficients,coefficients);
 assert.deepEqual(r.calculation.expected_remainder_numerators,remainders);
 const common=Object.keys(remainders).filter(k=>remainders[k].every(n=>n===0));
 assert.deepEqual(common,[]);assert.equal(q.answer,common[0]||'E','polynomial divisibility answer');
 assert.equal(r.content_sha256,'d5370981c72c54c36f365d33bdbdb57d80bf60117e711be1d4da1e7443f051c9');
 const current=pool.find(x=>x.id===r.id);assert.ok(current);
 assert.ok((integrated?[r.original_content_sha256,r.content_sha256]:[r.original_content_sha256]).includes(fp(current)),'current record changed');
 const pdf='C:/Users/Oza/Documents/afrotools/.jamb/MATHEMATICS-JAMB-Past-Questions.pdf';
 if(fs.existsSync(pdf))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),sourceSha);else assert.ok(integrated,'source PDF required before intake');
 return {passed:true,examined:1,candidates:1,remainders,scope:'Printed source and exact polynomial-divisibility evidence; no official-key claim.'};
}
module.exports={verify};
if(require.main===module)console.log(JSON.stringify(verify(require('./math-recovery-001.json'),require('../../source-pool.json').questions,process.argv.includes('--integrated'))));
