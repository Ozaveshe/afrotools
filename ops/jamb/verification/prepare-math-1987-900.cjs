'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json')));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
const destination=path.join(__dirname,'math-1987-publishable-900.json');
if(fs.existsSync(destination))throw Error('Batch already prepared.');
const edits=[
{id:'mathematics-1987-27-e00476e5ae5b',page:17,question:'Simplify (x² − y²)/(2x² + xy − y²), where the original denominator is nonzero.',options:{A:'(x + y)/(2x + y)',B:'(x + y)/(2x − y)',C:'(x − y)/(2x − y)',D:'(x − y)/(2x + y)'},answer:'C',explanation:'Factor the numerator as (x − y)(x + y). The denominator is (2x − y)(x + y), since expanding gives 2x² + xy − y². Cancel x + y to obtain (x − y)/(2x − y). The original restrictions remain: x + y ≠ 0 and 2x − y ≠ 0.',reason:'PDF page 17 visually inspected. Reconstructed all four printed stacked fractions, preserving numerator and denominator pairings. Added the original nonzero-denominator domain explicitly.'},
{id:'mathematics-1987-46-77f7e9e79042',page:18,question:'Daylight lasts from 5:30 a.m. to 7:00 p.m. Express the daylight and darkness durations as angles of Earth’s rotation, in that order, using 360° for 24 hours.',options:{A:'187°30′, 172°30′',B:'135°, 225°',C:'202°30′, 157°30′',D:'195°, 165°'},answer:'C',explanation:'Daylight lasts 13 hours 30 minutes, or 13.5 hours. Darkness lasts 24 − 13.5 = 10.5 hours. Earth rotates through 360°/24 = 15° per hour. The daylight angle is 13.5 × 15 = 202.5° = 202°30′, and the darkness angle is 10.5 × 15 = 157.5° = 157°30′. The two angles add to 360°.',reason:'PDF page 18 visually inspected. Restored printed angle-option punctuation. Made the angular-unit convention explicit in the adapted prompt; actual durations and conversion are both taught. Stored key A is incorrect; independent time arithmetic selects C.'}
];
const records=edits.map(edit=>{
 const q=pool.questions.find(q=>q.id===edit.id);if(!q)throw Error(edit.id);
 const before=JSON.parse(JSON.stringify(q));
 q.question=edit.question;if(edit.options)q.options=edit.options;
 q.answer=edit.answer;q.format=4;q.has_diagram=false;q.ai_explanation=edit.explanation;
 q.verification={method:'ai-calculation-checked',reviewed_at:'2026-09-15'};
 const evidence='ops/jamb/verification/math-1987-publishable-900.json#'+q.id;
 const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-15',evidence};
 const hash=questionFingerprint(q);
 ledger.questions[q.id]={content_sha256:hash,source_id:'owner-supplied-math-1983-2004',question_review:{...review},answer_review:{...review,evidence:evidence+'; ops/jamb/verification/check-math-1987-900.cjs'},explanation_review:{...review}};
 return {id:q.id,num:q.num,source_pdf_page:edit.page,before,after:q,content_sha256:hash,publication_candidate:true,reasoning:edit.reason};
});
const batch={schema_version:1,reviewed_at:'2026-09-15',source_file:'MATHEMATICS-JAMB-Past-Questions.pdf',source_pdf_sha256:'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264',reviewer:'Codex (AI)',records};
fs.writeFileSync(path.join(root,'ops/jamb/source-pool.json'),JSON.stringify(pool)+'\n');
fs.writeFileSync(path.join(root,'data/jamb/review-ledger.json'),JSON.stringify(ledger,null,2)+'\n');
fs.writeFileSync(destination,JSON.stringify(batch,null,2)+'\n');
