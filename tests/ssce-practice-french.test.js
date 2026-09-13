const {test}=require('node:test'),assert=require('node:assert/strict');
const en=require('../assets/js/lib/ssce-practice-bank'),fr=require('../assets/js/lib/ssce-practice-bank-fr'),api=require('../assets/js/lib/ssce-practice');
test('French adaptation preserves every reviewed answer and complete English learning text',()=>{
 assert.equal(fr.questions.length,40);assert.equal(fr.id,en.id);assert.equal(fr.locale,'fr');
 for(const q of fr.questions){
  const original=en.questions.find(item=>item.id===q.id);assert.equal(q.answer,original.answer);assert.equal(q.examYear,null);assert.equal(q.subject,original.subject);assert.equal(q.topic,original.topic);
  assert.notDeepEqual(q.steps,original.steps);assert.notEqual(q.pitfall,original.pitfall);assert.ok(q.steps.length>=2);
  if(q.subject==='English'){assert.equal(q.questionLanguage,'en');assert.equal(q.prompt,original.prompt);assert.deepEqual(q.options,original.options);}
  else{assert.equal(q.questionLanguage,'fr');assert.notEqual(q.prompt,original.prompt);
   const normalizeEnglish=s=>s.replace(/,/g,'').replace(/\bor\b/g,'ou').replace(/₦|\s/g,'');
   const normalizeFrench=s=>s.replace(/₦|\s/g,'').replace(/,/g,'.');
   assert.deepEqual(q.options.map(normalizeFrench),original.options.map(normalizeEnglish),q.id);
  }
 }
 assert.deepEqual(fr.passages,en.passages);
});
test('an English backup resumes in French and produces a French teaching report without changing its score',()=>{
 let state=api.start(en,'Mathematics','Number and proportion');state=api.answer(state,2,en);
 const translated=api.normalize(JSON.parse(JSON.stringify(state)),fr);assert.deepEqual(api.result(translated,fr),api.result(state,en));
 const report=api.report(translated,fr);assert.ok(report.includes('Une école achète 240 cahiers'));assert.ok(report.includes('Votre réponse : 150'));assert.ok(report.includes('Cahiers restants : 240 − 90 = 150.'));
 assert.equal(en.questions[0].questionLanguage,undefined,'loading French must not mutate the English source');
});
