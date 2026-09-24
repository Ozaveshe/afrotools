'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enQuick = require('../assets/js/lib/ssce-practice-bank');
const enWritten = require('../assets/js/lib/ssce-written-bank');
const quickApi = require('../assets/js/lib/ssce-practice');
const writtenApi = require('../assets/js/lib/ssce-written');
const generator = require('../scripts/build-ssce-practice-locales');
const quickBanks = { en: enQuick, fr: require('../assets/js/lib/ssce-practice-bank-fr'), sw: require('../assets/js/lib/ssce-practice-bank-sw') };
const writtenBanks = { en: enWritten, fr: require('../assets/js/lib/ssce-written-bank-fr'), sw: require('../assets/js/lib/ssce-written-bank-sw') };

test('all 99 identities, assessment language and backup contracts survive localization', () => {
  const originalQuick = JSON.stringify(enQuick), originalWritten = JSON.stringify(enWritten);
  for (const locale of ['fr', 'sw']) {
    const quick = quickBanks[locale], written = writtenBanks[locale];
    assert.equal(quick.questions.length, 52); assert.equal(written.items.length, 47);
    assert.equal(quick.id, enQuick.id); assert.equal(written.id, enWritten.id);
    assert.deepEqual(quick.passages, enQuick.passages);
    for (const question of quick.questions) {
      const source = enQuick.questions.find(q => q.id === question.id);
      for (const key of ['id','subject','topic','answer','examYear','passageId']) assert.deepEqual(question[key], source[key], `${locale}/${question.id}/${key}`);
      assert.notDeepEqual(question.steps, source.steps);
      assert.notEqual(question.pitfall, source.pitfall);
      if ((source.subject === 'English' || source.subject === 'Physics')) {
        assert.equal(question.questionLanguage, 'en'); assert.equal(question.prompt, source.prompt); assert.deepEqual(question.options, source.options);
      } else { assert.equal(question.questionLanguage, locale); assert.notEqual(question.prompt, source.prompt); }
    }
    for (const question of written.items) {
      const source = enWritten.items.find(q => q.id === question.id);
      for (const key of ['id','subject','collection','origin','exam','year','paper','number','source','figure','passage']) assert.deepEqual(question[key], source[key], `${locale}/${question.id}/${key}`);
      assert.equal(question.checks.length, source.checks.length, 'saved checklist positions must remain stable');
      assert.ok(question.steps.length >= 3); assert.notDeepEqual(question.steps, source.steps); assert.notDeepEqual(question.checks, source.checks);
      assert.notEqual(question.sourceUse, source.sourceUse); assert.notEqual(question.sourceLabel, source.sourceLabel);
      if (source.subject === 'English' || source.year === 2022) {
        assert.equal(question.questionLanguage, 'en'); assert.equal(question.prompt, source.prompt);
        if (source.passage) { assert.equal(question.answerLanguage, 'en'); assert.equal(question.answer, source.answer); }
      } else { assert.equal(question.questionLanguage, locale); assert.notEqual(question.prompt, source.prompt); }
    }
  }
  assert.equal(JSON.stringify(enQuick), originalQuick); assert.equal(JSON.stringify(enWritten), originalWritten);
});

test('every quick answer grades identically and every written entry round-trips among EN FR SW', () => {
  let quickState = { version:1, bankId:enQuick.id, ids:enQuick.questions.map(q => q.id), index:51,
    answers:Object.fromEntries(enQuick.questions.map(q => [q.id, q.answer])) };
  const writtenState = { version:1, bankId:enWritten.id, entries:Object.fromEntries(enWritten.items.map(q => [q.id, { answer:'Synthetic answer '+q.id, checks:q.checks.map((_, i) => i % 2 === 0) }])) };
  for (const locale of ['en','fr','sw']) {
    quickState = quickApi.normalize(JSON.parse(JSON.stringify(quickState)), quickBanks[locale]);
    assert.equal(quickApi.result(quickState, quickBanks[locale]).correct, 52);
    assert.deepEqual(writtenApi.normalize(JSON.parse(JSON.stringify(writtenState)), writtenBanks[locale]), writtenState);
    const report = writtenApi.report(writtenBanks[locale], writtenState);
    for (const q of writtenBanks[locale].items) { assert.ok(report.includes(q.prompt)); assert.ok(report.includes(q.source)); assert.ok(report.includes(q.steps[0])); }
    if (locale === 'fr') assert.ok(report.includes('Ma réponse :'));
    if (locale === 'sw') assert.ok(report.includes('Jibu langu:'));
  }
});

test('worked numerical results and exam references retain the English meanings', () => {
  for (const locale of ['fr','sw']) {
    const items = writtenBanks[locale].items;
    const answer = id => items.find(q => q.id === id).answer;
    assert.match(answer('written-m1'), /45/); assert.match(answer('written-m1'), /1[,.]68 × 10¹/);
    assert.match(answer('written-m2'), /248[ ,]?400/); assert.match(answer('written-m2'), /3[,.]5\s*%/);
    assert.match(answer('waec-2023-mathematics-p2-q3'), /13[,.]01 cm²/);
    assert.match(answer('waec-2023-mathematics-p2-q9'), /1[,.]6 m/);
    assert.match(answer('waec-2023-mathematics-p2-q10'), /349°.*167 m/);
    assert.match(answer('waec-2023-mathematics-p2-q13'), /−8x \+ 21y = 6/);
    assert.equal(items.filter(q => q.exam === 'WAEC').length, 26);
    assert.equal(items.filter(q => q.exam === 'NECO').length, 7);
    assert.equal(items.filter(q => q.exam === null && q.year === null).length, 14);
  }
});

test('malformed and unknown cross-language backups fail without mutating saved data', () => {
  for (const locale of ['fr','sw']) {
    const store = { value:'{damaged', getItem(){ return this.value; }, setItem(_, value){ this.value = value; } };
    assert.throws(() => writtenApi.write(store, writtenBanks[locale], 'written-m1', { answer:'Synthetic', checks:[false,false] }));
    assert.equal(store.value, '{damaged');
    assert.throws(() => writtenApi.normalize({ version:1, bankId:enWritten.id, entries:{ unknown:{ answer:'', checks:[] } } }, writtenBanks[locale]));
    assert.throws(() => quickApi.normalize({version:1,bankId:enQuick.id,ids:['unknown'],index:0,answers:{}},quickBanks[locale]));
  }
});

test('localized source generation is current and every locale page declares all peers', () => {
  generator.run(false);
  for (const locale of ['fr','sw']) {
    const html = fs.readFileSync(path.join(__dirname, '..', generator.routes[locale], 'index.html'), 'utf8');
    for (const lang of ['en','fr','sw']) assert.ok(html.includes(`hreflang="${lang}" href="https://afrotools.com${generator.routes[lang]}"`));
    assert.ok(html.includes('id="written-practice"')); assert.ok(html.includes('data-assessment-language-notice'));
    assert.ok(html.includes('scripts/build-ssce-practice-locales.js'));
  }
});
