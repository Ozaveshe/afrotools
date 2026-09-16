const {test}=require('node:test'),assert=require('node:assert/strict');
const en=require('../assets/js/lib/ssce-practice-bank'),fr=require('../assets/js/lib/ssce-practice-bank-fr'),api=require('../assets/js/lib/ssce-practice');
test('French adaptation preserves every reviewed answer and complete English learning text',()=>{
 assert.equal(fr.questions.length,52);assert.deepEqual(fr.questions.map(q=>q.id).sort(),en.questions.map(q=>q.id).sort());assert.equal(fr.questions.filter(q=>q.subject==='Physics').length,12);assert.equal(fr.id,en.id);assert.equal(fr.locale,'fr');
 for(const q of fr.questions){
  const original=en.questions.find(item=>item.id===q.id);assert.equal(q.answer,original.answer);assert.equal(q.examYear,null);assert.equal(q.subject,original.subject);assert.equal(q.topic,original.topic);
  assert.notDeepEqual(q.steps,original.steps);assert.notEqual(q.pitfall,original.pitfall);assert.ok(q.steps.length>=2);
  if(q.subject==='English'||q.subject==='Physics'){assert.equal(q.questionLanguage,'en');assert.equal(q.prompt,original.prompt);assert.deepEqual(q.options,original.options);}
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


test('all current French written tasks retain source identities and reviewed guidance',()=>{
 const source=require('../assets/js/lib/ssce-written-bank'),localized=require('../assets/js/lib/ssce-written-bank-fr'),written=require('../assets/js/lib/ssce-written');
 assert.equal(localized.items.length,42);assert.deepEqual(localized.items.map(q=>q.id),source.items.map(q=>q.id));
 for(const q of localized.items){const original=source.items.find(x=>x.id===q.id);for(const key of ['id','subject','year','paper','number','subpart','source'])assert.deepEqual(q[key],original[key],q.id+'/'+key);assert.equal(q.checks.length,original.checks.length);assert.notDeepEqual(q.steps,original.steps);assert.notDeepEqual(q.checks,original.checks);if(q.subject==='English'||q.year===2022){assert.equal(q.questionLanguage,'en');assert.equal(q.prompt,original.prompt);}else{assert.equal(q.questionLanguage,'fr');assert.notEqual(q.prompt,original.prompt);}}
 const saved={version:1,bankId:source.id,entries:Object.fromEntries(source.items.map(q=>[q.id,{answer:'Synthetic reviewed response',checks:q.checks.map(()=>true)}]))};assert.deepEqual(written.normalize(saved,localized),written.normalize(saved,source));
});

test('Physics backup and report preserve the assessment and French teaching',()=>{
 let state=api.start(en,'Physics','Electric circuits');const question=en.questions.find(q=>q.id===state.ids[0]);state=api.answer(state,question.answer,en);const localized=api.normalize(JSON.parse(JSON.stringify(state)),fr);assert.deepEqual(api.result(localized,fr),api.result(state,en));const report=api.report(localized,fr);assert.ok(report.includes(question.prompt));assert.ok(report.includes(fr.questions.find(q=>q.id===question.id).steps[0]));assert.ok(report.includes('résistance'));
});
