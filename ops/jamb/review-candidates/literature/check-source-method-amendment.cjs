const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto'),{questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust'),m=require('./source-method-amendment.json');
a.equal(m.count,69);a.equal(m.changes.length,69);a.equal(new Set(m.changes.map(c=>c.id)).size,69);
const beforeBytes=fs.readFileSync(path.join(__dirname,m.before_snapshot.file));a.equal(crypto.createHash('sha256').update(beforeBytes).digest('hex'),m.before_snapshot.sha256);const snapshot=JSON.parse(beforeBytes);a.equal(snapshot.base_commit,m.base_commit);
let checked=0;for(const file of [...new Set(m.changes.map(c=>c.file))]){
 const old=snapshot.batches[file],now=JSON.parse(fs.readFileSync(path.join(__dirname,file)));
 a.deepEqual(old.records.map(r=>r.id),now.records.map(r=>r.id));
 for(let i=0;i<old.records.length;i++){const before=old.records[i],after=now.records[i];if(!before.candidate){a.deepEqual(after,before);continue;}
 const c=m.changes.find(c=>c.id===before.id);a(c);a.equal(before.content_sha256,c.old_content_sha256);a.equal(questionFingerprint(before.candidate),c.old_content_sha256);a.equal(after.content_sha256,c.new_content_sha256);a.equal(questionFingerprint(after.candidate),c.new_content_sha256);
 a.equal(before.candidate.verification.method,'ai-calculation-checked');a.equal(after.candidate.verification.method,'ai-source-checked');
 const restored=structuredClone(after);restored.candidate.verification.method='ai-calculation-checked';restored.semantic_review.method='ai-calculation-checked';restored.content_sha256=c.old_content_sha256;a.deepEqual(restored,before,'Unexpected content change '+c.id);
 const altered=structuredClone(after.candidate);altered.explanation+=' changed';a.notEqual(questionFingerprint(altered),c.new_content_sha256);checked++;
 }
}
console.log(JSON.stringify({pass:true,method_only_candidates:checked,question_answer_passage_explanation_changes:0,base_commit:m.base_commit}));
