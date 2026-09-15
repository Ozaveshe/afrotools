'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json')));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
const destination=path.join(__dirname,'math-1983-publishable-901.json');
if(fs.existsSync(destination))throw Error('Batch already prepared.');
const edits=[
 {id:'mathematics-1983-7-84c43f60c219',page:2,question:'Triangles PQR and PRS share side PR. In triangle PQR, angle QPR = 90°, angle PQR = 60° and QR = 8 cm. In triangle PRS, angle PRS = 90° and angle RPS = 45°. Find PS.',answer:'B',explanation:'In right triangle PQR, QR is the hypotenuse. PR = 8 sin 60° = 4√3 cm. In right triangle PRS, PS is the hypotenuse, so cos 45° = PR/PS. Therefore PS = 4√3 ÷ (√2/2) = 4√6 cm.',reason:'Original PDF page 2 visually inspected: all angles and the shared side are retained in an equivalent self-contained verbal prompt. Corrected the stored explanation, which placed the right angle at the wrong vertex.'},
 {id:'mathematics-1983-45-afc8f0364ea2',page:4,question:'PR is the diameter of a semicircle of radius 3.5 cm. A triangle PRT lies on the opposite side of PR from the semicircle, with angle RPT = angle PRT = 60°. Find the outer perimeter formed by PT, TR and the semicircular arc from R to P. Use π = 22/7.',options:{A:'25 cm',B:'18 cm',C:'36 cm',D:'29 cm',E:'25.5 cm'},answer:'A',explanation:'PR = 2 × 3.5 = 7 cm. Both base angles of triangle PRT are 60°, so its third angle is also 60° and PT = TR = 7 cm. The semicircular arc has length πr = (22/7) × 3.5 = 11 cm. The outer perimeter is 7 + 7 + 11 = 25 cm. PR is inside the combined figure and is not part of its outer perimeter.',reason:'Original PDF page 4 diagram and options visually inspected. Restored five separate options from merged extraction; normalized units and decimal in E. Verbal prompt retains diameter, radius, opposite-side triangle, base angles and requested outer boundary. Independently corrected stored key D to A.'}
];
const records=edits.map(edit=>{
 const q=pool.questions.find(q=>q.id===edit.id);if(!q)throw Error(edit.id);
 const before=JSON.parse(JSON.stringify(q));
 q.question=edit.question;if(edit.options)q.options=edit.options;
 q.answer=edit.answer;q.format=5;q.has_diagram=false;q.ai_explanation=edit.explanation;
 q.verification={method:'ai-calculation-checked',reviewed_at:'2026-09-15'};
 const evidence='ops/jamb/verification/math-1983-publishable-901.json#'+q.id;
 const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-15',evidence};
 const hash=questionFingerprint(q);
 ledger.questions[q.id]={content_sha256:hash,source_id:'owner-supplied-math-1983-2004',question_review:{...review},answer_review:{...review,evidence:evidence+'; ops/jamb/verification/check-math-1983-901.cjs'},explanation_review:{...review}};
 return {id:q.id,num:q.num,source_pdf_page:edit.page,before,after:q,content_sha256:hash,publication_candidate:true,reasoning:edit.reason};
});
const batch={schema_version:1,reviewed_at:'2026-09-15',source_file:'MATHEMATICS-JAMB-Past-Questions.pdf',source_pdf_sha256:'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264',reviewer:'Codex (AI)',records};
fs.writeFileSync(path.join(root,'ops/jamb/source-pool.json'),JSON.stringify(pool)+'\n');
fs.writeFileSync(path.join(root,'data/jamb/review-ledger.json'),JSON.stringify(ledger,null,2)+'\n');
fs.writeFileSync(destination,JSON.stringify(batch,null,2)+'\n');
